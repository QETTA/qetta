# Linear-Style QETTA Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform QETTA into a Linear App-style premium SaaS platform with gradient orbs, dynamic backgrounds, enhanced typography, and refined micro-animations across 14 pages.

**Architecture:** Component Evolution approach - GlassCard evolves with new `variant="linear"` option, decorative elements (orbs, backgrounds) added as separate layers, Catalyst components gradually integrated. Progressive, non-breaking migration in 4 phases.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Catalyst UI, Framer Motion (optional)

---

## Phase 1: Foundation Components (Non-Breaking)

### Task 1: Create linear-config.ts constants file

**Files:**
- Create: `constants/linear-config.ts`

**Step 1: Write the configuration file**

```typescript
/**
 * Linear-Style Design System Configuration
 *
 * Gradient colors, positions, and animation settings for Linear App-style components.
 */

export const GRADIENT_COLORS = {
  violet: 'bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-purple-600/10',
  emerald: 'bg-gradient-to-br from-emerald-400/30 via-teal-500/20 to-cyan-600/10',
  blue: 'bg-gradient-to-br from-blue-400/30 via-cyan-500/20 to-sky-600/10',
  fuchsia: 'bg-gradient-to-br from-fuchsia-400/30 via-pink-500/20 to-rose-600/10',
  amber: 'bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-yellow-600/10',
} as const

export const ORB_SIZES = {
  sm: 'w-64 h-64',
  md: 'w-96 h-96',
  lg: 'w-[32rem] h-[32rem]',
  xl: 'w-[48rem] h-[48rem]',
} as const

export const ORB_POSITIONS = {
  'top-left': '-top-32 -left-32',
  'top-right': '-top-32 -right-32',
  'bottom-left': '-bottom-32 -left-32',
  'bottom-right': '-bottom-32 -right-32',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
} as const

export type GradientColor = keyof typeof GRADIENT_COLORS
export type OrbSize = keyof typeof ORB_SIZES
export type OrbPosition = keyof typeof ORB_POSITIONS

/**
 * Page-specific gradient color mappings
 */
export const PAGE_GRADIENT_MAP = {
  home: 'violet',
  features: 'violet',
  'how-it-works': 'emerald',
  product: 'blue',
  'solutions-companies': 'emerald',
  'solutions-partners': 'fuchsia',
  auth: 'zinc',
  settings: 'zinc',
} as const
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add constants/linear-config.ts
git commit -m "feat(linear): add gradient orb configuration constants"
```

---

### Task 2: Create GradientOrb component

**Files:**
- Create: `components/linear/GradientOrb.tsx`

**Step 1: Write the GradientOrb component**

```typescript
'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { GRADIENT_COLORS, ORB_SIZES, ORB_POSITIONS, type GradientColor, type OrbSize, type OrbPosition } from '@/constants/linear-config'

interface GradientOrbProps {
  /** Orb color theme */
  color: GradientColor
  /** Orb position */
  position?: OrbPosition
  /** Size variant */
  size?: OrbSize
  /** Blur intensity (px) */
  blur?: number
  /** Opacity (0-100) */
  opacity?: number
  /** Enable rotation animation */
  animate?: boolean
  /** Hide on mobile */
  hideOnMobile?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * GradientOrb - Linear App-style decorative gradient sphere
 *
 * Pure CSS gradient orb with optional rotation animation.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * <section className="relative">
 *   <GradientOrb color="violet" position="top-right" size="lg" />
 *   <div className="relative z-10">Content</div>
 * </section>
 * ```
 */
