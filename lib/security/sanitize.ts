/**
 * QETTA 입력 살균 유틸리티
 *
 * XSS, Path Traversal, Prototype Pollution 방지를 위한 입력 검증 및 살균
 *
 * @module security/sanitize
 */

import DOMPurify, { type Config as DOMPurifyConfig } from 'isomorphic-dompurify'

// ============================================
// DOMPurify 설정
// ============================================

/**
 * 허용된 HTML 태그 (마크다운 변환 결과용)
 */
const ALLOWED_TAGS = [
  // 텍스트 서식
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark',
  // 헤딩
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // 목록
  'ul', 'ol', 'li',
  // 링크 및 코드
  'a', 'code', 'pre', 'blockquote',
  // 테이블
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  // 기타
  'hr', 'span', 'div', 'sub', 'sup',
]

/**
 * 허용된 HTML 속성
 */
const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'id',
  'colspan', 'rowspan', 'scope', // 테이블
  'title', 'alt', // 접근성
]

/**
 * DOMPurify 기본 설정
 */
const DEFAULT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'], // 링크에 target 허용
  FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'svg', 'math'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress'],
  RETURN_TRUSTED_TYPE: false, // Ensure string return type
}

/**
 * 엄격 모드 설정 (모든 HTML 태그 제거)
 */
const STRICT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  RETURN_TRUSTED_TYPE: false, // Ensure string return type
}

// ============================================
// HTML 살균 함수
// ============================================

/**
 * HTML 살균 (Rich Text용)
 *
 * 허용된 태그와 속성만 유지하고 나머지는 제거합니다.
 *
 * @param dirty - 살균할 HTML 문자열
 * @param config - 추가 DOMPurify 설정 (선택)
 * @returns 살균된 HTML 문자열
 *
 * @example
 * ```ts
 * const safe = sanitizeHtml('<script>alert("xss")</script><p>Hello</p>')
 * // => '<p>Hello</p>'
 *
 * const safe2 = sanitizeHtml('<a href="javascript:void(0)">Click</a>')
 * // => '<a>Click</a>' (javascript: 프로토콜 제거됨)
 * ```
 */
export function sanitizeHtml(dirty: string, config?: DOMPurifyConfig): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }
  return DOMPurify.sanitize(dirty, { ...DEFAULT_CONFIG, ...config })
}

/**
 * 플레인 텍스트 추출 (모든 HTML 제거)
 *
 * @param dirty - HTML이 포함될 수 있는 문자열
 * @returns 모든 HTML 태그가 제거된 순수 텍스트
 *
 * @example
 * ```ts
 * const text = stripHtml('<p>Hello <strong>World</strong></p>')
 * // => 'Hello World'
 * ```
 */
export function stripHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }
  return DOMPurify.sanitize(dirty, STRICT_CONFIG)
}

/**
 * 마크다운 렌더링 결과 살균
 *
 * 마크다운 라이브러리의 HTML 출력을 안전하게 만듭니다.
 *
 * @param html - 마크다운 렌더러의 출력
 * @returns 살균된 HTML
 */
export function sanitizeMarkdown(html: string): string {
  return sanitizeHtml(html, {
    ADD_ATTR: ['target'],
    ADD_TAGS: ['img'], // 마크다운 이미지 허용
  })
}

// ============================================
// URL 살균 함수
// ============================================

/**
 * 위험한 프로토콜 목록
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
  'blob:',
]

/**
 * 안전한 프로토콜 목록
 */
const SAFE_PROTOCOLS = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  'sms:',
]

/**
 * URL 살균 (javascript: 프로토콜 방지)
 *
 * @param url - 검증할 URL
 * @returns 안전한 URL 또는 빈 문자열
 *
 * @example
 * ```ts
 * sanitizeUrl('javascript:alert(1)') // => ''
 * sanitizeUrl('https://example.com') // => 'https://example.com'
 * sanitizeUrl('/path/to/page')       // => '/path/to/page'
 * sanitizeUrl('data:text/html,...')  // => ''
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const trimmed = url.trim()
  const lowercased = trimmed.toLowerCase()

  // 위험한 프로토콜 차단
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowercased.startsWith(protocol)) {
      return ''
    }
  }

  // 안전한 프로토콜 또는 상대 경로 허용
  const isSafeProtocol = SAFE_PROTOCOLS.some(p => lowercased.startsWith(p))
  const isRelativePath = trimmed.startsWith('/') || trimmed.startsWith('.') || !trimmed.includes(':')

  return (isSafeProtocol || isRelativePath) ? trimmed : ''
}

/**
 * URL이 안전한지 검증
 *
 * @param url - 검증할 URL
 * @returns 안전 여부
 */
export function isUrlSafe(url: string): boolean {
  return sanitizeUrl(url) === url.trim()
}

// ============================================
// 파일명 살균 함수
// ============================================

/**
 * 파일명에서 제거할 문자 패턴
 */
const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g

/**
 * Path Traversal 패턴
 */
const PATH_TRAVERSAL_PATTERN = /\.\./g

/**
 * 파일명 살균 (Path Traversal 방지)
 *
 * @param filename - 살균할 파일명
 * @param options - 옵션
 * @returns 안전한 파일명
 *
 * @example
 * ```ts
 * sanitizeFilename('../../../etc/passwd')    // => 'etc-passwd'
 * sanitizeFilename('my file<script>.pdf')    // => 'my-file-script-.pdf'
 * sanitizeFilename('report 2024.docx')       // => 'report-2024.docx'
 * ```
 */
