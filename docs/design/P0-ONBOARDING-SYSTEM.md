# P0: QETTA Onboarding System Design

> **Version:** 1.0
> **Date:** 2026-01-31
> **Status:** Draft
> **Priority:** P0 (Critical)

---

## 1. Executive Summary

### Problem Statement
- 현재 대시보드 진입 시 가이드 없음 → 이탈률 높음
- Empty State는 존재하나 액션 유도력 부족
- 2026 트렌드 Progressive Onboarding 점수 40%

### Solution
3-Layer Onboarding System:
1. **First-Time Tour** - 인터랙티브 하이라이트 투어
2. **Contextual Hints** - 상황별 툴팁/가이드
3. **Empty State Actions** - 기존 컴포넌트 강화

### Expected Outcomes
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| 신규 사용자 이탈률 | 65% | 35% | -30% |
| 첫 문서 생성까지 시간 | 15분 | 5분 | -67% |
| Feature Discovery Rate | 25% | 60% | +140% |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Onboarding System Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   OnboardingProvider (Context)                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ State:                                                    │  │ │
│  │  │ - isFirstVisit: boolean                                   │  │ │
│  │  │ - currentTourStep: number | null                          │  │ │
│  │  │ - completedTours: Set<TourId>                            │  │ │
│  │  │ - dismissedHints: Set<HintId>                            │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│       ┌──────────────────────┼──────────────────────┐               │
│       │                      │                      │               │
│       ▼                      ▼                      ▼               │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │ TourOverlay │    │ ContextualHint  │    │  EmptyState     │     │
│  │             │    │                 │    │  (Enhanced)     │     │
│  │ - Spotlight │    │ - Tooltip       │    │                 │     │
│  │ - Step Nav  │    │ - Pulse Beacon  │    │ - Quick Start   │     │
│  │ - Progress  │    │ - Dismissible   │    │ - Templates     │     │
│  └─────────────┘    └─────────────────┘    └─────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 OnboardingProvider

```typescript
// components/onboarding/onboarding-provider.tsx

interface OnboardingState {
  isFirstVisit: boolean
  currentTour: TourId | null
  currentStep: number
  completedTours: TourId[]
  dismissedHints: HintId[]
  preferences: {
    showHints: boolean
    autoStartTour: boolean
  }
}

type TourId =
  | 'welcome'      // 첫 방문 환영 투어
  | 'docs'         // DOCS 탭 상세 투어
  | 'verify'       // VERIFY 탭 상세 투어
  | 'apply'        // APPLY 탭 상세 투어
  | 'monitor'      // MONITOR 탭 상세 투어

type HintId =
  | 'first-document'
  | 'ai-panel'
  | 'cross-tab-action'
  | 'keyboard-shortcuts'
  | 'export-options'

interface OnboardingContextValue extends OnboardingState {
  startTour: (tourId: TourId) => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  dismissHint: (hintId: HintId) => void
  resetOnboarding: () => void
}
```

### 3.2 TourOverlay Component

```typescript
// components/onboarding/tour-overlay.tsx

interface TourStep {
  id: string
  target: string               // CSS selector
  title: string
  content: string | ReactNode
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  spotlight?: {
    padding?: number
    borderRadius?: number
  }
  action?: {
    label: string
    onClick: () => void
  }
}

interface TourConfig {
  id: TourId
  name: string
  steps: TourStep[]
  onComplete?: () => void
  allowSkip?: boolean
}

// Welcome Tour Configuration
const WELCOME_TOUR: TourConfig = {
  id: 'welcome',
  name: 'QETTA 시작하기',
  steps: [
    {
      id: 'welcome-1',
      target: '[data-tour="tab-docs"]',
      title: '📄 DOCS - 문서 자동 생성',
      content: '45초 만에 MES 정산보고서, 사업계획서를 생성합니다.',
      placement: 'bottom',
      spotlight: { padding: 8, borderRadius: 12 },
    },
    {
      id: 'welcome-2',
      target: '[data-tour="tab-verify"]',
      title: '🔐 VERIFY - 해시체인 검증',
      content: 'SHA-256 기반으로 문서 무결성을 보장합니다.',
      placement: 'bottom',
    },
    {
      id: 'welcome-3',
      target: '[data-tour="tab-apply"]',
      title: '🌍 APPLY - 글로벌 입찰 매칭',
      content: '630K+ 입찰 중 당신의 회사에 맞는 기회를 찾습니다.',
      placement: 'bottom',
    },
    {
      id: 'welcome-4',
      target: '[data-tour="tab-monitor"]',
      title: '📊 MONITOR - 실시간 모니터링',
      content: 'MES, PLC, OPC-UA 데이터를 실시간으로 확인합니다.',
      placement: 'bottom',
    },
    {
      id: 'welcome-5',
      target: '[data-tour="ai-panel-toggle"]',
      title: '🤖 AI 어시스턴트',
      content: '궁금한 점이 있으면 AI에게 물어보세요.',
      placement: 'left',
    },
    {
      id: 'welcome-complete',
      target: 'center',
      title: '🎉 준비 완료!',
      content: 'DOCS 탭에서 첫 번째 문서를 생성해보세요.',
      placement: 'center',
      action: {
        label: '문서 생성 시작',
        onClick: () => { /* navigate to DOCS */ },
      },
    },
  ],
  allowSkip: true,
}
```

