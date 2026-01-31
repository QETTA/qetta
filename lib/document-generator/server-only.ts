/**
 * Server-Only Document Generator Exports
 *
 * 이 모듈은 서버에서만 사용 가능합니다.
 * 클라이언트에서 import 시 빌드 에러가 발생합니다.
 *
 * pdf-lib(24MB) + exceljs(23MB) + docx(3.3MB) = 50MB가
 * 클라이언트 번들에 포함되지 않도록 보장합니다.
 *
 * @example
 * ```ts
 * // API Route에서 사용
 * import { generateDocument } from '@/lib/document-generator/server-only'
 *
 * export async function POST(request: Request) {
 *   const doc = await generateDocument({ ... })
 *   return new Response(doc.buffer)
 * }
 * ```
 *
 * @module document-generator/server-only
 */

import 'server-only'

// ============================================
// 서버 전용 문서 생성 함수
// ============================================

export { generateDocument, getAvailableDocumentTypes, getMimeType, getExtension } from './index'

// 개별 생성기 (서버 전용)
export { generateDocx } from './docx-generator'
export { generateXlsx } from './xlsx-generator'
export { generatePdf } from './pdf-generator'

// HTML 프리뷰 (서버에서 렌더링)
export { generateHtmlPreview, getCachedPreview, cachePreview, clearExpiredPreviews } from './html-preview-generator'

// 해시 체인 DB (Prisma 사용)
export {
  persistHashChainEntry,
  getHashChainEntryFromDB,
  getAllHashChainEntriesFromDB,
} from './hash-chain-db'

// ============================================
// 타입 (클라이언트에서도 사용 가능)
// ============================================

export type {
  DocumentFormat,
  DocumentType,
  DocumentConfig,
  GenerateDocumentRequest,
  GeneratedDocument,
  DocumentMetadata,
  PreviewDocument,
  PreviewMetadata,
  ViewMode,
  PreviewCacheEntry,
} from './types'

// 상수 (클라이언트에서도 사용 가능)
export { DOCUMENT_CONFIGS, FORMAT_MIME_TYPES, FORMAT_EXTENSIONS, PREVIEW_CACHE_TTL_MS } from './types'
