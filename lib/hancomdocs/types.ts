/**
 * 한컴독스 API 타입 정의
 *
 * OAuth2.0 기반 한컴독스 웹 API 연동
 *
 * @module hancomdocs/types
 */

// ============================================
// OAuth 인증
// ============================================

export interface HancomOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri?: string
  scope?: string[]
}

export interface HancomAccessToken {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token?: string
  scope?: string
  issued_at: number // 토큰 발급 시각 (Unix timestamp)
}

// ============================================
// 문서 관련
// ============================================

export type HancomDocumentFormat = 'hwp' | 'hwpx' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'pdf'

export interface HancomDocument {
  id: string
  name: string
  format: HancomDocumentFormat
  size: number
  createdAt: string
  updatedAt: string
  ownerId: string
  viewUrl?: string
  editUrl?: string
  downloadUrl?: string
  thumbnailUrl?: string
}

export interface HancomUploadRequest {
  file: Buffer | File
  filename: string
  format?: HancomDocumentFormat
  folderId?: string
  description?: string
}

export interface HancomUploadResponse {
  success: boolean
  document?: HancomDocument
  viewerUrl?: string
  editUrl?: string
  error?: string
}

// ============================================
// 뷰어/에디터 관련
// ============================================

export type HancomViewerMode = 'view' | 'edit' | 'comment'

export interface HancomViewerConfig {
  mode: HancomViewerMode
  showToolbar?: boolean
  showSidebar?: boolean
  theme?: 'light' | 'dark'
  locale?: 'ko' | 'en' | 'ja' | 'zh'
  allowDownload?: boolean
  allowPrint?: boolean
  watermark?: string
}

export interface HancomViewerUrl {
  url: string
  expiresAt: string
  mode: HancomViewerMode
}

// ============================================
// API 응답
// ============================================

export interface HancomApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export interface HancomDocumentList {
  documents: HancomDocument[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================
// 이벤트 (PostMessage)
// ============================================

export type HancomViewerEventType =
  | 'ready'
  | 'loaded'
  | 'error'
  | 'save'
  | 'close'
  | 'print'
  | 'download'
  | 'pageChange'
  | 'selectionChange'

export interface HancomViewerEvent {
  type: HancomViewerEventType
  documentId: string
  data?: Record<string, unknown>
  timestamp: number
}

// ============================================
// 에러 코드
// ============================================

export const HANCOM_ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_FORMAT: 'INVALID_FORMAT',
} as const

export type HancomErrorCode = (typeof HANCOM_ERROR_CODES)[keyof typeof HANCOM_ERROR_CODES]

// ============================================
// 상수
// ============================================

export const HANCOM_API_BASE_URL = 'https://api.hancomdocs.com'
export const HANCOM_AUTH_URL = 'https://accounts.hancom.com/oauth2'
export const HANCOM_VIEWER_BASE_URL = 'https://docs.hancomdocs.com'

export const HANCOM_SUPPORTED_FORMATS: HancomDocumentFormat[] = [
  'hwp',
  'hwpx',
  'docx',
  'doc',
  'xlsx',
  'xls',
  'pptx',
  'ppt',
  'pdf',
]

export const HANCOM_FORMAT_MIME_TYPES: Record<HancomDocumentFormat, string> = {
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  pdf: 'application/pdf',
}
