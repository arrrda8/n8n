const puppeteerExtra = require('puppeteer-extra');
const puppeteer = require('puppeteer-core');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteerExtra.use(StealthPlugin());

// Eingabeparameter
const jobUrl = process.argv[2];

(async () => {
  try {
    // Browser starten
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');

    // Seite aufrufen
    await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Warten, bis die Jobdetails geladen sind
    await page.waitForSelector('h1[data-testid="jobsearch-JobInfoHeader-title"]', { timeout: 10000 });

    // Jobdetails extrahieren
    const jobData = await page.evaluate(() => {
      const jobTitle = document.querySelector('h1[data-testid="jobsearch-JobInfoHeader-title"]')?.innerText.trim() || '';
      const companyName = document.querySelector('div[data-testid="inlineHeader-companyName"]')?.innerText.trim() || '';
      const location = document.querySelector('div[data-testid="inlineHeader-companyLocation"]')?.innerText.trim() || '';
      const jobDescription = document.querySelector('#jobDescriptionText')?.innerText.trim() || '';

      // Leistungen
      const benefitsElements = document.querySelectorAll('#benefits ul li');
      const benefits = Array.from(benefitsElements).map(el => el.innerText.trim());

      // Unternehmensbewertung und Anzahl der Bewertungen
      const companyRating = document.querySelector('div.css-17cdm7w span[aria-label]')?.innerText.trim() || '';
      const numberOfReviews = document.querySelector('div.css-17cdm7w a')?.innerText.trim() || '';

      // Strukturiertes JSON-LD auslesen
      const ldJsonScript = document.querySelector('script[type="application/ld+json"]');
      let datePosted = '', validThrough = '', employmentType = '', industry = '', companySize = '', companyWebsite = '';
      if (ldJsonScript) {
        try {
          const ldJson = JSON.parse(ldJsonScript.textContent);
          datePosted = ldJson.datePosted || '';
          validThrough = ldJson.validThrough || '';
          employmentType = ldJson.employmentType || '';
          industry = ldJson.industry || ldJson.hiringOrganization?.industry || '';
          companySize = ldJson.hiringOrganization?.employee?.value || '';
          companyWebsite = ldJson.hiringOrganization?.sameAs || '';
        } catch (e) {}
      }

      return {
        job_title: jobTitle,
        company_name: companyName,
        job_location: location,
        job_description: jobDescription,
        benefits: benefits,
        date_posted: datePosted,
        valid_through: validThrough,
        employment_type: employmentType,
        industry: industry,
        company_rating: companyRating,
        number_of_reviews: numberOfReviews,
        company_size: companySize,
        company_website: companyWebsite
      };
    });

    // Ergebnis ausgeben
    console.log(JSON.stringify(jobData));

    // Browser schließen
    await browser.close();
  } catch (error) {
    console.error('Fehler beim Ausführen des Skripts:', error);
    process.exit(1);
  }
})();
