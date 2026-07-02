const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log('[PAGE ERROR]', error.message);
    });
    
    page.on('requestfailed', request => {
      console.log('[REQUEST FAILED]', request.url(), request.failure().errorText);
    });

    // Mock login by setting localStorage before navigation
    await page.goto('http://localhost:5174');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock_token');
      localStorage.setItem('user', JSON.stringify({ name: 'Test User', email: 'test@example.com' }));
    });

    console.log('Navigating to http://localhost:5174 (Logged in) ...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 15000 });
    
    const rootHtml = await page.$eval('#root', el => el.innerHTML);
    if (!rootHtml || rootHtml.trim() === '') {
        console.log('[HTML] #root is completely empty!');
    } else {
        console.log('[HTML] #root has content (length: ' + rootHtml.length + ')');
    }

    await browser.close();
  } catch (error) {
    console.error('SCRIPT ERROR:', error);
  }
})();
