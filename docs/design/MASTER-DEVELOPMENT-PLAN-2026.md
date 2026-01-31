# QETTA Master Development Plan 2026

> **Version:** 2.0
> **Date:** 2026-01-31
> **Scope:** P0-P3 전체 개발 계획
> **Total Estimated Time:** 45-55 시간
> **Branch:** claude/analyze-repo-project-9AXpB

---

## Executive Summary

### 현재 상태 (As-Is)

| 영역 | 페이지 수 | 2026 트렌드 점수 | 주요 이슈 |
|------|----------|-----------------|----------|
| 마케팅 | 12 | 60% | Onboarding 부재, 개인화 없음 |
| 인증 | 5 | 70% | SSO 없음, 진행표시 없음 |
| 대시보드 | 14 | 65% | Tour 없음, Empty UX 미흡 |

### 목표 상태 (To-Be)

| 트렌드 | 현재 | 목표 | 개선폭 |
|--------|------|------|--------|
| Progressive Onboarding | 40% | 80% | +40% |
| Instant Value | 75% | 90% | +15% |
| AI-Adaptive | 35% | 70% | +35% |
| Motion Design | 60% | 80% | +20% |

---

## Phase 0: 핵심 인프라 (P0) - 12시간

> **목표:** 신규 사용자 이탈률 65% → 35%

### P0-1: Onboarding Tour System (4h)

#### 신규 파일

```
components/onboarding/
├── index.ts                    # Public exports
├── onboarding-provider.tsx     # Context + State (localStorage)
├── use-onboarding.ts           # Custom hook
├── tour-overlay.tsx            # Spotlight mask + Navigation
├── tour-tooltip.tsx            # Floating tooltip
├── tour-spotlight.tsx          # Highlight mask
├── contextual-hint.tsx         # Hint wrapper
└── hint-beacon.tsx             # Pulsing indicator

constants/onboarding/
├── tours.ts                    # Tour configurations
├── hints.ts                    # Hint definitions
└── templates.ts                # Quick start templates

lib/
└── onboarding-storage.ts       # localStorage persistence
```

#### 구현 체크리스트

| # | Task | File | Time | Deps |
|---|------|------|------|------|
| 1 | OnboardingProvider 컨텍스트 | `onboarding-provider.tsx` | 45m | - |
| 2 | useOnboarding 훅 | `use-onboarding.ts` | 15m | 1 |
| 3 | localStorage 영속화 | `onboarding-storage.ts` | 30m | - |
| 4 | TourOverlay 메인 컴포넌트 | `tour-overlay.tsx` | 60m | 1,2 |
| 5 | TourTooltip 툴팁 | `tour-tooltip.tsx` | 30m | - |
| 6 | TourSpotlight 하이라이트 | `tour-spotlight.tsx` | 30m | - |
| 7 | Welcome Tour 설정 | `constants/onboarding/tours.ts` | 30m | 4 |
| 8 | CSS 애니메이션 추가 | `globals.css` | 20m | - |

#### 핵심 코드 스펙

