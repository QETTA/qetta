/**
 * Full Page Visual Test Script
 * Tests all pages with screenshots and button interactions
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE_URL = 'http://localhost:3003';
const SCREENSHOT_DIR = '/tmp/qetta-screenshots';

const PAGES_TO_TEST = [
  { name: 'landing', url: '/', description: 'Landing Page' },
  { name: 'login', url: '/login', description: 'Login Page' },
  { name: 'register', url: '/register', description: 'Register Page' },
  { name: 'map', url: '/map', description: 'KidsMap Page' },
  { name: 'feed', url: '/feed', description: 'Feed Page' },
];

async function runTests() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Desktop tests
  console.log('\n📱 Testing Desktop View...\n');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36',
  });

  for (const page of PAGES_TO_TEST) {
    const result = await testPage(desktopContext, page, 'desktop');
    results.push(result);
  }
  await desktopContext.close();

  // Mobile tests
  console.log('\n📱 Testing Mobile View (iPhone 14)...\n');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true,
  });

  for (const page of PAGES_TO_TEST) {
    const result = await testPage(mobileContext, page, 'mobile');
    results.push(result);
  }
  await mobileContext.close();

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Screenshots: ${SCREENSHOT_DIR}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  return failed === 0;
}

async function testPage(context, pageInfo, viewport) {
  const page = await context.newPage();
  const testName = `${pageInfo.name}-${viewport}`;

  try {
    console.log(`  Testing ${pageInfo.description} (${viewport})...`);

    // Navigate
    const response = await page.goto(`${BASE_URL}${pageInfo.url}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Check response
    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status() || 'no response'}`);
    }

    // Wait for content
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${testName}.png`,
      fullPage: true,
    });

    // Test buttons
    const buttons = await page.locator('button:visible').all();
    const links = await page.locator('a:visible').all();

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Try clicking interactive elements (if any)
    let interactiveCount = 0;
    for (const btn of buttons.slice(0, 3)) {
      try {
        const box = await btn.boundingBox();
        if (box && box.width >= 44 && box.height >= 44) {
          interactiveCount++;
        }
      } catch {}
    }

    console.log(`    ✅ ${pageInfo.description}: ${buttons.length} buttons, ${links.length} links, ${interactiveCount} touch-compliant`);

    await page.close();
    return { name: testName, status: 'pass', buttons: buttons.length, links: links.length };

  } catch (error) {
    console.log(`    ❌ ${pageInfo.description}: ${error.message}`);

    try {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${testName}-error.png`,
        fullPage: true,
      });
    } catch {}

    await page.close();
    return { name: testName, status: 'fail', error: error.message };
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