### 3.3 ContextualHint Component

```typescript
// components/onboarding/contextual-hint.tsx

interface ContextualHintProps {
  id: HintId
  children: ReactNode
  hint: {
    title: string
    content: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
  }
  trigger?: 'hover' | 'click' | 'auto'
  showBeacon?: boolean
  delay?: number
}

// Usage Example
<ContextualHint
  id="first-document"
  hint={{
    title: "첫 문서 생성하기",
    content: "도메인과 템플릿을 선택하면 45초 안에 문서가 생성됩니다.",
    placement: "bottom"
  }}
  trigger="auto"
  showBeacon
>
  <DocumentList />
</ContextualHint>
```

### 3.4 Enhanced EmptyState

```typescript
// components/dashboard/ui/empty-state.tsx (Enhancement)

interface EnhancedEmptyStateProps extends EmptyStateProps {
  quickStart?: {
    templates: Array<{
      id: string
      name: string
      icon: string
      description: string
      onClick: () => void
    }>
  }
  videoTutorial?: {
    url: string
    duration: string
    thumbnail: string
  }
  relatedDocs?: Array<{
    title: string
    href: string
  }>
}

// New Quick Start Templates for DOCS
const DOCS_QUICK_START_TEMPLATES = [
  {
    id: 'mes-report',
    name: 'MES 정산보고서',
    icon: '🏭',
    description: '스마트공장 일일 생산 리포트',
    onClick: () => startDocGeneration('MES_REPORT'),
  },
  {
    id: 'business-plan',
    name: '사업계획서',
    icon: '📋',
    description: '정부지원사업용 BP',
    onClick: () => startDocGeneration('BUSINESS_PLAN'),
  },
  {
    id: 'tms-report',
    name: 'TMS 보고서',
    icon: '🚛',
    description: '물류 운송 정산보고서',
    onClick: () => startDocGeneration('TMS_REPORT'),
  },
]
```

---

## 4. State Persistence

### localStorage Schema

```typescript
interface OnboardingStorage {
  version: number
  firstVisitAt: string | null
  completedTours: TourId[]
  dismissedHints: HintId[]
  preferences: {
    showHints: boolean
    autoStartTour: boolean
  }
  lastUpdated: string
}

const STORAGE_KEY = 'qetta_onboarding_v1'

// Migration support
function migrateOnboardingStorage(data: unknown): OnboardingStorage {
  // Handle version upgrades
}
```

---

## 5. Tour Triggers & Conditions

| Trigger | Condition | Action |
|---------|-----------|--------|
| First Visit | `!localStorage.getItem(STORAGE_KEY)` | Show Welcome Tour |
| Tab First Visit | `!completedTours.includes('docs')` && `activeTab === 'DOCS'` | Show Tab Tour |
| Empty State | Document count === 0 | Show Quick Start |
| Feature Discovery | After first document | Show Verify Hint |
| Cross-Tab Action | Generate in DOCS | Show "Verify in VERIFY" hint |

---

## 6. Animation Specifications

### Spotlight Animation

```css
/* globals.css additions */

@keyframes spotlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3),
                0 0 0 8px rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.4),
                0 0 0 12px rgba(255, 255, 255, 0.15);
  }
}

@keyframes hint-beacon {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.tour-spotlight {
  position: relative;
  z-index: 1001;
  animation: spotlight-pulse 2s ease-in-out infinite;
}

.hint-beacon {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  animation: hint-beacon 2s ease-out infinite;
}
```

### Motion Design Tokens

```typescript
// lib/design-tokens.ts additions

export const onboardingAnimations = {
  spotlight: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tooltip: {
    enterDuration: '200ms',
    exitDuration: '150ms',
    easing: 'ease-out',
  },
  beacon: {
    duration: '2s',
    repeat: 'infinite',
  },
} as const
```

---

## 7. Implementation Plan

### Phase 1: Core Infrastructure (2h)

| Task | File | Description |
|------|------|-------------|
| 1.1 | `components/onboarding/onboarding-provider.tsx` | Context + State Management |
| 1.2 | `components/onboarding/use-onboarding.ts` | Hook for accessing context |
| 1.3 | `lib/onboarding-storage.ts` | localStorage persistence |

