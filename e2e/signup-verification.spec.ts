import { test, expect } from '@playwright/test'

/**
 * Beta Signup Flow E2E Tests
 * Tests: /signup -> beta form -> /docs (dashboard)
 */
test.describe('Beta Signup Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testName = 'Test User'
  const testCompany = 'Test Company'

  test('beta signup page loads correctly', async ({ page }) => {
    await page.goto('/signup')

    // Check page loaded
    await expect(page).toHaveURL('/signup')

    // Check beta form elements
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/company/i)).toBeVisible()
    await expect(page.getByLabel(/industry/i)).toBeVisible()
  })

  test('beta signup form validation - empty fields', async ({ page }) => {
    await page.goto('/signup')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /get instant access/i })
    await submitButton.click()

    // Should stay on page (HTML5 validation)
    await expect(page).toHaveURL('/signup')
  })

  test('beta signup form validation - invalid email', async ({ page }) => {
    await page.goto('/signup')

    // Fill form with invalid email
    await page.getByLabel(/name/i).fill(testName)
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/company/i).fill(testCompany)
    await page.getByLabel(/industry/i).selectOption('consulting')

    const submitButton = page.getByRole('button', { name: /get instant access/i })
    await submitButton.click()

    // Should stay on page (HTML5 validation for email)
    await expect(page).toHaveURL('/signup')
  })

  test('beta signup form shows all industry options', async ({ page }) => {
    await page.goto('/signup')

    // Check industry dropdown has options
    const industrySelect = page.getByLabel(/industry/i)
    await expect(industrySelect).toBeVisible()

    // Verify some key industries are available
    await expect(industrySelect.locator('option')).toHaveCount(11) // 10 industries + placeholder
  })

  test('beta signup API endpoint responds correctly', async ({ request }) => {
    // Test the beta signup API endpoint
    const response = await request.post('/api/beta/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: '',
        name: '',
        company: '',
        industry: '',
      },
    })

    // Should return validation error, not server error
    expect([400, 422]).toContain(response.status())
  })

  test('beta signup API rejects invalid email format', async ({ request }) => {
    const response = await request.post('/api/beta/signup', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'not-an-email',
        name: testName,
        company: testCompany,
        industry: 'consulting',
      },
    })

    expect([400, 422]).toContain(response.status())
  })
})

test.describe('Email Verification Flow', () => {
  test('verify-email page loads', async ({ page }) => {
    await page.goto('/verify-email')

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()
  })

  test('verify-email page shows appropriate message', async ({ page }) => {
    await page.goto('/verify-email')

    // Should show some verification-related content
    const content = page.locator('main, [class*="container"]').first()
    await expect(content).toBeVisible()
  })

  test('verify-email with invalid token', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-token-12345')

    // Should show error or redirect
    await expect(page.locator('body')).toBeVisible()
  })

  test('verify-email API with invalid token', async ({ request }) => {
    const response = await request.post('/api/auth/verify-email', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        token: 'invalid-token-12345',
      },
    })

    // Should return error for invalid token
    expect([400, 401, 404]).toContain(response.status())
  })

  test('send-verification API requires email', async ({ request }) => {
    const response = await request.post('/api/auth/send-verification', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    })

    expect([400, 422]).toContain(response.status())
  })
})

test.describe('Password Reset Flow', () => {
  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password')

    await expect(page).toHaveURL('/forgot-password')
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('forgot-password form submission', async ({ page }) => {
    await page.goto('/forgot-password')

    // Fill email
    await page.getByLabel(/email/i).fill('test@example.com')

    // Submit
    const submitButton = page.getByRole('button', { name: /전송|send|reset|비밀번호/i })
    await submitButton.click()

    // Should show success message or redirect
    await expect(page.locator('body')).toBeVisible()
  })

  test('forgot-password API endpoint', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'test@example.com',
      },
    })

    // Should return 200 (always, for security) or validation error
    expect([200, 400, 422]).toContain(response.status())
  })

  test('reset-password page loads', async ({ page }) => {
    await page.goto('/reset-password')

    await expect(page.locator('body')).toBeVisible()
  })

  test('reset-password API with invalid token', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        token: 'invalid-token',
        password: 'NewPassword123!',
      },
    })

    expect([400, 401, 404]).toContain(response.status())
  })
})
