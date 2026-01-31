/**
 * 한컴독스 API 클라이언트
 *
 * OAuth2.0 기반 한컴독스 웹 API 연동
 * - 문서 업로드
 * - 웹 뷰어 URL 생성
 * - 문서 관리
 *
 * API 키:
 * - Client ID: BLEWPvrWbHM1CbSAsE36
 * - Client Secret: (환경변수에서 로드)
 *
 * @module hancomdocs/client
 */

import type {
  HancomOAuthConfig,
  HancomAccessToken,
  HancomDocument,
  HancomUploadRequest,
  HancomUploadResponse,
  HancomViewerConfig,
  HancomViewerUrl,
  HancomApiResponse,
  HancomDocumentList,
  HancomDocumentFormat,
  HancomErrorCode,
} from './types'

import {
  HANCOM_API_BASE_URL,
  HANCOM_AUTH_URL,
  HANCOM_VIEWER_BASE_URL,
  HANCOM_ERROR_CODES,
  HANCOM_FORMAT_MIME_TYPES,
} from './types'

// ============================================
// 환경 설정
// ============================================

const getConfig = (): HancomOAuthConfig => ({
  clientId: process.env.HANCOM_CLIENT_ID || process.env.NEXT_PUBLIC_HANCOM_CLIENT_ID || '',
  clientSecret: process.env.HANCOM_CLIENT_SECRET || '',
  redirectUri: process.env.HANCOM_REDIRECT_URI || 'http://localhost:3000/api/hancom/callback',
  scope: ['document.read', 'document.write', 'document.share'],
})

// 토큰 캐시 (메모리)
let cachedToken: HancomAccessToken | null = null

// ============================================
// OAuth 인증
// ============================================

/**
 * Client Credentials Grant로 액세스 토큰 획득
 */