export const GradientOrb = memo(function GradientOrb({
  color,
  position = 'top-right',
  size = 'lg',
  blur = 60,
  opacity = 100,
  animate = false,
  hideOnMobile = true,
  className,
}: GradientOrbProps) {
  return (
    <div
      className={cn(
        // Base styles
        'absolute rounded-full pointer-events-none',
        GRADIENT_COLORS[color],
        ORB_SIZES[size],
        ORB_POSITIONS[position],
        // Blur
        `blur-[${blur}px]`,
        // Opacity
        `opacity-${opacity}`,
        // Animation
        animate && 'motion-safe:animate-[spin_20s_linear_infinite]',
        // Mobile hiding
        hideOnMobile && 'hidden lg:block',
        className
      )}
      style={{
        filter: `blur(${blur}px)`,
        opacity: opacity / 100,
      }}
      aria-hidden="true"
    />
  )
})
```

**Step 2: Create index.ts barrel export**

Create: `components/linear/index.ts`

```typescript
export { GradientOrb } from './GradientOrb'
```

**Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Test component renders**

Run: `npm run dev`
Navigate to any page, open DevTools Console, run:
```javascript
// Should not throw errors
import('/components/linear/GradientOrb').then(m => console.log('✅ GradientOrb loaded'))
```

**Step 5: Commit**

```bash
git add components/linear/
git commit -m "feat(linear): add GradientOrb decorative component"
```

---

### Task 3: Create DynamicBackground component

**Files:**
- Create: `components/linear/DynamicBackground.tsx`
- Modify: `components/linear/index.ts`

**Step 1: Write the DynamicBackground component**

```typescript
'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

interface DynamicBackgroundProps {
  /** Blur intensity */
  blur?: number
  /** Gradient overlay type */
  gradient?: 'radial' | 'linear' | 'none'
  /** Add noise texture */
  noise?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * DynamicBackground - Linear App-style section background
 *
 * Adds subtle blur and gradient overlays to sections.
 *
 * @example
 * ```tsx
 * <section className="relative">
 *   <DynamicBackground blur={20} gradient="radial" />
 *   <div className="relative z-10">Content</div>
 * </section>
 * ```
 */
export const DynamicBackground = memo(function DynamicBackground({
  blur = 20,
  gradient = 'radial',
  noise = false,
  className,
}: DynamicBackgroundProps) {
  return (
    <>
      {/* Blur overlay */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          `backdrop-blur-[${blur}px]`,
          className
        )}
        style={{
          backdropFilter: `blur(${blur}px)`,
        }}
        aria-hidden="true"
      />

      {/* Gradient overlay */}
      {gradient !== 'none' && (
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            gradient === 'radial' && 'bg-gradient-radial from-zinc-900/50 via-zinc-950/80 to-zinc-950',
            gradient === 'linear' && 'bg-gradient-to-b from-zinc-900/50 to-zinc-950'
          )}
          aria-hidden="true"
        />
      )}

      {/* Noise texture (optional) */}
      {noise && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
          }}
          aria-hidden="true"
        />
      )}
    </>
  )
})
```

**Step 2: Update index.ts barrel export**

Modify: `components/linear/index.ts`

```typescript
export { GradientOrb } from './GradientOrb'
export { DynamicBackground } from './DynamicBackground'
```

**Step 3: Add radial gradient to tailwind.config.ts**

Modify: `tailwind.config.ts` (add to `extend.backgroundImage`)

```typescript
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        // ... existing gradients
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
}
```

**Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/linear/ tailwind.config.ts
git commit -m "feat(linear): add DynamicBackground component with blur and gradient overlays"
```

---

## Phase 2: GlassCard Evolution

### Task 4: Add Linear variants to card-styles.ts

**Files:**
- Modify: `constants/card-styles.ts`

**Step 1: Add new Linear variants**

Add to `CARD_VARIANTS`:

```typescript
export const CARD_VARIANTS = {
  // Existing variants
  glass: 'rounded-lg bg-zinc-900/50 ring-1 ring-white/15',
  glassHover:
    'rounded-lg bg-zinc-900/50 ring-1 ring-white/15 hover:bg-zinc-900/60 hover:ring-white/20 transition-all',
  solid: 'rounded-lg bg-zinc-900 ring-1 ring-white/15',
  gradientAmber:
    'rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 ring-1 ring-amber-500/20',

  // NEW Linear variants
  linear: 'rounded-2xl bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl shadow-black/40',
  linearHover:
    'rounded-2xl bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl shadow-black/40 hover:bg-zinc-900/90 hover:ring-white/15 hover:shadow-violet-500/10 transition-all duration-300',
  linearGlow:
    'rounded-2xl bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl shadow-violet-500/20',
} as const
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add constants/card-styles.ts
git commit -m "feat(linear): add linear/linearHover/linearGlow card variants"
```

