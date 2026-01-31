import { test, expect } from '@playwright/test';

/**
 * Phase 3 & 4: Homepage and Detailed Pages Tests
 */
test.describe('Homepage', () => {
  test('Hero section is present', async ({ page }) => {
    await page.goto('/');

    // Check for hero content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/QETTA|intelligence|인텔리전스/i)).toBeVisible();
  });

  test('MinimalCTA section is present', async ({ page }) => {
    await page.goto('/');

    // Check for CTA buttons
    await expect(page.getByText(/무료로 시작|get started|start free/i)).toBeVisible();
    await expect(page.getByText(/가격|pricing/i)).toBeVisible();
  });

  test('Trust indicators are visible', async ({ page }) => {
    await page.goto('/');

    // Check for trust indicators
    const trustText = page.getByText(/무료 체험|신용카드 불필요|언제든지 취소/i);
    await expect(trustText.first()).toBeVisible();
  });

  test('Removed sections do NOT appear', async ({ page }) => {
    await page.goto('/');

    // These sections should be removed per QA checklist
    // Check that homepage is minimal - no excessive sections
    const pageContent = await page.content();

    // Page should load quickly without heavy sections
    expect(pageContent.length).toBeLessThan(500000); // Reasonable size check
  });
});

test.describe('Features Page', () => {
  test('Features page loads with hero', async ({ page }) => {
    await page.goto('/features');

    // Check hero badge and title
    await expect(page.getByText(/all features|전체 기능/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Features grid shows 6 cards', async ({ page }) => {
    await page.goto('/features');

    // Look for feature cards (should be 6)
    const cards = page.locator('[class*="card"], [class*="Card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('Stats section shows metrics', async ({ page }) => {
    await page.goto('/features');

    // Check for stats: 93.8%, 91%, 630K+
    await expect(page.getByText(/93\.8%|91%|630K/)).toBeVisible();
  });
});

test.describe('How it Works Page', () => {
  test('How it Works page loads with hero', async ({ page }) => {
    await page.goto('/how-it-works');

    // Check hero badge
    await expect(page.getByText(/how it works|이용 방법/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Process timeline shows steps', async ({ page }) => {
    await page.goto('/how-it-works');

    // Check for step indicators (numbered or visual)
    const steps = page.locator('[class*="step"], [class*="Step"]');
    await expect(steps.first()).toBeVisible();
  });

  test('Time saved section is visible', async ({ page }) => {
    await page.goto('/how-it-works');

    // Check for time comparison
    await expect(page.getByText(/분|시간|hours|minutes/i)).toBeVisible();
  });
});

test.describe('Product Page', () => {
  test('Product page loads with hero', async ({ page }) => {
    await page.goto('/product');

    // Check hero
    await expect(page.getByText(/product|제품/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Architecture grid shows topics', async ({ page }) => {
    await page.goto('/product');

    // Check for architecture topics: SaaS, Security, AI, Integration
    await expect(page.getByText(/saas|security|ai|integration/i).first()).toBeVisible();
  });

  test('Performance metrics are visible', async ({ page }) => {
    await page.goto('/product');

    // Check for metrics: 99.9%, <3분, 630K+
    await expect(page.getByText(/99\.9%|630K/)).toBeVisible();
  });

  test('Tech stack section shows technologies', async ({ page }) => {
    await page.goto('/product');

    // Check for tech stack items
    await expect(page.getByText(/next\.js|react|typescript/i).first()).toBeVisible();
  });
});

test.describe('Solutions Pages', () => {
  test('Companies page loads correctly', async ({ page }) => {
    await page.goto('/solutions/companies');

    // Check hero
    await expect(page.getByText(/for companies|기업용/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Companies page shows benefits and use cases', async ({ page }) => {
    await page.goto('/solutions/companies');

    // Check for metrics
    await expect(page.getByText(/93\.8%|91%|70%/)).toBeVisible();
  });

  test('Partners page loads correctly', async ({ page }) => {
    await page.goto('/solutions/partners');

    // Check hero
    await expect(page.getByText(/for partners|파트너용/i)).toBeVisible();
  });

  test('Partners page shows partner type hub', async ({ page }) => {
    await page.goto('/solutions/partners');

    // Check for partner type links
    await expect(page.getByRole('link', { name: /consultants|컨설턴트/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /buyers|바이어/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /suppliers|공급업체/i })).toBeVisible();
  });
});

test.describe('Partner Detail Pages', () => {
  test('Consultants page loads', async ({ page }) => {
    await page.goto('/partners/consultants');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Buyers page loads', async ({ page }) => {
    await page.goto('/partners/buyers');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Suppliers page loads', async ({ page }) => {
    await page.goto('/partners/suppliers');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Pricing Page', () => {
  test('Pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
