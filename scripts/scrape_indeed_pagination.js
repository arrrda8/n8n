const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Eingabeparameter
const jobTitle = process.argv[2];
const age = process.argv[3];

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

    // URL generieren
    const url = `https://de.indeed.com/jobs?q=${encodeURIComponent(jobTitle)}&fromage=${encodeURIComponent(age)}`;

    // Seite aufrufen
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Warten, bis die Paginierung geladen ist
    await page.waitForSelector('nav[aria-label="pagination"]', { timeout: 5000 }).catch(() => {});

    // Anzahl der Seiten ermitteln
    const totalPages = await page.evaluate(() => {
      const paginationNav = document.querySelector('nav[aria-label="pagination"]');
      if (paginationNav) {
        const pageLinks = paginationNav.querySelectorAll('a[aria-label]');
        let pageNumbers = [];
        pageLinks.forEach(link => {
          const pageNumber = parseInt(link.getAttribute('aria-label'));
          if (!isNaN(pageNumber)) {
            pageNumbers.push(pageNumber);
          }
        });
        if (pageNumbers.length > 0) {
          return Math.max(...pageNumbers);
        }
      }
      return 1; // Standardwert, falls keine Paginierung vorhanden ist
    });

    // Ergebnis ausgeben
    console.log(JSON.stringify({ totalPages }));

    // Browser schließen
    await browser.close();
  } catch (error) {
    console.error('Fehler beim Ausführen des Skripts:', error);
    process.exit(1);
  }
})();
