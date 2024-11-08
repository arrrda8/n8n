const puppeteer = require('puppeteer-core');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
  try {
    const url = process.argv[2];
    if (!url) {
      console.error(JSON.stringify({ error: 'Bitte eine URL als Argument übergeben.' }));
      process.exit(1);
    }

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    try {
      const cookieButton = await page.waitForSelector('button#onetrust-accept-btn-handler', { timeout: 5000 });
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    try {
      await page.waitForSelector('script[type="application/ld+json"]', { timeout: 30000 });
    } catch (error) {
      console.error(JSON.stringify({ error: 'Das erwartete Element wurde nicht gefunden.' }));
      process.exit(1);
    }

    const jobData = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      return script ? JSON.parse(script.innerText) : null;
    });

    if (!jobData) {
      console.error(JSON.stringify({ error: 'Konnte keine Jobdaten finden.' }));
      process.exit(1);
    }

    console.log(JSON.stringify(jobData));

    await browser.close();
  } catch (error) {
    console.error(JSON.stringify({ error: 'Fehler beim Ausführen des Skripts', details: error.message }));
    process.exit(1);
  }
})();