```typescript
// components/onboarding/onboarding-provider.tsx
'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { loadOnboardingState, saveOnboardingState } from '@/lib/onboarding-storage'

type TourId = 'welcome' | 'docs' | 'verify' | 'apply' | 'monitor'
type HintId = 'first-document' | 'ai-panel' | 'cross-tab' | 'keyboard'

interface OnboardingState {
  isFirstVisit: boolean
  currentTour: TourId | null
  currentStep: number
  completedTours: TourId[]
  dismissedHints: HintId[]
}

interface OnboardingContextValue extends OnboardingState {
  startTour: (tourId: TourId) => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  dismissHint: (hintId: HintId) => void
  shouldShowHint: (hintId: HintId) => boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => loadOnboardingState())

  // Auto-start welcome tour for first-time visitors
  useEffect(() => {
    if (state.isFirstVisit && !state.currentTour) {
      setState(prev => ({ ...prev, currentTour: 'welcome', currentStep: 0 }))
    }
  }, [state.isFirstVisit, state.currentTour])

  // Persist state changes
  useEffect(() => {
    saveOnboardingState(state)
  }, [state])

  const startTour = useCallback((tourId: TourId) => {
    setState(prev => ({ ...prev, currentTour: tourId, currentStep: 0 }))
  }, [])

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
  }, [])

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))
  }, [])

  const skipTour = useCallback(() => {
    setState(prev => ({ ...prev, currentTour: null, currentStep: 0 }))
  }, [])

  const completeTour = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTour: null,
      currentStep: 0,
      completedTours: prev.currentTour
        ? [...prev.completedTours, prev.currentTour]
        : prev.completedTours,
      isFirstVisit: false,
    }))
  }, [])

  const dismissHint = useCallback((hintId: HintId) => {
    setState(prev => ({
      ...prev,
      dismissedHints: [...prev.dismissedHints, hintId],
    }))
  }, [])

  const shouldShowHint = useCallback((hintId: HintId) => {
    return !state.dismissedHints.includes(hintId)
  }, [state.dismissedHints])

  return (
    <OnboardingContext.Provider value={{
      ...state,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      dismissHint,
      shouldShowHint,
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
```

```typescript
// constants/onboarding/tours.ts
export interface TourStep {
  id: string
  target: string              // CSS selector or 'center'
  title: string
  content: string
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  spotlight?: { padding?: number; borderRadius?: number }
  action?: { label: string; onClick: () => void }
}

export interface TourConfig {
  id: string
  name: string
  steps: TourStep[]
}

export const WELCOME_TOUR: TourConfig = {
  id: 'welcome',
  name: 'QETTA 시작하기',
  steps: [
    {
      id: 'step-1',
      target: '[data-tour="tab-docs"]',
      title: '📄 DOCS - 문서 자동 생성',
      content: '45초 만에 MES 정산보고서, 사업계획서를 생성합니다.',
      placement: 'bottom',
      spotlight: { padding: 8, borderRadius: 12 },
    },
    {
      id: 'step-2',
      target: '[data-tour="tab-verify"]',
      title: '🔐 VERIFY - 해시체인 검증',
      content: 'SHA-256 기반으로 문서 무결성을 보장합니다.',
      placement: 'bottom',
    },
    {
      id: 'step-3',
      target: '[data-tour="tab-apply"]',
      title: '🌍 APPLY - 글로벌 입찰',
      content: '630K+ 입찰 중 맞춤 기회를 찾습니다.',
      placement: 'bottom',
    },
    {
      id: 'step-4',
      target: '[data-tour="tab-monitor"]',
      title: '📊 MONITOR - 실시간',
      content: 'MES, PLC, OPC-UA 실시간 확인.',
      placement: 'bottom',
    },
    {
      id: 'step-5',
      target: '[data-tour="ai-toggle"]',
      title: '🤖 AI 어시스턴트',
      content: '궁금한 점은 AI에게 물어보세요.',
      placement: 'left',
    },
    {
      id: 'step-complete',
      target: 'center',
      title: '🎉 준비 완료!',
      content: 'DOCS에서 첫 문서를 생성해보세요.',
      placement: 'center',
      action: { label: '시작하기', onClick: () => {} },
    },
  ],
}

export const TOURS: Record<string, TourConfig> = {
  welcome: WELCOME_TOUR,
  // 추가 투어들...
}
```

---

### P0-2: Empty State Enhancement (2h)

#### 수정 파일

| File | Changes |
|------|---------|
| `components/dashboard/ui/empty-state.tsx` | Quick Start 템플릿, 비디오 튜토리얼 |
| `constants/onboarding/templates.ts` | 빠른 시작 템플릿 설정 |

#### 구현 체크리스트

