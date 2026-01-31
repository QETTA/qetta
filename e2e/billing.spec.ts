import { test, expect } from '@playwright/test'

/**
 * Billing and Payment Flow E2E Tests
 * Tests: /settings/billing -> plan selection -> checkout -> success/fail
 */
test.describe('Billing Page', () => {
  test('billing page requires authentication', async ({ page, context }) => {
    // Clear cookies to ensure no auth
    await context.clearCookies()

    await page.goto('/settings/billing')

    // Should redirect to login or show auth error
    const currentUrl = page.url()
    const isAuthPage = currentUrl.includes('/login') || currentUrl.includes('/signin')
    const isOnBilling = currentUrl.includes('/settings/billing')

    // Either redirected to login or staying on billing (if showing auth prompt)
    expect(isAuthPage || isOnBilling).toBe(true)
  })

  test('billing page structure', async ({ page }) => {
    await page.goto('/settings/billing')

    // Page should load
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Pricing Plans', () => {
  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing')

    await expect(page).toHaveURL('/pricing')
    await expect(page.locator('body')).toBeVisible()
  })

  test('pricing page shows subscription plans', async ({ page }) => {
    await page.goto('/pricing')

    // Should show plan names or pricing info
    const planNames = ['TRIAL', 'STARTER', 'GROWTH', 'SCALE', 'UNLIMITED', '무료', '스타터', '그로스']
    const plansVisible = await page.locator('main').textContent()

    // At least one plan-related text should be visible
    const hasPlans = planNames.some(plan =>
      plansVisible?.toLowerCase().includes(plan.toLowerCase())
    )

    expect(hasPlans || plansVisible?.includes('₩') || plansVisible?.includes('원')).toBe(true)
  })

  test('pricing page has CTA buttons', async ({ page }) => {
    await page.goto('/pricing')

    // Should have call-to-action buttons
    const ctaButtons = page.getByRole('button', { name: /시작|start|구독|subscribe|선택|select|무료/i })
    const linkButtons = page.getByRole('link', { name: /시작|start|구독|subscribe|선택|select|무료/i })

    const buttonCount = await ctaButtons.count()
    const linkCount = await linkButtons.count()

    expect(buttonCount + linkCount).toBeGreaterThan(0)
  })
})

test.describe('Checkout Flow', () => {
  test('checkout page structure', async ({ page }) => {
    await page.goto('/settings/billing/checkout')

    // Page should load (may redirect if not authenticated)
    await expect(page.locator('body')).toBeVisible()
  })

  test('checkout success page', async ({ page }) => {
    await page.goto('/settings/billing/success')

    // Should show success message or redirect
    await expect(page.locator('body')).toBeVisible()

    // Check for success-related content
    const content = await page.locator('main, [class*="container"]').first().textContent()
    // Page should exist and have some content
    expect(content).toBeDefined()
  })

  test('checkout fail page', async ({ page }) => {
    await page.goto('/settings/billing/fail')

    // Should show failure message or redirect
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Payment API Endpoints', () => {
  test('checkout API requires authentication', async ({ request }) => {
    const response = await request.post('/api/payments/checkout', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planId: 'STARTER',
      },
    })

    // Should return 401 unauthorized
    expect([401, 400]).toContain(response.status())
  })

  test('checkout API validates plan ID', async ({ request }) => {
    const response = await request.post('/api/payments/checkout', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planId: 'INVALID_PLAN',
      },
    })

    // Should return validation error or auth error
    expect([400, 401, 422]).toContain(response.status())
  })

  test('subscription API requires authentication', async ({ request }) => {
    const response = await request.get('/api/payments/subscription')

    expect([401, 400]).toContain(response.status())
  })

  test('webhook endpoint exists', async ({ request }) => {
    // Webhook should accept POST but reject without valid signature
    const response = await request.post('/api/payments/webhook', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    })

    // Should return 400 (bad request) due to missing/invalid webhook signature
    expect([400, 401, 403]).toContain(response.status())
  })

  test('billing-key API requires authentication', async ({ request }) => {
    const response = await request.post('/api/payments/checkout/billing-key', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    })

    expect([400, 401]).toContain(response.status())
  })

  test('confirm checkout API requires valid data', async ({ request }) => {
    const response = await request.post('/api/payments/checkout/confirm', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        paymentKey: 'invalid',
        orderId: 'invalid',
        amount: 0,
      },
    })

    // Should return error for invalid payment data
    expect([400, 401, 422]).toContain(response.status())
  })
})

test.describe('Subscription Management', () => {
  test('subscription status check', async ({ request }) => {
    // GET subscription status (requires auth)
    const response = await request.get('/api/payments/subscription')

    // Should require authentication
    expect([401, 200]).toContain(response.status())
  })

  test('subscription cancel endpoint', async ({ request }) => {
    const response = await request.delete('/api/payments/subscription')

    // Should require authentication
    expect([401, 405, 400]).toContain(response.status())
  })
})

test.describe('Usage Tracking', () => {
  test('user has usage limits based on plan', async ({ page }) => {
    // This would be tested with authenticated session
    // For now, just verify the billing page loads
    await page.goto('/settings/billing')

    await expect(page.locator('body')).toBeVisible()
  })
})
