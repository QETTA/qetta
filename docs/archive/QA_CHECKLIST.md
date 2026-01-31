# QA Testing Checklist - QETTA UX/UI Refactoring

**Date**: 2026-01-31
**Build**: ✅ Passed
**Dev Server**: http://localhost:3000

---

## 🧪 Manual Testing Checklist

### Phase 1: Authentication Dark Theme

#### Test Auth Pages (5 pages)
- [ ] `/login` - Dark background, consistent styling
- [ ] `/signup` - Dark background, consistent styling
- [ ] `/verify-email` - Dark background, consistent styling
- [ ] `/forgot-password` - Dark background, consistent styling
- [ ] `/reset-password` - Dark background, consistent styling

**Expected Result**: All pages should have `bg-zinc-950` background with `bg-zinc-900` form containers

**Bug to Check**: No `lg:bg-white` should appear on large screens

---

### Phase 2: Navigation Dropdowns

#### Desktop Navigation (≥1024px)

1. **Solutions Dropdown**
   - [ ] Click "Solutions" button
   - [ ] Dropdown appears with smooth animation (scale + opacity)
   - [ ] Shows 2 items: "For Companies", "For Partners"
   - [ ] Each item has icon (BuildingOfficeIcon, UserGroupIcon)
   - [ ] Each item has description text
   - [ ] Hover highlights item with `bg-white/5`
   - [ ] Click outside closes dropdown
   - [ ] ESC key closes dropdown

2. **Partners Dropdown**
   - [ ] Click "Partners" button
   - [ ] Dropdown appears with smooth animation
   - [ ] Shows 3 items: "Consultants", "Buyers", "Suppliers"
   - [ ] Icons: AcademicCapIcon, ShoppingCartIcon, TruckIcon
   - [ ] Hover highlights work
   - [ ] Links navigate correctly

3. **Static Links**
   - [ ] "Features" → `/features`
   - [ ] "How it Works" → `/how-it-works`
   - [ ] "Pricing" → `/pricing`
   - [ ] Hover changes text from `text-zinc-400` to `text-white`

4. **Dashboard CTA**
   - [ ] Violet button visible
   - [ ] Hover darkens to `bg-violet-500`
   - [ ] Navigates to `/docs`

#### Mobile Navigation (<1024px)

1. **Menu Button**
   - [ ] Hamburger icon (Bars2Icon) visible
   - [ ] Click opens mobile menu
   - [ ] Smooth slide-down animation

2. **Solutions Accordion**
   - [ ] "Solutions" button with chevron
   - [ ] Click expands accordion
   - [ ] Chevron rotates 180°
   - [ ] Shows 2 sub-items with icons
   - [ ] Staggered animation (50ms delay)

3. **Partners Accordion**
   - [ ] "Partners" button with chevron
   - [ ] Click expands accordion
   - [ ] Shows 3 sub-items
   - [ ] Independent of Solutions accordion

4. **Static Links**
   - [ ] Features, How it Works, Pricing visible
   - [ ] Staggered animation after accordions
   - [ ] Touch targets ≥48px (accessibility)

5. **Dashboard CTA**
   - [ ] Violet button at bottom
   - [ ] Full width on mobile
   - [ ] Last item in stagger animation

---

### Phase 3: Homepage Minimalization

#### Homepage (`/`)

1. **Hero Section**
   - [ ] Still present (unchanged)
   - [ ] Title: "QETTA – Your Industry, Your Intelligence"
   - [ ] Subtitle and CTA visible

2. **MinimalCTA Section**
   - [ ] GlassCard container visible
   - [ ] Heading: "지금 시작하세요"
   - [ ] Two buttons: "무료로 시작하기", "가격 보기"
   - [ ] Three quick links with icons:
     - [ ] Features (SparklesIcon) → `/features`
     - [ ] How it Works (ArrowPathIcon) → `/how-it-works`
     - [ ] Product (CubeIcon) → `/product`
   - [ ] Trust indicators: 30일 무료 체험, 신용카드 불필요, 언제든지 취소

3. **Removed Sections** (should NOT appear)
   - [ ] ❌ Product Section (gone)
   - [ ] ❌ Apply Section (gone)
   - [ ] ❌ Features Section (gone)
   - [ ] ❌ CTA Section (gone)

**Performance Check**:
- [ ] Page loads noticeably faster
- [ ] LCP under 1 second
- [ ] No layout shift during load

---

### Phase 4: New Detailed Pages

#### Features Page (`/features`)

1. **Hero**
   - [ ] Badge: "All Features" (violet)
   - [ ] Title: "Complete Platform for Government Support"