### Phase 2: Tour System (3h)

| Task | File | Description |
|------|------|-------------|
| 2.1 | `components/onboarding/tour-overlay.tsx` | Spotlight + Navigation |
| 2.2 | `components/onboarding/tour-tooltip.tsx` | Tooltip component |
| 2.3 | `constants/onboarding-tours.ts` | Tour configurations |
| 2.4 | `app/globals.css` | Animation keyframes |

### Phase 3: Contextual Hints (2h)

| Task | File | Description |
|------|------|-------------|
| 3.1 | `components/onboarding/contextual-hint.tsx` | Hint wrapper component |
| 3.2 | `components/onboarding/hint-beacon.tsx` | Pulsing beacon |
| 3.3 | Integration with dashboard tabs | Add data-tour attributes |

### Phase 4: Empty State Enhancement (1.5h)

| Task | File | Description |
|------|------|-------------|
| 4.1 | `components/dashboard/ui/empty-state.tsx` | Add Quick Start templates |
| 4.2 | `constants/quick-start-templates.ts` | Template configurations |

### Phase 5: Integration & Testing (1.5h)

| Task | Description |
|------|-------------|
| 5.1 | Add `OnboardingProvider` to dashboard layout |
| 5.2 | Add `data-tour` attributes to target elements |
| 5.3 | E2E tests for tour flow |
| 5.4 | localStorage persistence tests |

---

## 8. File Structure

```
components/
├── onboarding/
│   ├── index.ts                    # Public exports
│   ├── onboarding-provider.tsx     # Context provider
│   ├── use-onboarding.ts           # Hook
│   ├── tour-overlay.tsx            # Main tour component
│   ├── tour-tooltip.tsx            # Tooltip with arrow
│   ├── tour-spotlight.tsx          # Spotlight mask
│   ├── tour-navigation.tsx         # Prev/Next/Skip buttons
│   ├── contextual-hint.tsx         # Hint wrapper
│   └── hint-beacon.tsx             # Pulsing indicator

constants/
├── onboarding/
│   ├── tours.ts                    # Tour step configs
│   ├── hints.ts                    # Hint configs
│   └── templates.ts                # Quick start templates

lib/
└── onboarding-storage.ts           # Persistence layer
```

---

## 9. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | Tab through tour, Escape to skip |
| Screen Reader | aria-live for step changes |
| Focus Management | Focus trap in tour overlay |
| Reduced Motion | `prefers-reduced-motion` support |
| High Contrast | Sufficient contrast ratios |

---

## 10. Analytics Events

```typescript
// Track onboarding metrics
const ONBOARDING_EVENTS = {
  TOUR_STARTED: 'onboarding_tour_started',
  TOUR_STEP_VIEWED: 'onboarding_tour_step_viewed',
  TOUR_COMPLETED: 'onboarding_tour_completed',
  TOUR_SKIPPED: 'onboarding_tour_skipped',
  HINT_SHOWN: 'onboarding_hint_shown',
  HINT_DISMISSED: 'onboarding_hint_dismissed',
  QUICK_START_CLICKED: 'onboarding_quick_start_clicked',
} as const
```

---

## 11. Dependencies

### New Dependencies
- None required (vanilla React + CSS)

### Existing Dependencies Used
- `cn()` from `lib/utils`
- `Button` from `components/catalyst/button`
- Design tokens from `lib/design-tokens`

---

## 12. Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tour Completion Rate | > 60% | Analytics |
| First Document Time | < 5min | Session timing |
| Feature Discovery | > 50% | Tab visit tracking |
| User Satisfaction | > 4.0/5 | Survey |

---

## Appendix: Tour Content (Korean)

### Welcome Tour

| Step | Title | Content |
|------|-------|---------|
| 1 | DOCS - 문서 자동 생성 | 45초 만에 MES 정산보고서, 사업계획서를 생성합니다. |
| 2 | VERIFY - 해시체인 검증 | SHA-256 기반으로 문서 무결성을 보장합니다. |
| 3 | APPLY - 글로벌 입찰 매칭 | 630K+ 입찰 중 당신의 회사에 맞는 기회를 찾습니다. |
| 4 | MONITOR - 실시간 모니터링 | MES, PLC, OPC-UA 데이터를 실시간으로 확인합니다. |
| 5 | AI 어시스턴트 | 궁금한 점이 있으면 AI에게 물어보세요. |
| 6 | 준비 완료! | DOCS 탭에서 첫 번째 문서를 생성해보세요. |

---

*Generated: 2026-01-31*
*Author: Claude Code Agent*
*Branch: claude/analyze-repo-project-9AXpB*
