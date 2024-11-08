const puppeteer = require('puppeteer-core');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function searchNorthData(companyName) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)');

    const query = encodeURIComponent(companyName);
    const url = `https://www.northdata.de/?query=${query}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
      const cookieButton = await page.waitForSelector('button#onetrust-accept-btn-handler', { timeout: 5000 });
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    const isCompanyPage = await page.evaluate(() => {
      const nameLabel = document.querySelector('h3.ui.large.ribbon.blue.label');
      return nameLabel && nameLabel.textContent.trim() === 'Name';
    });

    let result;

    if (isCompanyPage) {
      result = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        };

        return {
          company_name: getTextContent('h3.ui.large.ribbon.blue.label + .general-information .item .content'),
          address: getTextContent('h3:contains("Adresse") + .general-information .item .content a') ||
                   getTextContent('h3:contains("Adresse") + .general-information .item .content'),
          register_info: getTextContent('h3:contains("Register") + .general-information .item'),
          purpose: getTextContent('h3:contains("Gegenstand") + p'),
          company_url: window.location.href
        };
      });
    } else {
      await page.waitForSelector('.g-company-search-result', { timeout: 60000 });

      const resultLink = await page.evaluate(() => {
        const element = document.querySelector('.g-company-search-result .g-name a');
        return element ? element.href : null;
      });

      if (resultLink) {
        await page.goto(resultLink, { waitUntil: 'networkidle2' });

        result = await page.evaluate(() => {
          const getTextContent = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : null;
          };

          return {
            company_name: getTextContent('h3.ui.large.ribbon.blue.label + .general-information .item .content'),
            address: getTextContent('h3:contains("Adresse") + .general-information .item .content a') ||
                     getTextContent('h3:contains("Adresse") + .general-information .item .content'),
            register_info: getTextContent('h3:contains("Register") + .general-information .item'),
            purpose: getTextContent('h3:contains("Gegenstand") + p'),
            company_url: window.location.href
          };
        });
      } else {
        result = { error: `Keine Daten für ${companyName} gefunden.` };
      }
    }

    await browser.close();
    return result;

  } catch (error) {
    const screenshotPath = '/tmp/error_screenshot.png';
    const htmlPath = '/tmp/error_page.html';

    await page.screenshot({ path: screenshotPath, fullPage: true });
    const content = await page.content();
    fs.writeFileSync(htmlPath, content);

    await browser.close();

    return {
      error: `Fehler beim Abrufen der Daten für ${companyName}.`,
      screenshot_path: screenshotPath,
      html_path: htmlPath
    };
  }
}

const companyName = process.argv[2];

if (!companyName) {
  console.error(JSON.stringify({ error: 'Bitte gib einen Firmennamen als Argument an.' }));
  process.exit(1);
}

searchNorthData(companyName)
  .then((data) => {
    console.log(JSON.stringify(data));
  })
  .catch(() => {
    process.exit(1);
  });