---

### Task 5: Enhance GlassCard with Linear props

**Files:**
- Modify: `components/landing/blocks/shared/GlassCard.tsx`

**Step 1: Update GlassCard interface and implementation**

```typescript
import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CARD_VARIANTS, CARD_PADDINGS, type CardVariant, type CardPadding } from '@/constants/card-styles'
import { GradientOrb } from '@/components/linear'
import { type GradientColor } from '@/constants/linear-config'

interface GlassCardProps {
  children: ReactNode
  className?: string
  /** Card visual variant */
  variant?: CardVariant
  /** Padding preset */
  padding?: CardPadding
  /** HTML element to render as */
  as?: 'div' | 'li' | 'article'
  /** Embedded gradient orb (Linear style) */
  orb?: GradientColor | false
  /** Micro-animation on hover */
  microAnimate?: boolean
}

/**
 * GlassCard - Reusable glass morphism card container
 *
 * Now supports Linear App-style variants with embedded gradient orbs.
 *
 * @example
 * ```tsx
 * // Classic glassmorphism
 * <GlassCard variant="glass" padding="md">
 *   <p>Card content</p>
 * </GlassCard>
 *
 * // Linear style with orb
 * <GlassCard variant="linear" orb="violet" padding="lg" microAnimate>
 *   <Heading>Premium Card</Heading>
 *   <Text>With gradient orb</Text>
 * </GlassCard>
 * ```
 */
export const GlassCard = memo(function GlassCard({
  children,
  className,
  variant = 'glass',
  padding = 'md',
  as: Component = 'div',
  orb = false,
  microAnimate = false,
}: GlassCardProps) {
  return (
    <Component
      className={cn(
        'relative',
        CARD_VARIANTS[variant],
        CARD_PADDINGS[padding],
        microAnimate && 'transition-transform duration-300 motion-safe:hover:scale-[1.02]',
        className
      )}
    >
      {/* Embedded gradient orb */}
      {orb && (
        <GradientOrb
          color={orb}
          position="bottom-right"
          size="md"
          blur={80}
          opacity={30}
          className="absolute"
        />
      )}

      {/* Content with z-index to ensure it's above orb */}
      <div className="relative z-10">{children}</div>
    </Component>
  )
})
```

**Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add components/landing/blocks/shared/GlassCard.tsx
git commit -m "feat(linear): enhance GlassCard with orb and microAnimate props"
```

---

## Phase 3: Pilot Migration (Features & Product Pages)

### Task 6: Migrate /features page to Linear style

**Files:**
- Modify: `app/(marketing)/features/page.tsx`

**Step 1: Add gradient orbs to hero section**

Find the `<DetailPageHero>` component (around line 84-167) and wrap its parent with:

```typescript
// Add imports at top
import { GradientOrb, DynamicBackground } from '@/components/linear'

// Wrap the hero section
<section className="relative overflow-hidden">
  <DynamicBackground blur={15} gradient="radial" />
  <GradientOrb color="violet" position="top-right" size="xl" opacity={40} />
  <GradientOrb color="blue" position="bottom-left" size="lg" opacity={20} />

  <DetailPageHero
    badge="All Features"
    badgeColor="violet"
    showStatusPing
    statusPingColor="violet"
    heading={
      <>
        Complete Platform for
        <br />
        <span className="mt-2 block bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Government Support
        </span>
      </>
    }
    subheading="AI-powered automation, compliance validation, and global tender matching - all in one platform"
    rightContent={/* existing rightContent */}
  />