2. **Features Grid**
   - [ ] 6 cards in grid (2 cols on tablet, 3 on desktop)
   - [ ] Each card has icon, title, description, 3 benefits
   - [ ] Icons: Sparkles, DocumentMagnifying, ShieldCheck, Bolt, ChartBar, GlobeAlt
   - [ ] Scroll animations trigger on view

3. **Stats Section**
   - [ ] 3 metrics: 93.8%, 91%, 630K+
   - [ ] Centered in GlassCard
   - [ ] Sub-text for each metric

4. **MinimalCTA**
   - [ ] Present at bottom
   - [ ] Same as homepage

#### How it Works Page (`/how-it-works`)

1. **Hero**
   - [ ] Badge: "How it Works" (emerald)
   - [ ] Title: "3단계로 완성되는 정부지원사업 신청"

2. **Process Timeline**
   - [ ] 4 steps with connector lines
   - [ ] Each step has: number badge, title, duration badge, 4 details
   - [ ] Connector line between steps (except last)
   - [ ] Staggered animations (0.2s delay each)

3. **Time Saved Section**
   - [ ] Large "총 15-20분" text
   - [ ] Comparison: 125시간 → 7.8시간
   - [ ] Arrow icon between comparison

4. **FAQ Section**
   - [ ] 4 questions in cards
   - [ ] Hover effect on each card

#### Product Page (`/product`)

1. **Hero**
   - [ ] Badge: "Product" (blue)
   - [ ] Title: "Enterprise-Grade SaaS Platform"

2. **Architecture Grid**
   - [ ] 4 cards (2x2 grid)
   - [ ] Topics: SaaS, Security, AI, Integration
   - [ ] Each with 4 checkmarks

3. **Performance Metrics**
   - [ ] 4 metrics in row: 99.9%, <3분, 630K+, 6
   - [ ] Different colors: violet, emerald, blue, fuchsia

4. **Tech Stack**
   - [ ] 4 sections: Frontend, Backend, Infrastructure, AI & ML
   - [ ] Color-coded badges
   - [ ] Next.js 15, React 19, TypeScript, etc.

#### Solutions: Companies Page (`/solutions/companies`)

1. **Hero**
   - [ ] Badge: "For Companies" (emerald)
   - [ ] Title with violet accent: "규제 준수부터 지원금 수령까지 한 번에 자동화"

2. **Benefits Grid**
   - [ ] 4 metric cards with emojis
   - [ ] 93.8%, 91%, 70%, +33%p

3. **Use Cases**
   - [ ] 3 cards: R&D, 정책자금, 인증
   - [ ] Each with: Pain (red), Solution (emerald), ROI (violet)

4. **ROI Calculator**
   - [ ] Comparison table: Before vs After
   - [ ] Total savings: ₩69,500,000
   - [ ] Visual hierarchy with colors

#### Solutions: Partners Page (`/solutions/partners`)

1. **Hero**
   - [ ] Badge: "For Partners" (fuchsia)
   - [ ] Title: "당신의 브랜드로 정부지원사업 플랫폼 제공"

2. **Partner Types Hub**
   - [ ] 3 clickable cards
   - [ ] Links to: `/partners/consultants`, `/partners/buyers`, `/partners/suppliers`
   - [ ] Arrow icon on hover (slides right)
   - [ ] Each with 4 benefits listed

3. **Whitelabel Features**
   - [ ] 4 small cards: Branding, API, Custom, Revenue
   - [ ] Grid layout (2x2 on desktop, 4 on large)

4. **Revenue Model**
   - [ ] 3 metrics: 30-40%, 100%, ∞
   - [ ] Example calculation at bottom

5. **API Section**
   - [ ] 2 columns: RESTful API, Webhooks
   - [ ] Each with 4 checkmarks
   - [ ] Link to `/docs/api` at bottom

---

## 🎨 Visual Design Checks

### Global Consistency

