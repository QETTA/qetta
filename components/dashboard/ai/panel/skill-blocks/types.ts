/**
 * Skill Engine Result Block Types
 */

export interface RejectionPattern {
  category: string
  frequency: 'high' | 'medium' | 'low'
  description: string
  prevention: string
}

export interface RejectionAnalysisResult {
  overallRisk: 'high' | 'medium' | 'low'
  patterns: RejectionPattern[]
  suggestions: string[]
  thinking?: string // Extended Thinking 결과
}

export interface ValidationResult {
  score: number
  warnings: string[]
  suggestions: string[]
  rejectionRisks: string[]
}

export interface ProgramMatch {
  program: {
    id: string
    name: string
    nameEn: string
    category: string
    stage: string[]
    support: {
      maxAmount: number
      duration: number
    }
  }
  matchScore: number
  eligibilityIssues: string[]
}

export interface QettaMetrics {
  timeReduction: { value: string; label: string; detail: string }
  rejectionReduction: { value: string; label: string; detail: string }
  docSpeed: { value: string; label: string; detail: string }
  apiUptime: { value: string; label: string; detail: string }
  termAccuracy: { value: string; label: string; detail: string }
  globalTenderDB: { value: string; label: string; detail: string }
}

export interface QettaTestResult {
  companyProfile: {
    name: string
    basic: {
      region: string
      industry: string
      employees: number
    }
  }
  metrics: QettaMetrics
  results: {
    matchedPrograms: Array<{
      program: string
      matchScore: number
      issues: string[]
    }>
    validation: {
      score: number
      warnings: string[]
      suggestions: string[]
      rejectionRisks: string[]
    }
    businessPlan: {
      wordCount: number
      preview: string
    }
  }
}

export interface BizInfoAnnouncement {
  id: string
  title: string
  agency: string
  field?: string
  region?: string
  status: 'upcoming' | 'open' | 'closed' | 'unknown'
  applicationPeriod: {
    start: string | null
    end: string | null
  }
  sourceUrl: string
}

export interface BizInfoSearchResultData {
  announcements: BizInfoAnnouncement[]
  totalCount: number
  currentPage: number
  totalPages: number
  searchedAt: string
  fromCache?: boolean
}