</section>
```

**Step 2: Convert feature cards to linear variant**

Find the features grid section (around line 174-283) and update GlassCards:

Change from:
```tsx
<GlassCard variant="glassHover" padding="lg" className="h-full">
```

To:
```tsx
<GlassCard variant="linearHover" padding="lg" className="h-full" microAnimate>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Visual QA**

Run: `npm run dev`
Navigate to: `http://localhost:3000/features`
Check:
- [ ] Gradient orbs visible in hero
- [ ] Cards have linear style (rounded-2xl, backdrop-blur)
- [ ] Hover animations work
- [ ] Mobile responsive (orbs hidden)

**Step 5: Commit**

```bash
git add app/(marketing)/features/page.tsx
git commit -m "feat(linear): migrate /features page to Linear style"
```

---

### Task 7: Migrate /product page to Linear style

**Files:**
- Modify: `app/(marketing)/product/page.tsx`

**Step 1: Add gradient orbs to hero**

```typescript
import { GradientOrb, DynamicBackground } from '@/components/linear'

// Wrap hero section
<section className="relative overflow-hidden">
  <DynamicBackground blur={15} gradient="radial" />
  <GradientOrb color="blue" position="top-right" size="xl" opacity={40} />

  <DetailPageHero
    // existing props
  />
</section>
```

**Step 2: Convert architecture cards to linear variant**

Find architecture grid (around line 105-220), change:

```tsx
<GlassCard variant="glassHover" padding="lg" className="h-full">
```

To:
```tsx
<GlassCard variant="linearHover" padding="lg" className="h-full" orb="blue" microAnimate>
```

**Step 3: Build and QA**

Run: `npm run build && npm run dev`
Navigate to: `/product`
Check:
- [ ] Blue gradient orb in hero
- [ ] Architecture cards have linear style with embedded blue orbs
- [ ] Smooth hover animations

**Step 4: Commit**

```bash
git add app/(marketing)/product/page.tsx
git commit -m "feat(linear): migrate /product page to Linear style"
```

---

### Task 8: Lighthouse audit on pilot pages

**Files:**
- None (testing only)

**Step 1: Audit /features page**

Run: Lighthouse in Chrome DevTools on `/features`
Check:
- [ ] Performance ≥ 95
- [ ] Accessibility ≥ 98
- [ ] No CLS from orbs (absolute positioning)

**Step 2: Audit /product page**

Run: Lighthouse on `/product`
Verify same metrics

**Step 3: Test prefers-reduced-motion**

In Chrome DevTools:
1. Open Rendering tab
2. Check "Emulate CSS prefers-reduced-motion: reduce"
3. Verify animations disabled

**Step 4: Document results**

Create: `docs/lighthouse-pilot-results.md`

```markdown
# Lighthouse Pilot Results

## /features
- Performance: XX
- Accessibility: XX
- Best Practices: XX
- SEO: XX

## /product
- Performance: XX
- Accessibility: XX
- Best Practices: XX
- SEO: XX

## Issues Found:
- [List any issues]

## Actions:
- [List fixes needed]
```

**Step 5: Commit results**

```bash
git add docs/lighthouse-pilot-results.md
git commit -m "docs: add Lighthouse audit results for pilot pages"
```

---

## Phase 4: Full Rollout

### Task 9: Migrate homepage

**Files:**
- Modify: `app/(marketing)/page.tsx`
- Modify: `components/landing/blocks/HeroSection.tsx`

**Step 1: Add gradient orbs to HeroSection**

Modify: `components/landing/blocks/HeroSection.tsx`

Add after line 22 (inside `<section>`):

```tsx
import { GradientOrb, DynamicBackground } from '@/components/linear'

// Inside <section>, before <div className="mx-auto max-w-7xl">
<DynamicBackground blur={10} gradient="radial" />
<GradientOrb color="violet" position="top-right" size="xl" opacity={50} animate />
<GradientOrb color="fuchsia" position="bottom-left" size="md" opacity={20} />
```