| # | Task | Time |
|---|------|------|
| 1 | QuickStartTemplate 인터페이스 정의 | 15m |
| 2 | DOCS/VERIFY/APPLY/MONITOR 템플릿 설정 | 30m |
| 3 | EmptyState 컴포넌트에 Quick Start 섹션 추가 | 45m |
| 4 | 애니메이션 및 호버 효과 | 30m |

#### 핵심 코드 스펙

```typescript
// constants/onboarding/templates.ts

export interface QuickStartTemplate {
  id: string
  name: string
  icon: string
  description: string
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'advanced'
}

export const DOCS_TEMPLATES: QuickStartTemplate[] = [
  {
    id: 'mes-report',
    name: 'MES 정산보고서',
    icon: '🏭',
    description: '스마트공장 일일 생산 리포트',
    estimatedTime: '45초',
    difficulty: 'easy',
  },
  {
    id: 'business-plan',
    name: '사업계획서',
    icon: '📋',
    description: '정부지원사업용 BP',
    estimatedTime: '2분',
    difficulty: 'medium',
  },
  {
    id: 'tms-report',
    name: 'TMS 보고서',
    icon: '🚛',
    description: '물류 운송 정산보고서',
    estimatedTime: '45초',
    difficulty: 'easy',
  },
]

export const QUICK_START_BY_TAB = {
  DOCS: DOCS_TEMPLATES,
  VERIFY: [...],
  APPLY: [...],
  MONITOR: [...],
}
```

```typescript
// components/dashboard/ui/empty-state.tsx (Enhanced)

import { cn } from '@/lib/utils'
import { Button } from '@/components/catalyst/button'
import { QUICK_START_BY_TAB, QuickStartTemplate } from '@/constants/onboarding/templates'

interface EnhancedEmptyStateProps {
  tab: 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'
  onTemplateSelect?: (template: QuickStartTemplate) => void
  className?: string
}

export function EnhancedEmptyState({ tab, onTemplateSelect, className }: EnhancedEmptyStateProps) {
  const templates = QUICK_START_BY_TAB[tab]
  const content = EMPTY_STATE_CONTENT[tab]

  return (
    <div className={cn('py-12 px-6', className)}>
      {/* Hero Section */}
      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block">{content.icon}</span>
        <h3 className="text-xl font-semibold text-white mb-2">{content.title}</h3>
        <p className="text-3xl font-bold text-white mb-2">{content.value}</p>
        <p className="text-zinc-400">{content.subtitle}</p>
      </div>

      {/* Quick Start Templates */}
      <div className="max-w-2xl mx-auto">
        <h4 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
          <span>⚡</span> 빠른 시작
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onTemplateSelect?.(template)}
              className={cn(
                'p-4 rounded-xl text-left transition-all',
                'bg-zinc-900/50 border border-zinc-800',
                'hover:bg-zinc-800/50 hover:border-zinc-700',
                'group'
              )}
            >
              <span className="text-2xl mb-2 block">{template.icon}</span>
              <p className="font-medium text-white mb-1">{template.name}</p>
              <p className="text-xs text-zinc-500 mb-2">{template.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">⏱️ {template.estimatedTime}</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded',
                  template.difficulty === 'easy' && 'bg-emerald-500/10 text-emerald-400',
                  template.difficulty === 'medium' && 'bg-amber-500/10 text-amber-400',
                  template.difficulty === 'advanced' && 'bg-red-500/10 text-red-400',
                )}>
                  {template.difficulty === 'easy' && '쉬움'}
                  {template.difficulty === 'medium' && '보통'}
                  {template.difficulty === 'advanced' && '고급'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

### P0-3: Progressive Disclosure System (3h)

#### 신규 파일

```
components/onboarding/
├── feature-discovery.tsx      # 기능 발견 시스템
├── achievement-toast.tsx      # 달성 토스트
└── progress-tracker.tsx       # 진행률 트래커
```

#### 구현 체크리스트

| # | Task | Time |
|---|------|------|
| 1 | FeatureDiscovery 컴포넌트 | 45m |
| 2 | AchievementToast 컴포넌트 | 30m |
| 3 | ProgressTracker 컴포넌트 | 45m |
| 4 | Dashboard 통합 | 30m |
| 5 | 애니메이션 추가 | 30m |

#### 핵심 코드 스펙

```typescript
// components/onboarding/progress-tracker.tsx

