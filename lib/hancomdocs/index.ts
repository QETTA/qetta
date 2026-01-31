/**
 * 한컴독스 API 모듈
 *
 * QETTA 도메인 엔진과 한컴독스 웹 연동
 *
 * 주요 기능:
 * - 문서 업로드 및 웹 뷰어 URL 생성
 * - 인웹뷰 (iframe) 임베드
 * - OAuth2.0 인증
 *
 * API 키:
 * - App: Qetta-DOCS
 * - Client ID: BLEWPvrWbHM1CbSAsE36
 * - Status: 심사 중
 *
 * @module hancomdocs
 */

import { logger } from '@/lib/api/logger'

// Types
export * from './types'

// Client
export {
  getAccessToken,
  clearTokenCache,
  uploadDocument,
  generateLocalViewerUrl,
  generateViewerUrl,
  generateEmbedUrl,
  listDocuments,
  getDocument,
  deleteDocument,
  checkConnection,
  HancomApiError,
} from './client'

// ============================================
// 통합 파이프라인 함수
// ============================================

import { uploadDocument, generateLocalViewerUrl } from './client'
import type { HancomUploadResponse, HancomDocumentFormat } from './types'

export interface DocumentPipelineInput {
  buffer: Buffer
  filename: string
  format?: HancomDocumentFormat
  description?: string
}

export interface DocumentPipelineResult {
  success: boolean
  documentId?: string
  viewerUrl?: string
  editUrl?: string
  downloadUrl?: string
  localPath?: string
  webUploadUrl?: string
  error?: string
  mode: 'api' | 'local'
}

/**
 * 문서 생성 → 한컴독스 파이프라인
 *
 * API가 승인되면 자동 업로드, 그렇지 않으면 로컬 모드로 폴백
 *
 * @example
 * ```ts
 * import { generateDocument } from '@/lib/document-generator'
 * import { processDocumentPipeline } from '@/lib/hancomdocs'
 *
 * // 문서 생성
 * const doc = await generateDocument({
 *   enginePreset: 'ENVIRONMENT',
 *   documentType: 'daily_report',
 *   metadata: { ... }
 * })
 *
 * // 한컴독스 연동
 * const result = await processDocumentPipeline({
 *   buffer: doc.buffer,
 *   filename: doc.filename,
 * })
 *
 * if (result.mode === 'api') {
 *   // 웹 뷰어 URL로 iframe 렌더링
 *   window.open(result.viewerUrl)
 * } else {
 *   // 로컬 파일 다운로드 후 수동 업로드 안내
 *   download(result.localPath)
 * }
 * ```
 */
export async function processDocumentPipeline(
  input: DocumentPipelineInput
): Promise<DocumentPipelineResult> {
  try {
    // API 업로드 시도
    const uploadResult: HancomUploadResponse = await uploadDocument({
      file: input.buffer,
      filename: input.filename,
      format: input.format,
      description: input.description,
    })

    if (uploadResult.success && uploadResult.document) {
      return {
        success: true,
        documentId: uploadResult.document.id,
        viewerUrl: uploadResult.viewerUrl,
        editUrl: uploadResult.editUrl,
        downloadUrl: uploadResult.document.downloadUrl,
        mode: 'api',
      }
    }

    // API 실패 시 로컬 모드로 폴백
    logger.warn('[Hancomdocs] API upload failed, falling back to local mode:', uploadResult.error)
    return fallbackToLocalMode(input)
  } catch (error) {
    // 에러 시 로컬 모드로 폴백
    logger.warn('[Hancomdocs] API error, falling back to local mode:', error)
    return fallbackToLocalMode(input)
  }
}

/**
 * 로컬 모드 폴백
 */
function fallbackToLocalMode(input: DocumentPipelineInput): DocumentPipelineResult {
  const localPath = `/tmp/${input.filename}`
  const { webUploadUrl } = generateLocalViewerUrl(input.filename, localPath)

  return {
    success: true,
    localPath,
    webUploadUrl,
    mode: 'local',
  }
}

// ============================================
// 상태 상수
// ============================================

export const HANCOM_API_STATUS = {
  appName: 'Qetta-DOCS',
  clientId: 'BLEWPvrWbHM1CbSAsE36',
  owner: 'qetta.ai@gmail.com',
  status: 'pending_review', // 'pending_review' | 'approved' | 'rejected'
  registeredAt: '2026-01-20',
  reviewRequestedAt: '2026-01-22',
} as const