**Step 2: Wrap content in relative z-10 div**

```tsx
<div className="mx-auto max-w-7xl relative z-10">
  {/* existing content */}
</div>
```

**Step 3: Build and verify**

Run: `npm run build`
Navigate to: `/`
Check orbs render correctly

**Step 4: Commit**

```bash
git add components/landing/blocks/HeroSection.tsx
git commit -m "feat(linear): add gradient orbs to homepage hero"
```

---

### Task 10: Migrate /how-it-works page

**Files:**
- Modify: `app/(marketing)/how-it-works/page.tsx`

**Step 1: Add orbs and convert cards**

```typescript
import { GradientOrb, DynamicBackground } from '@/components/linear'

// Wrap hero
<section className="relative overflow-hidden">
  <DynamicBackground blur={15} gradient="radial" />
  <GradientOrb color="emerald" position="top-right" size="xl" opacity={40} />
  <DetailPageHero /* ... */ />
</section>

// Convert all GlassCards to linear variant
<GlassCard variant="linear" padding="lg" orb="emerald" microAnimate>
```

**Step 2: Commit**

```bash
git add app/(marketing)/how-it-works/page.tsx
git commit -m "feat(linear): migrate /how-it-works to Linear style"
```

---

### Task 11: Migrate /solutions/companies page

**Files:**
- Modify: `app/(marketing)/solutions/companies/page.tsx`

**Step 1: Add orbs and convert cards**

```typescript
import { GradientOrb, DynamicBackground } from '@/components/linear'

<section className="relative overflow-hidden">
  <DynamicBackground blur={15} />
  <GradientOrb color="emerald" position="top-right" size="xl" opacity={40} />
  <DetailPageHero /* ... */ />
</section>

// Benefits cards
<GlassCard variant="linear" padding="lg" microAnimate>
```

**Step 2: Commit**

```bash
git add app/(marketing)/solutions/companies/page.tsx
git commit -m "feat(linear): migrate /solutions/companies to Linear style"
```

---

### Task 12: Migrate /solutions/partners page

**Files:**
- Modify: `app/(marketing)/solutions/partners/page.tsx`

**Step 1: Add fuchsia gradient orbs**

```typescript
import { GradientOrb, DynamicBackground } from '@/components/linear'

<section className="relative overflow-hidden">
  <DynamicBackground blur={15} />
  <GradientOrb color="fuchsia" position="top-right" size="xl" opacity={40} />
  <GradientOrb color="violet" position="bottom-left" size="md" opacity={20} />
  <DetailPageHero /* ... */ />
</section>

<GlassCard variant="linearHover" orb="fuchsia" microAnimate>
```

**Step 2: Commit**

```bash
git add app/(marketing)/solutions/partners/page.tsx
git commit -m "feat(linear): migrate /solutions/partners to Linear style"
```

---

### Task 13: Final Lighthouse audit on all pages

**Files:**
- Update: `docs/lighthouse-pilot-results.md` → rename to `docs/lighthouse-final-results.md`

**Step 1: Run Lighthouse on all 6 landing pages**

Pages to audit:
- `/`
- `/features`
- `/how-it-works`
- `/product`
- `/solutions/companies`
- `/solutions/partners`

**Step 2: Document results**

Update: `docs/lighthouse-final-results.md`

Add table:
```markdown
| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| / | XX | XX | XX | XX |
| /features | XX | XX | XX | XX |
| ... | ... | ... | ... | ... |
```

**Step 3: Verify all metrics meet criteria**

Check:
- [ ] All Performance ≥ 95
- [ ] All Accessibility ≥ 98
- [ ] No regressions vs baseline

**Step 4: Commit**

```bash
git add docs/lighthouse-final-results.md
git commit -m "docs: final Lighthouse audit results for all Linear-style pages"
```

---

### Task 14: Cross-browser QA

**Files:**
- Create: `docs/cross-browser-qa.md`

