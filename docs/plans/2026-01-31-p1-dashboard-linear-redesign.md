# P1 Dashboard Core - Linear Style Redesign Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate dashboard core components to Linear-style titanium silver/deep gray design with English text

**Architecture:** Systematic replacement of violet colors → zinc/white, Korean text → English, maintaining existing functionality. Design system components first, then layout, then dashboard features.

**Tech Stack:** Next.js App Router, Tailwind CSS, Headless UI, Catalyst components

---

## 📊 Color Migration Reference

### Violet → Zinc/White Mapping

| Original | Target | Usage |
|----------|--------|-------|
| `violet-500` | `zinc-500` | Primary accent |
| `violet-400` | `white` or `zinc-300` | Highlights, links |
| `violet-600` | `zinc-600` | Buttons, strong accent |
| `bg-violet-400/10` | `bg-white/10` | Badge backgrounds |
| `text-violet-400` | `text-white` | Accent text |
| `ring-violet-500` | `ring-white/30` | Focus rings |
| `shadow-violet-500/20` | `shadow-zinc-500/20` | Glow effects |

### Focus State Pattern
```tsx
// Before
'focus:ring-violet-500' or 'focus:ring-2 focus:ring-violet-500'
// After
'focus:ring-white/30' or 'focus:ring-2 focus:ring-white/30'
```

---

## Task 1: Catalyst Button Component

**Files:**
- Modify: `components/catalyst/button.tsx`

**Step 1: Update focus ring colors**

Change line 11:
```tsx
// Before
'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
// After
'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
```

**Step 2: Update violet color variant (lines 33-36)**

```tsx
// Before
violet: [
  'text-white bg-violet-500 border-violet-600/90',
  'hover:bg-violet-400',
],
// After - rename to 'primary' or keep as 'violet' but use zinc
zinc: [
  'text-white bg-zinc-600 border-zinc-700/90',
  'hover:bg-zinc-500',
],
```

Note: Keep the violet color option but also ensure there's a primary zinc option. The violet variant at lines 33-36 can remain for semantic color purposes but shouldn't be the default primary.

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add components/catalyst/button.tsx
git commit -m "refactor(catalyst): update button focus ring to zinc/white"
```

---

## Task 2: Catalyst Checkbox Component

**Files:**
- Modify: `components/catalyst/checkbox.tsx`

**Step 1: Search for violet references**

```bash
grep -n "violet" components/catalyst/checkbox.tsx
```

**Step 2: Update checked state colors**

Replace any violet references:
```tsx
// Before patterns
'data-checked:bg-violet-600'
'data-checked:border-violet-600'
// After
'data-checked:bg-zinc-500'
'data-checked:border-zinc-500'
```

**Step 3: Update focus ring**

```tsx
// Before
'focus:ring-violet-500'
// After
'focus:ring-white/30'
```

**Step 4: Commit**

```bash
git add components/catalyst/checkbox.tsx
git commit -m "refactor(catalyst): update checkbox to zinc colors"
```

---

## Task 3: Catalyst Input Component

**Files:**
- Modify: `components/catalyst/input.tsx`

**Step 1: Update focus ring**

```tsx
// Before
'focus:ring-violet-500' or similar
// After
'focus:ring-white/30'
```

**Step 2: Update any violet border on focus**

```tsx
// Before
'focus:border-violet-500'
// After
'focus:border-white/30'
```

**Step 3: Commit**

```bash
git add components/catalyst/input.tsx
git commit -m "refactor(catalyst): update input focus to zinc/white"
```

---

## Task 4: Catalyst Badge Component

**Files:**
- Modify: `components/catalyst/badge.tsx`

**Step 1: Update violet badge color option**

Keep violet as an option but ensure it's not the default/primary:
```tsx
// Violet badge should still exist for semantic use
// But default/primary should be zinc
```

**Step 2: Commit**

```bash
git add components/catalyst/badge.tsx
git commit -m "refactor(catalyst): update badge color defaults"
```

---

## Task 5: Catalyst Link Component

**Files:**
- Modify: `components/catalyst/link.tsx`

**Step 1: Update link colors**

```tsx
// Before
'text-violet-400 hover:text-violet-300'
// After
'text-white hover:text-zinc-300'
```

**Step 2: Update focus ring**

```tsx
// Before
'focus:ring-violet-500'
// After
'focus:ring-white/30'
```

**Step 3: Commit**

```bash
git add components/catalyst/link.tsx
git commit -m "refactor(catalyst): update link to white/zinc colors"
```

---

## Task 6: Dashboard Sidebar - Colors

**Files:**
- Modify: `components/dashboard/layout/sidebar.tsx`

**Step 1: Update focus rings (lines 146, 170, 298, 334, 347)**

```tsx
// Before
'focus:ring-2 focus:ring-violet-500'
// After
'focus:ring-2 focus:ring-white/30'
```

**Step 2: Update highlight badge colors (line 188)**

```tsx
// Before
'bg-violet-400/10 text-violet-400'
// After
'bg-white/10 text-white'
```

**Step 3: Update animated ping (lines 199-201)**

```tsx
// Before
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
// After
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
```

**Step 4: Update domain engine status indicator (lines 236-238)**

```tsx
// Before
<span className="flex items-center gap-1 text-[10px] text-violet-400">
  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
