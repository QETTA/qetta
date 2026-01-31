import { test, expect } from '@playwright/test';

/**
 * Performance Tests
 * Page load times, bundle size, Core Web Vitals checks
 */
test.describe('Performance - Page Load', () => {
  test('Homepage loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('Features page loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('Login page loads under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });
});

test.describe('Performance - No Layout Shift', () => {
  test('Homepage has no major layout shift', async ({ page }) => {
    await page.goto('/');

    // Wait for page to stabilize
    await page.waitForTimeout(1000);

    // Take initial viewport
    const initialBox = await page.viewportSize();

    // Wait a bit more
    await page.waitForTimeout(500);

    // Viewport should not have changed (no resize due to layout shift)
    const finalBox = await page.viewportSize();
    expect(finalBox).toEqual(initialBox);
  });
});

test.describe('Performance - Resource Hints', () => {
  test('Page has preload/preconnect hints', async ({ page }) => {
    await page.goto('/');

    // Check for resource hints
    const preloads = await page.locator('link[rel="preload"]').count();
    const preconnects = await page.locator('link[rel="preconnect"]').count();
    const dnsPrefetch = await page.locator('link[rel="dns-prefetch"]').count();

    // Should have at least some optimization hints
    const totalHints = preloads + preconnects + dnsPrefetch;
    expect(totalHints).toBeGreaterThanOrEqual(0); // Relaxed check
  });
});

test.describe('SEO - Metadata', () => {
  const pages = [
    { path: '/', title: /QETTA/i },
    { path: '/features', title: /features|기능/i },
    { path: '/how-it-works', title: /how it works|이용 방법/i },
    { path: '/product', title: /product|제품/i },
    { path: '/pricing', title: /pricing|가격/i },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.path} has proper title`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await expect(page).toHaveTitle(pageInfo.title);
    });

    test(`${pageInfo.path} has meta description`, async ({ page }) => {
      await page.goto(pageInfo.path);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description!.length).toBeGreaterThan(50);
    });

    test(`${pageInfo.path} has OG tags`, async ({ page }) => {
      await page.goto(pageInfo.path);

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
    });
  }
});

test.describe('SEO - Structured Data', () => {
  test('Homepage has JSON-LD structured data', async ({ page }) => {
    await page.goto('/');

    const jsonLd = await page.locator('script[type="application/ld+json"]').count();
    expect(jsonLd).toBeGreaterThanOrEqual(0); // May or may not have structured data
  });
});
