/**
 * E2E Tests - Admin Dashboard Flow (P1 - Critical)
 * Tests: Partner creation → Cafe → API key → Payout operations
 */

import { test, expect } from '@playwright/test'

test.describe('Accounting Admin Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@qetta.com')
    await page.fill('[name="password"]', 'admin_password')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 })
  })

  test('Admin creates partner → cafe → API key flow', async ({ page }) => {
    // Navigate to accounting section
    await page.goto('/dashboard/accounting')
    await expect(page.locator('h1:has-text("Accounting")')).toBeVisible()

    // Step 1: Create partner
    await page.click('button:has-text("Add Partner")')
    await expect(page.locator('text=Create Partner')).toBeVisible()

    const orgId = `ORG${Date.now()}`
    await page.fill('[name="orgId"]', orgId)
    await page.fill('[name="orgName"]', 'E2E Test Partner')
    await page.fill('[name="businessNumber"]', '123-45-67890')
    await page.fill('[name="contactEmail"]', 'test@e2e-partner.com')
    await page.fill('[name="contactName"]', 'John Doe')
    await page.click('button:has-text("Create")')

    // Verify partner created
    await expect(page.locator(`text=${orgId}`)).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=E2E Test Partner')).toBeVisible()

    // Step 2: Add cafe to partner
    await page.click(`tr:has-text("${orgId}") button:has-text("Add Cafe")`)
    await expect(page.locator('text=Add Cafe')).toBeVisible()

    await page.fill('[name="cafeName"]', 'HQ Location')
    await page.fill('[name="commissionRate"]', '0.05')
    await page.click('button:has-text("Create")')

    // Verify cafe created
    await expect(page.locator('text=HQ Location')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=5%')).toBeVisible() // Commission rate

    // Step 3: Generate API key
    await page.click(`tr:has-text("${orgId}") button:has-text("Generate API Key")`)
    await expect(page.locator('text=Generate API Key')).toBeVisible()

    await page.check('[name="permission"][value="read:cafes"]')
    await page.check('[name="permission"][value="write:posts"]')
    await page.fill('[name="expiresInDays"]', '365')
    await page.click('button:has-text("Generate")')

    // Verify API key shown (one-time display)
    await expect(page.locator('text=Store this API key securely')).toBeVisible()
    const apiKeyElement = page.locator('[data-testid="raw-api-key"]')
    await expect(apiKeyElement).toBeVisible()
    const apiKey = await apiKeyElement.textContent()
    expect(apiKey).toMatch(/^pk_live_[a-z0-9]{32}$/)

    // Copy API key and close modal
    await page.click('button:has-text("Copy")')
    await page.click('button:has-text("Close")')

    // Verify API key NOT shown again (security)
    await page.click(`tr:has-text("${orgId}") button:has-text("View API Keys")`)
    await expect(page.locator('text=pk_live_')).not.toBeVisible() // Only prefix shown
    await expect(page.locator('text=expires in')).toBeVisible()
  })

  test('Admin previews and approves payout', async ({ page, request }) => {
    // Setup: Create partner with conversions via API
    const setupResponse = await request.post('/api/test/setup-accounting', {
      data: {
        partnerId: 'partner-e2e-payout',
        conversionsCount: 10,
        totalRevenue: 1000,
        totalCommission: 50
      }
    })
    expect(setupResponse.ok()).toBeTruthy()

    // Navigate to payouts
    await page.goto('/dashboard/accounting/payouts')
    await expect(page.locator('h1:has-text("Payouts")')).toBeVisible()

    // Step 1: Generate payout preview
    await page.click('button:has-text("Generate This Month")')
    await page.selectOption('[name="partnerId"]', 'partner-e2e-payout')
    await page.fill('[name="periodStart"]', '2026-02-01')
    await page.fill('[name="periodEnd"]', '2026-02-28')
    await page.click('button:has-text("Preview")')

    // Verify preview data
    await expect(page.locator('text=Preview Generated')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=10 conversions')).toBeVisible()
    await expect(page.locator('text=$50.00')).toBeVisible() // Commission
    await expect(page.locator('[data-testid="snapshot-hash"]')).toBeVisible()

    // Step 2: Approve payout
    await page.click('button:has-text("Approve")')
    await expect(page.locator('text=Confirm Approval')).toBeVisible()
    await page.fill('[name="approvalNote"]', 'February 2026 monthly payout')
    await page.click('button:has-text("Confirm")')

    // Verify payout approved (SSE real-time update)
    await expect(page.locator('text=Status: APPROVED')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Approved by: admin@qetta.com')).toBeVisible()

    // Step 3: Verify audit log
    await page.click('button:has-text("View Audit Log")')
    await expect(page.locator('text=Payout approved')).toBeVisible()
    await expect(page.locator('text=February 2026 monthly payout')).toBeVisible()
  })

  test('Admin creates adjustment for paid payout', async ({ page, request }) => {
    // Setup: Create paid payout
    const setupResponse = await request.post('/api/test/setup-accounting', {
      data: {
        partnerId: 'partner-e2e-adjustment',
        payoutStatus: 'PAID',
        totalCommission: 100
      }
    })
    const { payoutId } = await setupResponse.json()

    // Navigate to payout detail
    await page.goto(`/dashboard/accounting/payouts/${payoutId}`)
    await expect(page.locator('text=Status: PAID')).toBeVisible()

    // Create adjustment
    await page.click('button:has-text("Create Adjustment")')
    await expect(page.locator('text=Create Adjustment')).toBeVisible()

    await page.fill('[name="adjustmentAmount"]', '-50') // Clawback $50
    await page.fill('[name="reason"]', 'Incorrect commission calculation')
    await page.click('button:has-text("Create")')

    // Verify adjustment created
    await expect(page.locator('text=Adjustment Created')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=-$50.00')).toBeVisible()
    await expect(page.locator('text=Version: 2')).toBeVisible()
    await expect(page.locator('text=Net Payout: $50.00')).toBeVisible() // 100 - 50

    // Verify compensating ledger entry
    await page.click('button:has-text("View Ledger History")')
    await expect(page.locator('text=PAYOUT')).toBeVisible()
    await expect(page.locator('text=ADJUSTMENT')).toBeVisible()
  })

  test('Admin dashboard shows real-time stats', async ({ page }) => {
    await page.goto('/dashboard/accounting')

    // Verify stat cards visible
    await expect(page.locator('[data-testid="total-partners"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-cafes"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-conversions"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-commission"]')).toBeVisible()

    // Get initial values
    const initialConversions = await page.locator('[data-testid="monthly-conversions"]').textContent()

    // Simulate conversion (via API)
    await page.request.post('/api/test/create-conversion', {
      data: { userId: 'user-e2e-123', linkId: 'link-test', amount: 100 }
    })

    // Wait for SSE update (5 seconds max)
    await page.waitForTimeout(2000)

    // Verify stat updated (should increment)
    const updatedConversions = await page.locator('[data-testid="monthly-conversions"]').textContent()
    expect(parseInt(updatedConversions!)).toBeGreaterThan(parseInt(initialConversions!))
  })

  test('Admin cannot approve payout with tampered snapshot', async ({ page, request }) => {
    // Setup: Create payout preview
    const previewResponse = await request.post('/api/accounting/admin/payouts/preview', {
      data: {
        partnerId: 'partner-tamper-test',
        periodStart: '2026-02-01T00:00:00Z',
        periodEnd: '2026-02-28T23:59:59Z'
      }
    })
    const { snapshotHash, conversionIds } = await previewResponse.json()

    // Navigate to approval page
    await page.goto('/dashboard/accounting/payouts/approve')
    await page.fill('[name="partnerId"]', 'partner-tamper-test')
    await page.fill('[name="snapshotHash"]', snapshotHash)

    // Tamper with conversion IDs (simulate TOCTOU attack)
    const tamperedIds = [...conversionIds, 'conv-tampered-123']
    await page.evaluate((ids) => {
      ;(window as any).__conversionIds = ids
    }, tamperedIds)

    // Attempt approval
    await page.click('button:has-text("Approve")')

    // Verify rejection
    await expect(page.locator('text=Snapshot verification failed')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Data tampering detected')).toBeVisible()
  })

  test('Admin views partner performance dashboard', async ({ page }) => {
    await page.goto('/dashboard/accounting/partners/partner-123')

    // Verify performance metrics
    await expect(page.locator('h2:has-text("Performance")')).toBeVisible()
    await expect(page.locator('[data-testid="total-cafes"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-links"]')).toBeVisible()
    await expect(page.locator('[data-testid="conversion-rate"]')).toBeVisible()
    await expect(page.locator('[data-testid="lifetime-commission"]')).toBeVisible()

    // Verify commission chart (Recharts)
    await expect(page.locator('.recharts-wrapper')).toBeVisible()
    await expect(page.locator('.recharts-line')).toBeVisible()

    // Verify top performing cafes table
    await expect(page.locator('table:has-text("Top Cafes")')).toBeVisible()
    await expect(page.locator('th:has-text("Cafe Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Conversions")')).toBeVisible()
    await expect(page.locator('th:has-text("Commission")')).toBeVisible()
  })
})