// After
<span className="flex items-center gap-1 text-[10px] text-emerald-400">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
```

**Step 5: Update Core Metrics accent (line 249)**

Keep semantic colors for metrics (violet for Digital domain is intentional), but update generic accents:
```tsx
// Line 249 - text-violet-400 for specific metric is OK (it represents DIGITAL domain)
// Line 310 - document category dot
// Before
<span className="w-2 h-2 rounded-full bg-violet-500"></span>
// After
<span className="w-2 h-2 rounded-full bg-zinc-500"></span>
```

**Step 6: Commit**

```bash
git add components/dashboard/layout/sidebar.tsx
git commit -m "refactor(sidebar): update colors to zinc/white Linear style"
```

---

## Task 7: Dashboard Sidebar - Korean to English

**Files:**
- Modify: `components/dashboard/layout/sidebar.tsx`

**Step 1: Update navigation item sublabels (lines 24, 38, 51, 64)**

```tsx
// Before
sublabel: '증빙',  // line 24
sublabel: '검증',  // line 38
sublabel: '매칭',  // line 51
sublabel: '관제',  // line 64
// After
sublabel: 'Evidence',
sublabel: 'Verify',
sublabel: 'Match',
sublabel: 'Monitor',
```

**Step 2: Update descriptions (lines 33, 46, 59, 72)**

```tsx
// Before
description: '문서 자동 생성',
description: '해시체인 검증',
description: '글로벌 입찰 매칭',
description: '대시보드 모니터링',
// After
description: 'Auto document generation',
description: 'Hashchain verification',
description: 'Global tender matching',
description: 'Dashboard monitoring',
```

**Step 3: Update comment (line 76) and document buckets (lines 87-92)**

```tsx
// Before
// 도메인 엔진별 색상 매핑 (6 Engine Presets - Super-Model v4.0)
const documentBuckets = [
  { id: 'tms-report', label: 'TMS 보고서' },
  { id: 'env-form', label: '환경부 양식' },
  { id: 'overseas-tender', label: '해외 입찰' },
  { id: 'internal', label: '내부 문서' },
]
// After
// Domain engine color mapping (6 Engine Presets - Super-Model v4.0)
const documentBuckets = [
  { id: 'tms-report', label: 'TMS Reports' },
  { id: 'env-form', label: 'Environment Forms' },
  { id: 'overseas-tender', label: 'Overseas Tender' },
  { id: 'internal', label: 'Internal Docs' },
]
```

**Step 4: Update toast messages (lines 103, 107)**

```tsx
// Before
showToast('검색 기능은 준비 중입니다 (Cmd+K)', 'info')
showToast('카테고리 추가 기능은 준비 중입니다', 'info')
// After
showToast('Search coming soon (Cmd+K)', 'info')
showToast('Add category coming soon', 'info')
```

**Step 5: Update aria-labels and UI text (lines 116, 147, 154, 176, 213, 217, 221, 225, 295, 299, 323, 335, 340, 348)**

```tsx
// Key translations:
'메인 내비게이션' → 'Main navigation'
'검색 (Cmd+K)' → 'Search (Cmd+K)'
'검색' → 'Search'
'(${item.count}건)' → '(${item.count} items)'
'보관함' → 'Archive'
'스팸' → 'Spam'
'카테고리' → 'Categories'
'카테고리 추가' → 'Add category'
'화면 설정' → 'Display settings'
'홈페이지로 이동' → 'Go to homepage'
'홈으로' → 'Home'
'사이드바 펼치기' → 'Expand sidebar'
'사이드바 접기' → 'Collapse sidebar'
```

**Step 6: Update metric labels (lines 250, 254, 258, 262, 266, 270)**

```tsx
// Before
'시간 단축' → 'Time saved'
'반려 감소' → 'Rejection ↓'
'생성 속도' → 'Generation'
'가용성' → 'Uptime'
'정확도' → 'Accuracy'
'글로벌 DB' → 'Global DB'
```

**Step 7: Commit**

```bash
git add components/dashboard/layout/sidebar.tsx
git commit -m "refactor(sidebar): translate Korean to English"
```

---

## Task 8: Dashboard UI Components - Card

**Files:**
- Modify: `components/dashboard/ui/card.tsx`

**Step 1: Search and update violet references**

```bash
grep -n "violet" components/dashboard/ui/card.tsx
```

**Step 2: Replace violet colors with zinc/white**

```tsx
// Typical patterns to replace:
'border-violet-500' → 'border-zinc-500'
'bg-violet-500' → 'bg-zinc-500'
'text-violet-400' → 'text-white'
'ring-violet-500' → 'ring-white/30'
```

**Step 3: Commit**

```bash
git add components/dashboard/ui/card.tsx
git commit -m "refactor(ui/card): update to Linear zinc colors"
```

---

## Task 9: Dashboard UI Components - Tab Header

**Files:**
- Modify: `components/dashboard/ui/tab-header.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text if any**