export function sanitizeFilename(
  filename: string,
  options: { maxLength?: number; replacement?: string } = {}
): string {
  const { maxLength = 255, replacement = '-' } = options

  if (!filename || typeof filename !== 'string') {
    return ''
  }

  return filename
    .replace(PATH_TRAVERSAL_PATTERN, '') // Path traversal 방지
    .replace(UNSAFE_FILENAME_CHARS, replacement) // 위험 문자 제거
    .replace(/\s+/g, replacement) // 공백을 대시로
    .replace(new RegExp(`${replacement}+`, 'g'), replacement) // 연속 대시 정리
    .replace(new RegExp(`^${replacement}|${replacement}$`, 'g'), '') // 앞뒤 대시 제거
    .slice(0, maxLength) // 파일명 길이 제한
}

/**
 * 파일 확장자 검증
 *
 * @param filename - 파일명
 * @param allowedExtensions - 허용된 확장자 목록 (소문자)
 * @returns 확장자가 허용 목록에 있는지 여부
 */
export function hasAllowedExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? allowedExtensions.includes(ext) : false
}

// ============================================
// 식별자 검증 함수
// ============================================

/**
 * SQL Injection 방지를 위한 식별자 검증
 * (Prisma 사용 시 대부분 불필요하지만, 동적 쿼리용)
 *
 * @param value - 검증할 값
 * @returns 안전한 식별자인지 여부
 *
 * @example
 * ```ts
 * isValidIdentifier('user_id')           // => true
 * isValidIdentifier("'; DROP TABLE--")   // => false
 * isValidIdentifier('123abc')            // => false (숫자로 시작)
 * ```
 */
export function isValidIdentifier(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false
  }
  // 알파벳 또는 언더스코어로 시작, 알파벳/숫자/언더스코어만 허용
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)
}

/**
 * 식별자 살균 (안전하지 않은 문자 제거)
 *
 * @param value - 살균할 값
 * @returns 안전한 식별자
 */
export function sanitizeIdentifier(value: string): string {
  if (!value || typeof value !== 'string') {
    return ''
  }
  // 안전한 문자만 유지
  const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '')
  // 숫자로 시작하면 앞에 _ 추가
  return /^[0-9]/.test(sanitized) ? `_${sanitized}` : sanitized
}

// ============================================
// JSON 파싱 함수
// ============================================

/**
 * JSON 안전 파싱 (Prototype Pollution 방지)
 *
 * @param json - 파싱할 JSON 문자열
 * @param defaultValue - 파싱 실패 시 반환할 기본값
 * @returns 파싱된 객체 또는 기본값
 *
 * @example
 * ```ts
 * safeJsonParse('{"name": "test"}', {})  // => { name: 'test' }
 * safeJsonParse('invalid', {})            // => {}
 * safeJsonParse('{"__proto__": {}}', {})  // => {} (__proto__ 제거됨)
 * ```
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(json)

    // Prototype Pollution 방지: 위험 키 제거
    if (typeof parsed === 'object' && parsed !== null) {
      removePrototypeKeys(parsed)
    }

    return parsed as T
  } catch {
    return defaultValue
  }
}

/**
 * 객체에서 Prototype Pollution 위험 키 재귀적 제거
 */
function removePrototypeKeys(obj: Record<string, unknown>): void {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']

  for (const key of dangerousKeys) {
    if (key in obj) {
      delete obj[key]
    }
  }

  // 중첩 객체 처리
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      removePrototypeKeys(value as Record<string, unknown>)
    }
  }
}

// ============================================
// 문자열 이스케이프 함수
// ============================================

/**
 * HTML 특수문자 이스케이프
 *
 * @param str - 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') {
    return ''
  }

  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  }

  return str.replace(/[&<>"'/`=]/g, char => escapeMap[char] || char)
}

/**
 * 정규식 특수문자 이스케이프
 *
 * @param str - 이스케이프할 문자열
 * @returns 정규식에서 안전하게 사용할 수 있는 문자열
 */
export function escapeRegex(str: string): string {
  if (!str || typeof str !== 'string') {
    return ''
  }
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ============================================
// 입력 트림 및 정규화
// ============================================

/**
 * 문자열 정규화 (트림 + 연속 공백 제거)
 *
 * @param str - 정규화할 문자열
 * @returns 정규화된 문자열
 */
export function normalizeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return ''
  }
  return str.trim().replace(/\s+/g, ' ')
}

/**
 * 이메일 정규화 (소문자 변환, 트림)
 *
 * @param email - 정규화할 이메일
 * @returns 정규화된 이메일
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }
  return email.trim().toLowerCase()
}

// ============================================
// Zod 스키마 확장
// ============================================

import { z } from 'zod'

/**
 * 살균된 문자열 스키마 (모든 HTML 제거)
 */
export const sanitizedString = z.string().transform(stripHtml)

/**
 * 정규화된 문자열 스키마
 */
export const normalizedString = z.string().transform(normalizeString)

/**
 * 살균된 HTML 스키마 (허용된 태그만 유지)
 */
export const sanitizedHtmlSchema = z.string().transform((val) => sanitizeHtml(val))

/**
 * 안전한 URL 스키마
 */
export const safeUrlSchema = z.string().transform(sanitizeUrl).refine(
  (url) => url.length > 0,
  { message: '유효하지 않거나 안전하지 않은 URL입니다' }
)

/**
 * 안전한 파일명 스키마
 */
export const safeFilenameSchema = z.string().transform((val) => sanitizeFilename(val)).refine(
  (filename) => filename.length > 0,
  { message: '유효하지 않은 파일명입니다' }
)

/**
 * 정규화된 이메일 스키마
 */
export const normalizedEmailSchema = z.string().email().transform(normalizeEmail)

// ============================================
// 모듈 Export 요약
// ============================================

export {
  // 상수
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  DANGEROUS_PROTOCOLS,
  SAFE_PROTOCOLS,

  // 타입
  type DOMPurify,
}
