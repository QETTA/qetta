# P2 Features & Landing - Linear Style Redesign Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all dashboard features and landing page components to Linear-style titanium silver/deep gray design with English text

**Architecture:** Systematic replacement of violet → zinc/white, Korean → English across 94 files organized by feature domain

**Tech Stack:** Next.js App Router, Tailwind CSS, Headless UI

---

## 📊 File Count Summary

| Domain | Files | Violet | Korean |
|--------|-------|--------|--------|
| dashboard/ai/ | 23 | ✓ | ✓ |
| dashboard/docs/ | 14 | ✓ | ✓ |
| dashboard/apply/ | 5 | ✓ | ✓ |
| dashboard/verify/ | 8 | ✓ | ✓ |
| dashboard/monitor/ | 11 | ✓ | ✓ |
| dashboard/widgets/ | 8 | ✓ | - |
| landing/ | 26 | ✓ | ✓ |
| chat/ | 6 | ✓ | ✓ |
| editor/ | 8 | ✓ | ✓ |
| **Total** | **109** | | |

---

## 📁 Batch A: AI Panel (23 files)

### Task A1: AI Panel Core

**Files:**
- `components/dashboard/ai/agent.tsx`
- `components/dashboard/ai/agent-layer-visualization.tsx`
- `components/dashboard/ai/panel/index.tsx`

**Changes:**
1. Replace `violet-*` → `zinc-*` / `white`
2. Replace `focus:ring-violet-*` → `focus:ring-white/30`
3. Translate Korean comments/labels to English

**Commit:** `refactor(ai-panel): update core to Linear style`

---

### Task A2: AI Chat Components

**Files:**
- `components/dashboard/ai/panel/chat-message.tsx`
- `components/dashboard/ai/panel/chat-input.tsx`
- `components/dashboard/ai/panel/chat-empty-state.tsx`
- `components/dashboard/ai/panel/chat-thread.tsx`
- `components/dashboard/ai/panel/chat-icons.tsx`

**Changes:**
1. Update all violet accent colors
2. Translate Korean placeholder text, labels, aria-labels
3. Update focus states

**Commit:** `refactor(ai-chat): update chat components to Linear style`

---

### Task A3: AI Panel Features

**Files:**
- `components/dashboard/ai/panel/layer-visualization.tsx`
- `components/dashboard/ai/panel/proactive-suggestions.tsx`
- `components/dashboard/ai/panel/inline-command.tsx`
- `components/dashboard/ai/panel/rejection-analysis.tsx`
- `components/dashboard/ai/panel/artifact-preview.tsx`
- `components/dashboard/ai/panel/skill-blocks.tsx`
- `components/dashboard/ai/panel/domain-selector.tsx`
- `components/dashboard/ai/panel/error-boundary.tsx`
- `components/dashboard/ai/panel/mobile-bottom-sheet.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean text
3. Update focus rings

**Commit:** `refactor(ai-features): update AI panel features to Linear style`

---

### Task A4: AI Skill Blocks

**Files:**
- `components/dashboard/ai/panel/skill-blocks/QettaTestResultBlock.tsx`
- `components/dashboard/ai/panel/skill-blocks/RejectionAnalysisBlock.tsx`
- `components/dashboard/ai/panel/skill-blocks/QettaMetricsBlock.tsx`
- `components/dashboard/ai/panel/skill-blocks/ProgramMatchBlock.tsx`
- `components/dashboard/ai/panel/skill-blocks/ValidationResultBlock.tsx`
- `components/dashboard/ai/panel/skill-blocks/BizInfoResultBlock.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean labels/text
3. Preserve semantic colors (emerald for success, red for error)

**Commit:** `refactor(skill-blocks): update skill blocks to Linear style`

---

## 📁 Batch B: Docs Components (14 files)

### Task B1: Docs Core

**Files:**
- `components/dashboard/docs/document-list.tsx`
- `components/dashboard/docs/editor.tsx`
- `components/dashboard/docs/preview.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean document-related text

**Commit:** `refactor(docs-core): update docs core to Linear style`

---

### Task B2: Docs Editor Components

**Files:**
- `components/dashboard/docs/editor-toolbar.tsx`
- `components/dashboard/docs/editor-status-bar.tsx`
- `components/dashboard/docs/editor-content-area.tsx`
- `components/dashboard/docs/editor-generate-view.tsx`
- `components/dashboard/docs/editor-skeleton.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean toolbar labels, status messages

**Commit:** `refactor(docs-editor): update editor components to Linear style`

---

### Task B3: Docs Preview Components

