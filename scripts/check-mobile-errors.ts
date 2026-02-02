import { chromium } from '@playwright/test'

async function checkMobileErrors() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  const page = await context.newPage()

  // Track console messages
  const consoleMessages: Array<{ type: string; text: string }> = []
  page.on('console', (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
    })
  })

  // Track page errors
  const pageErrors: string[] = []
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  // Track failed requests
  const failedRequests: Array<{ url: string; status: number | null }> = []
  page.on('requestfailed', async (request) => {
    const response = await request.response()
    failedRequests.push({
      url: request.url(),
      status: response?.status() || null,
    })
  })

  console.log('🔍 Checking KidsMap page on mobile viewport...\n')

  try {
    // Navigate to KidsMap
    await page.goto('http://localhost:3000/map', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait a bit for dynamic content
    await page.waitForTimeout(3000)

    // Check for CSS issues
    console.log('📱 CSS Layout Check:')
    const body = await page.$('body')
    if (body) {
      const overflowX = await body.evaluate((el) => window.getComputedStyle(el).overflowX)
      const bodyWidth = await body.evaluate((el) => el.scrollWidth)
      const viewportWidth = 375

      if (bodyWidth > viewportWidth && overflowX !== 'hidden') {
        console.log('❌ Horizontal scroll detected:', bodyWidth, 'px > ', viewportWidth, 'px')
      } else {
        console.log('✅ No horizontal scroll issues')
      }
    }

    // Check for missing elements
    console.log('\n🗺️ Map Elements Check:')
    const mapContainer = await page.$('[id*="map"], [class*="map"]')
    if (!mapContainer) {
      console.log('❌ Map container not found')
    } else {
      console.log('✅ Map container found')
    }

    // Print console errors and warnings
    console.log('\n🐛 Console Messages:')
    const errors = consoleMessages.filter((m) => m.type === 'error')
    const warnings = consoleMessages.filter((m) => m.type === 'warning')

    if (errors.length > 0) {
      console.log(`❌ ${errors.length} Console Errors:`)
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`)
      })
    } else {
      console.log('✅ No console errors')
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️ ${warnings.length} Console Warnings:`)
      warnings.slice(0, 5).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.text}`)
      })
      if (warnings.length > 5) {
        console.log(`  ... and ${warnings.length - 5} more warnings`)
      }
    } else {
      console.log('✅ No console warnings')
    }

    // Print page errors
    if (pageErrors.length > 0) {
      console.log('\n💥 Page Errors:')
      pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    } else {
      console.log('\n✅ No page errors')
    }

    // Print failed requests
    if (failedRequests.length > 0) {
      console.log('\n🌐 Failed Requests:')
      failedRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.url} (${req.status || 'no response'})`)
      })
    } else {
      console.log('\n✅ No failed requests')
    }

    // Take screenshot
    await page.screenshot({
      path: 'mobile-kidsmap-screenshot.png',
      fullPage: true,
    })
    console.log('\n📸 Screenshot saved: mobile-kidsmap-screenshot.png')
  } catch (error) {
    console.error('❌ Error during check:', error)
  } finally {
    await browser.close()
  }
}

checkMobileErrors().catch(console.error)
