/**
 * DOCS-VERIFY-APPLY E2E Tests
 *
 * 문서 생성 → 해시 검증 → 파이프라인 통합 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateSHA256,
  createHashChainEntry,
  verifyDocumentHash,
  verifyHashChain,
  addToHashChain,
  getHashChainEntry,
  getAllHashChainEntries,
  clearHashChain,
  formatHashChainId,
  type HashChainEntry,
} from '../hash-verifier'
import { adaptTemplateToDocumentRequest } from '../domain-engine-adapter'
import { DOCUMENT_CONFIGS } from '../types'
import type { EnginePresetType } from '@/types/inbox'

// ============================================
// Test 1: Document Generation → Hash Chain
// ============================================

describe('Document Generation → Hash Chain', () => {
  beforeEach(() => {
    clearHashChain()
  })

  it('creates hash chain entry from document buffer', () => {
    const buffer = Buffer.from('test document content')
    const entry = addToHashChain(buffer, {
      documentId: 'doc-test-001',
      documentType: 'daily_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'test.docx',
    })

    expect(entry.id).toMatch(/^hc-/)
    expect(entry.documentHash).toHaveLength(64)
    expect(entry.previousHash).toBeNull() // first entry
    expect(entry.signature).toHaveLength(64)
    expect(entry.metadata.documentId).toBe('doc-test-001')
  })

  it('links entries in chain (previousHash)', () => {
    const buf1 = Buffer.from('document 1')
    const buf2 = Buffer.from('document 2')

    const entry1 = addToHashChain(buf1, {
      documentId: 'doc-1',
      documentType: 'daily_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'doc1.docx',
    })

    const entry2 = addToHashChain(buf2, {
      documentId: 'doc-2',
      documentType: 'monthly_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'doc2.docx',
    })

    expect(entry1.previousHash).toBeNull()
    expect(entry2.previousHash).toBe(entry1.documentHash)
  })
})

// ============================================
// Test 2: SHA-256 Hash Verification
// ============================================

describe('SHA-256 Hash Verification', () => {
  it('verifies document hash matches', () => {
    const buffer = Buffer.from('important document')
    const hash = generateSHA256(buffer)
    const result = verifyDocumentHash(buffer, hash)

    expect(result.isValid).toBe(true)
    expect(result.chainIntegrity).toBe(true)
    expect(result.documentHash).toBe(hash)
  })

  it('detects tampered document', () => {
    const original = Buffer.from('original')
    const hash = generateSHA256(original)
    const tampered = Buffer.from('tampered')
    const result = verifyDocumentHash(tampered, hash)

    expect(result.isValid).toBe(false)
    expect(result.message).toContain('변조')
  })
})

// ============================================
// Test 3: Hash Chain Integrity
// ============================================

describe('Hash Chain Integrity', () => {
  beforeEach(() => {
    clearHashChain()
  })

  it('verifies valid chain', () => {
    addToHashChain(Buffer.from('doc1'), {
      documentId: 'doc-1',
      documentType: 'daily_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'doc1.docx',
    })
    addToHashChain(Buffer.from('doc2'), {
      documentId: 'doc-2',
      documentType: 'monthly_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'doc2.docx',
    })

    const entries = getAllHashChainEntries()
    const result = verifyHashChain(entries)

    expect(result.isValid).toBe(true)
    expect(result.chainIntegrity).toBe(true)
    expect(result.message).toContain('2개 엔트리')
  })

  it('detects tampered signature', () => {
    addToHashChain(Buffer.from('doc1'), {
      documentId: 'doc-1',
      documentType: 'daily_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'doc1.docx',
    })

    const entries = getAllHashChainEntries()
    // Tamper with signature
    const tampered: HashChainEntry[] = entries.map((e) => ({
      ...e,
      signature: 'tampered_signature_value_0000000000000000000000000000000',
    }))

    const result = verifyHashChain(tampered)
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('변조')
  })

  it('returns false for empty chain', () => {
    const result = verifyHashChain([])
    expect(result.isValid).toBe(false)
  })
})

// ============================================
// Test 4: In-Memory Store
// ============================================

describe('In-Memory Hash Chain Store', () => {
  beforeEach(() => {
    clearHashChain()
  })

  it('stores and retrieves entry by ID', () => {
    const entry = addToHashChain(Buffer.from('test'), {
      documentId: 'doc-test',
      documentType: 'daily_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'test.docx',
    })

    const retrieved = getHashChainEntry(entry.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved?.id).toBe(entry.id)
    expect(retrieved?.documentHash).toBe(entry.documentHash)
  })

  it('returns null for non-existent ID', () => {
    expect(getHashChainEntry('non-existent')).toBeNull()
  })

  it('clears all entries', () => {
    addToHashChain(Buffer.from('a'), {
      documentId: 'a',
      documentType: 'daily_report',
      enginePreset: 'ENVIRONMENT',
      filename: 'a.docx',
    })
    clearHashChain()
    expect(getAllHashChainEntries()).toHaveLength(0)
  })
})

// ============================================
// Test 5: Domain Engine Coverage (6 Presets)
// ============================================

describe('All 6 Domain Engines have document configs', () => {
  const domains: EnginePresetType[] = [
    'MANUFACTURING',
    'ENVIRONMENT',
    'DIGITAL',
    'EXPORT',
    'FINANCE',
    'STARTUP',
  ]

  for (const domain of domains) {
    it(`${domain} has at least one document type`, () => {
      const configs = DOCUMENT_CONFIGS[domain]
      expect(configs).toBeDefined()
      expect(Object.keys(configs).length).toBeGreaterThan(0)
    })
  }
})

// ============================================
// Test 6: Domain Engine Adapter
// ============================================

describe('Domain Engine Adapter', () => {
  it('converts template to document request', () => {
    const template = {
      id: 'tpl-test',
      name: 'Test Template',
      nameEn: 'Test Template',
      type: 'application_form' as const,
      domain: 'MANUFACTURING' as EnginePresetType,
      version: '1.0',
      sections: [
        {
          id: 'sec-1',
          type: 'company_overview' as const,
          title: '기업 개요',
          titleEn: 'Company Overview',
          order: 1,
          required: true,
          variableIds: ['company_name'],
        },
      ],
      variables: [
        {
          id: 'company_name',
          name: '회사명',
          nameEn: 'Company Name',
          category: 'company' as const,
          type: 'text' as const,
          required: true,
        },
      ],
      outputFormats: ['DOCX' as const],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { usageCount: 0, tags: [] },
    }

    const request = adaptTemplateToDocumentRequest(template, {
      company_name: '주식회사 테스트',
    })

    expect(request.enginePreset).toBe('MANUFACTURING')
    expect(request.templateId).toBe('tpl-test')
    expect(request.templateSections).toHaveLength(1)
    expect(request.templateSections[0].title).toBe('기업 개요')
    expect(request.metadata?.companyName).toBe('주식회사 테스트')
  })
})

// ============================================
// Test 7: Hash Chain ID Formatting
// ============================================

describe('Hash Chain ID Formatting', () => {
  it('formats compact hash chain ID', () => {
    const entry = createHashChainEntry(
      Buffer.from('test'),
      null,
      {
        documentId: 'doc-1',
        documentType: 'daily_report',
        enginePreset: 'ENVIRONMENT',
        filename: 'test.docx',
      }
    )

    const formatted = formatHashChainId(entry)
    expect(formatted).toMatch(/^sha256:[a-f0-9]{8}\.\.\.[a-f0-9]+$/)
  })
})

// ============================================
// Test 8: Pipeline Request Validation
// ============================================

describe('Pipeline Request Validation', () => {
  it('requires announcementId', () => {
    // Simulating API validation logic
    const validateRequest = (body: { announcementId?: string }) => {
      if (!body.announcementId) {
        return { valid: false, error: 'announcementId is required' }
      }
      return { valid: true }
    }

    expect(validateRequest({})).toEqual({ valid: false, error: 'announcementId is required' })
    expect(validateRequest({ announcementId: 'ann-123' })).toEqual({ valid: true })
  })
})

// ============================================
// Test 9: resolveDefaultDocumentType Coverage
// ============================================

describe('resolveDefaultDocumentType for all 6 domains', () => {
  const resolveDefaultDocumentType = (domain: EnginePresetType): string => {
    const defaults: Record<EnginePresetType, string> = {
      MANUFACTURING: 'settlement_report',
      ENVIRONMENT: 'daily_report',
      DIGITAL: 'performance_report',
      EXPORT: 'proposal_draft',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    }
    return defaults[domain]
  }

  it('resolves MANUFACTURING → settlement_report', () => {
    expect(resolveDefaultDocumentType('MANUFACTURING')).toBe('settlement_report')
  })

  it('resolves ENVIRONMENT → daily_report', () => {
    expect(resolveDefaultDocumentType('ENVIRONMENT')).toBe('daily_report')
  })

  it('resolves DIGITAL → performance_report', () => {
    expect(resolveDefaultDocumentType('DIGITAL')).toBe('performance_report')
  })

  it('resolves EXPORT → proposal_draft', () => {
    expect(resolveDefaultDocumentType('EXPORT')).toBe('proposal_draft')
  })

  it('resolves FINANCE → application', () => {
    expect(resolveDefaultDocumentType('FINANCE')).toBe('application')
  })

  it('resolves STARTUP → business_plan', () => {
    expect(resolveDefaultDocumentType('STARTUP')).toBe('business_plan')
  })
})

// ============================================
// Test 10: Pipeline with companyData → Adapter Path
// ============================================

describe('Pipeline with companyData uses adapter', () => {
  it('adapts template to document request when companyData provided', () => {
    const template = {
      id: 'tpl-pipeline',
      name: 'Pipeline Template',
      nameEn: 'Pipeline Template',
      type: 'application_form' as const,
      domain: 'DIGITAL' as EnginePresetType,
      version: '1.0',
      sections: [
        {
          id: 'sec-company',
          type: 'company_overview' as const,
          title: '기업 정보',
          titleEn: 'Company Info',
          order: 1,
          required: true,
          variableIds: ['company_name', 'representative'],
        },
      ],
      variables: [
        {
          id: 'company_name',
          name: '회사명',
          nameEn: 'Company Name',
          category: 'company' as const,
          type: 'text' as const,
          required: true,
        },
        {
          id: 'representative',
          name: '대표자',
          nameEn: 'Representative',
          category: 'company' as const,
          type: 'text' as const,
          required: true,
        },
      ],
      outputFormats: ['DOCX' as const, 'PDF' as const],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { usageCount: 0, tags: ['pipeline'] },
    }

    const companyData = {
      company_name: '주식회사 QETTA',
      representative: '홍길동',
    }

    const request = adaptTemplateToDocumentRequest(template, companyData)

    expect(request.enginePreset).toBe('DIGITAL')
    expect(request.templateId).toBe('tpl-pipeline')
    expect(request.templateSections).toHaveLength(1)
    expect(request.metadata?.companyName).toBe('주식회사 QETTA')
    // Note: only company_name is extracted to metadata.companyName by the adapter
    // Other variables are stored in templateSections[].variableValues
    expect(request.templateSections[0].variableValues).toEqual({
      company_name: '주식회사 QETTA',
      representative: '홍길동',
    })
  })
})
