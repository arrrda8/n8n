const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Eingabeparameter
const jobTitle = process.argv[2];
const age = process.argv[3];
const pageNumber = process.argv[4];

(async () => {
  try {
    // Browser starten
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // User-Agent setzen
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    // Berechnung des Startparameters
    const start = (parseInt(pageNumber) - 1) * 10;

    // URL generieren
    const url = `https://de.indeed.com/jobs?q=${encodeURIComponent(jobTitle)}&fromage=${encodeURIComponent(age)}&start=${start}`;

    // Seite aufrufen
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Warten, bis die Jobkarten geladen sind
    await page.waitForSelector('a.jcs-JobTitle', { timeout: 5000 }).catch(() => {});

    // Job-Links extrahieren
    const jobLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a.jcs-JobTitle').forEach(element => {
        const relativeLink = element.getAttribute('href');
        if (relativeLink) {
          links.push('https://de.indeed.com' + relativeLink);
        }
      });
      return links;
    });

    // Ergebnis ausgeben
    console.log(JSON.stringify({ jobLinks }));

    // Browser schließen
    await browser.close();
  } catch (error) {
    console.error('Fehler beim Ausführen des Skripts:', error);
    process.exit(1);
  }
})();
