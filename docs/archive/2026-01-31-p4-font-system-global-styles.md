# P4 Font System & Global Styles - Linear Style Migration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Linear-style migration at the foundational level - fonts, CSS variables, brand colors, animations, and global metadata

**Architecture:** Update root configuration files to eliminate all violet/purple references and establish titanium silver (zinc) as the primary accent color

**Tech Stack:** Next.js, Tailwind CSS v4, Google Fonts (Geist, Inter)

---

## 📊 Files Summary

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root metadata, fonts, lang |
| `app/globals.css` | CSS variables, brand colors, animations |
| `tailwind.config.ts` | Tailwind theme extensions |
| `constants/card-styles.ts` | Shared card/shadow styles |

---

## 📁 Task 1: Root Layout - Metadata & Language

**Files:**
- Modify: `app/layout.tsx`

### Step 1: Update metadata to English

```tsx
// Before (lines 22-26)
export const metadata: Metadata = {
  title: "QETTA - 정부지원사업 AI 어시스턴트",
  description: "정부지원사업 신청서 작성부터 제출까지, AI가 함께합니다.",
  applicationName: "QETTA",
};

// After
export const metadata: Metadata = {
  title: "QETTA - AI Documentation Platform",
  description: "From application drafting to submission, AI works with you.",
  applicationName: "QETTA",
};
```

### Step 2: Update html lang attribute

```tsx
// Before (line 39)
<html lang="ko" dir="ltr">

// After
<html lang="en" dir="ltr">
```

### Step 3: Verify build

```bash
npm run build
```

### Step 4: Commit

```bash
git add app/layout.tsx
git commit -m "refactor(layout): update root metadata to English"
```

---

## 📁 Task 2: Global CSS - Brand Colors

**Files:**
- Modify: `app/globals.css`

### Step 1: Update brand color variables (lines 27-30)

```css
/* Before */
/* 브랜드 (QETTA 퍼플) */
--brand: #7C3AED;
--brand-light: #A78BFA;
--brand-dark: #5B21B6;

/* After - Titanium Silver (Linear style) */
/* Brand (QETTA Titanium Silver) */
--brand: #71717A;        /* zinc-500 */
--brand-light: #A1A1AA;  /* zinc-400 */
--brand-dark: #52525B;   /* zinc-600 */
```

### Step 2: Update Korean comments to English

```css
/* Before */
/* 배경 - Linear Woodsmoke */
/* 텍스트 */
/* 테두리 */
/* 브랜드 (QETTA 퍼플) */
/* Code Diff 색상 (GitHub Dark) */
/* Code Diff 주석 색상 (Linear 스타일) */

/* After */
/* Background - Linear Woodsmoke */
/* Text */
/* Border */
/* Brand (QETTA Titanium Silver) */
/* Code Diff colors (GitHub Dark) */
/* Code Diff comment colors (Linear style) */
```

### Step 3: Commit

```bash
git add app/globals.css
git commit -m "refactor(styles): update brand colors to titanium silver"
```

---

## 📁 Task 3: Global CSS - Glow Animations

**Files:**
- Modify: `app/globals.css`

### Step 1: Update glow-pulse animation (lines 79-82)

```css
/* Before */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.5); }
}

/* After - Zinc/white glow */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(161, 161, 170, 0.3); }
  50% { box-shadow: 0 0 40px rgba(161, 161, 170, 0.5); }
}
```

### Step 2: Update code line animation comments

```css
/* Before (line 194) */
/* 순차 애니메이션 */

/* After */
/* Sequential animation */
```

### Step 3: Update all Korean comments in globals.css

```css
/* Full list of Korean → English translations */
/* 각 라인 순차 딜레이 (CSS custom property 기반) */
→ /* Per-line stagger delay (CSS custom property based) */

/* Linear 스타일: 주석 라인에 배경 색상 */
→ /* Linear style: comment line background colors */

/* Linear 레퍼런스: 약 25-35% 불투명도로 확실히 보이게 */
→ /* Linear reference: 25-35% opacity for visibility */

/* (framer-motion 대체) */
→ /* (framer-motion replacement) */

/* Stagger 애니메이션 (자식 요소용) */
→ /* Stagger animation (for child elements) */

/* Slide 변형 */
→ /* Slide variants */

/* Scale 변형 */
→ /* Scale variants */
```

### Step 4: Commit

```bash
git add app/globals.css
git commit -m "refactor(styles): update glow animations + translate comments"
```

---

## 📁 Task 4: Tailwind Config - Glow Shadows

**Files:**
- Modify: `tailwind.config.ts`

### Step 1: Update glow-pulse keyframe (lines 83-85)

```ts
// Before
'glow-pulse': {
  '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
  '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)' },
},

// After
'glow-pulse': {
  '0%, 100%': { boxShadow: '0 0 20px rgba(161, 161, 170, 0.3)' },
  '50%': { boxShadow: '0 0 40px rgba(161, 161, 170, 0.5)' },
},
```

### Step 2: Update boxShadow glow values (lines 152-153)