**Files:**
- `components/dashboard/docs/docs-preview-constants.tsx`
- `components/dashboard/docs/docs-preview-table.tsx`
- `components/dashboard/docs/docs-preview-toolbar.tsx`
- `components/dashboard/docs/docs-preview-footer.tsx`
- `components/dashboard/docs/generation-progress.tsx`
- `components/dashboard/docs/verify-badge.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean preview text

**Commit:** `refactor(docs-preview): update preview components to Linear style`

---

## 📁 Batch C: Apply Components (5 files)

### Task C1: Apply Module

**Files:**
- `components/dashboard/apply/global-search.tsx`
- `components/dashboard/apply/content.tsx`
- `components/dashboard/apply/matching-analysis.tsx`
- `components/dashboard/apply/preview.tsx`
- `components/dashboard/apply/proposal-generator.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean labels (매칭, 검색, 제안서, 분석, etc.)

**Commit:** `refactor(apply): update apply module to Linear style`

---

## 📁 Batch D: Verify Components (8 files)

### Task D1: Verify Module

**Files:**
- `components/dashboard/verify/verify-preview-result.tsx`
- `components/dashboard/verify/verify-preview-qr-scan.tsx`
- `components/dashboard/verify/content.tsx`
- `components/dashboard/verify/verify-timeline.tsx`
- `components/dashboard/verify/verify-detail-panel.tsx`
- `components/dashboard/verify/file-upload.tsx`
- `components/dashboard/verify/preview.tsx`
- `components/dashboard/verify/verify-qr-modal.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean labels (검증, 해시, 파일 업로드, QR, 타임라인, etc.)
3. Keep semantic colors for verification states (emerald=valid, red=invalid)

**Commit:** `refactor(verify): update verify module to Linear style`

---

## 📁 Batch E: Monitor Components (11 files)

### Task E1: Monitor Core

**Files:**
- `components/dashboard/monitor/monitor-equipment-list.tsx`
- `components/dashboard/monitor/monitor-equipment-detail.tsx`
- `components/dashboard/monitor/monitor-agent-panel.tsx`
- `components/dashboard/monitor/monitor-sidebar.tsx`
- `components/dashboard/monitor/preview.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean labels (장비, 센서, 모니터링, etc.)

**Commit:** `refactor(monitor-core): update monitor core to Linear style`

---

### Task E2: Monitor Widgets

**Files:**
- `components/dashboard/monitor/gauge-widget-live.tsx`
- `components/dashboard/monitor/equipment-selection-context.tsx`
- `components/dashboard/monitor/RealTimeChart.tsx`
- `components/dashboard/monitor/ConnectionStatus.tsx`
- `components/dashboard/monitor/equipment-sensor-chart.tsx`
- `components/dashboard/monitor/widget-dashboard.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean chart/widget labels
3. Keep semantic colors for status indicators

**Commit:** `refactor(monitor-widgets): update monitor widgets to Linear style`

---

## 📁 Batch F: Dashboard Widgets (8 files)

### Task F1: Widget System

**Files:**
- `components/dashboard/widgets/widget-system.tsx`
- `components/dashboard/widgets/widget-catalog.tsx`
- `components/dashboard/widgets/layout-editor.tsx`
- `components/dashboard/widgets/chart-widget.tsx`
- `components/dashboard/widgets/timeline-widget.tsx`
- `components/dashboard/widgets/list-widget.tsx`
- `components/dashboard/widgets/gauge-widget.tsx`
- `components/dashboard/widgets/stats-widget.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate any Korean labels

**Commit:** `refactor(widgets): update widget system to Linear style`

---

## 📁 Batch G: Landing Components (26 files)

### Task G1: Landing Blocks Core

**Files:**
- `components/landing/blocks/HeroSection.tsx`
- `components/landing/blocks/FeaturesSection.tsx`
- `components/landing/blocks/ProductSection.tsx`
- `components/landing/blocks/ApplySection.tsx`
- `components/landing/blocks/CTASection.tsx`
- `components/landing/blocks/MinimalCTASection.tsx`
- `components/landing/blocks/DetailPageHero.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean marketing copy to English

**Commit:** `refactor(landing-blocks): update landing blocks to Linear style`

---

### Task G2: Landing Shared Components

**Files:**
- `components/landing/blocks/shared/AnimatedSection.tsx`
- `components/landing/blocks/shared/SectionHeader.tsx`
- `components/landing/blocks/shared/ChecklistItem.tsx`
- `components/landing/blocks/shared/SectionSkeleton.tsx`
- `components/landing/blocks/shared/StatusPing.tsx`
- `components/landing/blocks/shared/StatsGrid.tsx`
- `components/landing/blocks/shared/GlassBadge.tsx`
- `components/landing/blocks/shared/GlassCard.tsx`
- `components/landing/blocks/hero/HeroAnimatedContent.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean text

**Commit:** `refactor(landing-shared): update shared components to Linear style`

---

### Task G3: Landing Linear Components