interface ProgressTrackerProps {
  achievements: Achievement[]
  className?: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  completed: boolean
  progress?: number // 0-100
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-doc', name: '첫 문서 생성', description: 'DOCS에서 첫 문서 생성', icon: '📄', completed: false },
  { id: 'first-verify', name: '첫 검증 완료', description: 'VERIFY에서 문서 검증', icon: '🔐', completed: false },
  { id: 'first-match', name: '첫 매칭 확인', description: 'APPLY에서 입찰 매칭', icon: '🌍', completed: false },
  { id: 'first-monitor', name: '첫 모니터링', description: 'MONITOR 연결 설정', icon: '📊', completed: false },
  { id: 'ai-chat', name: 'AI와 대화', description: 'AI 어시스턴트 사용', icon: '🤖', completed: false },
]

export function ProgressTracker({ achievements = DEFAULT_ACHIEVEMENTS, className }: ProgressTrackerProps) {
  const completedCount = achievements.filter(a => a.completed).length
  const totalCount = achievements.length
  const progress = (completedCount / totalCount) * 100

  return (
    <div className={cn('p-4 rounded-xl bg-zinc-900/50 border border-zinc-800', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white">시작 가이드</h4>
        <span className="text-xs text-zinc-500">{completedCount}/{totalCount} 완료</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-zinc-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-zinc-500 to-white rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Achievement List */}
      <div className="space-y-2">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-colors',
              achievement.completed ? 'bg-emerald-500/10' : 'hover:bg-zinc-800/50'
            )}
          >
            <span className="text-lg">{achievement.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium truncate',
                achievement.completed ? 'text-emerald-400' : 'text-white'
              )}>
                {achievement.name}
              </p>
              <p className="text-xs text-zinc-500 truncate">{achievement.description}</p>
            </div>
            {achievement.completed && (
              <span className="text-emerald-400">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### P0-4: Dashboard Integration (3h)

#### 수정 파일

| File | Changes |
|------|---------|
| `components/dashboard/page.tsx` | OnboardingProvider 래핑 |
| `components/dashboard/layout/sidebar.tsx` | data-tour 속성 추가 |
| `components/dashboard/ai/panel/index.tsx` | data-tour 속성 추가 |
| `app/(dashboard)/layout.tsx` | Provider 적용 |

#### 구현 체크리스트

| # | Task | Time |
|---|------|------|
| 1 | Dashboard layout에 OnboardingProvider 추가 | 30m |
| 2 | Sidebar tabs에 data-tour 속성 | 30m |
| 3 | AI Panel에 data-tour 속성 | 15m |
| 4 | TourOverlay 렌더링 조건부 추가 | 30m |
| 5 | ProgressTracker 사이드바에 추가 | 30m |
| 6 | E2E 테스트 작성 | 45m |

---

## Phase 1: 인증 강화 (P1) - 10시간

### P1-1: OAuth SSO Integration (5h)

#### 신규/수정 파일

```
app/api/auth/[...nextauth]/
├── route.ts                 # NextAuth 설정
└── providers/
    ├── google.ts            # Google OAuth
    └── microsoft.ts         # Microsoft OAuth

components/auth/
├── oauth-buttons.tsx        # 수정: Google/MS 버튼 추가
└── sso-callback.tsx         # SSO 콜백 처리

lib/
└── auth/
    └── sso-config.ts        # SSO 설정
```

#### 구현 체크리스트

| # | Task | Time |
|---|------|------|
| 1 | Google OAuth Provider 설정 | 60m |
| 2 | Microsoft OAuth Provider 설정 | 60m |
| 3 | OAuth 버튼 컴포넌트 업데이트 | 45m |
| 4 | SSO 콜백 처리 로직 | 45m |
| 5 | 기존 Beta 폼과 통합 | 30m |
| 6 | 에러 핸들링 및 폴백 | 30m |
| 7 | E2E 테스트 | 30m |

#### 핵심 코드 스펙

```typescript
// lib/auth/sso-config.ts
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'

export const ssoProviders = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
  }),
  AzureADProvider({
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    tenantId: process.env.AZURE_AD_TENANT_ID,
  }),
]

// components/auth/oauth-buttons.tsx
'use client'

import { signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'

export function OAuthButtons({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <button
        onClick={() => signIn('google', { callbackUrl: '/docs' })}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white text-zinc-900 font-medium hover:bg-zinc-100 transition-colors"
      >
        <GoogleIcon className="w-5 h-5" />
        Continue with Google
      </button>
      <button
        onClick={() => signIn('azure-ad', { callbackUrl: '/docs' })}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#00a4ef] text-white font-medium hover:bg-[#0096dc] transition-colors"
      >
        <MicrosoftIcon className="w-5 h-5" />
        Continue with Microsoft
      </button>
    </div>
  )
}
```

---

### P1-2: Industry Personalization (3h)

#### 신규 파일

```
lib/personalization/
├── industry-context.tsx     # 산업별 컨텍스트
├── content-rules.ts         # 콘텐츠 규칙
└── use-personalization.ts   # 개인화 훅

constants/
└── personalization/
    └── industry-content.ts  # 산업별 콘텐츠
```

#### 구현 체크리스트

| # | Task | Time |
|---|------|------|
| 1 | IndustryContext 생성 | 30m |
| 2 | 산업별 콘텐츠 맵 정의 | 45m |
| 3 | usePersonalization 훅 | 30m |
| 4 | Dashboard 개인화 적용 | 45m |
| 5 | Landing 개인화 적용 | 30m |

---

### P1-3: Interactive Demo Widget (2h)

#### 신규 파일

```
components/landing/
└── interactive-demo/
    ├── index.tsx            # 메인 컴포넌트
    ├── demo-docs.tsx        # DOCS 데모
    ├── demo-verify.tsx      # VERIFY 데모
    └── demo-apply.tsx       # APPLY 데모
```

---

## Phase 2: UX 강화 (P2) - 12시간

### P2-1: Command Palette (Cmd+K) (4h)

#### 신규 파일

```
components/command-palette/
├── index.tsx                # 메인 컴포넌트
├── command-input.tsx        # 검색 입력
├── command-list.tsx         # 명령어 목록
├── command-item.tsx         # 개별 명령어
└── use-commands.ts          # 명령어 훅

constants/
└── commands.ts              # 명령어 정의
```

#### 구현 체크리스트

| # | Task | Time |
|---|------|------|
| 1 | 명령어 데이터 구조 정의 | 30m |
| 2 | CommandPalette 컴포넌트 | 60m |
| 3 | 검색/필터 로직 | 45m |
| 4 | 키보드 네비게이션 | 45m |
| 5 | Dashboard 통합 | 30m |
| 6 | 명령어 확장 (DOCS/VERIFY/APPLY/MONITOR) | 30m |

#### 핵심 코드 스펙

```typescript
// constants/commands.ts

export interface Command {
  id: string
  name: string
  description: string
  shortcut?: string
  icon: string
  category: 'navigation' | 'action' | 'settings'
  action: () => void
}

export const COMMANDS: Command[] = [
  // Navigation
  { id: 'nav-docs', name: 'Go to DOCS', description: '문서 탭으로 이동', shortcut: 'G D', icon: '📄', category: 'navigation', action: () => {} },
  { id: 'nav-verify', name: 'Go to VERIFY', description: '검증 탭으로 이동', shortcut: 'G V', icon: '🔐', category: 'navigation', action: () => {} },
  { id: 'nav-apply', name: 'Go to APPLY', description: '입찰 탭으로 이동', shortcut: 'G A', icon: '🌍', category: 'navigation', action: () => {} },
  { id: 'nav-monitor', name: 'Go to MONITOR', description: '모니터링 탭으로 이동', shortcut: 'G M', icon: '📊', category: 'navigation', action: () => {} },

  // Actions
  { id: 'action-new-doc', name: 'New Document', description: '새 문서 생성', shortcut: 'N', icon: '➕', category: 'action', action: () => {} },
  { id: 'action-ai', name: 'Open AI Assistant', description: 'AI 어시스턴트 열기', shortcut: '/', icon: '🤖', category: 'action', action: () => {} },

  // Settings
  { id: 'settings-profile', name: 'Profile Settings', description: '프로필 설정', icon: '👤', category: 'settings', action: () => {} },
  { id: 'settings-billing', name: 'Billing', description: '결제 관리', icon: '💳', category: 'settings', action: () => {} },
]

// components/command-palette/index.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { COMMANDS, Command } from '@/constants/commands'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query) return COMMANDS
    const lower = query.toLowerCase()
    return COMMANDS.filter(cmd =>
      cmd.name.toLowerCase().includes(lower) ||
      cmd.description.toLowerCase().includes(lower)
    )
  }, [query])

  // Execute command
  const executeCommand = useCallback((command: Command) => {
    command.action()
    setIsOpen(false)
    setQuery('')
  }, [])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-zinc-800">
          <span className="text-zinc-500">⌘</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 px-3 py-4 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Command List */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => executeCommand(cmd)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                selectedIndex === index ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
              )}
            >
              <span className="text-lg">{cmd.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{cmd.name}</p>
                <p className="text-xs text-zinc-500 truncate">{cmd.description}</p>
              </div>
              {cmd.shortcut && (
                <kbd className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded">
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500">
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
          <span>esc Close</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

---

### P2-2: AI Agent Enhancement (4h)

#### 수정 파일

| File | Changes |
|------|---------|
| `components/dashboard/ai/panel/index.tsx` | 자연어 질의 강화 |
| `components/dashboard/ai/panel/proactive-suggestions.tsx` | 제안 액션 확장 |
| `lib/claude/agent-prompts.ts` | 프롬프트 개선 |

---

### P2-3: Micro-Interaction Enhancement (4h)

#### 수정 파일

| File | Changes |
|------|---------|
| `app/globals.css` | 새 애니메이션 키프레임 |
| `lib/design-tokens.ts` | 애니메이션 토큰 |
| `components/dashboard/ui/*` | 마이크로 인터랙션 적용 |

#### 새 애니메이션 목록

```css
/* 추가할 애니메이션 */

@keyframes success-check {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes slide-up-fade {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes skeleton-wave {
  0% { background-position: -200% 0; }
  100% { background-position: calc(200% + 100px) 0; }
}

@keyframes tab-indicator {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
```

---

## Phase 3: 최적화 (P3) - 11시간

### P3-1: Performance Optimization (4h)

| Task | Description | Time |
|------|-------------|------|
| 번들 분석 | webpack-bundle-analyzer 실행 | 30m |
| 코드 스플리팅 추가 | 대형 컴포넌트 분할 | 90m |
| 이미지 최적화 | next/image 적용 확대 | 60m |
| 캐싱 전략 개선 | SWR/React Query 도입 | 60m |

### P3-2: Accessibility Audit (3h)

| Task | Description | Time |
|------|-------------|------|
| Lighthouse 감사 | 접근성 점수 확인 | 30m |
| 키보드 네비게이션 | 모든 인터랙티브 요소 | 60m |
| ARIA 속성 추가 | 스크린 리더 지원 | 60m |
| 색상 대비 검증 | WCAG AA 준수 | 30m |

### P3-3: E2E Test Coverage (4h)

| Task | Description | Time |
|------|-------------|------|
| Onboarding 투어 테스트 | 전체 플로우 | 60m |
| Empty State 테스트 | 각 탭별 | 30m |
| Command Palette 테스트 | 키보드 인터랙션 | 45m |
| SSO 테스트 | OAuth 플로우 | 60m |
| 크로스 브라우저 | Chrome/Firefox/Safari | 45m |

---

## Implementation Timeline

### Week 1: P0 Core

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | P0-1: OnboardingProvider, Storage | 3h |
| 2 | P0-1: TourOverlay, TourTooltip | 4h |
| 3 | P0-2: EmptyState Enhancement | 2h |
| 4 | P0-3: ProgressTracker | 2h |
| 5 | P0-4: Dashboard Integration | 3h |

### Week 2: P1 Auth

| Day | Tasks | Hours |
|-----|-------|-------|
| 1-2 | P1-1: OAuth SSO | 5h |
| 3 | P1-2: Industry Personalization | 3h |
| 4 | P1-3: Interactive Demo | 2h |

### Week 3: P2 UX

| Day | Tasks | Hours |
|-----|-------|-------|
| 1-2 | P2-1: Command Palette | 4h |
| 3-4 | P2-2: AI Agent Enhancement | 4h |
| 5 | P2-3: Micro-Interactions | 4h |

### Week 4: P3 Polish

| Day | Tasks | Hours |
|-----|-------|-------|
| 1-2 | P3-1: Performance | 4h |
| 3 | P3-2: Accessibility | 3h |
| 4-5 | P3-3: E2E Tests | 4h |

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| 신규 사용자 이탈률 | 65% | 35% | Analytics |
| 첫 문서 생성 시간 | 15분 | 5분 | Session timing |
| Feature Discovery | 25% | 60% | Tab visits |
| Tour Completion | 0% | 60% | Onboarding events |
| A11y Score | 75 | 95 | Lighthouse |
| Performance Score | 80 | 90 | Lighthouse |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSO 통합 지연 | High | Beta 폼 유지 (폴백) |
| 번들 크기 증가 | Medium | 코드 스플리팅 우선 |
| 브라우저 호환성 | Medium | Polyfill, 점진적 개선 |
| 테스트 커버리지 | Low | 핵심 플로우 우선 |

---

## Appendix: File Change Summary

### New Files (25개)

```
components/onboarding/
├── index.ts
├── onboarding-provider.tsx
├── use-onboarding.ts
├── tour-overlay.tsx
├── tour-tooltip.tsx
├── tour-spotlight.tsx
├── contextual-hint.tsx
├── hint-beacon.tsx
├── feature-discovery.tsx
├── achievement-toast.tsx
└── progress-tracker.tsx

components/command-palette/
├── index.tsx
├── command-input.tsx
├── command-list.tsx
├── command-item.tsx
└── use-commands.ts

constants/onboarding/
├── tours.ts
├── hints.ts
└── templates.ts

constants/
└── commands.ts

lib/
├── onboarding-storage.ts
└── personalization/
    ├── industry-context.tsx
    ├── content-rules.ts
    └── use-personalization.ts
```

### Modified Files (12개)

```
app/globals.css                               # 새 애니메이션
app/(dashboard)/layout.tsx                    # OnboardingProvider
components/dashboard/page.tsx                 # data-tour 속성
components/dashboard/layout/sidebar.tsx       # data-tour 속성
components/dashboard/ai/panel/index.tsx       # data-tour, 강화
components/dashboard/ui/empty-state.tsx       # Quick Start
components/auth/oauth-buttons.tsx             # SSO 버튼
lib/design-tokens.ts                          # 애니메이션 토큰
e2e/onboarding.spec.ts                        # 신규 테스트
e2e/command-palette.spec.ts                   # 신규 테스트
```

---

*Generated: 2026-01-31*
*Total Estimated Hours: 45-55h*
*Priority: P0 > P1 > P2 > P3*
