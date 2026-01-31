/**
 * QETTA Domain Engine Constants (Legacy)
 *
 * Extended configuration for 6 domain engines.
 * UI styling, inline commands, and helper functions for dashboard components.
 *
 * @deprecated v4.0 — Domain Engine pipeline has moved to `lib/skill-engine/core/domain-engine.ts`.
 * New code should use `EnginePreset` + `PRESETS` from `@/lib/skill-engine`.
 * This file is retained for dashboard UI consumers (AI panel, domain selector, etc.).
 *
 * @see lib/skill-engine/core/domain-engine.ts (v4 pipeline)
 * @see lib/skill-engine/presets.ts (6 preset BLOCK combinations)
 * @see generators/gov-support/data/qetta-super-model.json (Single Source of Truth)
 */

import type { EnginePresetType } from '@/types/inbox'

export interface EnginePresetConfig {
  id: EnginePresetType
  label: string
  shortLabel: string
  labelEn: string
  icon: string // Emoji for quick identification
  ministry: string
  ministryEn: string
  color: 'emerald' | 'blue' | 'violet' | 'amber'
  keywords: string[]
  outputs: string[]
  requiredFormat: 'HWP' | 'DOCX' | 'XLSX' | 'PDF'
  terminologyPath: string

  // UI styling for Catalyst Dark theme
  styles: {
    badge: string
    badgeHover: string
    iconBg: string
    accent: string
  }

  // Key metrics specific to this domain
  metrics: {
    avgGenerationTime: number // seconds
    terminologyCount: number
    accuracyRate: number // percentage
  }
}

