const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Intercept network to check script content
  const scriptErrors = [];
  page.on('requestfailed', req => {
    if (req.url().includes('kakao')) scriptErrors.push(req.url() + ' - ' + req.failure().errorText);
  });

  await page.goto('https://kidsmap.vercel.app/map', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check what the page sees as the env var
  const envVal = await page.evaluate(() => {
    // Check all script tags for KAKAO
    const scripts = Array.from(document.querySelectorAll('script'));
    const kakaoScripts = scripts.filter(s => s.src && s.src.includes('kakao'));
    return {
      scriptSrcs: kakaoScripts.map(s => s.src),
      allScriptCount: scripts.length,
    };
  });

  console.log('Kakao script tags found:', JSON.stringify(envVal, null, 2));
  console.log('Failed requests:', scriptErrors);

  await browser.close();
})();