**Step 3: Commit**

```bash
git add components/dashboard/ui/tab-header.tsx
git commit -m "refactor(ui/tab-header): update to Linear style"
```

---

## Task 10: Dashboard UI Components - Progress Indicator

**Files:**
- Modify: `components/dashboard/ui/progress-indicator.tsx`

**Step 1: Update violet references**

```tsx
// Before
'bg-violet-500' → 'bg-zinc-500' (or keep semantic colors like emerald for success)
```

**Step 2: Commit**

```bash
git add components/dashboard/ui/progress-indicator.tsx
git commit -m "refactor(ui/progress): update to Linear style"
```

---

## Task 11: Dashboard UI Components - Skill Block

**Files:**
- Modify: `components/dashboard/ui/skill-block.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/ui/skill-block.tsx
git commit -m "refactor(ui/skill-block): update to Linear style"
```

---

## Task 12: Dashboard UI Components - Empty State

**Files:**
- Modify: `components/dashboard/ui/empty-state.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/ui/empty-state.tsx
git commit -m "refactor(ui/empty-state): update to Linear style"
```

---

## Task 13: Dashboard UI Components - List Item

**Files:**
- Modify: `components/dashboard/ui/list-item.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/ui/list-item.tsx
git commit -m "refactor(ui/list-item): update to Linear style"
```

---

## Task 14: Dashboard UI Components - Metrics Grid

**Files:**
- Modify: `components/dashboard/ui/metrics-grid.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/ui/metrics-grid.tsx
git commit -m "refactor(ui/metrics-grid): update to Linear style"
```

---

## Task 15: Dashboard Layout - Center Panel

**Files:**
- Modify: `components/dashboard/layout/center-panel.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/layout/center-panel.tsx
git commit -m "refactor(layout/center-panel): update to Linear style"
```

---

## Task 16: Dashboard Layout - Right Panel

**Files:**
- Modify: `components/dashboard/layout/right-panel.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/layout/right-panel.tsx
git commit -m "refactor(layout/right-panel): update to Linear style"
```

