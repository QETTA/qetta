import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'
import type { ArtifactReference } from '@/stores/ai-panel-store'
import type { UserIntent } from '@/lib/ai/intelligent-context'
import type { MetricBlockAttributes } from '@/components/editor'
import type {
  RejectionAnalysisResult,
  ValidationResult,
  ProgramMatch,
  QettaMetrics,
  QettaTestResult,
  BizInfoSearchResultData,
} from './skill-blocks'

export interface SkillResult {
  type: 'rejection-analysis' | 'validation' | 'program-match' | 'qetta-test' | 'qetta-metrics' | 'bizinfo-search'
  data: RejectionAnalysisResult | ValidationResult | ProgramMatch[] | QettaTestResult | QettaMetrics | BizInfoSearchResultData
  programName?: string // For validation result
  keyword?: string // For bizinfo search
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  artifact?: ArtifactReference
  intent?: UserIntent
  metrics?: MetricBlockAttributes[]
  skillResult?: SkillResult
}

// QETTA Core Metrics (from super-model)
export const QETTA_METRICS: Record<string, MetricBlockAttributes[]> = {
  docs: [
    { value: DISPLAY_METRICS.timeSaved.value, label: 'Time Reduction', detail: DISPLAY_METRICS.timeSaved.detailEn, trend: 'up', domain: 'DIGITAL' },
    { value: DISPLAY_METRICS.docSpeed.valueEn, label: 'Per Document', detail: 'API speed', domain: 'DIGITAL' },
  ],
  verify: [
    { value: DISPLAY_METRICS.apiUptime.value, label: 'API Uptime', detail: DISPLAY_METRICS.apiUptime.detailEn, trend: 'neutral', domain: 'DIGITAL' },
    { value: DISPLAY_METRICS.termAccuracy.value, label: 'Term Accuracy', detail: `${STRUCTURE_METRICS.terminologyMappings} term mapping`, domain: 'DIGITAL' },
  ],
  apply: [
    { value: '630K+', label: 'Global Tenders', detail: DISPLAY_METRICS.globalTenders.detailEn, domain: 'EXPORT' },
    { value: DISPLAY_METRICS.rejectionReduction.value, label: 'Rejection Reduced', detail: 'Document quality', trend: 'up', domain: 'EXPORT' },
  ],
}

// Detect if message contains metric-related keywords
export function detectMetricContext(content: string): MetricBlockAttributes[] | null {
  const lowerContent = content.toLowerCase()

  if (lowerContent.includes('시간 단축') || lowerContent.includes('time') || lowerContent.includes('93.8')) {
    return QETTA_METRICS.docs
  }
  if (lowerContent.includes('검증') || lowerContent.includes('verify') || lowerContent.includes('99.9')) {
    return QETTA_METRICS.verify
  }
  if (lowerContent.includes('입찰') || lowerContent.includes('tender') || lowerContent.includes('63만')) {
    return QETTA_METRICS.apply
  }

  return null
}

// Document type mappings
export const DOMAIN_DOCUMENT_TYPES: Record<string, Record<string, string>> = {
  TMS: {
    '일일보고서': 'daily_report',
    '월간보고서': 'monthly_report',
    '측정기록부': 'measurement_record',
  },
  SMART_FACTORY: {
    '정산보고서': 'settlement_report',
    '설비이력 보고서': 'equipment_history',
    '품질분석 리포트': 'quality_analysis',
  },
  AI_VOUCHER: {
    '실적보고서': 'performance_report',
    '매칭분석 리포트': 'matching_analysis',
    '정산서': 'settlement',
  },
  GLOBAL_TENDER: {
    '제안서 초안': 'proposal_draft',
    '입찰 분석': 'tender_analysis',
    '매칭 리포트': 'matching_report',
  },
}

// Check if message is a document request
export function isDocumentRequest(content: string): string | null {
  const patterns = [
    /(.+?)\s*작성해\s*줘/,
    /(.+?)\s*생성해\s*줘/,
    /(.+?)\s*만들어\s*줘/,
  ]
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) return match[1].trim()
  }
  return null
}
