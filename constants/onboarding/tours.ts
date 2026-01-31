/**
 * Onboarding Tour Configurations
 *
 * 대시보드 투어 단계 정의
 */

import type { TourId } from '@/lib/onboarding-storage'

export interface TourStep {
  id: string
  target: string // CSS selector or 'center' for modal
  title: string
  content: string
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  spotlight?: {
    padding?: number
    borderRadius?: number
  }
  action?: {
    label: string
    href?: string
  }
}

export interface TourConfig {
  id: TourId
  name: string
  description: string
  steps: TourStep[]
  allowSkip: boolean
}

/**
 * Welcome Tour - 첫 방문 사용자용
 */
export const WELCOME_TOUR: TourConfig = {
  id: 'welcome',
  name: 'QETTA 시작하기',
  description: '핵심 기능을 빠르게 알아보세요',
  allowSkip: true,
  steps: [
    {
      id: 'welcome-intro',
      target: 'center',
      title: 'QETTA에 오신 것을 환영합니다',
      content: '문서 자동화 플랫폼의 핵심 기능을 빠르게 알아보세요. 약 1분이 소요됩니다.',
      placement: 'center',
    },
    {
      id: 'welcome-docs',
      target: '[data-tour="tab-docs"]',
      title: '📄 DOCS - 문서 자동 생성',
      content: 'MES 정산보고서, 사업계획서를 45초 만에 생성합니다. 8시간 → 30분으로 93.8% 시간 단축.',
      placement: 'bottom',
      spotlight: { padding: 8, borderRadius: 12 },
    },
    {
      id: 'welcome-verify',
      target: '[data-tour="tab-verify"]',
      title: '🔐 VERIFY - 해시체인 검증',
      content: 'SHA-256 기반으로 문서 무결성을 검증합니다. QR 코드로 원본 센서 데이터까지 역추적 가능.',
      placement: 'bottom',
      spotlight: { padding: 8, borderRadius: 12 },
    },
    {
      id: 'welcome-apply',
      target: '[data-tour="tab-apply"]',
      title: '🌍 APPLY - 글로벌 입찰 매칭',
      content: '630,000+ 글로벌 입찰 중 당신의 회사에 맞는 기회를 AI가 찾아드립니다.',
      placement: 'bottom',
      spotlight: { padding: 8, borderRadius: 12 },
    },
    {
      id: 'welcome-monitor',
      target: '[data-tour="tab-monitor"]',
      title: '📊 MONITOR - 실시간 모니터링',
      content: 'MES, PLC, OPC-UA 장비를 실시간으로 연결하고 모니터링합니다.',
      placement: 'bottom',
      spotlight: { padding: 8, borderRadius: 12 },
    },
    {
      id: 'welcome-ai',
      target: '[data-tour="ai-toggle"]',
      title: '🤖 AI 어시스턴트',
      content: '궁금한 점이 있으면 AI에게 물어보세요. 문서 작성부터 입찰 매칭까지 도와드립니다.',
      placement: 'left',
      spotlight: { padding: 8, borderRadius: 12 },
    },
    {
      id: 'welcome-complete',
      target: 'center',
      title: '🎉 준비 완료!',
      content: 'DOCS 탭에서 첫 번째 문서를 생성해보세요. 템플릿을 선택하면 45초 안에 완성됩니다.',
      placement: 'center',
      action: {
        label: '문서 생성 시작',
        href: '/docs',
      },
    },
  ],
}

/**
 * DOCS Tab Tour
 */
export const DOCS_TOUR: TourConfig = {
  id: 'docs',
  name: 'DOCS 상세 가이드',
  description: '문서 생성 기능 상세 안내',
  allowSkip: true,
  steps: [
    {
      id: 'docs-domain',
      target: '[data-tour="domain-selector"]',
      title: '1️⃣ 도메인 선택',
      content: '산업 분야를 선택하세요: 제조업, 환경, 물류 등',
      placement: 'right',
      spotlight: { padding: 8, borderRadius: 8 },
    },
    {
      id: 'docs-template',
      target: '[data-tour="template-list"]',
      title: '2️⃣ 템플릿 선택',
      content: 'MES 정산보고서, 사업계획서 등 템플릿을 선택합니다',
      placement: 'right',
      spotlight: { padding: 8, borderRadius: 8 },
    },
    {
      id: 'docs-generate',
      target: '[data-tour="generate-btn"]',
      title: '3️⃣ 생성하기',
      content: '버튼을 클릭하면 45초 안에 문서가 생성됩니다',
      placement: 'top',
      spotlight: { padding: 8, borderRadius: 8 },
    },
  ],
}

/**
 * All Tours
 */
export const TOURS: Record<TourId, TourConfig> = {
  welcome: WELCOME_TOUR,
  docs: DOCS_TOUR,
  verify: {
    id: 'verify',
    name: 'VERIFY 상세 가이드',
    description: '문서 검증 기능 안내',
    allowSkip: true,
    steps: [],
  },
  apply: {
    id: 'apply',
    name: 'APPLY 상세 가이드',
    description: '입찰 매칭 기능 안내',
    allowSkip: true,
    steps: [],
  },
  monitor: {
    id: 'monitor',
    name: 'MONITOR 상세 가이드',
    description: '실시간 모니터링 안내',
    allowSkip: true,
    steps: [],
  },
}

/**
 * 특정 투어의 단계 수 가져오기
 */
export function getTourStepCount(tourId: TourId): number {
  return TOURS[tourId]?.steps.length ?? 0
}

/**
 * 특정 투어의 특정 단계 가져오기
 */
export function getTourStep(tourId: TourId, stepIndex: number): TourStep | null {
  return TOURS[tourId]?.steps[stepIndex] ?? null
}