**Step 1: Test on Chrome**

Visit all 6 pages, check:
- [ ] Gradient orbs render
- [ ] Blur effects work
- [ ] Animations smooth
- [ ] Mobile responsive

**Step 2: Test on Safari**

Same checks

**Step 3: Test on Firefox**

Same checks

**Step 4: Document results**

```markdown
# Cross-Browser QA Results

## Chrome (tested version: XX)
- ✅ All features working
- Issues: [none/list]

## Safari (tested version: XX)
- ✅ All features working
- Issues: [none/list]

## Firefox (tested version: XX)
- ✅ All features working
- Issues: [none/list]

## Mobile Safari (iOS XX)
- ✅ Orbs hidden correctly
- Issues: [none/list]
```

**Step 5: Commit**

```bash
git add docs/cross-browser-qa.md
git commit -m "docs: cross-browser QA results"
```

---

### Task 15: Create summary and cleanup

**Files:**
- Create: `docs/LINEAR_REDESIGN_SUMMARY.md`

**Step 1: Write summary document**

```markdown
# Linear-Style Redesign Summary

## Changes Made

### New Components (3)
- `components/linear/GradientOrb.tsx`
- `components/linear/DynamicBackground.tsx`
- `components/linear/index.ts`

### New Constants (1)
- `constants/linear-config.ts`

### Enhanced Components (1)
- `components/landing/blocks/shared/GlassCard.tsx`
  - Added `orb`, `microAnimate` props
  - Added `linear`, `linearHover`, `linearGlow` variants

### Updated Pages (7)
- `app/(marketing)/page.tsx` (homepage)
- `app/(marketing)/features/page.tsx`
- `app/(marketing)/how-it-works/page.tsx`
- `app/(marketing)/product/page.tsx`
- `app/(marketing)/solutions/companies/page.tsx`
- `app/(marketing)/solutions/partners/page.tsx`
- `components/landing/blocks/HeroSection.tsx`

## Performance Impact

- [Include Lighthouse before/after comparison]
- [Note any bundle size changes]

## Visual Changes

- Gradient orbs on all hero sections
- Dynamic blur backgrounds
- Enhanced card styles (rounded-2xl, backdrop-blur-xl)
- Micro-animations on hover

## Accessibility

- All orbs marked `aria-hidden="true"`
- `prefers-reduced-motion` respected
- No color contrast issues
- Lighthouse Accessibility: 98+ on all pages

## Next Steps

- [ ] Monitor production metrics
- [ ] Gather user feedback
- [ ] Consider migrating auth pages (Phase 5)
- [ ] Consider migrating settings pages (Phase 6)
```

**Step 2: Final build verification**

Run: `npm run build`
Expected: ✓ Compiled successfully

**Step 3: Commit summary**

```bash
git add docs/LINEAR_REDESIGN_SUMMARY.md
git commit -m "docs: add Linear redesign summary and completion report"
```

---

## Execution Complete

**Total Tasks**: 15
**Total Commits**: 15
**Estimated Time**: 12-16 hours
**Pages Migrated**: 6 landing pages (homepage + 5 detail pages)

**Success Criteria Check**:
- [ ] All 15 tasks completed
- [ ] All commits pushed
- [ ] Lighthouse Performance ≥ 95 on all pages
- [ ] Lighthouse Accessibility ≥ 98 on all pages
- [ ] Cross-browser QA passed
- [ ] No visual regressions
- [ ] Build succeeds

---

## Optional Future Phases

### Phase 5: Auth Pages (5 pages)
- `/login`
- `/signup`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

Add subtle zinc orbs, convert forms to Catalyst Field/Input components.

### Phase 6: Settings Pages (3 pages)
- `/settings/profile`
- `/settings/billing`
- `/settings/notifications`

Add zinc orbs, enhance with linear card variants.

---

**Plan Status**: ✅ Ready for Execution
**Next Action**: Choose execution method (Subagent-Driven or Parallel Session)
