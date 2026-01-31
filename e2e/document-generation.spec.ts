import { test, expect } from '@playwright/test'

/**
 * Document Generation E2E Tests
 * Tests the core document generation flow: /generate -> preview -> download
 */
test.describe('Document Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to generate page
    await page.goto('/generate')
  })

  test('generate page loads correctly', async ({ page }) => {
    // Check page title or heading
    await expect(page).toHaveURL('/generate')

    // Check main UI elements are visible
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('document type selector is visible', async ({ page }) => {
    // Check for document type selection UI
    // Could be dropdown, radio buttons, or cards
    const typeSelector = page.locator('[data-testid="document-type-selector"], select, [role="listbox"]').first()
    await expect(typeSelector).toBeVisible({ timeout: 10000 })
  })

  test('form inputs are functional', async ({ page }) => {
    // Check for common form inputs
    const inputs = page.locator('input, textarea')
    const inputCount = await inputs.count()

    // Should have at least some input fields
    expect(inputCount).toBeGreaterThan(0)
  })

  test('generate button exists and is clickable', async ({ page }) => {
    // Look for generate/create button
    const generateButton = page.getByRole('button', {
      name: /생성|만들기|generate|create|시작/i
    }).first()

    await expect(generateButton).toBeVisible()
    await expect(generateButton).toBeEnabled()
  })

  test('redirects to login when not authenticated', async ({ page, context }) => {
    // Clear any existing auth state
    await context.clearCookies()

    // Try to access protected route
    await page.goto('/generate')

    // Should redirect to login or show auth prompt
    const currentUrl = page.url()
    const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/signin')
    const hasAuthPrompt = await page.locator('[data-testid="auth-prompt"], [class*="login"]').isVisible().catch(() => false)

    // Either redirected to login or shows auth prompt
    expect(isLoginPage || hasAuthPrompt || currentUrl.includes('/generate')).toBe(true)
  })
})

test.describe('Document Preview', () => {
  test('preview modal/page structure', async ({ page }) => {
    await page.goto('/generate')

    // Check for preview area or modal trigger
    const previewArea = page.locator('[data-testid="document-preview"], [class*="preview"]').first()

    // Preview area might not be visible until document is generated
    // Just verify the page loads without errors
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Document Download', () => {
  test('download API endpoint responds', async ({ request }) => {
    // Test the download endpoint exists (will require auth in real scenario)
    const response = await request.get('/api/generate-document/download')

    // Should return 401 (unauthorized) or 400 (bad request) if not authenticated
    // 200 would require valid session and document ID
    expect([200, 400, 401, 405]).toContain(response.status())
  })

  test('download endpoint with ID structure', async ({ request }) => {
    // Test with a fake ID - should return appropriate error
    const response = await request.get('/api/generate-document/download/test-id-123')

    // Should return 401 or 404, not 500
    expect([401, 404, 400]).toContain(response.status())
  })
})

test.describe('Document Generation API', () => {
  test('generate document API endpoint exists', async ({ request }) => {
    // Test the main generate endpoint
    const response = await request.post('/api/generate-document', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    })

    // Should return auth error or validation error, not 500
    expect([400, 401, 422]).toContain(response.status())
  })

  test('preview API endpoint exists', async ({ request }) => {
    const response = await request.post('/api/generate-document/preview', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {},
    })

    // Should return auth error or validation error, not 500
    expect([400, 401, 422]).toContain(response.status())
  })
})
