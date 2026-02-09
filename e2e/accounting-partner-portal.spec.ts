/**
 * E2E Tests - Partner Portal (P1)
 * Tests: Partner API usage via x-api-key, dashboard, external post upload
 */

import { test, expect } from '@playwright/test'

test.describe('Partner Portal', () => {
  let apiKey: string
  let partnerId: string

  test.beforeAll(async ({ request }) => {
    // Setup: Create partner and generate API key
    const partnerResponse = await request.post('/api/accounting/admin/partners', {
      headers: {
        'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
      },
      data: {
        orgId: `E2E${Date.now()}`,
        orgName: 'E2E Partner',
        businessNumber: '123-45-67890',
        contactEmail: 'e2e@partner.com',
        contactName: 'E2E Test'
      }
    })

    const partner = await partnerResponse.json()
    partnerId = partner.data.id

    // Generate API key
    const keyResponse = await request.post(`/api/accounting/admin/partners/${partnerId}/api-keys`, {
      headers: {
        'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
      },
      data: {
        permissions: ['read:cafes', 'read:links', 'write:posts'],
        expiresInDays: 365
      }
    })

    const keyData = await keyResponse.json()
    apiKey = keyData.data.rawKey
  })

  test('Partner fetches cafe list via API', async ({ request }) => {
    // Call Partner API
    const response = await request.get('/api/qetta/v1/partners/me/cafes', {
      headers: {
        'x-api-key': apiKey
      }
    })

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.cafes)).toBe(true)
    expect(data.data.pagination).toBeDefined()
    expect(data.data.pagination.page).toBe(1)
  })

  test('Partner fetches referral links with stats', async ({ request }) => {
    const response = await request.get('/api/qetta/v1/partners/me/referral-links', {
      headers: {
        'x-api-key': apiKey
      }
    })

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)

    // Verify stats included
    if (data.data.length > 0) {
      const link = data.data[0]
      expect(link).toHaveProperty('conversionsCount')
      expect(link).toHaveProperty('conversionRate')
      expect(link).toHaveProperty('clicks')
    }
  })

  test('Partner fetches payout history', async ({ request }) => {
    const response = await request.get('/api/qetta/v1/partners/me/payouts?page=1&pageSize=20', {
      headers: {
        'x-api-key': apiKey
      }
    })

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.payouts)).toBe(true)
    expect(data.data.pagination).toBeDefined()
  })

  test('Partner uploads external posts (batch)', async ({ request }) => {
    // Setup: Create cafe for partner
    const cafeResponse = await request.post(`/api/accounting/admin/partners/${partnerId}/cafes`, {
      headers: {
        'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
      },
      data: {
        cafeName: 'E2E Cafe',
        commissionRate: 0.05
      }
    })
    const cafe = await cafeResponse.json()
    const cafeId = cafe.data.id

    // Upload posts
    const response = await request.post('/api/qetta/v1/partners/me/external-posts/batch', {
      headers: {
        'x-api-key': apiKey
      },
      data: {
        posts: [
          {
            cafeId,
            postType: 'BLOG',
            url: `https://blog.example.com/e2e-${Date.now()}`,
            title: 'E2E Test Blog Post',
            contentPreview: 'This is a test post',
            publishedAt: new Date().toISOString(),
            views: 1000,
            likes: 50
          },
          {
            cafeId,
            postType: 'INSTAGRAM',
            url: `https://instagram.com/p/e2e-${Date.now()}`,
            title: 'E2E Instagram Post',
            publishedAt: new Date().toISOString(),
            views: 5000,
            likes: 250
          }
        ]
      }
    })

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(201)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.uploaded).toBe(2)
    expect(data.data.posts).toHaveLength(2)
  })

  test('Partner API enforces rate limiting', async ({ request }) => {
    // Make 101 requests (exceeds 100 req/min limit)
    const requests = []

    for (let i = 0; i < 101; i++) {
      requests.push(
        request.get('/api/qetta/v1/partners/me/cafes', {
          headers: { 'x-api-key': apiKey }
        })
      )
    }

    const responses = await Promise.all(requests)

    // At least one should be rate limited
    const rateLimited = responses.filter(r => r.status() === 429)
    expect(rateLimited.length).toBeGreaterThan(0)

    // Verify Retry-After header
    const rateLimitedResponse = rateLimited[0]
    const retryAfter = rateLimitedResponse.headers()['retry-after']
    expect(retryAfter).toBeDefined()
    expect(parseInt(retryAfter)).toBeGreaterThan(0)
  })

  test('Partner API rejects expired API key', async ({ request }) => {
    // Setup: Create API key that expires in 1 second
    const keyResponse = await request.post(`/api/accounting/admin/partners/${partnerId}/api-keys`, {
      headers: {
        'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
      },
      data: {
        permissions: ['read:cafes'],
        expiresInDays: 0.00001 // ~1 second
      }
    })

    const keyData = await keyResponse.json()
    const expiredKey = keyData.data.rawKey

    // Wait 2 seconds for expiration
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Attempt to use expired key
    const response = await request.get('/api/qetta/v1/partners/me/cafes', {
      headers: {
        'x-api-key': expiredKey
      }
    })

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('expired')
  })

  test('Partner API rejects invalid API key', async ({ request }) => {
    const response = await request.get('/api/qetta/v1/partners/me/cafes', {
      headers: {
        'x-api-key': 'pk_live_invalid123456789'
      }
    })

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Invalid API key')
  })

  test('Partner API rejects request without write:posts permission', async ({ request }) => {
    // Setup: Create API key with only read permissions
    const keyResponse = await request.post(`/api/accounting/admin/partners/${partnerId}/api-keys`, {
      headers: {
        'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
      },
      data: {
        permissions: ['read:cafes', 'read:links'], // No write:posts
        expiresInDays: 365
      }
    })

    const keyData = await keyResponse.json()
    const readOnlyKey = keyData.data.rawKey

    // Attempt to upload posts
    const response = await request.post('/api/qetta/v1/partners/me/external-posts/batch', {
      headers: {
        'x-api-key': readOnlyKey
      },
      data: {
        posts: [
          {
            cafeId: 'cafe-123',
            postType: 'BLOG',
            url: 'https://blog.example.com/test',
            title: 'Test',
            publishedAt: new Date().toISOString()
          }
        ]
      }
    })

    expect(response.status()).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Permission denied')
  })

  test('Partner dashboard loads correctly', async ({ page }) => {
    // Navigate to partner portal (requires API key authentication)
    await page.goto('/partner/dashboard')

    // Enter API key
    await page.fill('[name="apiKey"]', apiKey)
    await page.click('button:has-text("Connect")')

    // Verify dashboard loaded
    await expect(page.locator('h1:has-text("Partner Dashboard")')).toBeVisible({ timeout: 10000 })

    // Verify stats cards
    await expect(page.locator('[data-testid="total-cafes"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-links"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-conversions"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-commission"]')).toBeVisible()

    // Verify cafe list table
    await expect(page.locator('table:has-text("Cafes")')).toBeVisible()
    await expect(page.locator('th:has-text("Cafe Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Commission Rate")')).toBeVisible()

    // Verify referral links section
    await expect(page.locator('h2:has-text("Referral Links")')).toBeVisible()
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible()
  })

  test('Partner can copy referral link', async ({ page, context }) => {
    await page.goto('/partner/dashboard')
    await page.fill('[name="apiKey"]', apiKey)
    await page.click('button:has-text("Connect")')

    await expect(page.locator('h1:has-text("Partner Dashboard")')).toBeVisible()

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Click copy button
    const copyButton = page.locator('button:has-text("Copy Link")').first()
    await copyButton.click()

    // Verify copied text
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toMatch(/^https:\/\/qetta\.com\/r\/[A-Z0-9]{8}$/)

    // Verify success toast
    await expect(page.locator('text=Link copied')).toBeVisible({ timeout: 2000 })
  })

  test('Partner views payout history with filters', async ({ page }) => {
    await page.goto('/partner/dashboard')
    await page.fill('[name="apiKey"]', apiKey)
    await page.click('button:has-text("Connect")')

    await expect(page.locator('h1:has-text("Partner Dashboard")')).toBeVisible()

    // Navigate to payout history
    await page.click('a:has-text("Payout History")')
    await expect(page.locator('h2:has-text("Payout History")')).toBeVisible()

    // Apply filters
    await page.selectOption('[name="status"]', 'PAID')
    await page.fill('[name="startDate"]', '2026-01-01')
    await page.fill('[name="endDate"]', '2026-12-31')
    await page.click('button:has-text("Apply Filters")')

    // Verify filtered results
    await expect(page.locator('text=Status: PAID')).toBeVisible({ timeout: 5000 })

    // Verify pagination
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    await expect(page.locator('button:has-text("Next")')).toBeVisible()
  })

  test('Partner uploads external posts via UI', async ({ page }) => {
    await page.goto('/partner/dashboard')
    await page.fill('[name="apiKey"]', apiKey)
    await page.click('button:has-text("Connect")')

    await expect(page.locator('h1:has-text("Partner Dashboard")')).toBeVisible()

    // Navigate to external posts
    await page.click('a:has-text("External Posts")')
    await expect(page.locator('h2:has-text("External Posts")')).toBeVisible()

    // Upload post
    await page.click('button:has-text("Upload Post")')
    await page.selectOption('[name="cafeId"]', { index: 0 }) // Select first cafe
    await page.selectOption('[name="postType"]', 'BLOG')
    await page.fill('[name="url"]', `https://blog.example.com/ui-${Date.now()}`)
    await page.fill('[name="title"]', 'UI Upload Test Post')
    await page.fill('[name="contentPreview"]', 'This post was uploaded via UI')
    await page.fill('[name="publishedAt"]', '2026-02-01')
    await page.fill('[name="views"]', '1500')
    await page.fill('[name="likes"]', '75')
    await page.click('button:has-text("Upload")')

    // Verify success
    await expect(page.locator('text=Post uploaded successfully')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=UI Upload Test Post')).toBeVisible()
  })
})
