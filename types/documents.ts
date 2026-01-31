/**
 * Document Types
 *
 * Centralized type definitions for document APIs
 *
 * @module types/documents
 */

import type { EnginePresetType } from '@/types/inbox'

// =============================================================================
// Document Status & Type
// =============================================================================

export type DocumentStatus = 'processing' | 'pending' | 'completed' | 'warning' | 'error'
export type DocumentType = 'request' | 'report' | 'proposal' | 'certificate' | 'checklist'

// =============================================================================
// Document Info
// =============================================================================

export interface DocumentMetadata {
  /** 우선순위 */
  priority?: 'critical' | 'high' | 'medium' | 'low'
  /** 담당자 */
  assignee?: string
  /** 생성 일시 */
  createdAt?: string
  /** 마감일 */
  deadline?: string
  /** 파일 크기 */
  fileSize?: string
  /** 해시값 (검증용) */
  hash?: string
  /** 문서 버전 */
  version?: number
  /** 부모 문서 ID (이전 버전) */
  parentDocumentId?: string
}

export interface DocumentInfo {
  /** 문서 ID */
  id: string
  /** 문서 제목 */
  title: string
  /** 문서 유형 */
  type: DocumentType
  /** 처리 상태 */
  status: DocumentStatus
  /** 도메인 엔진 */
  domain: EnginePresetType
  /** 요약 */
  summary: string
  /** 메타데이터 */
  metadata?: DocumentMetadata
}

export interface DocumentsResponse {
  success: boolean
  data?: {
    documents: DocumentInfo[]
    total: number
    byStatus: Record<DocumentStatus, number>
    byDomain: Record<EnginePresetType, number>
  }
  document?: DocumentInfo
  error?: {
    code: string
    message: string
  }
}

// =============================================================================
// Verify Types (from verify routes)
// =============================================================================

export type VerifyStatus = 'verified' | 'pending' | 'failed'

export interface VerifiedDocument {
  id: string
  documentHash: string
  previousHash: string | null
  timestamp: string
  metadata: {
    documentId: string
    documentType: string
    enginePreset: string
    filename: string
  }
  chainPosition: number
}

export interface VerifySensorReading {
  type: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
}

export interface VerifyDocumentInfo {
  id: string
  title: string
  type: string
  status: string
  domain: string
  createdAt: string
  verifiedAt?: string
}

export interface HashChainBlock {
  index: number
  timestamp: string
  dataHash: string
  previousHash: string
  nonce: number
  verified: boolean
  metadata?: {
    documentId?: string
    documentType?: string
    changes?: string[]
  }
}

export interface VerifyResponse {
  success: boolean
  data?: {
    document: VerifyDocumentInfo
    sensors: VerifySensorReading[]
    hashChain: HashChainBlock[]
    integrity: {
      isValid: boolean
      lastVerified: string
      chainLength: number
    }
  }
  error?: {
    code: string
    message: string
  }
}
