/**
 * E2E Tests - Referral Attribution Flow (P1 - Critical)
 * Tests: Click link → Cookie set → Signup → Payment → Attribution
 */

import { test, expect } from '@playwright/test'

test.describe('Referral Attribution Flow', () => {
  test('User clicks referral link → cookie set → attribution', async ({ page, context }) => {
    // Step 1: User clicks referral link
    await page.goto('/r/ABCD1234')

    // Verify redirect to signup with ref parameter
    await expect(page).toHaveURL(/\/register\?ref=ABCD1234/, { timeout: 5000 })

    // Verify cookie set (7-day expiry, httpOnly)
    const cookies = await context.cookies()
    const refCookie = cookies.find(c => c.name === 'qetta_ref')

    expect(refCookie).toBeDefined()
    expect(refCookie!.value).toBe('ABCD1234')
    expect(refCookie!.httpOnly).toBe(true)
    expect(refCookie!.secure).toBe(true) // Production only

    // Verify 7-day expiry (within 1 hour tolerance)
    const expiryDate = new Date(refCookie!.expires * 1000)
    const expectedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const timeDiff = Math.abs(expiryDate.getTime() - expectedExpiry.getTime())
    expect(timeDiff).toBeLessThan(60 * 60 * 1000) // 1 hour tolerance

    // Step 2: User completes signup
    await page.fill('[name="email"]', `e2e+${Date.now()}@test.com`)
    await page.fill('[name="password"]', 'Test123!@#')
    await page.fill('[name="passwordConfirm"]', 'Test123!@#')
    await page.click('button:has-text("Sign Up")')

    // Verify signup success
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 })

    // Step 3: User purchases subscription
    await page.goto('/pricing')
    await page.click('button:has-text("Subscribe to Premium")')

    // Fill payment form
    await page.fill('[name="cardNumber"]', '4242 4242 4242 4242')
    await page.fill('[name="expiry"]', '12/28')
    await page.fill('[name="cvc"]', '123')
    await page.click('button:has-text("Pay")')

    // Verify payment success
    await expect(page.locator('text=Payment Successful')).toBeVisible({ timeout: 15000 })

    // Step 4: Verify attribution created (via API check)
    const userId = await page.evaluate(() => {
      return (window as any).__userId || localStorage.getItem('userId')
    })

    const attributionResponse = await page.request.get(`/api/accounting/admin/conversions/${userId}`)
    expect(attributionResponse.ok()).toBeTruthy()

    const attribution = await attributionResponse.json()
    expect(attribution.linkId).toBe('link-ABCD1234') // Resolved from short code
    expect(attribution.userId).toBe(userId)
    expect(attribution.amount).toBe(100) // Premium plan price
    expect(attribution.commissionAmount).toBeGreaterThan(0)

    // Verify IP and User-Agent hashed
    expect(attribution.ipHash).toMatch(/^[a-f0-9]{64}$/)
    expect(attribution.userAgentHash).toMatch(/^[a-f0-9]{64}$/)
  })

  test('Duplicate attribution prevented (first-touch)', async ({ page, context }) => {
    // Setup: Create user with existing attribution
    const userId = `user-e2e-${Date.now()}`
    await page.request.post('/api/test/create-user', {
      data: { userId, email: `${userId}@test.com` }
    })
    await page.request.post('/api/test/create-attribution', {
      data: { userId, linkId: 'link-FIRST', amount: 100 }
    })

    // User clicks different referral link (should be ignored)
    await page.goto('/r/SECOND123')
    await expect(page).toHaveURL(/\/register\?ref=SECOND123/)

    // Login as existing user
    await page.goto('/login')
    await page.fill('[name="email"]', `${userId}@test.com`)
    await page.fill('[name="password"]', 'password')
    await page.click('button:has-text("Sign In")')

    // Make second purchase
    await page.goto('/pricing')
    await page.click('button:has-text("Subscribe to Pro")')
    await page.fill('[name="cardNumber"]', '4242 4242 4242 4242')
    await page.fill('[name="expiry"]', '12/28')
    await page.fill('[name="cvc"]', '123')
    await page.click('button:has-text("Pay")')

    await expect(page.locator('text=Payment Successful')).toBeVisible()

    // Verify attribution still points to first link
    const attributionResponse = await page.request.get(`/api/accounting/admin/conversions/${userId}`)
    const attribution = await attributionResponse.json()

    expect(attribution.linkId).toBe('link-FIRST') // First-touch preserved
    expect(attribution.linkId).not.toBe('link-SECOND123')
  })

  test('Fallback attribution via IP + User-Agent (7-day window)', async ({ page, context }) => {
    // Setup: User clicks link but doesn't signup immediately (cookie expires)
    await page.goto('/r/FALLBACK1')
    await expect(page).toHaveURL(/\/register\?ref=FALLBACK1/)

    // Get IP and User-Agent for later matching
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const ipAddress = '192.168.1.100' // Simulated

    // Simulate cookie deletion (user clears cookies)
    await context.clearCookies()

    // User returns 5 days later and signs up (no cookie)
    await page.goto('/register')
    await page.fill('[name="email"]', `fallback+${Date.now()}@test.com`)
    await page.fill('[name="password"]', 'Test123!@#')
    await page.fill('[name="passwordConfirm"]', 'Test123!@#')
    await page.click('button:has-text("Sign Up")')

    await expect(page.locator('text=Welcome')).toBeVisible()

    // Make purchase (triggers fallback attribution)
    await page.goto('/pricing')
    await page.click('button:has-text("Subscribe to Premium")')
    await page.fill('[name="cardNumber"]', '4242 4242 4242 4242')
    await page.fill('[name="expiry"]', '12/28')
    await page.fill('[name="cvc"]', '123')
    await page.click('button:has-text("Pay")')

    await expect(page.locator('text=Payment Successful')).toBeVisible()

    // Verify fallback attribution via IP + User-Agent hash
    const userId = await page.evaluate(() => localStorage.getItem('userId'))
    const attributionResponse = await page.request.get(`/api/accounting/admin/conversions/${userId}`)
    const attribution = await attributionResponse.json()

    expect(attribution.linkId).toBe('link-FALLBACK1') // Matched via IP+UA
    expect(attribution.attributionMethod).toBe('fallback')
  })

  test('Expired link returns 404', async ({ page }) => {
    // Setup: Create expired link
    await page.request.post('/api/test/create-link', {
      data: {
        shortCode: 'EXPIRED1',
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    })

    // User clicks expired link
    await page.goto('/r/EXPIRED1')

    // Verify 404 page
    await expect(page.locator('text=Link Expired')).toBeVisible()
    await expect(page.locator('text=404')).toBeVisible()
    await expect(page.locator('a:has-text("Go Home")')).toBeVisible()
  })

  test('Click tracking increments atomically', async ({ page, context }) => {
    const shortCode = `CLICK${Date.now()}`

    // Setup: Create link with 0 clicks
    await page.request.post('/api/test/create-link', {
      data: { shortCode, clicks: 0 }
    })

    // Simulate 5 concurrent clicks
    const clickPromises = Array.from({ length: 5 }, (_, i) =>
      context.newPage().then(async (newPage) => {
        await newPage.goto(`/r/${shortCode}`)
        await newPage.close()
      })
    )

    await Promise.all(clickPromises)

    // Verify clicks = 5 (atomic increment)
    const linkResponse = await page.request.get(`/api/accounting/admin/links/${shortCode}`)
    const link = await linkResponse.json()

    expect(link.clicks).toBe(5) // No race condition
  })

  test('Attribution window expires after 7 days', async ({ page }) => {
    // Setup: Create click event 8 days ago
    await page.request.post('/api/test/create-click-event', {
      data: {
        linkId: 'link-OLD',
        ipHash: 'hash123',
        userAgentHash: 'hash456',
        clickedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    })

    // User signs up with same IP + User-Agent (but 8 days later)
    await page.goto('/register')
    await page.fill('[name="email"]', `expired+${Date.now()}@test.com`)
    await page.fill('[name="password"]', 'Test123!@#')
    await page.fill('[name="passwordConfirm"]', 'Test123!@#')
    await page.click('button:has-text("Sign Up")')

    await expect(page.locator('text=Welcome')).toBeVisible()

    // Make purchase
    await page.goto('/pricing')
    await page.click('button:has-text("Subscribe to Premium")')
    await page.fill('[name="cardNumber"]', '4242 4242 4242 4242')
    await page.fill('[name="expiry"]', '12/28')
    await page.fill('[name="cvc"]', '123')
    await page.click('button:has-text("Pay")')

    await expect(page.locator('text=Payment Successful')).toBeVisible()

    // Verify NO attribution created (window expired)
    const userId = await page.evaluate(() => localStorage.getItem('userId'))
    const attributionResponse = await page.request.get(`/api/accounting/admin/conversions/${userId}`)

    expect(attributionResponse.status()).toBe(404) // No attribution found
  })

  test('UTM parameters tracked correctly', async ({ page, context }) => {
    // User clicks link with UTM parameters
    await page.goto('/r/UTM12345?utm_source=instagram&utm_medium=story&utm_campaign=summer2026')

    // Verify redirect preserves UTM params
    await expect(page).toHaveURL(/\/register\?ref=UTM12345&utm_source=instagram&utm_medium=story&utm_campaign=summer2026/)

    // Complete signup and purchase
    await page.fill('[name="email"]', `utm+${Date.now()}@test.com`)
    await page.fill('[name="password"]', 'Test123!@#')
    await page.fill('[name="passwordConfirm"]', 'Test123!@#')
    await page.click('button:has-text("Sign Up")')

    await expect(page.locator('text=Welcome')).toBeVisible()

    await page.goto('/pricing')
    await page.click('button:has-text("Subscribe to Premium")')
    await page.fill('[name="cardNumber"]', '4242 4242 4242 4242')
    await page.fill('[name="expiry"]', '12/28')
    await page.fill('[name="cvc"]', '123')
    await page.click('button:has-text("Pay")')

    await expect(page.locator('text=Payment Successful')).toBeVisible()

    // Verify UTM parameters stored in conversion
    const userId = await page.evaluate(() => localStorage.getItem('userId'))
    const attributionResponse = await page.request.get(`/api/accounting/admin/conversions/${userId}`)
    const attribution = await attributionResponse.json()

    expect(attribution.utmSource).toBe('instagram')
    expect(attribution.utmMedium).toBe('story')
    expect(attribution.utmCampaign).toBe('summer2026')
  })
})