```ts
// Before
boxShadow: {
  'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  'glow': '0 0 20px rgba(124, 58, 237, 0.3)',
  'glow-lg': '0 0 40px rgba(124, 58, 237, 0.5)',
},

// After
boxShadow: {
  'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  'glow': '0 0 20px rgba(161, 161, 170, 0.3)',
  'glow-lg': '0 0 40px rgba(161, 161, 170, 0.5)',
},
```

### Step 3: Update Korean comments in tailwind.config.ts

```ts
// Before
// Hero 타이포그래피
// After
// Hero typography
```

### Step 4: Commit

```bash
git add tailwind.config.ts
git commit -m "refactor(tailwind): update glow shadows to zinc"
```

---

## 📁 Task 5: Card Styles Constants

**Files:**
- Modify: `constants/card-styles.ts`

### Step 1: Verify violet shadow colors are already updated

```bash
grep "violet" constants/card-styles.ts
```

Expected: Only `STATUS_PING_COLORS.violet` should remain (semantic color for DIGITAL domain)

### Step 2: Update Korean comments if any

```bash
grep "[가-힣]" constants/card-styles.ts
```

### Step 3: Commit (if changes needed)

```bash
git add constants/card-styles.ts
git commit -m "refactor(card-styles): finalize Linear style"
```

---

## 📁 Task 6: Font Verification

### Step 1: Verify font loading

Current fonts (correct for Linear style):
- **Geist Sans** - Primary sans-serif (matches Linear's SF Pro/Inter style)
- **Geist Mono** - Monospace for code
- **Noto Sans KR** - Korean fallback (keep for i18n)

### Step 2: Verify font CSS variables

```css
/* In globals.css @theme inline */
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
```

These are correct for Linear style. No changes needed.

### Step 3: Optional - Add Inter as fallback

If stricter Linear matching is desired:
```tsx
// In app/layout.tsx, add Inter
import { Inter } from 'next/font/google'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
```

But Geist is already very close to Linear's aesthetic, so this is optional.

---

## 📁 Task 7: Global Metadata Files Check

### Step 1: Check for other metadata files with Korean

```bash
grep -r "정부지원" app/
grep -r "[가-힣]" app/*/page.tsx | head -20
```

### Step 2: Dashboard layout metadata

**File:** `app/(dashboard)/layout.tsx`

```tsx
// Check and update if Korean exists
title: '대시보드 | QETTA' → 'Dashboard | QETTA'
```

### Step 3: Commit all metadata updates

```bash
git add app/
git commit -m "refactor(metadata): update all page metadata to English"
```

---

## 📁 Task 8: Final Verification

### Step 1: Check for remaining violet in config files

```bash
grep -r "violet\|7C3AED\|A78BFA\|5B21B6\|139, 92, 246\|124, 58, 237" \
  app/layout.tsx app/globals.css tailwind.config.ts constants/
```

Expected: No matches (except STATUS_PING_COLORS)

### Step 2: Check for remaining Korean in config files

```bash
grep -r "[가-힣]" \
  app/layout.tsx app/globals.css tailwind.config.ts constants/
```

Expected: No matches

### Step 3: Build verification

```bash
npm run build
```

### Step 4: TypeScript check

```bash
npx tsc --noEmit
```

### Step 5: Final commit

```bash
git add -A
git commit -m "refactor(p4): complete font system and global styles migration"
```

---

## 📊 Color Reference Table

### Violet → Zinc Mapping (RGB Values)

| Original | RGB | Target | RGB |
|----------|-----|--------|-----|
| violet-600 (#7C3AED) | 124, 58, 237 | zinc-500 (#71717A) | 113, 113, 122 |
| violet-500 (#8B5CF6) | 139, 92, 246 | zinc-400 (#A1A1AA) | 161, 161, 170 |
| violet-400 (#A78BFA) | 167, 139, 250 | zinc-300 (#D4D4D8) | 212, 212, 216 |
| violet-800 (#5B21B6) | 91, 33, 182 | zinc-600 (#52525B) | 82, 82, 91 |

### CSS Variable Updates

| Variable | Before | After |
|----------|--------|-------|
| `--brand` | #7C3AED | #71717A |
| `--brand-light` | #A78BFA | #A1A1AA |
| `--brand-dark` | #5B21B6 | #52525B |

---

## ✅ Success Criteria

1. **Zero violet RGB values** in:
   - `app/globals.css`
   - `tailwind.config.ts`

2. **Zero Korean text** in:
   - `app/layout.tsx` (metadata)
   - `app/globals.css` (comments)
   - `tailwind.config.ts` (comments)

3. **Root html lang="en"**

4. **Build passes**

5. **Fonts verified** (Geist Sans/Mono working correctly)

---

## 📊 Estimated Time

| Task | Est. Time |
|------|-----------|
| Task 1: Root Layout | 15 min |
| Task 2: Brand Colors | 15 min |
| Task 3: Glow Animations | 20 min |
| Task 4: Tailwind Config | 15 min |
| Task 5: Card Styles | 10 min |
| Task 6: Font Verification | 10 min |
| Task 7: Metadata Files | 20 min |
| Task 8: Final Verification | 15 min |
| **Total** | **2 hours** |

---

**Last Updated:** 2026-01-31
**Plan Version:** v1.0 (P4 Font System & Global Styles)
