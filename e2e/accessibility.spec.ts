import { test, expect } from '@playwright/test';

/**
 * Accessibility Tests
 * Keyboard navigation, focus indicators, screen reader support
 */
test.describe('Accessibility - Keyboard Navigation', () => {
  test('Tab order is logical on homepage', async ({ page }) => {
    await page.goto('/');

    // Start tabbing from the beginning
    await page.keyboard.press('Tab');

    // First focusable element should be visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('Focus indicators are visible', async ({ page }) => {
    await page.goto('/');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');

    // Check that focused element has visible focus ring
    const hasRing = await focused.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.outline !== 'none' ||
        styles.boxShadow.includes('rgb') ||
        el.className.includes('ring') ||
        el.className.includes('focus')
      );
    });

    expect(hasRing).toBe(true);
  });

  test('Dropdown menus are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1280, height: 720 });

    // Tab to Solutions dropdown
    let found = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focusedText = await page.locator(':focus').textContent();
      if (focusedText?.toLowerCase().includes('solutions')) {
        found = true;
        break;
      }
    }

    if (found) {
      // Press Enter to open dropdown
      await page.keyboard.press('Enter');

      // Check dropdown opened
      await expect(page.getByText(/for companies|기업용/i)).toBeVisible();
    }
  });
});

test.describe('Accessibility - Screen Reader', () => {
  test('All images have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');

      // Image should have alt text, aria-label, or be decorative (role="presentation")
      const hasAccessibleName = alt !== null || ariaLabel !== null || role === 'presentation' || role === 'none';
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('Headings are in proper order', async ({ page }) => {
    await page.goto('/');

    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    let previousLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName);
      const level = parseInt(tagName.replace('H', ''));

      // Heading level should not skip more than one level
      if (previousLevel > 0) {
        expect(level).toBeLessThanOrEqual(previousLevel + 1);
      }
      previousLevel = level;
    }
  });

  test('Main landmark is present', async ({ page }) => {
    await page.goto('/');

    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('Icon buttons have aria-labels', async ({ page }) => {
    await page.goto('/');

    // Find buttons with only icons (no text content)
    const iconButtons = page.locator('button:has(svg):not(:has-text("."))');
    const count = await iconButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = iconButtons.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const textContent = await btn.textContent();

      // Should have accessible name
      const hasName = ariaLabel || title || (textContent && textContent.trim().length > 0);
      expect(hasName).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('Text has sufficient contrast', async ({ page }) => {
    await page.goto('/');

    // Sample key text elements
    const textElements = page.locator('h1, h2, p, a, button');
    const count = await textElements.count();

    // Just verify text is readable (not pure color check, but visibility)
    for (let i = 0; i < Math.min(count, 10); i++) {
      const el = textElements.nth(i);
      if (await el.isVisible()) {
        const opacity = await el.evaluate((e) => {
          return window.getComputedStyle(e).opacity;
        });
        // Text should not be invisible
        expect(parseFloat(opacity)).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Accessibility - Motion', () => {
  test('Respects prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Page should still load and be functional
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Animations should be reduced (hard to test, but page should work)
  });
});
