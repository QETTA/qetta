/**
 * Document Generator Types Tests
 */

import { describe, it, expect } from 'vitest'
import { DocumentGenerationError, DOC_ERROR_CODES } from '../types'

describe('DocumentGenerationError', () => {
  it('creates error with message and code', () => {
    const error = new DocumentGenerationError('Test error', 'TEST_CODE')

    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
    expect(error.name).toBe('DocumentGenerationError')
    expect(error.enginePreset).toBeUndefined()
    expect(error.documentType).toBeUndefined()
  })

  it('creates error with all parameters', () => {
    const error = new DocumentGenerationError(
      'Generation failed',
      'GENERATION_FAILED',
      'MANUFACTURING',
      'report'
    )

    expect(error.message).toBe('Generation failed')
    expect(error.code).toBe('GENERATION_FAILED')
    expect(error.enginePreset).toBe('MANUFACTURING')
    expect(error.documentType).toBe('report')
  })

  it('extends Error class', () => {
    const error = new DocumentGenerationError('Test', 'CODE')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DocumentGenerationError)
  })

  it('has proper stack trace', () => {
    const error = new DocumentGenerationError('Stack test', 'STACK')

    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('Stack test')
  })
})

describe('DOC_ERROR_CODES', () => {
  it('defines expected error codes', () => {
    expect(DOC_ERROR_CODES.INVALID_DOMAIN).toBe('INVALID_DOMAIN')
    expect(DOC_ERROR_CODES.INVALID_TYPE).toBe('INVALID_TYPE')
    expect(DOC_ERROR_CODES.GENERATION_FAILED).toBe('GENERATION_FAILED')
  })
})
