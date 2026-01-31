import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiPost, apiGet, ApiError } from '../client'

// ---------- helpers ----------

const originalFetch = globalThis.fetch

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const ok = response.ok ?? true
  const status = response.status ?? (ok ? 200 : 500)
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: response.json ?? (() => Promise.resolve({})),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

// ---------- ApiError ----------

describe('ApiError', () => {
  it('has correct name, message, status, code', () => {
    const err = new ApiError('bad request', 400, 'VALIDATION_ERROR')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ApiError')
    expect(err.message).toBe('bad request')
    expect(err.status).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
  })

  it('code is optional', () => {
    const err = new ApiError('fail', 500)
    expect(err.code).toBeUndefined()
  })
})

// ---------- apiPost ----------

describe('apiPost', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ id: 1 }) })
    const data = await apiPost<{ id: number }>('/api/test', { foo: 'bar' })
    expect(data).toEqual({ id: 1 })

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[0]).toBe('/api/test')
    expect(call[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    })
  })

  it('throws ApiError on 4xx', async () => {
    mockFetch({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ message: 'Validation failed', code: 'VALIDATION_ERROR' }),
    })

    await expect(apiPost('/api/test', {})).rejects.toThrow(ApiError)
    try {
      await apiPost('/api/test', {})
    } catch (e) {
      const err = e as ApiError
      expect(err.status).toBe(422)
      expect(err.message).toBe('Validation failed')
      expect(err.code).toBe('VALIDATION_ERROR')
    }
  })

  it('throws ApiError on 5xx', async () => {
    mockFetch({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: 'Service unavailable' }),
    })

    await expect(apiPost('/api/test', {})).rejects.toThrow(ApiError)
  })

  it('uses fallback message when error JSON parsing fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    })

    try {
      await apiPost('/api/test', {})
    } catch (e) {
      const err = e as ApiError
      expect(err.message).toBe('Request failed: 500')
      expect(err.status).toBe(500)
    }
  })
})

// ---------- apiGet ----------

describe('apiGet', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch({ ok: true, json: () => Promise.resolve([1, 2, 3]) })
    const data = await apiGet<number[]>('/api/list')
    expect(data).toEqual([1, 2, 3])
  })

  it('throws ApiError on server error', async () => {
    mockFetch({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found', code: 'NOT_FOUND' }),
    })

    await expect(apiGet('/api/missing')).rejects.toThrow(ApiError)
  })

  it('uses fallback message when error JSON parsing fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('parse error')),
    })

    try {
      await apiGet('/api/test')
    } catch (e) {
      const err = e as ApiError
      expect(err.message).toBe('Request failed: 502')
    }
  })
})
