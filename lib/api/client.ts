/**
 * QETTA API Client (Browser-side)
 *
 * Shared fetch helpers for components calling /api/ routes.
 * Eliminates duplicated fetch + JSON + error-handling boilerplate.
 *
 * @example
 * ```ts
 * import { apiPost, apiGet } from '@/lib/api/client'
 *
 * const data = await apiPost<GenerateResponse>('/api/generate-document', {
 *   enginePreset: 'MANUFACTURING',
 *   documentType: 'settlement',
 * })
 *
 * const list = await apiGet<ListResponse>('/api/verify/list')
 * ```
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * POST JSON to an API route and return typed response.
 */
export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.message || error.error || `Request failed: ${response.status}`,
      response.status,
      error.code,
    )
  }

  return response.json()
}

/**
 * GET from an API route and return typed response.
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(
      error.message || error.error || `Request failed: ${response.status}`,
      response.status,
      error.code,
    )
  }

  return response.json()
}