export const DOMAIN_ENGINE_CONFIGS: Record<EnginePresetType, EnginePresetConfig> =
  {
    MANUFACTURING: {
      id: 'MANUFACTURING',
      label: '제조/스마트공장',
      shortLabel: '제조',
      labelEn: 'Manufacturing',
      icon: '🏭',
      ministry: '중기부/산업부',
      ministryEn: 'MSS/MOTIE',
      color: 'blue',
      keywords: ['MES', 'PLC', 'OEE', '스마트공장', '중기부', '정산'],
      outputs: ['정산보고서', 'OEE 분석', '설비이력'],
      requiredFormat: 'DOCX',
      terminologyPath: 'generators/domain-engines/manufacturing/terminology.json',
      styles: {
        badge: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
        badgeHover: 'hover:bg-blue-500/20 hover:ring-blue-500/30',
        iconBg: 'bg-blue-500/10',
        accent: 'text-blue-400',
      },
      metrics: {
        avgGenerationTime: 45,
        terminologyCount: 50,
        accuracyRate: 99.2,
      },
    },
    ENVIRONMENT: {
      id: 'ENVIRONMENT',
      label: '환경/TMS',
      shortLabel: '환경',
      labelEn: 'Environment',
      icon: '🌿',
      ministry: '환경부',
      ministryEn: 'MOE',
      color: 'emerald',
      keywords: ['ENVIRONMENT', 'NOx', 'SOx', 'PM', '탄소중립', '환경부'],
      outputs: ['일일보고서', '배출량신고서', '탄소보고서'],
      requiredFormat: 'HWP',
      terminologyPath: 'generators/domain-engines/environment/terminology.json',
      styles: {
        badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
        badgeHover: 'hover:bg-emerald-500/20 hover:ring-emerald-500/30',
        iconBg: 'bg-emerald-500/10',
        accent: 'text-emerald-400',
      },
      metrics: {
        avgGenerationTime: 45,
        terminologyCount: 50,
        accuracyRate: 99.2,
      },
    },
    DIGITAL: {
      id: 'DIGITAL',
      label: 'AI/SW 바우처',
      shortLabel: 'AI/SW',
      labelEn: 'Digital',
      icon: '💡',
      ministry: '과기정통부/NIPA',
      ministryEn: 'MSIT/NIPA',
      color: 'violet',
      keywords: ['AI', 'SW', '바우처', 'NIPA', '공급기업', '수요기업'],
      outputs: ['실적보고서', '정산서', '매칭분석'],
      requiredFormat: 'DOCX',
      terminologyPath: 'generators/domain-engines/digital/terminology.json',
      styles: {
        badge: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
        badgeHover: 'hover:bg-violet-500/20 hover:ring-violet-500/30',
        iconBg: 'bg-violet-500/10',
        accent: 'text-violet-400',
      },
      metrics: {
        avgGenerationTime: 45,
        terminologyCount: 40,
        accuracyRate: 99.2,
      },
    },
    FINANCE: {
      id: 'FINANCE',
      label: '융자/보증',
      shortLabel: '금융',
      labelEn: 'Finance',
      icon: '💰',
      ministry: '중기부/금융위',
      ministryEn: 'MSS/FSC',
      color: 'emerald',
      keywords: ['기보', '신보', '소진공', '융자', '보증', '기술평가'],
      outputs: ['신청서', '기술평가서', '보증서'],
      requiredFormat: 'DOCX',
      terminologyPath: 'generators/domain-engines/finance/terminology.json',
      styles: {
        badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
        badgeHover: 'hover:bg-emerald-500/20 hover:ring-emerald-500/30',
        iconBg: 'bg-emerald-500/10',
        accent: 'text-emerald-400',
      },
      metrics: {
        avgGenerationTime: 45,
        terminologyCount: 40,
        accuracyRate: 99.2,
      },
    },
    STARTUP: {
      id: 'STARTUP',
      label: '창업지원',
      shortLabel: '창업',
      labelEn: 'Startup',
      icon: '🚀',
      ministry: '중기부/창업진흥원',
      ministryEn: 'MSS/KISED',
      color: 'violet',
      keywords: ['TIPS', '액셀러레이팅', '창업', 'IR', '투자유치'],
      outputs: ['사업계획서', 'IR덱', '창업지원신청서'],
      requiredFormat: 'DOCX',
      terminologyPath: 'generators/domain-engines/startup/terminology.json',
      styles: {
        badge: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
        badgeHover: 'hover:bg-violet-500/20 hover:ring-violet-500/30',
        iconBg: 'bg-violet-500/10',
        accent: 'text-violet-400',
      },
      metrics: {
        avgGenerationTime: 60, // IR deck takes longer
        terminologyCount: 50,
        accuracyRate: 99.2,
      },
    },
    EXPORT: {
      id: 'EXPORT',
      label: '수출/글로벌',
      shortLabel: '수출',
      labelEn: 'Export',
      icon: '🌏',
      ministry: 'KOTRA/산업부',
      ministryEn: 'KOTRA/MOTIE',
      color: 'amber',
      keywords: ['수출', 'KOTRA', 'SAM.gov', 'UNGM', '글로벌입찰'],
      outputs: ['제안서초안', '수출바우처신청서', '입찰분석'],
      requiredFormat: 'DOCX',
      terminologyPath: 'generators/domain-engines/export/terminology.json',
      styles: {
        badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
        badgeHover: 'hover:bg-amber-500/20 hover:ring-amber-500/30',
        iconBg: 'bg-amber-500/10',
        accent: 'text-amber-400',
      },
      metrics: {
        avgGenerationTime: 60, // Translation takes longer
        terminologyCount: 80,
        accuracyRate: 99.2,
      },
    },
  }

// Inline commands available in the editor
export interface InlineCommand {
  id: string
  trigger: string
  label: string
  labelKo: string
  description: string
  descriptionKo: string
  icon: string
  availableFor: EnginePresetType[] | 'all'
}

