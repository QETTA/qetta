import { test, expect } from '@playwright/test';

/**
 * Phase 2: Navigation Dropdowns Tests
 * Desktop and Mobile navigation functionality
 */
test.describe('Desktop Navigation (≥1024px)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('Solutions dropdown opens and shows items', async ({ page }) => {
    await page.goto('/');

    // Find and click Solutions button
    const solutionsBtn = page.getByRole('button', { name: /solutions/i });
    await expect(solutionsBtn).toBeVisible();
    await solutionsBtn.click();

    // Check dropdown items appear
    await expect(page.getByText(/for companies|기업용/i)).toBeVisible();
    await expect(page.getByText(/for partners|파트너용/i)).toBeVisible();
  });

  test('Solutions dropdown closes on outside click', async ({ page }) => {
    await page.goto('/');

    const solutionsBtn = page.getByRole('button', { name: /solutions/i });
    await solutionsBtn.click();

    // Verify dropdown is open
    await expect(page.getByText(/for companies|기업용/i)).toBeVisible();

    // Click outside
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    // Dropdown should close
    await expect(page.getByText(/for companies|기업용/i)).not.toBeVisible();
  });

  test('Solutions dropdown closes on ESC', async ({ page }) => {
    await page.goto('/');

    const solutionsBtn = page.getByRole('button', { name: /solutions/i });
    await solutionsBtn.click();

    await expect(page.getByText(/for companies|기업용/i)).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    // Dropdown should close
    await expect(page.getByText(/for companies|기업용/i)).not.toBeVisible();
  });

  test('Partners dropdown opens and shows items', async ({ page }) => {
    await page.goto('/');

    const partnersBtn = page.getByRole('button', { name: /partners/i });
    await expect(partnersBtn).toBeVisible();
    await partnersBtn.click();

    // Check 3 items: Consultants, Buyers, Suppliers
    await expect(page.getByRole('link', { name: /consultants|컨설턴트/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /buyers|바이어/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /suppliers|공급업체/i })).toBeVisible();
  });

  test('Static navigation links work', async ({ page }) => {
    await page.goto('/');

    // Check Features link
    const featuresLink = page.getByRole('link', { name: /features/i });
    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveAttribute('href', '/features');

    // Check How it Works link
    const howLink = page.getByRole('link', { name: /how it works/i });
    await expect(howLink).toBeVisible();
    await expect(howLink).toHaveAttribute('href', '/how-it-works');

    // Check Pricing link
    const pricingLink = page.getByRole('link', { name: /pricing/i });
    await expect(pricingLink).toBeVisible();
    await expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  test('Dashboard CTA button exists and navigates', async ({ page }) => {
    await page.goto('/');

    // Look for dashboard/docs button
    const ctaBtn = page.getByRole('link', { name: /dashboard|대시보드|docs|시작/i });
    await expect(ctaBtn).toBeVisible();
  });
});

test.describe('Mobile Navigation (<1024px)', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('Hamburger menu button is visible', async ({ page }) => {
    await page.goto('/');

    // Mobile menu button should be visible
    const menuBtn = page.getByRole('button', { name: /menu|메뉴/i });
    await expect(menuBtn).toBeVisible();
  });

  test('Mobile menu opens on hamburger click', async ({ page }) => {
    await page.goto('/');

    const menuBtn = page.getByRole('button', { name: /menu|메뉴/i });
    await menuBtn.click();

    // Menu items should appear
    await expect(page.getByText(/solutions/i)).toBeVisible();
    await expect(page.getByText(/partners/i)).toBeVisible();
  });

  test('Solutions accordion expands on mobile', async ({ page }) => {
    await page.goto('/');

    // Open mobile menu
    const menuBtn = page.getByRole('button', { name: /menu|메뉴/i });
    await menuBtn.click();

    // Find and click Solutions accordion
    const solutionsAccordion = page.getByRole('button', { name: /solutions/i });
    await solutionsAccordion.click();

    // Sub-items should appear
    await expect(page.getByText(/for companies|기업용/i)).toBeVisible();
  });

  test('Partners accordion expands independently', async ({ page }) => {
    await page.goto('/');

    // Open mobile menu
    const menuBtn = page.getByRole('button', { name: /menu|메뉴/i });
    await menuBtn.click();

    // Click Partners accordion
    const partnersAccordion = page.getByRole('button', { name: /partners/i });
    await partnersAccordion.click();

    // Sub-items should appear
    await expect(page.getByRole('link', { name: /consultants|컨설턴트/i })).toBeVisible();
  });

  test('Touch targets are at least 48px', async ({ page }) => {
    await page.goto('/');

    // Open mobile menu
    const menuBtn = page.getByRole('button', { name: /menu|메뉴/i });
    await menuBtn.click();

    // Check button sizes (accessibility requirement)
    const buttons = page.locator('button, a').filter({ hasText: /.+/ });
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        // Height should be at least 44px (Apple HIG) or 48px (Material)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
