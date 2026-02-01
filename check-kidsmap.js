const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Loading https://kidsmap.vercel.app/map ...');
  await page.goto('https://kidsmap.vercel.app/map', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const kakaoLoaded = await page.evaluate(() => {
    return typeof window.kakao !== 'undefined' && typeof window.kakao.maps !== 'undefined';
  });
  console.log('Kakao Maps SDK loaded:', kakaoLoaded);

  const title = await page.title();
  console.log('Page title:', title);

  await page.screenshot({ path: 'C:\\Users\\sihu2\\kidsmap-check.png', fullPage: true });
  console.log('Screenshot saved');

  console.log('Console errors:', errors.length);
  errors.forEach((e, i) => console.log('  ' + (i+1) + '. ' + e.substring(0, 200)));

  await browser.close();
})();