export const INLINE_COMMANDS: InlineCommand[] = [
  {
    id: 'analyze',
    trigger: '/분석',
    label: 'Analyze',
    labelKo: '분석',
    description: 'Analyze selected text or document',
    descriptionKo: '선택 텍스트 또는 문서 분석',
    icon: '🔍',
    availableFor: 'all',
  },
  {
    id: 'summarize',
    trigger: '/요약',
    label: 'Summarize',
    labelKo: '요약',
    description: 'Summarize the document',
    descriptionKo: '문서 요약',
    icon: '📝',
    availableFor: 'all',
  },
  {
    id: 'translate',
    trigger: '/번역',
    label: 'Translate',
    labelKo: '번역',
    description: 'Translate to English (for international tenders)',
    descriptionKo: '영문 번역 (해외입찰용)',
    icon: '🌐',
    availableFor: ['EXPORT'],
  },
  {
    id: 'report',
    trigger: '/보고서',
    label: 'Generate Report',
    labelKo: '보고서',
    description: 'Generate report draft',
    descriptionKo: '보고서 초안 생성',
    icon: '📄',
    availableFor: 'all',
  },
  {
    id: 'verify',
    trigger: '/검증',
    label: 'Verify',
    labelKo: '검증',
    description: 'Verify hash chain integrity',
    descriptionKo: '해시체인 무결성 검증',
    icon: '✅',
    availableFor: 'all',
  },
  {
    id: 'terminology',
    trigger: '/용어',
    label: 'Terminology',
    labelKo: '용어',
    description: 'Check domain terminology',
    descriptionKo: '도메인 용어 확인',
    icon: '📖',
    availableFor: 'all',
  },
  // ===== 정부지원사업 관련 명령어 =====
  {
    id: 'rejection-analysis',
    trigger: '/탈락분석',
    label: 'Rejection Analysis',
    labelKo: '탈락분석',
    description: 'Analyze rejection reasons with Extended Thinking',
    descriptionKo: '탈락 사유 심층 분석 (AI 추론)',
    icon: '🧠',
    availableFor: 'all',
  },
  {
    id: 'pre-validate',
    trigger: '/사전검증',
    label: 'Pre-Validate',
    labelKo: '사전검증',
    description: 'Validate application before submission',
    descriptionKo: '신청서 제출 전 검증',
    icon: '✔️',
    availableFor: 'all',
  },
  {
    id: 'find-programs',
    trigger: '/프로그램찾기',
    label: 'Find Programs',
    labelKo: '프로그램찾기',
    description: 'Find matching government programs',
    descriptionKo: '적합 정부지원사업 매칭',
    icon: '🎯',
    availableFor: 'all',
  },
  {
    id: 'business-plan',
    trigger: '/사업계획서',
    label: 'Business Plan',
    labelKo: '사업계획서',
    description: 'Generate business plan draft',
    descriptionKo: '사업계획서 초안 생성',
    icon: '📋',
    availableFor: 'all',
  },
  {
    id: 'qetta-test',
    trigger: '/큐에타테스트',
    label: 'QETTA Test',
    labelKo: 'QETTA 테스트',
    description: 'Test skill engine with QETTA data',
    descriptionKo: 'QETTA 사업자료로 전체 테스트',
    icon: '🚀',
    availableFor: 'all',
  },
  // ===== 문서 열기 명령어 (한컴독스 연동) =====
  {
    id: 'open-in-browser',
    trigger: '/열기',
    label: 'Open in Browser',
    labelKo: '브라우저에서 열기',
    description: 'Open generated document in web viewer (Hancom Docs)',
    descriptionKo: '생성된 문서를 웹 뷰어에서 열기 (한컴독스)',
    icon: '🌐',
    availableFor: 'all',
  },
  {
    id: 'qetta-metrics',
    trigger: '/핵심수치',
    label: 'QETTA Metrics',
    labelKo: '핵심수치',
    description: 'Show QETTA core metrics from super-model',
    descriptionKo: 'QETTA 핵심 수치 (슈퍼모델 기반)',
    icon: '📊',
    availableFor: 'all',
  },
  // ===== 기업마당 API 연동 =====
  {
    id: 'bizinfo-search',
    trigger: '/공고검색',
    label: 'Search Announcements',
    labelKo: '공고검색',
    description: 'Search government support program announcements (BizInfo API)',
    descriptionKo: '정부지원사업 공고 검색 (기업마당 API)',
    icon: '🔎',
    availableFor: 'all',
  },
  {
    id: 'bizinfo-active',
    trigger: '/접수중',
    label: 'Active Programs',
    labelKo: '접수중',
    description: 'Show currently active program announcements',
    descriptionKo: '현재 접수 중인 공고 조회',
    icon: '📢',
    availableFor: 'all',
  },
]

// Helper functions
export function getDomainConfig(
  domain: EnginePresetType
): EnginePresetConfig {
  return DOMAIN_ENGINE_CONFIGS[domain]
}

export function getInlineCommandsForDomain(
  domain: EnginePresetType
): InlineCommand[] {
  return INLINE_COMMANDS.filter(
    (cmd) => cmd.availableFor === 'all' || cmd.availableFor.includes(domain)
  )
}

export function getDomainByKeyword(keyword: string): EnginePresetType | null {
  const normalizedKeyword = keyword.toLowerCase()
  for (const [domainId, config] of Object.entries(DOMAIN_ENGINE_CONFIGS)) {
    if (
      config.keywords.some((k) => k.toLowerCase().includes(normalizedKeyword))
    ) {
      return domainId as EnginePresetType
    }
  }
  return null
}
