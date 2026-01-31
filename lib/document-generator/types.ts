/**
 * Document Generator Types
 *
 * QETTA 문서 생성기 타입 정의
 *
 * @module document-generator/types
 */

import type { EnginePresetType } from '@/types/inbox'

// ============================================
// 문서 유형
// ============================================

export type DocumentFormat = 'DOCX' | 'XLSX' | 'PDF' | 'HWP'

export type DocumentType = 'document' | 'report' | 'analysis'

export interface DocumentConfig {
  title: string
  format: DocumentFormat
  type: DocumentType
  template?: string
}

// ============================================
// 생성 요청/결과
// ============================================

export interface GenerateDocumentRequest {
  enginePreset: EnginePresetType
  documentType: string
  data?: Record<string, unknown>
  metadata?: {
    companyName?: string
    reportDate?: string
    period?: {
      start: string
      end: string
    }
  }
}

export interface GeneratedDocument {
  id: string
  buffer: Buffer
  filename: string
  mimeType: string
  format: DocumentFormat
  hashChain: string
  createdAt: Date
  metadata: DocumentMetadata
}

export interface DocumentMetadata {
  enginePreset: EnginePresetType
  documentType: string
  title: string
  generationTimeMs: number
  sizeBytes: number
}

// ============================================
// 도메인별 문서 설정
// ============================================

export const DOCUMENT_CONFIGS: Record<EnginePresetType, Record<string, DocumentConfig>> = {
  ENVIRONMENT: {
    daily_report: {
      title: 'TMS 일일보고서',
      format: 'DOCX',
      type: 'report',
    },
    monthly_report: {
      title: 'TMS 월간보고서',
      format: 'DOCX',
      type: 'report',
    },
    measurement_record: {
      title: '측정기록부',
      format: 'XLSX',
      type: 'document',
    },
    emission_analysis: {
      title: '배출량 분석',
      format: 'PDF',
      type: 'analysis',
    },
  },
  MANUFACTURING: {
    settlement_report: {
      title: '스마트공장 정산보고서',
      format: 'DOCX',
      type: 'report',
    },
    equipment_history: {
      title: '설비이력 보고서',
      format: 'XLSX',
      type: 'document',
    },
    quality_analysis: {
      title: '품질분석 리포트',
      format: 'PDF',
      type: 'analysis',
    },
    oee_report: {
      title: '설비종합효율(OEE) 보고서',
      format: 'XLSX',
      type: 'report',
    },
  },
  DIGITAL: {
    performance_report: {
      title: 'AI 바우처 실적보고서',
      format: 'DOCX',
      type: 'report',
    },
    matching_analysis: {
      title: '매칭분석 리포트',
      format: 'PDF',
      type: 'analysis',
    },
    settlement: {
      title: '정산서',
      format: 'XLSX',
      type: 'document',
    },
    supplier_portfolio: {
      title: '공급기업 포트폴리오',
      format: 'DOCX',
      type: 'document',
    },
  },
  EXPORT: {
    proposal_draft: {
      title: '제안서 초안',
      format: 'DOCX',
      type: 'document',
    },
    tender_analysis: {
      title: '입찰 분석',
      format: 'PDF',
      type: 'analysis',
    },
    matching_report: {
      title: '매칭 리포트',
      format: 'PDF',
      type: 'report',
    },
    compliance_checklist: {
      title: '요건 체크리스트',
      format: 'XLSX',
      type: 'document',
    },
  },
  FINANCE: {
    application: {
      title: '융자/보증 신청서',
      format: 'DOCX',
      type: 'document',
    },
  },
  STARTUP: {
    business_plan: {
      title: 'TIPS 사업계획서',
      format: 'DOCX',
      type: 'document',
    },
  },
}

// ============================================
// MIME 타입 매핑
// ============================================

export const FORMAT_MIME_TYPES: Record<DocumentFormat, string> = {
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PDF: 'application/pdf',
  HWP: 'application/x-hwp',
}

export const FORMAT_EXTENSIONS: Record<DocumentFormat, string> = {
  DOCX: '.docx',
  XLSX: '.xlsx',
  PDF: '.pdf',
  HWP: '.hwp',
}

// ============================================
// 에러
// ============================================

export class DocumentGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly enginePreset?: EnginePresetType,
    public readonly documentType?: string
  ) {
    super(message)
    this.name = 'DocumentGenerationError'
  }
}

export const DOC_ERROR_CODES = {
  INVALID_DOMAIN: 'INVALID_DOMAIN',
  INVALID_TYPE: 'INVALID_TYPE',
  GENERATION_FAILED: 'GENERATION_FAILED',
  HASH_FAILED: 'HASH_FAILED',
} as const

// ============================================
// Preview Types (BATCH 1: Types Foundation)
// ============================================

// STEP 1.1: Re-export EnginePresetType for convenience
export type { EnginePresetType } from '@/types/inbox'

// STEP 1.2: PreviewDocument 인터페이스
export interface PreviewDocument {
  /** 고유 식별자 (UUID v4) */
  id: string

  /** 렌더링된 완전한 HTML 문서 (<!DOCTYPE html> 포함) */
  html: string

  /** 문서 유형 (예: 'daily_report', 'settlement') */
  documentType: string

  /** 도메인 엔진 타입 */
  enginePreset: EnginePresetType

  /** 생성 시각 */
  generatedAt: Date

  /** 만료 시각 (30분 TTL) */
  expiresAt: Date

  /** 원본 문서 메타데이터 */
  metadata: PreviewMetadata
}

export interface PreviewMetadata {
  createdAt: Date
  version: string
  companyName?: string
  reportDate?: string
}

// STEP 1.3: ViewMode 타입 (editor.tsx에서 사용)
export type ViewMode = 'view' | 'edit' | 'generate' | 'preview' | 'hancomdocs'

// STEP 1.4: Preview 캐시 엔트리 (메모리 캐시용)
export interface PreviewCacheEntry {
  preview: PreviewDocument
  cachedAt: number // Date.now() timestamp
}

// 캐시 TTL 상수 (30분)
export const PREVIEW_CACHE_TTL_MS = 30 * 60 * 1000