1. **Colors**
   - [ ] Primary: Violet (#8B5CF6 / `text-violet-500`)
   - [ ] Background: Zinc-950 (`bg-zinc-950`)
   - [ ] Cards: Zinc-900/50 (`bg-zinc-900/50`)
   - [ ] Text: White → Zinc-400 hierarchy

2. **Typography**
   - [ ] Headings: Bold, proper hierarchy
   - [ ] Body: Zinc-400 for secondary text
   - [ ] Consistent font sizes

3. **Spacing**
   - [ ] Section padding: `py-16` or `py-24`
   - [ ] Card padding: `xl` (px-8 py-6) for CTAs
   - [ ] Grid gaps: `gap-6` or `gap-8`

4. **Animations**
   - [ ] Scroll animations smooth (AnimatedSection)
   - [ ] Dropdown transitions (200ms ease-out)
   - [ ] Hover states responsive
   - [ ] Respects `prefers-reduced-motion`

---

## ♿ Accessibility Checks

### Keyboard Navigation

1. **Tab Order**
   - [ ] Logical top-to-bottom, left-to-right
   - [ ] Dropdown menus accessible via Tab
   - [ ] Skip to content link works (Tab from page load)

2. **Focus Indicators**
   - [ ] Visible focus rings (`focus-visible:ring-2`)
   - [ ] High contrast (violet or white)
   - [ ] Never hidden

3. **Screen Reader**
   - [ ] All images have alt text
   - [ ] ARIA labels on icon buttons
   - [ ] Headings in proper order (h1 → h2 → h3)
   - [ ] `main` landmark present
   - [ ] Skip to content link announces

### Color Contrast

- [ ] Text on background ≥ 4.5:1 (WCAG AA)
- [ ] Violet on zinc-950 ≥ 4.5:1
- [ ] Zinc-400 on zinc-950 ≥ 4.5:1

---

## 🚀 Performance Checks

### Lighthouse (Desktop)

Run in Chrome DevTools (Incognito mode):
```
Performance: ___ (Target: ≥95)
Accessibility: ___ (Target: ≥98)
Best Practices: ___ (Target: 100)
SEO: ___ (Target: 100)
```

### Lighthouse (Mobile)

```
Performance: ___ (Target: ≥90)
Accessibility: ___ (Target: ≥98)
Best Practices: ___ (Target: 100)
SEO: ___ (Target: 100)
```

### Core Web Vitals

- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

### Network

- [ ] Homepage initial bundle < 300KB gzipped
- [ ] New pages lazy-load (not in initial bundle)
- [ ] ISR headers present (`s-maxage=3600`)

---

## 🌐 Browser Testing

### Desktop Browsers

- [ ] Chrome (latest) - macOS
- [ ] Chrome (latest) - Windows
- [ ] Safari (latest) - macOS
- [ ] Firefox (latest) - Windows
- [ ] Edge (latest) - Windows

**Test**: Dropdown menus, hover states, animations

### Mobile Browsers

- [ ] Safari - iOS (iPhone)
- [ ] Chrome - Android
- [ ] Samsung Internet - Android

**Test**: Mobile menu, touch targets, accordion

### Viewports

- [ ] 375px (iPhone SE)
- [ ] 768px (iPad)
- [ ] 1024px (Desktop)
- [ ] 1440px (Large Desktop)

---

## 🔍 SEO Verification

### Metadata

Check each page has unique:
- [ ] `/features` - title, description, OG tags
- [ ] `/how-it-works` - title, description, OG tags
- [ ] `/product` - title, description, OG tags
- [ ] `/solutions/companies` - title, description, OG tags
- [ ] `/solutions/partners` - title, description, OG tags

### Structured Data

- [ ] Homepage has Organization schema
- [ ] Homepage has SoftwareApplication schema
- [ ] Validates on https://search.google.com/test/rich-results

### Sitemap

- [ ] New routes added to sitemap.xml (if exists)
- [ ] Robots.txt allows new routes

---

## 🐛 Regression Testing

### Existing Pages

Ensure these still work:
- [ ] `/pricing` - unchanged
- [ ] `/partners/consultants` - unchanged
- [ ] `/partners/buyers` - unchanged
- [ ] `/partners/suppliers` - unchanged
- [ ] `/company` - unchanged
- [ ] `/docs` - unchanged

### Existing Features

- [ ] Auth flows work (login, signup)
- [ ] Dashboard accessible
- [ ] API routes functional
- [ ] Settings pages work

---

## 📊 Analytics Tracking

### Events to Track (Post-Deployment)

1. **Navigation**
   - Solutions dropdown opened
   - Partners dropdown opened
   - Menu item clicked (per link)

2. **CTAs**
   - MinimalCTA "무료로 시작하기" clicked
   - MinimalCTA "가격 보기" clicked
   - Quick links clicked (Features, How it Works, Product)

3. **Page Views**
   - /features page view
   - /how-it-works page view
   - /product page view
   - /solutions/companies page view
   - /solutions/partners page view

4. **Conversions**
   - Signup from new pages
   - Navigation path analysis
   - Bounce rate on new pages

---

## ✅ Sign-Off

**QA Tester**: _______________
**Date**: _______________
**Browser/OS**: _______________

**Overall Result**: ☐ Pass ☐ Fail

**Critical Issues Found**: _______________

**Minor Issues Found**: _______________

**Notes**: _______________