---

## Task 17: Dashboard Layout - Dashboard Layout

**Files:**
- Modify: `components/dashboard/layout/dashboard-layout.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/layout/dashboard-layout.tsx
git commit -m "refactor(layout/dashboard-layout): update to Linear style"
```

---

## Task 18: Dashboard Layout - Frame

**Files:**
- Modify: `components/dashboard/layout/frame.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/layout/frame.tsx
git commit -m "refactor(layout/frame): update to Linear style"
```

---

## Task 19: Dashboard Layout - Center Panel Document Item

**Files:**
- Modify: `components/dashboard/layout/center-panel-document-item.tsx`

**Step 1: Update violet references**

**Step 2: Translate Korean text**

**Step 3: Commit**

```bash
git add components/dashboard/layout/center-panel-document-item.tsx
git commit -m "refactor(layout/document-item): update to Linear style"
```

---

## Task 20: Verify and Build Check

**Step 1: Check for remaining violet in modified files**

```bash
grep -r "violet" components/catalyst/ components/dashboard/layout/ components/dashboard/ui/
```

**Step 2: Check for remaining Korean in modified files**

```bash
grep -r "[가-힣]" components/catalyst/ components/dashboard/layout/ components/dashboard/ui/
```

**Step 3: Run build**

```bash
npm run build
```

**Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Create batch completion commit**

```bash
git add -A
git commit -m "refactor(p1): complete dashboard core Linear style migration"
```

---

## ✅ Success Criteria

1. **Zero violet colors** in:
   - `components/catalyst/` (5 files)
   - `components/dashboard/layout/` (6 files)
   - `components/dashboard/ui/` (8 files)

2. **Zero Korean text** in same files

3. **Build passes** without errors

4. **TypeScript passes** without errors

5. **Visual consistency** with Linear design (titanium silver on dark background)

---

## 📁 Files Summary (19 files)

### Catalyst Components (5 files)
| # | File | Changes |
|---|------|---------|
| 1 | `components/catalyst/button.tsx` | Focus ring, violet variant |
| 2 | `components/catalyst/checkbox.tsx` | Checked state, focus ring |
| 3 | `components/catalyst/input.tsx` | Focus ring, border |
| 4 | `components/catalyst/badge.tsx` | Color defaults |
| 5 | `components/catalyst/link.tsx` | Link colors, focus ring |

### Dashboard Layout (6 files)
| # | File | Changes |
|---|------|---------|
| 6-7 | `components/dashboard/layout/sidebar.tsx` | Colors + 30+ translations |
| 8 | `components/dashboard/layout/center-panel.tsx` | Colors + translations |
| 9 | `components/dashboard/layout/right-panel.tsx` | Colors + translations |
| 10 | `components/dashboard/layout/dashboard-layout.tsx` | Colors + translations |
| 11 | `components/dashboard/layout/frame.tsx` | Colors + translations |
| 12 | `components/dashboard/layout/center-panel-document-item.tsx` | Colors + translations |

### Dashboard UI (8 files)
| # | File | Changes |
|---|------|---------|
| 13 | `components/dashboard/ui/card.tsx` | Colors |
| 14 | `components/dashboard/ui/tab-header.tsx` | Colors + translations |
| 15 | `components/dashboard/ui/progress-indicator.tsx` | Colors |
| 16 | `components/dashboard/ui/skill-block.tsx` | Colors + translations |
| 17 | `components/dashboard/ui/empty-state.tsx` | Colors + translations |
| 18 | `components/dashboard/ui/list-item.tsx` | Colors + translations |
| 19 | `components/dashboard/ui/metrics-grid.tsx` | Colors + translations |

---

## 🔄 Execution Notes

- **Batch size:** 3 tasks per review checkpoint
- **Verification:** Run build after each batch
- **Commit frequency:** After each task
- **Skip:** Tasks where grep shows no violet/Korean content

---

**Last Updated:** 2026-01-31
**Plan Version:** v1.0 (P1 Dashboard Core)
**Estimated Time:** 4-6 hours
