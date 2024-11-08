const puppeteer = require('puppeteer-core');

async function searchCompanyWebsite(companyName) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');

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

// Eingabeparameter
const companyName = process.argv[2];

if (!companyName) {
  console.error('Bitte gib einen Firmennamen als Argument an.');
  process.exit(1);
}

searchCompanyWebsite(companyName)
  .then((website) => {
    const result = website
      ? { website_url: website }
      : { error: `Keine Webseite für ${companyName} gefunden.` };

    console.log(JSON.stringify(result));
  })
  .catch((error) => {
    console.error(JSON.stringify({ error: `Fehler beim Abrufen der Webseite: ${error.message}` }));
    process.exit(1);
  });
