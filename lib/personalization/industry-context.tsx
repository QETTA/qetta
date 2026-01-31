'use client'

/**
 * Industry Personalization System
 *
 * 사용자 산업군 기반 개인화:
 * - 산업군별 추천 템플릿
 * - 대시보드 레이아웃 커스터마이징
 * - 관련 입찰 우선 표시
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

// ============================================
// Industry Types
// ============================================

export type IndustryId =
  | 'manufacturing'
  | 'environment'
  | 'digital'
  | 'finance'
  | 'startup'
  | 'export'
  | 'general'

export interface IndustryConfig {
  id: IndustryId
  name: string
  nameKo: string
  icon: string
  color: string
  description: string
  suggestedTemplates: string[]
  suggestedTenderKeywords: string[]
  priorityTabs: ('DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR')[]
}

export const INDUSTRY_CONFIGS: Record<IndustryId, IndustryConfig> = {
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing',
    nameKo: '제조업',
    icon: '🏭',
    color: 'blue',
    description: 'MES, 스마트공장, 정산보고서 자동화',
    suggestedTemplates: ['mes-report', 'production-report', 'quality-report'],
    suggestedTenderKeywords: ['smart factory', 'MES', 'IoT'],
    priorityTabs: ['MONITOR', 'DOCS', 'VERIFY', 'APPLY'],
  },
  environment: {
    id: 'environment',
    name: 'Environment',
    nameKo: '환경',
    icon: '🌱',
    color: 'emerald',
    description: 'TMS, 환경보고서, 배출권 관리',
    suggestedTemplates: ['tms-report', 'emission-report', 'env-compliance'],
    suggestedTenderKeywords: ['environment', 'emission', 'waste', 'water'],
    priorityTabs: ['VERIFY', 'DOCS', 'MONITOR', 'APPLY'],
  },
  digital: {
    id: 'digital',
    name: 'Digital',
    nameKo: '디지털/IT',
    icon: '💻',
    color: 'zinc',
    description: 'SW개발, 클라우드, 데이터 분석',
    suggestedTemplates: ['sw-proposal', 'cloud-migration', 'data-analysis'],
    suggestedTenderKeywords: ['software', 'cloud', 'AI', 'data'],
    priorityTabs: ['DOCS', 'APPLY', 'VERIFY', 'MONITOR'],
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    nameKo: '금융',
    icon: '🏦',
    color: 'indigo',
    description: '금융 컴플라이언스, 감사보고서',
    suggestedTemplates: ['audit-report', 'compliance-report', 'risk-assessment'],
    suggestedTenderKeywords: ['finance', 'banking', 'insurance', 'fintech'],
    priorityTabs: ['VERIFY', 'DOCS', 'APPLY', 'MONITOR'],
  },
  startup: {
    id: 'startup',
    name: 'Startup',
    nameKo: '스타트업',
    icon: '🚀',
    color: 'amber',
    description: 'IR자료, 사업계획서, 정부지원사업',
    suggestedTemplates: ['business-plan', 'ir-deck', 'gov-support-application'],
    suggestedTenderKeywords: ['startup', 'venture', 'innovation', 'R&D'],
    priorityTabs: ['APPLY', 'DOCS', 'VERIFY', 'MONITOR'],
  },
  export: {
    id: 'export',
    name: 'Export',
    nameKo: '수출/무역',
    icon: '🌍',
    color: 'blue',
    description: '글로벌 입찰, 수출 서류, 인증',
    suggestedTemplates: ['export-proposal', 'certification', 'trade-document'],
    suggestedTenderKeywords: ['export', 'trade', 'international', 'global'],
    priorityTabs: ['APPLY', 'DOCS', 'VERIFY', 'MONITOR'],
  },
  general: {
    id: 'general',
    name: 'General',
    nameKo: '일반',
    icon: '📋',
    color: 'zinc',
    description: '일반 문서 자동화',
    suggestedTemplates: ['general-proposal', 'report', 'presentation'],
    suggestedTenderKeywords: [],
    priorityTabs: ['DOCS', 'VERIFY', 'APPLY', 'MONITOR'],
  },
}

// ============================================
// Personalization Storage
// ============================================

const STORAGE_KEY = 'qetta_personalization'
const STORAGE_VERSION = 1

interface PersonalizationStorage {
  version: number
  industry: IndustryId
  onboardingComplete: boolean
  preferences: {
    defaultTab: 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR' | null
    dashboardLayout: 'default' | 'compact'
    showRecommendations: boolean
  }
  lastUpdated: string
}

function getDefaultStorage(): PersonalizationStorage {
  return {
    version: STORAGE_VERSION,
    industry: 'general',
    onboardingComplete: false,
    preferences: {
      defaultTab: null,
      dashboardLayout: 'default',
      showRecommendations: true,
    },
    lastUpdated: new Date().toISOString(),
  }
}

function loadPersonalization(): PersonalizationStorage {
  if (typeof window === 'undefined') return getDefaultStorage()

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return getDefaultStorage()

    const parsed = JSON.parse(saved) as PersonalizationStorage

    // Version migration
    if (parsed.version !== STORAGE_VERSION) {
      return getDefaultStorage()
    }

    return parsed
  } catch {
    return getDefaultStorage()
  }
}

function savePersonalization(state: PersonalizationStorage): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastUpdated: new Date().toISOString(),
    }))
  } catch {
    // Storage quota exceeded
  }
}

// ============================================
// Context
// ============================================

interface PersonalizationContextValue {
  industry: IndustryId
  industryConfig: IndustryConfig
  onboardingComplete: boolean
  preferences: PersonalizationStorage['preferences']

  // Actions
  setIndustry: (industry: IndustryId) => void
  completeOnboarding: () => void
  setPreference: <K extends keyof PersonalizationStorage['preferences']>(
    key: K,
    value: PersonalizationStorage['preferences'][K]
  ) => void
  resetPersonalization: () => void
}

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null)

interface PersonalizationProviderProps {
  children: ReactNode
}

export function PersonalizationProvider({ children }: PersonalizationProviderProps) {
  const [state, setState] = useState<PersonalizationStorage>(getDefaultStorage)

  // Load from localStorage on mount
  useEffect(() => {
    setState(loadPersonalization())
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    savePersonalization(state)
  }, [state])

  const setIndustry = useCallback((industry: IndustryId) => {
    setState((prev) => ({ ...prev, industry }))
  }, [])

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, onboardingComplete: true }))
  }, [])

  const setPreference = useCallback(
    <K extends keyof PersonalizationStorage['preferences']>(
      key: K,
      value: PersonalizationStorage['preferences'][K]
    ) => {
      setState((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: value },
      }))
    },
    []
  )

  const resetPersonalization = useCallback(() => {
    setState(getDefaultStorage())
  }, [])

  const contextValue: PersonalizationContextValue = {
    industry: state.industry,
    industryConfig: INDUSTRY_CONFIGS[state.industry],
    onboardingComplete: state.onboardingComplete,
    preferences: state.preferences,
    setIndustry,
    completeOnboarding,
    setPreference,
    resetPersonalization,
  }

  return (
    <PersonalizationContext.Provider value={contextValue}>
      {children}
    </PersonalizationContext.Provider>
  )
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext)
  if (!context) {
    throw new Error('usePersonalization must be used within PersonalizationProvider')
  }
  return context
}

// ============================================
// Industry Selector Component
// ============================================

interface IndustrySelectorProps {
  selected: IndustryId
  onChange: (industry: IndustryId) => void
  className?: string
}

export function IndustrySelector({ selected, onChange, className }: IndustrySelectorProps) {
  const industries = Object.values(INDUSTRY_CONFIGS).filter((i) => i.id !== 'general')

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {industries.map((industry) => (
          <button
            key={industry.id}
            onClick={() => onChange(industry.id)}
            className={`
              p-4 rounded-lg border transition-all duration-200
              ${
                selected === industry.id
                  ? 'bg-white/10 border-white/20 ring-2 ring-white/20'
                  : 'bg-zinc-800/50 border-white/5 hover:bg-zinc-800 hover:border-white/10'
              }
            `}
          >
            <span className="text-2xl block mb-2">{industry.icon}</span>
            <span className="text-sm font-medium text-white block">{industry.name}</span>
            <span className="text-xs text-zinc-500 block">{industry.nameKo}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Industry Badge Component
// ============================================

interface IndustryBadgeProps {
  industry?: IndustryId
  size?: 'sm' | 'md' | 'lg'
}

export function IndustryBadge({ industry, size = 'md' }: IndustryBadgeProps) {
  const { industryConfig } = usePersonalization()
  const config = industry ? INDUSTRY_CONFIGS[industry] : industryConfig

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full
        bg-zinc-800/50 text-zinc-300 ring-1 ring-white/10
        ${sizeClasses[size]}
      `}
    >
      <span>{config.icon}</span>
      <span>{config.name}</span>
    </span>
  )
}
