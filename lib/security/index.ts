/**
 * QETTA Security Module
 *
 * 보안 관련 유틸리티 모음
 *
 * @module security
 */

// ============================================
// Input Sanitization (XSS Prevention)
// ============================================

export {
  // HTML 살균
  sanitizeHtml,
  stripHtml,
  sanitizeMarkdown,

  // URL 살균
  sanitizeUrl,
  isUrlSafe,

  // 파일명 살균
  sanitizeFilename,
  hasAllowedExtension,

  // 식별자 검증
  isValidIdentifier,
  sanitizeIdentifier,

  // JSON 파싱
  safeJsonParse,

  // 문자열 이스케이프
  escapeHtml,
  escapeRegex,

  // 정규화
  normalizeString,
  normalizeEmail,

  // Zod 스키마
  sanitizedString,
  normalizedString,
  sanitizedHtmlSchema,
  safeUrlSchema,
  safeFilenameSchema,
  normalizedEmailSchema,

  // 상수
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  DANGEROUS_PROTOCOLS,
  SAFE_PROTOCOLS,
} from './sanitize'

// ============================================
// CSRF Protection
// ============================================

export {
  // 토큰 생성 및 관리
  generateCsrfToken,
  setCsrfToken,
  getCsrfToken,
  clearCsrfToken,

  // 토큰 추출 및 검증
  extractCsrfToken,
  verifyCsrfToken,

  // 미들웨어
  csrfProtection,
  withCsrfProtection,

  // 클라이언트 헬퍼
  getCsrfFetchOptions,
  createCsrfFormData,

  // 상수
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_FORM_FIELD,
  CSRF_TOKEN_TTL,

  // 타입
  type CsrfVerificationResult,
  type CsrfProtectionOptions,
} from './csrf'
