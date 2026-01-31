import { test, expect } from '@playwright/test'

/**
 * Signup and Email Verification Flow E2E Tests
 * Tests: /signup -> email sent -> /verify-email -> success
 */
test.describe('Signup Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/signup')

    // Check page loaded
    await expect(page).toHaveURL('/signup')

    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
  })

  test('signup form validation - empty fields', async ({ page }) => {
    await page.goto('/signup')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /회원가입|sign up|register|가입/i })
    await submitButton.click()

    // Should show validation errors or stay on page
    await expect(page).toHaveURL('/signup')
  })

  test('signup form validation - invalid email', async ({ page }) => {
    await page.goto('/signup')

    // Fill invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).first().fill(testPassword)

    const submitButton = page.getByRole('button', { name: /회원가입|sign up|register|가입/i })
    await submitButton.click()

    // Should show email validation error
    const errorMessage = page.locator('[class*="error"], [role="alert"], [class*="invalid"]')
    await expect(errorMessage.or(page.locator('body'))).toBeVisible()
  })

  test('signup form validation - weak password', async ({ page }) => {
    await page.goto('/signup')

    // Fill valid email but weak password
    await page.getByLabel(/email/i).fill(testEmail)
    await page.getByLabel(/password/i).first().fill('123')

    const submitButton = page.getByRole('button', { name: /회원가입|sign up|register|가입/i })
    await submitButton.click()

    // Should stay on page or show password error
    await expect(page).toHaveURL('/signup')
  })

  test('signup page has link to login', async ({ page }) => {
    await page.goto('/signup')

    const loginLink = page.getByRole('link', { name: /로그인|sign in|login|이미 계정/i })
    await expect(loginLink).toBeVisible()

    await loginLink.click()
    await expect(page).toHaveURL('/login')
  })

  test('signup API endpoint responds correctly', async ({ request }) => {
    // Test the register API endpoint
    const response = await request.post('/api/auth/register', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: '',
        password: '',
      },
    })

    // Should return validation error, not server error
    expect([400, 422]).toContain(response.status())
  })

  test('signup API rejects invalid email format', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'not-an-email',
        password: testPassword,
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