**Files:**
- `components/landing/linear/LinearNavbar.tsx`
- `components/landing/linear/LinearCodeDiff.tsx`
- `components/landing/linear/LinearButton.tsx`
- `components/landing/linear/LinearHero.tsx`

**Changes:**
1. These should already be Linear-styled, verify and fix any remaining violet
2. Translate Korean text

**Commit:** `refactor(landing-linear): finalize Linear components`

---

### Task G4: Landing Misc Components

**Files:**
- `components/landing/dashboard-mockup-parts.tsx`
- `components/landing/partners/shared.tsx`
- `components/landing/StatsSection.tsx`
- `components/landing/IndustryBlockGrid.tsx`
- `components/landing/LinearDashboardMockup.tsx`
- `components/landing/WaitlistForm.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean text

**Commit:** `refactor(landing-misc): update misc landing components to Linear style`

---

## 📁 Batch H: Chat Components (6 files)

### Task H1: Chat Module

**Files:**
- `components/chat/qetta-chatbot.tsx`
- `components/chat/qetta-chat-messages.tsx`
- `components/chat/qetta-chat-message.tsx`
- `components/chat/qetta-chat-input.tsx`
- `components/chat/qetta-chat-feedback.tsx`
- `components/chat/chatbot-provider.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean chat UI text

**Commit:** `refactor(chat): update chat module to Linear style`

---

## 📁 Batch I: Editor Components (8 files)

### Task I1: Editor Core

**Files:**
- `components/editor/QettaBlockEditor.tsx`
- `components/editor/QettaEditorProvider.tsx`
- `components/editor/QettaReadOnlyEditor.tsx`
- `components/editor/MetricCard.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean editor text

**Commit:** `refactor(editor-core): update editor core to Linear style`

---

### Task I2: Editor Extensions

**Files:**
- `components/editor/extensions/HashVerifyBlock/index.tsx`
- `components/editor/extensions/SlashCommand/index.tsx`
- `components/editor/extensions/MetricBlock/index.tsx`
- `components/editor/extensions/DocumentBlock/index.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean slash command labels

**Commit:** `refactor(editor-extensions): update editor extensions to Linear style`

---

## 📁 Batch J: Dashboard Root Components

### Task J1: Dashboard Root Files

**Files:**
- `components/dashboard/page.tsx`
- `components/dashboard/loading-skeleton.tsx`
- `components/dashboard/shimmer-skeleton.tsx`
- `components/dashboard/skeleton.tsx`
- `components/dashboard/step-guide.tsx`
- `components/dashboard/phone-support-fab.tsx`
- `components/dashboard/preview-banner.tsx`
- `components/dashboard/accessibility-toggle.tsx`
- `components/dashboard/hancomdocs-viewer.tsx`
- `components/dashboard/mini-preview.tsx`
- `components/dashboard/context.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean text

**Commit:** `refactor(dashboard-root): update root dashboard components to Linear style`

---

## 📁 Batch K: Layout Components

### Task K1: Global Layout

**Files:**
- `components/layout/navbar.tsx`
- `components/layout/footer.tsx`
- `components/layout/gradient.tsx`

**Changes:**
1. Update violet → zinc/white
2. Translate Korean navigation/footer text

**Commit:** `refactor(layout): update layout components to Linear style`

---

## ✅ Verification

### Final Check Commands

```bash
# Check for remaining violet
grep -r "violet" components/dashboard/ai/ components/dashboard/docs/ \
  components/dashboard/apply/ components/dashboard/verify/ \
  components/dashboard/monitor/ components/dashboard/widgets/ \
  components/landing/ components/chat/ components/editor/ \
  components/layout/

# Check for remaining Korean
grep -r "[가-힣]" components/dashboard/ai/ components/dashboard/docs/ \
  components/dashboard/apply/ components/dashboard/verify/ \
  components/dashboard/monitor/ components/dashboard/widgets/ \
  components/landing/ components/chat/ components/editor/ \
  components/layout/

# Build check
npm run build

# TypeScript check
npx tsc --noEmit
```

---

## 📊 Estimated Time

| Batch | Files | Est. Time |
|-------|-------|-----------|
| A: AI Panel | 23 | 3-4 hours |
| B: Docs | 14 | 2 hours |
| C: Apply | 5 | 45 min |
| D: Verify | 8 | 1 hour |
| E: Monitor | 11 | 1.5 hours |
| F: Widgets | 8 | 1 hour |
| G: Landing | 26 | 3 hours |
| H: Chat | 6 | 45 min |
| I: Editor | 8 | 1 hour |
| J: Dashboard Root | 11 | 1.5 hours |
| K: Layout | 3 | 30 min |
| **Total** | **123** | **16-18 hours** |

---

**Last Updated:** 2026-01-31
**Plan Version:** v1.0 (P2 Features & Landing)
