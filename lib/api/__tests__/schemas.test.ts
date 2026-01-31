import { describe, it, expect } from 'vitest'
import {
  chatRequestSchema,
  verifyChainRequestSchema,
  analyzeRejectionRequestSchema,
  batchRequestSchema,
  skillEngineRequestSchema,
  templateRequestSchema,
  emailScanRequestSchema,
  generateDocumentRequestSchema,
  documentsRequestSchema,
} from '../schemas'

describe('chatRequestSchema', () => {
  it('accepts valid input', () => {
    const result = chatRequestSchema.parse({
      messages: [{ role: 'user', content: 'hello' }],
    })
    expect(result.messages).toHaveLength(1)
  })

  it('accepts optional fields', () => {
    const result = chatRequestSchema.parse({
      messages: [{ role: 'user', content: 'hello' }],
      enginePreset: 'tms',
      context: 'some context',
    })
    expect(result.enginePreset).toBe('tms')
  })

  it('rejects empty messages array', () => {
    expect(() => chatRequestSchema.parse({ messages: [] })).toThrow()
  })

  it('rejects missing messages', () => {
    expect(() => chatRequestSchema.parse({})).toThrow()
  })

  it('rejects invalid message shape', () => {
    expect(() =>
      chatRequestSchema.parse({ messages: [{ role: 123 }] })
    ).toThrow()
  })
})

describe('verifyChainRequestSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = verifyChainRequestSchema.parse({})
    expect(result).toBeDefined()
  })

  it('accepts valid fields', () => {
    const result = verifyChainRequestSchema.parse({
      entryId: 'abc',
      expectedHash: 'sha256hash',
    })
    expect(result.entryId).toBe('abc')
  })

  it('rejects non-string entryId', () => {
    expect(() =>
      verifyChainRequestSchema.parse({ entryId: 123 })
    ).toThrow()
  })
})

describe('analyzeRejectionRequestSchema', () => {
  it('accepts valid input', () => {
    const result = analyzeRejectionRequestSchema.parse({
      rejectionText: '탈락 사유',
    })
    expect(result.rejectionText).toBe('탈락 사유')
    expect(result.domain).toBe('general') // default
  })

  it('rejects empty rejectionText', () => {
    expect(() =>
      analyzeRejectionRequestSchema.parse({ rejectionText: '' })
    ).toThrow()
  })

  it('rejects missing rejectionText', () => {
    expect(() => analyzeRejectionRequestSchema.parse({})).toThrow()
  })
})

describe('batchRequestSchema', () => {
  it('accepts valid batch', () => {
    const result = batchRequestSchema.parse({
      type: 'announcement_analysis',
      items: [{ id: '1' }],
    })
    expect(result.type).toBe('announcement_analysis')
  })

  it('rejects empty items', () => {
    expect(() =>
      batchRequestSchema.parse({ type: 'announcement_analysis', items: [] })
    ).toThrow()
  })

  it('rejects invalid type enum', () => {
    expect(() =>
      batchRequestSchema.parse({ type: 'invalid', items: [{ id: '1' }] })
    ).toThrow()
  })

  it('rejects items exceeding max 1000', () => {
    const items = Array.from({ length: 1001 }, (_, i) => ({ id: String(i) }))
    expect(() =>
      batchRequestSchema.parse({ type: 'announcement_analysis', items })
    ).toThrow()
  })

  it('accepts exactly 1000 items', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }))
    const result = batchRequestSchema.parse({
      type: 'rejection_classification',
      items,
    })
    expect(result.items).toHaveLength(1000)
  })
})

describe('skillEngineRequestSchema', () => {
  it('accepts valid input', () => {
    const result = skillEngineRequestSchema.parse({ action: 'execute' })
    expect(result.action).toBe('execute')
    expect(result.domain).toBe('general') // default
    expect(result.data).toEqual({}) // default
  })

  it('rejects empty action', () => {
    expect(() => skillEngineRequestSchema.parse({ action: '' })).toThrow()
  })

  it('rejects missing action', () => {
    expect(() => skillEngineRequestSchema.parse({})).toThrow()
  })
})

describe('templateRequestSchema', () => {
  it('accepts valid input with defaults', () => {
    const result = templateRequestSchema.parse({})
    expect(result.action).toBe('generate') // default
  })

  it('accepts all action types', () => {
    for (const action of ['generate', 'analyze', 'fill'] as const) {
      const result = templateRequestSchema.parse({ action })
      expect(result.action).toBe(action)
    }
  })

  it('rejects invalid action', () => {
    expect(() => templateRequestSchema.parse({ action: 'invalid' })).toThrow()
  })
})

describe('emailScanRequestSchema', () => {
  it('accepts valid gmail request', () => {
    const result = emailScanRequestSchema.parse({ provider: 'gmail' })
    expect(result.provider).toBe('gmail')
    expect(result.maxResults).toBe(20) // default
    expect(result.processRejections).toBe(true) // default
  })

  it('accepts outlook provider', () => {
    const result = emailScanRequestSchema.parse({ provider: 'outlook' })
    expect(result.provider).toBe('outlook')
  })

  it('rejects invalid provider', () => {
    expect(() =>
      emailScanRequestSchema.parse({ provider: 'yahoo' })
    ).toThrow()
  })

  it('rejects maxResults over 100', () => {
    expect(() =>
      emailScanRequestSchema.parse({ provider: 'gmail', maxResults: 101 })
    ).toThrow()
  })

  it('rejects maxResults of 0', () => {
    expect(() =>
      emailScanRequestSchema.parse({ provider: 'gmail', maxResults: 0 })
    ).toThrow()
  })

  it('accepts maxResults of 1', () => {
    const result = emailScanRequestSchema.parse({
      provider: 'gmail',
      maxResults: 1,
    })
    expect(result.maxResults).toBe(1)
  })

  it('accepts maxResults of 100', () => {
    const result = emailScanRequestSchema.parse({
      provider: 'gmail',
      maxResults: 100,
    })
    expect(result.maxResults).toBe(100)
  })
})

describe('generateDocumentRequestSchema', () => {
  it('accepts valid input', () => {
    const result = generateDocumentRequestSchema.parse({
      documentType: 'report',
      enginePreset: 'tms',
    })
    expect(result.documentType).toBe('report')
  })

  it('rejects missing documentType', () => {
    expect(() =>
      generateDocumentRequestSchema.parse({ enginePreset: 'tms' })
    ).toThrow()
  })

  it('rejects empty documentType', () => {
    expect(() =>
      generateDocumentRequestSchema.parse({
        documentType: '',
        enginePreset: 'tms',
      })
    ).toThrow()
  })

  it('rejects missing enginePreset', () => {
    expect(() =>
      generateDocumentRequestSchema.parse({ documentType: 'report' })
    ).toThrow()
  })
})

describe('documentsRequestSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = documentsRequestSchema.parse({})
    expect(result).toBeDefined()
  })

  it('accepts all fields', () => {
    const result = documentsRequestSchema.parse({
      action: 'list',
      documentId: 'doc-1',
      domain: 'ENVIRONMENT',
      status: 'draft',
      type: 'report',
    })
    expect(result.action).toBe('list')
  })
})
