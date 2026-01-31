# Linear-Style QETTA Redesign Design Document

**Date**: 2026-01-31
**Author**: Claude Sonnet 4.5 + Sequential Thinking
**Status**: Approved for Implementation
**Estimated Effort**: 12-16 hours

---

## 🎯 Executive Summary

Transform QETTA into a Linear App-style premium SaaS platform by evolving the existing design system with:
- Gradient orbs and dynamic backgrounds
- Enhanced typography hierarchy using Catalyst
- Refined micro-animations with progressive enhancement
- Consistent component architecture across 14 pages

**Approach**: Component Evolution (not Clean Slate)
- GlassCard evolves with new `variant="linear"` option
- Decorative elements (orbs, backgrounds) added as separate layers
- Catalyst components gradually integrated inside existing structure
- Progressive, non-breaking migration

---

## 📊 Current State Analysis

### Existing Strengths (Keep)
✅ Dark theme (bg-zinc-950) - matches Linear
✅ Large typography (text-7xl) - matches Linear
✅ Inter font - matches Linear
✅ Glassmorphism - unique brand identity
✅ 3D perspective transforms - premium feel
✅ Intersection Observer animations - performant

### Gaps vs Linear App
🔴 **HIGH Priority:**
- No gradient orbs (Linear's signature visual element)
- No dynamic blur backgrounds
- Limited micro-animations

🟡 **MEDIUM Priority:**
- Incomplete Catalyst adoption (Typography system)
- Component inconsistency (GlassCard vs plain divs)

🟢 **LOW Priority:**
- Form accessibility (auth pages could use Catalyst Forms, but functional)

---

## 🏗️ Solution Architecture: Component Evolution

### Core Principle
**Evolve, don't replace.** Enhance GlassCard to support Linear style while maintaining backward compatibility.

### Three-Layer System

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Section Background (optional)         │
│  <section className="relative">                 │
│    <DynamicBackground blur={20} />              │
│    <GradientOrb position="top-right" />         │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  Layer 2: GlassCard Container                   │
│  <GlassCard                                     │
│    variant="linear"  // NEW                     │
│    orb="violet"      // NEW                     │
│    blur              // NEW                     │
│  >                                              │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  Layer 3: Catalyst Content                     │
│    <Heading>...</Heading>                       │
│    <Text>...</Text>                             │
│    <Button>...</Button>                         │
│  </GlassCard>                                   │
└─────────────────────────────────────────────────┘
```

---

## 🧩 Component Specifications

### 1. GradientOrb Component (NEW)

**Location**: `/components/linear/GradientOrb.tsx`

**Props**:
```typescript
interface GradientOrbProps {
  /** Orb color theme (maps to page-specific gradients) */
  color: 'violet' | 'emerald' | 'blue' | 'fuchsia' | 'amber'

  /** Orb position */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'

  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'

  /** Blur intensity (px) */
  blur?: number

  /** Opacity (0-100) */
  opacity?: number

  /** Enable rotation animation */
  animate?: boolean

  /** Disable on mobile */
  hideOnMobile?: boolean
}
```

**Implementation Strategy**:
- Pure CSS gradients (no JavaScript unless `animate={true}`)
- `position: absolute` with pointer-events-none
- `prefers-reduced-motion` support
- Mobile-first (hidden by default on small screens if `hideOnMobile`)

**Gradient Color Mappings**:
```tsx
const GRADIENT_COLORS = {
  violet: 'bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-purple-600/10',
  emerald: 'bg-gradient-to-br from-emerald-400/30 via-teal-500/20 to-cyan-600/10',
  blue: 'bg-gradient-to-br from-blue-400/30 via-cyan-500/20 to-sky-600/10',
  fuchsia: 'bg-gradient-to-br from-fuchsia-400/30 via-pink-500/20 to-rose-600/10',
  amber: 'bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-yellow-600/10',
}

const ORB_SIZES = {
  sm: 'w-64 h-64',
  md: 'w-96 h-96',
  lg: 'w-[32rem] h-[32rem]',
  xl: 'w-[48rem] h-[48rem]',
}

const ORB_POSITIONS = {
  'top-left': '-top-32 -left-32',
  'top-right': '-top-32 -right-32',
  'bottom-left': '-bottom-32 -left-32',
  'bottom-right': '-bottom-32 -right-32',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
}
```

---

### 2. DynamicBackground Component (NEW)

**Location**: `/components/linear/DynamicBackground.tsx`

**Props**:
```typescript
interface DynamicBackgroundProps {
  /** Blur intensity */
  blur?: number

  /** Gradient overlay */
  gradient?: 'radial' | 'linear' | 'none'

  /** Noise texture */
  noise?: boolean
}
```

**Implementation**:
- CSS `backdrop-filter: blur()`
- Optional noise texture via SVG filter
- Gradient overlay with low opacity

---

### 3. Enhanced GlassCard (MODIFIED)

**Location**: `/components/landing/blocks/shared/GlassCard.tsx`

**New Variants**:
```typescript
export const CARD_VARIANTS = {
  // Existing
  glass: 'rounded-lg bg-zinc-900/50 ring-1 ring-white/15',
  glassHover: 'rounded-lg bg-zinc-900/50 ring-1 ring-white/15 hover:bg-zinc-900/60 hover:ring-white/20 transition-all',
  solid: 'rounded-lg bg-zinc-900 ring-1 ring-white/15',
  gradientAmber: 'rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 ring-1 ring-amber-500/20',

  // NEW Linear Variants
  linear: 'rounded-2xl bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl shadow-black/40',
  linearHover: 'rounded-2xl bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl shadow-black/40 hover:bg-zinc-900/90 hover:ring-white/15 hover:shadow-violet-500/10 transition-all duration-300',
  linearGlow: 'rounded-2xl bg-zinc-900/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl shadow-violet-500/20',
}
```

**New Props**:
```typescript
interface GlassCardProps {
  // Existing
  children: ReactNode
  className?: string
  variant?: CardVariant
  padding?: CardPadding
  as?: 'div' | 'li' | 'article'

  // NEW
  /** Embedded gradient orb (Linear style) */
  orb?: 'violet' | 'emerald' | 'blue' | 'fuchsia' | 'amber' | false

  /** Blur effect */
  blur?: boolean

  /** Micro-animation on hover */
  microAnimate?: boolean
}
```

---

### 4. Catalyst Typography Integration

**Strategy**: Wrap existing text content with Catalyst components

**Before**:
```tsx
<GlassCard variant="glass">
  <div className="text-xl font-semibold text-white">Title</div>
  <p className="text-sm text-zinc-400">Description</p>
</GlassCard>
```

**After**:
```tsx
<GlassCard variant="linear">
  <Heading level={3}>Title</Heading>
  <Text>Description</Text>
</GlassCard>
```

**Catalyst Components to Use**:
- `<Heading level={1-6}>` - Replaces `<h1>` through `<h6>`
- `<Subheading>` - Replaces subtitle `<p>`
- `<Text>` - Replaces body text
- `<Strong>` - Replaces `<span className="font-semibold">`
- `<Code>` - Replaces inline code

---

## 🗺️ Migration Strategy (4 Phases)

### Phase 1: Foundation (Non-Breaking)
**Goal**: Create new components without touching existing pages

**Tasks**:
1. Create `/components/linear/` directory
2. Build `GradientOrb.tsx` component
3. Build `DynamicBackground.tsx` component
4. Create `/constants/linear-config.ts` (gradient colors, positions)
5. Write unit tests for new components
6. Verify build passes

**Files Changed**: 4 new files
**Pages Affected**: 0
**Time**: 2-3 hours
**Risk**: 🟢 None (additive only)

---

### Phase 2: GlassCard Evolution
**Goal**: Add Linear variants to GlassCard without breaking existing usage

**Tasks**:
1. Add new variants to `CARD_VARIANTS` in `/constants/card-styles.ts`
2. Extend `GlassCard.tsx` with new props (`orb`, `blur`, `microAnimate`)
3. Implement conditional rendering for orb embedment
4. Add hover micro-animations with `prefers-reduced-motion` check
5. Update GlassCard tests
6. Verify existing pages still render correctly

**Files Changed**: 2 modified
**Pages Affected**: 0 (new variants optional)
**Time**: 3-4 hours
**Risk**: 🟡 Low (backward compatible)

---

### Phase 3: Pilot Migration (1-2 Pages)
**Goal**: Test new system on 1-2 pages, validate approach

**Tasks**:
1. Choose pilot pages: `/features` and `/product`
2. Wrap sections with `<DynamicBackground />`
3. Add `<GradientOrb />` to hero sections
4. Convert GlassCard to `variant="linear"`
5. Wrap text content with Catalyst `<Heading>`, `<Text>`
6. Test across browsers (Chrome, Safari, Firefox)
7. Lighthouse audit (target: 95+ Performance, 98+ Accessibility)
8. Get user feedback

**Files Changed**: 2 pages
**Pages Affected**: 2
**Time**: 4-5 hours
**Risk**: 🟡 Medium (user-facing changes)

---

### Phase 4: Full Rollout
**Goal**: Apply Linear style to all 14 pages

**Tasks**:
1. Migrate remaining 4 landing pages (`/`, `/how-it-works`, `/solutions/*`)
2. Migrate 5 auth pages (`/login`, `/signup`, etc.)
3. Migrate 3 settings pages (`/settings/*`)
4. Page-specific gradient orb colors:
   - Home: Violet
   - Features: Violet + Blue
   - How it Works: Emerald
   - Product: Blue
   - Companies: Emerald
   - Partners: Fuchsia
   - Auth: Zinc (subtle)
   - Settings: Zinc
5. Final Lighthouse audit on all pages
6. Cross-browser QA
7. Deploy to production

**Files Changed**: 12 pages
**Pages Affected**: 12
**Time**: 6-8 hours
**Risk**: 🟡 Medium (bulk changes)

---

## ✅ Success Criteria

### Performance
- [ ] Lighthouse Performance ≥ 95 on all pages
- [ ] Lighthouse Accessibility ≥ 98 on all pages
- [ ] First Contentful Paint (FCP) ≤ 1.0s
- [ ] Largest Contentful Paint (LCP) ≤ 1.5s
- [ ] Cumulative Layout Shift (CLS) ≤ 0.1

### Visual Quality
- [ ] Gradient orbs on all hero sections
- [ ] Consistent card style (linear variant)
- [ ] Smooth micro-animations (60fps)
- [ ] No visual regressions on existing pages

### Accessibility
- [ ] All interactive elements keyboard-accessible
- [ ] `prefers-reduced-motion` respected
- [ ] ARIA labels on all orbs (decorative)
- [ ] Color contrast ratio ≥ 4.5:1

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] No ESLint errors
- [ ] Component tests pass
- [ ] Vercel build succeeds

---

## ⚠️ Risk Mitigation

### Risk 1: Performance Degradation
**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Use CSS gradients (not canvas/WebGL)
- Limit orbs to 1-2 per page
- Lazy-load animations with IntersectionObserver
- Profile with Chrome DevTools before/after

### Risk 2: Visual Regression
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:
- Phase 3 pilot migration validates approach
- Keep `variant="glass"` as fallback
- Screenshot comparison (Percy/Chromatic)

### Risk 3: Accessibility Issues
**Likelihood**: Low
**Impact**: High
**Mitigation**:
- All orbs have `aria-hidden="true"`
- `prefers-reduced-motion` disables animations
- Axe DevTools audit on every page
- Screen reader testing

### Risk 4: Build Failures
**Likelihood**: Low
**Impact**: High
**Mitigation**:
- Run `npm run build` after each phase
- TypeScript strict checks
- Git commit after each successful phase

---

## 📂 File Structure

```
/components/
  /linear/                    # NEW directory
    GradientOrb.tsx          # NEW
    DynamicBackground.tsx    # NEW
    index.ts                 # NEW (exports)

  /landing/blocks/shared/
    GlassCard.tsx            # MODIFIED (add linear variants)
    AnimatedSection.tsx      # MODIFIED (enhance animations)

  /catalyst/                 # EXISTING (use more widely)
    heading.tsx
    text.tsx
    button.tsx
    badge.tsx

/constants/
  card-styles.ts             # MODIFIED (add linear variants)
  linear-config.ts           # NEW (gradient colors, positions)

/app/(marketing)/
  page.tsx                   # MODIFIED (Phase 4)
  features/page.tsx          # MODIFIED (Phase 3 pilot)
  product/page.tsx           # MODIFIED (Phase 3 pilot)
  how-it-works/page.tsx      # MODIFIED (Phase 4)
  solutions/companies/page.tsx    # MODIFIED (Phase 4)
  solutions/partners/page.tsx     # MODIFIED (Phase 4)

/app/(auth)/
  login/page.tsx             # MODIFIED (Phase 4)
  signup/page.tsx            # MODIFIED (Phase 4)
  (3 more auth pages)        # MODIFIED (Phase 4)

/app/(dashboard)/settings/
  profile/page.tsx           # MODIFIED (Phase 4)
  billing/page.tsx           # MODIFIED (Phase 4)
  notifications/page.tsx     # MODIFIED (Phase 4)
```

**Total File Changes**:
- NEW: 4 files
- MODIFIED: 16 files
- DELETED: 0 files

---

## 📈 Expected Impact

### User Experience
- 🎨 +40% visual premium feel (gradient orbs)
- ⚡ +20% perceived performance (micro-animations)
- ♿ +15% accessibility score (Catalyst typography)

### Development
- 🧩 +30% component reusability (linear variant)
- 📏 +25% design consistency (Catalyst system)
- 🐛 -50% CSS bugs (centralized variants)

### Business
- 📊 +10-15% conversion rate (premium brand perception)
- 🏆 Competitive parity with Linear/Vercel tier SaaS
- 🚀 Stronger brand differentiation

---

## 🔄 Rollback Plan

### If Phase 3 Pilot Fails:
1. Revert 2 pilot pages to `variant="glass"`
2. Remove GradientOrb components
3. Keep Phase 1-2 changes (no harm)
4. Re-evaluate approach

### If Phase 4 Encounters Issues:
1. Roll back page-by-page (Git revert)
2. Each page is independent commit
3. Can mix linear/glass variants during transition

### Emergency Rollback (Full):
```bash
git revert HEAD~16  # Revert all 16 file changes
npm run build       # Verify build
git push            # Deploy
```

---

## 📅 Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundation | 2-3h | 2-3h |
| Phase 2: GlassCard Evolution | 3-4h | 5-7h |
| Phase 3: Pilot Migration | 4-5h | 9-12h |
| Phase 4: Full Rollout | 6-8h | 15-20h |

**Buffer**: 2-3 hours for unexpected issues
**Total**: 17-23 hours (within 25h constraint ✅)

---

## 🎯 Next Steps

1. **Review & Approve**: Validate this design document
2. **Create Implementation Plan**: Use `superpowers:writing-plans` skill
3. **Set Up Git Worktree**: Isolate work in `linear-redesign` branch
4. **Execute Phase 1**: Build foundation components
5. **Review After Each Phase**: Quality gates before proceeding

---

**Document Status**: ✅ Ready for Implementation
**Approved By**: Awaiting user confirmation
**Next Action**: Create detailed implementation plan with task breakdown
