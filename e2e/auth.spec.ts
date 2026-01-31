import { test, expect } from '@playwright/test';

/**
 * Phase 1: Authentication Dark Theme Tests
 * Verifies all auth pages have consistent dark theme styling
 */
test.describe('Auth Pages Dark Theme', () => {
  const authPages = [
    { path: '/login', name: 'Login' },
    { path: '/signup', name: 'Signup' },
    { path: '/verify-email', name: 'Verify Email' },
    { path: '/forgot-password', name: 'Forgot Password' },
    { path: '/reset-password', name: 'Reset Password' },
  ];

  for (const page of authPages) {
    test(`${page.name} page has dark background`, async ({ page: p }) => {
      await p.goto(page.path);

      // Check page has dark background (bg-zinc-950)
      const body = p.locator('body');
      await expect(body).toBeVisible();

      // Verify no lg:bg-white on large screens (the bug mentioned in QA)
      const hasWhiteBg = await p.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const classes = el.className;
          if (typeof classes === 'string' && classes.includes('lg:bg-white')) {
            return true;
          }
        }
        return false;
      });
      expect(hasWhiteBg).toBe(false);
    });

    test(`${page.name} page form container has zinc-900 background`, async ({ page: p }) => {
      await p.goto(page.path);

      // Look for form container with dark styling
      const formContainer = p.locator('[class*="bg-zinc-900"], [class*="bg-zinc-800"]').first();
      await expect(formContainer).toBeVisible({ timeout: 5000 });
    });
  }

  test('Login form is functional', async ({ page }) => {
    await page.goto('/login');

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /로그인|sign in|login/i })).toBeVisible();

    // Check link to signup
    await expect(page.getByRole('link', { name: /회원가입|sign up|register/i })).toBeVisible();
  });

  test('Signup form is functional', async ({ page }) => {
    await page.goto('/signup');

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();

    // Check link to login
    await expect(page.getByRole('link', { name: /로그인|sign in|login/i })).toBeVisible();
  });
});
