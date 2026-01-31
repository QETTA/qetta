import { describe, it, expect } from 'vitest'
import { APIError, createErrorResponse, handleAPIError } from '../errors'

describe('APIError', () => {
  it('creates error with correct properties', () => {
    const error = new APIError('NOT_FOUND', 'Resource not found', 404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Resource not found')
    expect(error.status).toBe(404)
    expect(error.name).toBe('APIError')
    expect(error).toBeInstanceOf(Error)
  })

  it('defaults status to 500', () => {
    const error = new APIError('INTERNAL_ERROR', 'fail')
    expect(error.status).toBe(500)
  })
})

describe('createErrorResponse', () => {
  it('returns structured error response', () => {
    const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input')
    expect(response).toEqual({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
    })
  })
})

describe('handleAPIError', () => {
  it('handles APIError with correct status', async () => {
    const apiError = new APIError('NOT_FOUND', 'Not found', 404)
    const response = handleAPIError(apiError)
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('handles generic Error as 500', async () => {
    const error = new Error('Something broke')
    const response = handleAPIError(error)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).toBe('Something broke')
  })

  it('handles non-Error (string) as 500', async () => {
    const response = handleAPIError('string error')
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).toBe('Internal server error')
  })

  it('handles non-Error (number) as 500', async () => {
    const response = handleAPIError(42)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
