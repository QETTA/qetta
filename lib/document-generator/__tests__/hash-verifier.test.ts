/**
 * Hash Verifier Unit Tests
 *
 * QETTA VERIFY - SHA-256 해시체인 무결성 검증 테스트
 *
 * Covers:
 * - generateSHA256() - buffer hash generation
 * - generateSHA256FromString() - string hash generation
 * - createHashChainEntry() - chain entry creation with signature
 * - verifyDocumentHash() - single document verification
 * - verifyHashChain() - full chain integrity verification
 * - Serialization/Deserialization
 * - In-memory store operations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateSHA256,
  generateSHA256FromString,
  createHashChainEntry,
  verifyDocumentHash,
  verifyHashChain,
  formatHashChainId,
  serializeHashChain,
  deserializeHashChain,
  addToHashChain,
  getHashChainEntry,
  getAllHashChainEntries,
  clearHashChain,
  type HashChainEntry,
} from '../hash-verifier'

// ============================================
// Test Data
// ============================================

const TEST_METADATA: HashChainEntry['metadata'] = {
  documentId: 'doc-001',
  documentType: 'report',
  enginePreset: 'MANUFACTURING',
  filename: 'test-report.pdf',
}

// Known SHA-256 hash for "hello"
const HELLO_HASH = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'

// Known SHA-256 hash for empty string/buffer
const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

// ============================================
// generateSHA256
// ============================================

describe('generateSHA256', () => {
  it('returns known hash for "hello"', () => {
    const hash = generateSHA256(Buffer.from('hello'))
    expect(hash).toBe(HELLO_HASH)
  })

  it('is deterministic (same input produces same hash)', () => {
    const buf = Buffer.from('qetta-verify')
    expect(generateSHA256(buf)).toBe(generateSHA256(buf))
  })

  it('different inputs produce different hashes', () => {
    expect(generateSHA256(Buffer.from('a'))).not.toBe(generateSHA256(Buffer.from('b')))
  })

  it('empty buffer returns valid 64-char hex', () => {
    const hash = generateSHA256(Buffer.alloc(0))
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(EMPTY_HASH)
  })

  it('handles large content (1MB buffer)', () => {
    const largeBuffer = Buffer.alloc(1024 * 1024, 'x') // 1MB of 'x'
    const hash = generateSHA256(largeBuffer)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('handles binary data', () => {
    const binaryBuffer = Buffer.from([0x00, 0x01, 0xff, 0xfe])
    const hash = generateSHA256(binaryBuffer)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

// ============================================
// generateSHA256FromString
// ============================================

describe('generateSHA256FromString', () => {
  it('produces same hash as buffer version for ASCII', () => {
    const input = 'test-string'
    expect(generateSHA256FromString(input)).toBe(generateSHA256(Buffer.from(input, 'utf8')))
  })

  it('handles empty string', () => {
    const hash = generateSHA256FromString('')
    expect(hash).toBe(EMPTY_HASH)
  })

  it('handles Korean text (UTF-8)', () => {
    const korean = '데이터가 흐르면, 증빙이 따라온다'
    const hash = generateSHA256FromString(korean)
    expect(hash).toHaveLength(64)
    // Same string should produce same hash
    expect(generateSHA256FromString(korean)).toBe(hash)
  })

  it('handles emoji and special characters', () => {
    const content = 'QETTA 🚀 해시체인 ✅'
    const hash = generateSHA256FromString(content)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

// ============================================
// createHashChainEntry
// ============================================

describe('createHashChainEntry', () => {
  it('creates entry with correct structure', () => {
    const buffer = Buffer.from('document content')
    const entry = createHashChainEntry(buffer, null, TEST_METADATA)

    expect(entry).toHaveProperty('id')
    expect(entry).toHaveProperty('documentHash')
    expect(entry).toHaveProperty('previousHash')
    expect(entry).toHaveProperty('timestamp')
    expect(entry).toHaveProperty('metadata')
    expect(entry).toHaveProperty('signature')
  })

  it('generates unique ID with hc- prefix', () => {
    const buffer = Buffer.from('test')
    const entry = createHashChainEntry(buffer, null, TEST_METADATA)
    expect(entry.id).toMatch(/^hc-\d+-[a-z0-9]+$/)
  })

  it('generates correct document hash', () => {
    const content = 'test document'
    const buffer = Buffer.from(content)
    const entry = createHashChainEntry(buffer, null, TEST_METADATA)
    expect(entry.documentHash).toBe(generateSHA256(buffer))
  })

  it('sets previousHash to null for genesis entry', () => {
    const entry = createHashChainEntry(Buffer.from('genesis'), null, TEST_METADATA)
    expect(entry.previousHash).toBeNull()
  })

  it('sets previousHash correctly for chained entry', () => {
    const prevHash = 'abc123'
    const entry = createHashChainEntry(Buffer.from('chained'), prevHash, TEST_METADATA)
    expect(entry.previousHash).toBe(prevHash)
  })

  it('generates valid signature', () => {
    const buffer = Buffer.from('test')
    const entry = createHashChainEntry(buffer, null, TEST_METADATA)

    // Verify signature is SHA-256 of content
    const signatureContent = `${entry.documentHash}:GENESIS:${entry.timestamp}`
    const expectedSignature = generateSHA256FromString(signatureContent)
    expect(entry.signature).toBe(expectedSignature)
  })

  it('signature includes previousHash when present', () => {
    const prevHash = 'previous-hash-value'
    const buffer = Buffer.from('test')
    const entry = createHashChainEntry(buffer, prevHash, TEST_METADATA)

    const signatureContent = `${entry.documentHash}:${prevHash}:${entry.timestamp}`
    const expectedSignature = generateSHA256FromString(signatureContent)
    expect(entry.signature).toBe(expectedSignature)
  })

  it('preserves metadata', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    expect(entry.metadata).toEqual(TEST_METADATA)
  })

  it('generates ISO timestamp', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  })
})

// ============================================
// verifyDocumentHash
// ============================================

describe('verifyDocumentHash', () => {
  it('returns valid=true when hash matches', () => {
    const buffer = Buffer.from('document content')
    const correctHash = generateSHA256(buffer)
    const result = verifyDocumentHash(buffer, correctHash)

    expect(result.isValid).toBe(true)
    expect(result.chainIntegrity).toBe(true)
    expect(result.message).toBe('문서 무결성 검증 완료')
  })

  it('returns valid=false when hash does not match', () => {
    const buffer = Buffer.from('document content')
    const wrongHash = 'wrong-hash-value'
    const result = verifyDocumentHash(buffer, wrongHash)

    expect(result.isValid).toBe(false)
    expect(result.chainIntegrity).toBe(false)
    expect(result.message).toContain('해시 불일치')
  })

  it('returns actual document hash in result', () => {
    const buffer = Buffer.from('test')
    const expectedHash = generateSHA256(buffer)
    const result = verifyDocumentHash(buffer, 'any-hash')
    expect(result.documentHash).toBe(expectedHash)
  })

  it('includes verification timestamp', () => {
    const result = verifyDocumentHash(Buffer.from('test'), 'hash')
    expect(result.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('handles empty buffer verification', () => {
    const emptyBuffer = Buffer.alloc(0)
    const result = verifyDocumentHash(emptyBuffer, EMPTY_HASH)
    expect(result.isValid).toBe(true)
  })
})

// ============================================
// verifyHashChain
// ============================================

describe('verifyHashChain', () => {
  it('returns invalid for empty chain', () => {
    const result = verifyHashChain([])
    expect(result.isValid).toBe(false)
    expect(result.chainIntegrity).toBe(false)
    expect(result.message).toBe('검증할 해시체인이 없습니다')
  })

  it('validates single-entry chain (genesis)', () => {
    const entry = createHashChainEntry(Buffer.from('genesis'), null, TEST_METADATA)
    const result = verifyHashChain([entry])

    expect(result.isValid).toBe(true)
    expect(result.chainIntegrity).toBe(true)
    expect(result.message).toContain('1개 엔트리')
  })

  it('validates multi-entry chain', () => {
    const buffer1 = Buffer.from('doc1')
    const entry1 = createHashChainEntry(buffer1, null, TEST_METADATA)

    const buffer2 = Buffer.from('doc2')
    const entry2 = createHashChainEntry(buffer2, entry1.documentHash, {
      ...TEST_METADATA,
      documentId: 'doc-002',
    })

    const result = verifyHashChain([entry1, entry2])

    expect(result.isValid).toBe(true)
    expect(result.chainIntegrity).toBe(true)
    expect(result.message).toContain('2개 엔트리')
  })

  it('detects tampered signature', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    const tamperedEntry: HashChainEntry = {
      ...entry,
      signature: 'tampered-signature',
    }

    const result = verifyHashChain([tamperedEntry])
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('변조 감지')
  })

  it('detects tampered documentHash', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    const tamperedEntry: HashChainEntry = {
      ...entry,
      documentHash: 'tampered-hash',
    }

    const result = verifyHashChain([tamperedEntry])
    expect(result.isValid).toBe(false)
  })

  it('detects broken chain link', () => {
    const entry1 = createHashChainEntry(Buffer.from('doc1'), null, TEST_METADATA)

    // Create entry2 with later timestamp and WRONG previousHash (not linked to entry1)
    const entry2Timestamp = new Date(Date.now() + 1000).toISOString()
    const buffer2 = Buffer.from('doc2')
    const entry2Hash = generateSHA256(buffer2)
    const wrongPreviousHash = 'wrong-previous-hash'

    // Create a valid signature for the entry (so signature check passes)
    const signatureContent = `${entry2Hash}:${wrongPreviousHash}:${entry2Timestamp}`
    const entry2: HashChainEntry = {
      id: 'hc-test-002',
      documentHash: entry2Hash,
      previousHash: wrongPreviousHash, // This should NOT match entry1.documentHash
      timestamp: entry2Timestamp,
      metadata: { ...TEST_METADATA, documentId: 'doc-002' },
      signature: generateSHA256FromString(signatureContent),
    }

    const result = verifyHashChain([entry1, entry2])
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('연결 오류')
  })

  it('handles entries out of order (sorts by timestamp)', () => {
    const buffer1 = Buffer.from('doc1')
    const entry1 = createHashChainEntry(buffer1, null, TEST_METADATA)

    // Small delay to ensure different timestamp
    const buffer2 = Buffer.from('doc2')
    const entry2 = createHashChainEntry(buffer2, entry1.documentHash, {
      ...TEST_METADATA,
      documentId: 'doc-002',
    })

    // Pass in reverse order
    const result = verifyHashChain([entry2, entry1])
    expect(result.isValid).toBe(true)
  })

  it('returns latest document hash on success', () => {
    const entry1 = createHashChainEntry(Buffer.from('doc1'), null, TEST_METADATA)

    // Ensure entry2 has later timestamp
    const entry2Timestamp = new Date(Date.now() + 1000).toISOString()
    const buffer2 = Buffer.from('doc2')
    const entry2Hash = generateSHA256(buffer2)
    const signatureContent = `${entry2Hash}:${entry1.documentHash}:${entry2Timestamp}`

    const entry2: HashChainEntry = {
      id: 'hc-test-002',
      documentHash: entry2Hash,
      previousHash: entry1.documentHash,
      timestamp: entry2Timestamp,
      metadata: { ...TEST_METADATA, documentId: 'doc-002' },
      signature: generateSHA256FromString(signatureContent),
    }

    const result = verifyHashChain([entry1, entry2])
    expect(result.documentHash).toBe(entry2Hash)
  })
})

// ============================================
// formatHashChainId
// ============================================

describe('formatHashChainId', () => {
  it('returns compact format with sha256 prefix', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    const formatted = formatHashChainId(entry)

    expect(formatted).toMatch(/^sha256:[0-9a-f]{8}\.\.\.[0-9a-f]{8}$/)
  })

  it('shows first 8 and last 8 characters of hash', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    const formatted = formatHashChainId(entry)

    const first8 = entry.documentHash.substring(0, 8)
    const last8 = entry.documentHash.substring(56)
    expect(formatted).toBe(`sha256:${first8}...${last8}`)
  })
})

// ============================================
// serializeHashChain / deserializeHashChain
// ============================================

describe('serializeHashChain', () => {
  it('serializes to valid JSON', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    const json = serializeHashChain([entry])

    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('preserves all entry fields', () => {
    const entry = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    const json = serializeHashChain([entry])
    const parsed = JSON.parse(json)

    expect(parsed[0]).toHaveProperty('id', entry.id)
    expect(parsed[0]).toHaveProperty('documentHash', entry.documentHash)
    expect(parsed[0]).toHaveProperty('signature', entry.signature)
  })
})

describe('deserializeHashChain', () => {
  it('restores original entries', () => {
    const original = createHashChainEntry(Buffer.from('test'), null, TEST_METADATA)
    const json = serializeHashChain([original])
    const restored = deserializeHashChain(json)

    expect(restored).toHaveLength(1)
    expect(restored[0]).toEqual(original)
  })

  it('round-trip preserves chain integrity', () => {
    const entry1 = createHashChainEntry(Buffer.from('doc1'), null, TEST_METADATA)
    const entry2 = createHashChainEntry(Buffer.from('doc2'), entry1.documentHash, {
      ...TEST_METADATA,
      documentId: 'doc-002',
    })

    const json = serializeHashChain([entry1, entry2])
    const restored = deserializeHashChain(json)

    const result = verifyHashChain(restored)
    expect(result.isValid).toBe(true)
  })
})

// ============================================
// In-Memory Store Operations
// ============================================

describe('In-Memory Hash Chain Store', () => {
  beforeEach(() => {
    clearHashChain()
  })

  describe('addToHashChain', () => {
    it('adds entry and returns it', () => {
      const entry = addToHashChain(Buffer.from('test'), TEST_METADATA)

      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('documentHash')
      expect(entry.metadata).toEqual(TEST_METADATA)
    })

    it('first entry has null previousHash', () => {
      const entry = addToHashChain(Buffer.from('genesis'), TEST_METADATA)
      expect(entry.previousHash).toBeNull()
    })

    it('subsequent entries link to previous', () => {
      const entry1 = addToHashChain(Buffer.from('doc1'), TEST_METADATA)
      const entry2 = addToHashChain(Buffer.from('doc2'), { ...TEST_METADATA, documentId: 'doc-002' })

      expect(entry2.previousHash).toBe(entry1.documentHash)
    })

    it('builds valid chain across multiple adds', () => {
      const entry1 = addToHashChain(Buffer.from('doc1'), TEST_METADATA)
      const entry2 = addToHashChain(Buffer.from('doc2'), { ...TEST_METADATA, documentId: 'doc-002' })
      const entry3 = addToHashChain(Buffer.from('doc3'), { ...TEST_METADATA, documentId: 'doc-003' })

      // Verify chain linking is correct
      expect(entry1.previousHash).toBeNull()
      expect(entry2.previousHash).toBe(entry1.documentHash)
      expect(entry3.previousHash).toBe(entry2.documentHash)

      const allEntries = getAllHashChainEntries()
      expect(allEntries).toHaveLength(3)

      // Individual entry signatures are valid
      for (const entry of allEntries) {
        const signatureContent = `${entry.documentHash}:${entry.previousHash || 'GENESIS'}:${entry.timestamp}`
        const expectedSignature = generateSHA256FromString(signatureContent)
        expect(entry.signature).toBe(expectedSignature)
      }
    })
  })

  describe('getHashChainEntry', () => {
    it('returns entry by id', () => {
      const added = addToHashChain(Buffer.from('test'), TEST_METADATA)
      const retrieved = getHashChainEntry(added.id)

      expect(retrieved).toEqual(added)
    })

    it('returns null for unknown id', () => {
      const result = getHashChainEntry('nonexistent-id')
      expect(result).toBeNull()
    })
  })

  describe('getAllHashChainEntries', () => {
    it('returns empty array when no entries', () => {
      expect(getAllHashChainEntries()).toEqual([])
    })

    it('returns all added entries', () => {
      addToHashChain(Buffer.from('doc1'), TEST_METADATA)
      addToHashChain(Buffer.from('doc2'), { ...TEST_METADATA, documentId: 'doc-002' })

      const entries = getAllHashChainEntries()
      expect(entries).toHaveLength(2)
    })
  })

  describe('clearHashChain', () => {
    it('removes all entries', () => {
      addToHashChain(Buffer.from('doc1'), TEST_METADATA)
      addToHashChain(Buffer.from('doc2'), { ...TEST_METADATA, documentId: 'doc-002' })

      clearHashChain()
      expect(getAllHashChainEntries()).toHaveLength(0)
    })

    it('resets chain (next add has null previousHash)', () => {
      addToHashChain(Buffer.from('doc1'), TEST_METADATA)
      clearHashChain()

      const newEntry = addToHashChain(Buffer.from('new-genesis'), TEST_METADATA)
      expect(newEntry.previousHash).toBeNull()
    })
  })
})
