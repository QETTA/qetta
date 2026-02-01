import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateCsrfToken,
  extractCsrfToken,
  getCsrfFetchOptions,
  createCsrfFormData,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_FORM_FIELD,
} from '../csrf'

// ============================================
// Token Generation
// ============================================

describe('generateCsrfToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateCsrfToken()
    expect(token).toHaveLength(64)
    expect(/^[a-f0-9]+$/.test(token)).toBe(true)
  })

  it('generates unique tokens', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(token1).not.toBe(token2)
  })
})

// ============================================
// Token Extraction
// ============================================

describe('extractCsrfToken', () => {
  it('extracts token from X-CSRF-Token header', async () => {
    const token = 'test-token-123'
    const request = new Request('https://example.com/api', {
      method: 'POST',
      headers: {
        [CSRF_HEADER_NAME]: token,
      },
    })

    const extracted = await extractCsrfToken(request)
    expect(extracted).toBe(token)
  })

  it('extracts token from form data', async () => {
    const token = 'form-token-456'
    const formData = new FormData()
    formData.set(CSRF_FORM_FIELD, token)

    const request = new Request('https://example.com/api', {
      method: 'POST',
      body: formData,
    })

    const extracted = await extractCsrfToken(request)
    expect(extracted).toBe(token)
  })

  it('extracts token from URL-encoded form data', async () => {
    const token = 'urlencoded-token-789'
    const body = new URLSearchParams()
    body.set(CSRF_FORM_FIELD, token)

    const request = new Request('https://example.com/api', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const extracted = await extractCsrfToken(request)
    expect(extracted).toBe(token)
  })

  it('extracts token from query string', async () => {
    const token = 'query-token-abc'
    const request = new Request(`https://example.com/api?${CSRF_FORM_FIELD}=${token}`, {
      method: 'GET',
    })

    const extracted = await extractCsrfToken(request)
    expect(extracted).toBe(token)
  })

  it('prefers header over form data', async () => {
    const headerToken = 'header-token'
    const formData = new FormData()
    formData.set(CSRF_FORM_FIELD, 'form-token')

    const request = new Request('https://example.com/api', {
      method: 'POST',
      headers: {
        [CSRF_HEADER_NAME]: headerToken,
      },
      body: formData,
    })

    const extracted = await extractCsrfToken(request)
    expect(extracted).toBe(headerToken)
  })

  it('returns null when no token present', async () => {
    const request = new Request('https://example.com/api', {
      method: 'POST',
    })

    const extracted = await extractCsrfToken(request)
    expect(extracted).toBeNull()
  })
})

// ============================================
// Client Helpers
// ============================================

describe('getCsrfFetchOptions', () => {
  it('returns correct header', () => {
    const token = 'fetch-token'
    const options = getCsrfFetchOptions(token)

    expect(options.headers).toHaveProperty(CSRF_HEADER_NAME, token)
    expect(options.credentials).toBe('include')
  })
})

describe('createCsrfFormData', () => {
  it('creates FormData with CSRF token', () => {
    const token = 'formdata-token'
    const formData = createCsrfFormData(token)

    expect(formData.get(CSRF_FORM_FIELD)).toBe(token)
  })

  it('includes additional data', () => {
    const token = 'formdata-token'
    const formData = createCsrfFormData(token, {
      name: 'test',
      value: '123',
    })

    expect(formData.get(CSRF_FORM_FIELD)).toBe(token)
    expect(formData.get('name')).toBe('test')
    expect(formData.get('value')).toBe('123')
  })
})

// ============================================
// Constants
// ============================================

describe('CSRF constants', () => {
  it('has correct cookie name', () => {
    expect(CSRF_COOKIE_NAME).toBe('qetta_csrf')
  })

  it('has correct header name', () => {
    expect(CSRF_HEADER_NAME).toBe('x-csrf-token')
  })

  it('has correct form field name', () => {
    expect(CSRF_FORM_FIELD).toBe('_csrf')
  })
})