export async function getAccessToken(): Promise<HancomAccessToken> {
  const config = getConfig()

  if (!config.clientId || !config.clientSecret) {
    throw new HancomApiError(
      HANCOM_ERROR_CODES.AUTH_FAILED,
      'Hancom API credentials not configured. Set HANCOM_CLIENT_ID and HANCOM_CLIENT_SECRET.'
    )
  }

  // 캐시된 토큰이 유효한지 확인
  if (cachedToken && isTokenValid(cachedToken)) {
    return cachedToken
  }

  try {
    const response = await fetch(`${HANCOM_AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: config.scope?.join(' ') || 'document.read document.write',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new HancomApiError(
        HANCOM_ERROR_CODES.AUTH_FAILED,
        errorData.error_description || 'Authentication failed'
      )
    }

    const tokenData = await response.json()
    const newToken: HancomAccessToken = {
      ...tokenData,
      issued_at: Date.now(),
    }
    cachedToken = newToken

    return newToken
  } catch (error) {
    if (error instanceof HancomApiError) throw error
    throw new HancomApiError(
      HANCOM_ERROR_CODES.NETWORK_ERROR,
      `Failed to obtain access token: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 토큰 유효성 검사
 */
function isTokenValid(token: HancomAccessToken): boolean {
  const expiresAt = token.issued_at + token.expires_in * 1000
  const bufferTime = 60 * 1000 // 1분 버퍼
  return Date.now() < expiresAt - bufferTime
}

/**
 * 토큰 캐시 초기화
 */
export function clearTokenCache(): void {
  cachedToken = null
}

// ============================================
// 문서 업로드
// ============================================

/**
 * 문서 업로드 및 웹 뷰어 URL 생성
 */
export async function uploadDocument(request: HancomUploadRequest): Promise<HancomUploadResponse> {
  try {
    const token = await getAccessToken()

    // FormData 생성
    const formData = new FormData()

    if (request.file instanceof Buffer) {
      // Node.js Buffer → Uint8Array → Blob
      const uint8Array = new Uint8Array(request.file)
      const blob = new Blob([uint8Array], {
        type: getFormatMimeType(request.format || detectFormat(request.filename)),
      })
      formData.append('file', blob, request.filename)
    } else if (request.file instanceof File) {
      // Browser File object
      formData.append('file', request.file)
    } else {
      throw new HancomApiError(
        HANCOM_ERROR_CODES.INVALID_FORMAT,
        'Invalid file type: expected Buffer or File'
      )
    }

    if (request.folderId) {
      formData.append('folderId', request.folderId)
    }
    if (request.description) {
      formData.append('description', request.description)
    }

    const response = await fetch(`${HANCOM_API_BASE_URL}/v1/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `Upload failed with status ${response.status}`,
      }
    }

    const data: HancomApiResponse<HancomDocument> = await response.json()

    if (!data.success || !data.data) {
      return {
        success: false,
        error: data.error?.message || 'Upload failed',
      }
    }

    // 뷰어 URL 생성
    const viewerUrl = await generateViewerUrl(data.data.id, { mode: 'view' })

    return {
      success: true,
      document: data.data,
      viewerUrl: viewerUrl.url,
      editUrl: `${HANCOM_VIEWER_BASE_URL}/edit/${data.data.id}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 로컬 폴백: 한컴독스 웹으로 직접 업로드 URL 생성
 * (API 심사 승인 전 사용)
 */
export function generateLocalViewerUrl(
  _filename: string,
  localPath: string
): { webUploadUrl: string; localPath: string } {
  return {
    webUploadUrl: `${HANCOM_VIEWER_BASE_URL}/ko/home`,
    localPath,
  }
}

// ============================================
// 뷰어 URL 생성
// ============================================

/**
 * 문서 뷰어/에디터 URL 생성
 */
export async function generateViewerUrl(
  documentId: string,
  config: HancomViewerConfig
): Promise<HancomViewerUrl> {
  const token = await getAccessToken()

  const response = await fetch(`${HANCOM_API_BASE_URL}/v1/documents/${documentId}/viewer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: config.mode,
      showToolbar: config.showToolbar ?? true,
      showSidebar: config.showSidebar ?? true,
      theme: config.theme ?? 'light',
      locale: config.locale ?? 'ko',
      allowDownload: config.allowDownload ?? true,
      allowPrint: config.allowPrint ?? true,
      watermark: config.watermark,
    }),
  })

  if (!response.ok) {
    throw new HancomApiError(
      HANCOM_ERROR_CODES.SERVER_ERROR,
      `Failed to generate viewer URL: ${response.status}`
    )
  }

  const data: HancomApiResponse<HancomViewerUrl> = await response.json()

  if (!data.success || !data.data) {
    throw new HancomApiError(
      HANCOM_ERROR_CODES.SERVER_ERROR,
      data.error?.message || 'Failed to generate viewer URL'
    )
  }

  return data.data
}

/**
 * 임베드용 iframe URL 생성
 */
export function generateEmbedUrl(documentId: string, mode: 'view' | 'edit' = 'view'): string {
  return `${HANCOM_VIEWER_BASE_URL}/embed/${documentId}?mode=${mode}`
}

// ============================================
// 문서 관리
// ============================================

/**
 * 문서 목록 조회
 */
export async function listDocuments(
  page: number = 1,
  pageSize: number = 20
): Promise<HancomDocumentList> {
  const token = await getAccessToken()

  const response = await fetch(
    `${HANCOM_API_BASE_URL}/v1/documents?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    }
  )

  if (!response.ok) {
    throw new HancomApiError(
      HANCOM_ERROR_CODES.SERVER_ERROR,
      `Failed to list documents: ${response.status}`
    )
  }

  const data: HancomApiResponse<HancomDocumentList> = await response.json()

  if (!data.success || !data.data) {
    throw new HancomApiError(
      HANCOM_ERROR_CODES.SERVER_ERROR,
      data.error?.message || 'Failed to list documents'
    )
  }

  return data.data
}

/**
 * 문서 상세 조회
 */
export async function getDocument(documentId: string): Promise<HancomDocument> {
  const token = await getAccessToken()

  const response = await fetch(`${HANCOM_API_BASE_URL}/v1/documents/${documentId}`, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new HancomApiError(HANCOM_ERROR_CODES.DOCUMENT_NOT_FOUND, 'Document not found')
    }
    throw new HancomApiError(
      HANCOM_ERROR_CODES.SERVER_ERROR,
      `Failed to get document: ${response.status}`
    )
  }

  const data: HancomApiResponse<HancomDocument> = await response.json()

  if (!data.success || !data.data) {
    throw new HancomApiError(
      HANCOM_ERROR_CODES.SERVER_ERROR,
      data.error?.message || 'Failed to get document'
    )
  }

  return data.data
}

/**
 * 문서 삭제
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const token = await getAccessToken()

  const response = await fetch(`${HANCOM_API_BASE_URL}/v1/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  })

  return response.ok
}

// ============================================
// 유틸리티
// ============================================

/**
 * 파일 확장자에서 형식 감지
 */
function detectFormat(filename: string): HancomDocumentFormat {
  const ext = filename.split('.').pop()?.toLowerCase()
  const formatMap: Record<string, HancomDocumentFormat> = {
    hwp: 'hwp',
    hwpx: 'hwpx',
    docx: 'docx',
    doc: 'doc',
    xlsx: 'xlsx',
    xls: 'xls',
    pptx: 'pptx',
    ppt: 'ppt',
    pdf: 'pdf',
  }
  return formatMap[ext || ''] || 'docx'
}

/**
 * 형식에서 MIME 타입 조회
 */
function getFormatMimeType(format: HancomDocumentFormat): string {
  return HANCOM_FORMAT_MIME_TYPES[format]
}

// ============================================
// 에러 클래스
// ============================================

export class HancomApiError extends Error {
  code: HancomErrorCode

  constructor(code: HancomErrorCode, message: string) {
    super(message)
    this.name = 'HancomApiError'
    this.code = code
  }
}

// ============================================
// 연결 상태 확인
// ============================================

/**
 * API 연결 상태 확인
 */
export async function checkConnection(): Promise<{
  connected: boolean
  authenticated: boolean
  error?: string
}> {
  const config = getConfig()

  if (!config.clientId || !config.clientSecret) {
    return {
      connected: false,
      authenticated: false,
      error: 'API credentials not configured',
    }
  }

  try {
    await getAccessToken()
    return {
      connected: true,
      authenticated: true,
    }
  } catch (error) {
    return {
      connected: true,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }
  }
}
