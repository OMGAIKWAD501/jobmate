const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  try {
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle0', timeout: 5000 });
  } catch (err) {
    console.log('Timeout or error:', err.message);
  }
  
  await browser.close();
})();
