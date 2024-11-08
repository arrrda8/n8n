const puppeteer = require('puppeteer');

async function searchCompanyWebsite(companyName) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Google-Suche aufrufen
  const query = encodeURIComponent(companyName);
  const url = `https://www.google.com/search?q=${query}`;
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Warten, bis die Suchergebnisse geladen sind
  await page.waitForSelector('div#search');

  // Ersten Suchergebnis-Link extrahieren
  const link = await page.evaluate(() => {
    const element = document.querySelector('div#search a');
    return element ? element.href : null;
  });

  await browser.close();
  return link;
}

const companyName = process.argv[2];

if (!companyName) {
  console.error('Bitte gib einen Firmennamen als Argument an.');
  process.exit(1);
}

searchCompanyWebsite(companyName)
  .then((website) => {
    if (website) {
      console.log(`${website}`);
    } else {
      console.log(`Keine Webseite f端r ${companyName} gefunden.`);
    }
  })
  .catch((error) => {
    console.error('Fehler beim Abrufen der Webseite:', error);
  });
