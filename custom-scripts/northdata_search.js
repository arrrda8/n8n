const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

async function searchNorthData(companyName) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // User-Agent setzen
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)');

    // North Data Suche aufrufen
    const query = encodeURIComponent(companyName);
    const url = `https://www.northdata.de/?query=${query}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Optional: Cookie-Banner akzeptieren
    try {
      const cookieButton = await page.waitForSelector('button#onetrust-accept-btn-handler', { timeout: 5000 });
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Wenn kein Cookie-Banner vorhanden ist, ignorieren wir den Fehler
    }

    // Pr端fen, ob wir auf der Unternehmensseite sind
    const isCompanyPage = await page.evaluate(() => {
      const nameLabel = document.querySelector('h3.ui.large.ribbon.blue.label');
      return nameLabel && nameLabel.textContent.trim() === 'Name';
    });

    let result;

    if (isCompanyPage) {
      // Wir sind auf der Unternehmensseite
      result = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        };

        const company_name = getTextContent('h3.ui.large.ribbon.blue.label + .general-information .item .content');

        const address = getTextContent('h3:contains("Adresse") + .general-information .item .content a') ||
                        getTextContent('h3:contains("Adresse") + .general-information .item .content');

        const register_info = getTextContent('h3:contains("Register") + .general-information .item');

        const purpose = getTextContent('h3:contains("Gegenstand") + p');

        const company_url = window.location.href;

        return {
          company_name,
          address,
          register_info,
          purpose,
          company_url
        };
      });
    } else {
      // Wir sind auf der Suchergebnisseite
      // Warten, bis die Suchergebnisse geladen sind
      await page.waitForSelector('.g-company-search-result', { timeout: 60000 });

      // Ersten Suchergebnis-Link extrahieren
      const resultLink = await page.evaluate(() => {
        const element = document.querySelector('.g-company-search-result .g-name a');
        return element ? element.href : null;
      });

      if (resultLink) {
        // Unternehmensseite aufrufen
        await page.goto(resultLink, { waitUntil: 'networkidle2' });

        // Daten von der Unternehmensseite extrahieren
        result = await page.evaluate(() => {
          const getTextContent = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : null;
          };

          const company_name = getTextContent('h3.ui.large.ribbon.blue.label + .general-information .item .content');

          const address = getTextContent('h3:contains("Adresse") + .general-information .item .content a') ||
                          getTextContent('h3:contains("Adresse") + .general-information .item .content');

          const register_info = getTextContent('h3:contains("Register") + .general-information .item');

          const purpose = getTextContent('h3:contains("Gegenstand") + p');

          const company_url = window.location.href;

          return {
            company_name,
            address,
            register_info,
            purpose,
            company_url
          };
        });
      } else {
        result = null;
      }
    }

    await browser.close();
    return result;

  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);

    // Fehlerbehandlung innerhalb der Funktion, Zugriff auf 'page' ist m旦glich
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
    const content = await page.content();
    fs.writeFileSync('error_page.html', content);

    await browser.close();

    // Fehler weiterwerfen, falls ben旦tigt
    throw error;
  }
}

const companyName = process.argv[2];

if (!companyName) {
  console.error('Bitte gib einen Firmennamen als Argument an.');
  process.exit(1);
}

searchNorthData(companyName)
  .then((data) => {
    if (data) {
      // Ausgabe als JSON-Objekt
      console.log(JSON.stringify(data));
    } else {
      console.log(JSON.stringify({ error: `Keine Daten f端r ${companyName} gefunden.` }));
    }
  })
  .catch((error) => {
    // Fehler bereits in der Funktion behandelt
    process.exit(1);
  });
