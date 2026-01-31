import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  cacheDocument,
  getDocumentFromCache,
  deleteFromCache,
  cleanupCache,
  getCacheStats,
  clearCache,
  MAX_CACHE_ENTRIES,
  // KidsMap 확장 함수
  createContentHash,
  getCacheKeyByContentHash,
  getDocumentWithSWR,
  getDocumentByContentHash,
  getCacheStatsExtended,
  resetCacheStats,
  SEMANTIC_CACHE_TTL_MS,
  STALE_TTL_MS,
} from '../cache'

function makeBuffer(content: string): Buffer {
  return Buffer.from(content)
}

describe('Document Cache', () => {
  beforeEach(() => {
    clearCache()
  })

  describe('cacheDocument / getDocumentFromCache', () => {
    it('stores and retrieves a document', () => {
      cacheDocument('doc-1', makeBuffer('hello'), 'text/plain', 'hello.txt')

      const result = getDocumentFromCache('doc-1')
      expect(result).not.toBeNull()
      expect(result!.filename).toBe('hello.txt')
      expect(result!.mimeType).toBe('text/plain')
      expect(result!.buffer.toString()).toBe('hello')
    })

    it('returns null for non-existent key', () => {
      expect(getDocumentFromCache('nonexistent')).toBeNull()
    })

    it('overwrites existing entry with same key', () => {
      cacheDocument('doc-1', makeBuffer('v1'), 'text/plain', 'v1.txt')
      cacheDocument('doc-1', makeBuffer('v2'), 'text/plain', 'v2.txt')

      const result = getDocumentFromCache('doc-1')
      expect(result!.buffer.toString()).toBe('v2')
    })
  })

  describe('TTL expiration', () => {
    it('returns null for expired entries', () => {
      cacheDocument('expired', makeBuffer('data'), 'text/plain', 'file.txt')

      // Manually expire the entry by mocking Date.now
      const realNow = Date.now
      Date.now = () => realNow() + 2 * 60 * 60 * 1000 // 2 hours later

      const result = getDocumentFromCache('expired')
      expect(result).toBeNull()

      Date.now = realNow
    })
  })

  describe('deleteFromCache', () => {
    it('deletes existing entry and returns true', () => {
      cacheDocument('doc-del', makeBuffer('data'), 'text/plain', 'f.txt')
      expect(deleteFromCache('doc-del')).toBe(true)
      expect(getDocumentFromCache('doc-del')).toBeNull()
    })

    it('returns false for non-existent entry', () => {
      expect(deleteFromCache('nope')).toBe(false)
    })
  })

  describe('cleanupCache', () => {
    it('removes expired entries past STALE_TTL', () => {
      cacheDocument('fresh', makeBuffer('data'), 'text/plain', 'f.txt')
      cacheDocument('stale', makeBuffer('data'), 'text/plain', 'f.txt')

      // Expire entries by manipulating time past both TTL and STALE_TTL
      // TTL = 1hr, STALE_TTL = 1hr, so need 2+ hours
      const realNow = Date.now
      Date.now = () => realNow() + 3 * 60 * 60 * 1000 // 3 hours

      cleanupCache()

      // Both should be fully expired at this point
      Date.now = realNow
      // Re-add fresh one
      cacheDocument('fresh2', makeBuffer('data'), 'text/plain', 'f.txt')

      expect(getCacheStats().count).toBe(1) // only fresh2
    })
  })

  describe('getCacheStats', () => {
    it('returns correct count and size', () => {
      cacheDocument('s1', makeBuffer('abc'), 'text/plain', 'a.txt')
      cacheDocument('s2', makeBuffer('defgh'), 'text/plain', 'b.txt')

      const stats = getCacheStats()
      expect(stats.count).toBe(2)
      expect(stats.totalSizeBytes).toBe(8) // 3 + 5
    })
  })

  describe('MAX_CACHE_ENTRIES eviction', () => {
    it('evicts oldest entry when cache is full', () => {
      // Fill cache to max
      for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
        cacheDocument(`doc-${i}`, makeBuffer(`data-${i}`), 'text/plain', `file-${i}.txt`)
      }

      expect(getCacheStats().count).toBe(MAX_CACHE_ENTRIES)

      // Add one more — should trigger eviction
      cacheDocument('overflow', makeBuffer('new'), 'text/plain', 'overflow.txt')

      expect(getCacheStats().count).toBe(MAX_CACHE_ENTRIES)
      expect(getDocumentFromCache('overflow')).not.toBeNull()
    })

    it('does not evict when updating existing key', () => {
      for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
        cacheDocument(`doc-${i}`, makeBuffer(`data-${i}`), 'text/plain', `file-${i}.txt`)
      }

      // Update existing key — should NOT evict
      cacheDocument('doc-0', makeBuffer('updated'), 'text/plain', 'file-0.txt')

      expect(getCacheStats().count).toBe(MAX_CACHE_ENTRIES)
      expect(getDocumentFromCache('doc-0')!.buffer.toString()).toBe('updated')
    })
  })

  describe('clearCache', () => {
    it('removes all entries', () => {
      cacheDocument('a', makeBuffer('x'), 'text/plain', 'a.txt')
      cacheDocument('b', makeBuffer('y'), 'text/plain', 'b.txt')

      clearCache()
      expect(getCacheStats().count).toBe(0)
    })
  })
})

// ============================================
// KidsMap LRU Optimization Tests
// ============================================

describe('KidsMap: createContentHash', () => {
  beforeEach(() => {
    clearCache()
  })

  it('generates consistent hash for same input', () => {
    const hash1 = createContentHash('DIGITAL', 'proposal', { companyName: 'Test Inc' })
    const hash2 = createContentHash('DIGITAL', 'proposal', { companyName: 'Test Inc' })
    expect(hash1).toBe(hash2)
  })

  it('generates different hash for different inputs', () => {
    const hash1 = createContentHash('DIGITAL', 'proposal', { companyName: 'Test Inc' })
    const hash2 = createContentHash('BIOTECH', 'proposal', { companyName: 'Test Inc' })
    const hash3 = createContentHash('DIGITAL', 'report', { companyName: 'Test Inc' })

    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hash3)
  })

  it('handles undefined metadata', () => {
    const hash1 = createContentHash('DIGITAL', 'proposal')
    const hash2 = createContentHash('DIGITAL', 'proposal', undefined)
    expect(hash1).toBe(hash2)
  })

  it('normalizes metadata key order', () => {
    const hash1 = createContentHash('DIGITAL', 'proposal', { a: 1, b: 2 })
    const hash2 = createContentHash('DIGITAL', 'proposal', { b: 2, a: 1 })
    expect(hash1).toBe(hash2)
  })

  it('returns 16-character hash', () => {
    const hash = createContentHash('DIGITAL', 'proposal', { test: 'data' })
    expect(hash).toHaveLength(16)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })
})

describe('KidsMap: Content Hash Index', () => {
  beforeEach(() => {
    clearCache()
  })

  it('registers contentHash in index when caching', () => {
    const contentHash = createContentHash('DIGITAL', 'proposal', { id: 1 })

    cacheDocument('doc-1', makeBuffer('data'), 'text/plain', 'file.txt', {
      contentHash,
      requestMeta: { enginePreset: 'DIGITAL', documentType: 'proposal' },
    })

    const cacheKey = getCacheKeyByContentHash(contentHash)
    expect(cacheKey).toBe('doc-1')
  })

  it('updates contentHash index on overwrite', () => {
    const hash1 = 'hash-old'
    const hash2 = 'hash-new'

    cacheDocument('doc-1', makeBuffer('v1'), 'text/plain', 'file.txt', { contentHash: hash1 })
    cacheDocument('doc-1', makeBuffer('v2'), 'text/plain', 'file.txt', { contentHash: hash2 })

    expect(getCacheKeyByContentHash(hash1)).toBeUndefined()
    expect(getCacheKeyByContentHash(hash2)).toBe('doc-1')
  })

  it('removes contentHash from index on delete', () => {
    const contentHash = 'test-hash'
    cacheDocument('doc-1', makeBuffer('data'), 'text/plain', 'file.txt', { contentHash })

    expect(getCacheKeyByContentHash(contentHash)).toBe('doc-1')

    deleteFromCache('doc-1')
    expect(getCacheKeyByContentHash(contentHash)).toBeUndefined()
  })
})

describe('KidsMap: Stale-While-Revalidate (SWR)', () => {
  beforeEach(() => {
    clearCache()
  })

  it('returns fresh hit for non-expired entry', () => {
    cacheDocument('doc-1', makeBuffer('fresh'), 'text/plain', 'file.txt')

    const result = getDocumentWithSWR('doc-1')
    expect(result.hitType).toBe('hit')
    expect(result.isStale).toBe(false)
    expect(result.data?.buffer.toString()).toBe('fresh')
  })

  it('returns stale hit for expired entry within STALE_TTL', () => {
    cacheDocument('doc-1', makeBuffer('stale-data'), 'text/plain', 'file.txt')

    // Time travel: past TTL but within STALE_TTL
    const realNow = Date.now
    const originalTime = realNow()
    Date.now = () => originalTime + 61 * 60 * 1000 // 61 minutes (TTL=1hr, STALE_TTL=1hr)

    const result = getDocumentWithSWR('doc-1')
    expect(result.hitType).toBe('stale')
    expect(result.isStale).toBe(true)
    expect(result.data?.buffer.toString()).toBe('stale-data')

    Date.now = realNow
  })

  it('returns miss for entry past STALE_TTL', () => {
    cacheDocument('doc-1', makeBuffer('expired'), 'text/plain', 'file.txt')

    // Time travel: past both TTL and STALE_TTL
    const realNow = Date.now
    const originalTime = realNow()
    Date.now = () => originalTime + 3 * 60 * 60 * 1000 // 3 hours

    const result = getDocumentWithSWR('doc-1')
    expect(result.hitType).toBe('miss')
    expect(result.isStale).toBe(false)
    expect(result.data).toBeNull()

    Date.now = realNow
  })

  it('returns miss for non-existent key', () => {
    const result = getDocumentWithSWR('nonexistent')
    expect(result.hitType).toBe('miss')
    expect(result.data).toBeNull()
  })
})

describe('KidsMap: getDocumentByContentHash', () => {
  beforeEach(() => {
    clearCache()
  })

  it('retrieves document by content hash', () => {
    const contentHash = createContentHash('DIGITAL', 'proposal', { id: 123 })

    cacheDocument('doc-xyz', makeBuffer('content'), 'text/plain', 'file.txt', {
      contentHash,
      requestMeta: { enginePreset: 'DIGITAL', documentType: 'proposal' },
    })

    const result = getDocumentByContentHash(contentHash)
    expect(result.hitType).toBe('hit')
    expect(result.data?.buffer.toString()).toBe('content')
  })

  it('returns miss for unknown content hash', () => {
    const result = getDocumentByContentHash('unknown-hash')
    expect(result.hitType).toBe('miss')
    expect(result.data).toBeNull()
  })
})

describe('KidsMap: Extended Cache Statistics', () => {
  beforeEach(() => {
    clearCache()
  })

  it('tracks hit count', () => {
    cacheDocument('doc-1', makeBuffer('data'), 'text/plain', 'file.txt')

    getDocumentFromCache('doc-1') // hit
    getDocumentFromCache('doc-1') // hit
    getDocumentFromCache('doc-1') // hit

    const stats = getCacheStatsExtended()
    expect(stats.hitCount).toBe(3)
  })

  it('tracks miss count', () => {
    getDocumentFromCache('nonexistent-1') // miss
    getDocumentFromCache('nonexistent-2') // miss

    const stats = getCacheStatsExtended()
    expect(stats.missCount).toBe(2)
  })

  it('calculates hit rate correctly', () => {
    cacheDocument('doc-1', makeBuffer('data'), 'text/plain', 'file.txt')

    // 3 hits + 1 miss = 75% hit rate
    getDocumentFromCache('doc-1') // hit
    getDocumentFromCache('doc-1') // hit
    getDocumentFromCache('doc-1') // hit
    getDocumentFromCache('nonexistent') // miss

    const stats = getCacheStatsExtended()
    expect(stats.hitRate).toBe(75)
  })

  it('resets statistics on clearCache', () => {
    cacheDocument('doc-1', makeBuffer('data'), 'text/plain', 'file.txt')
    getDocumentFromCache('doc-1')
    getDocumentFromCache('nonexistent')

    clearCache()

    const stats = getCacheStatsExtended()
    expect(stats.hitCount).toBe(0)
    expect(stats.missCount).toBe(0)
    expect(stats.staleHitCount).toBe(0)
  })

  it('resets statistics on resetCacheStats', () => {
    cacheDocument('doc-1', makeBuffer('data'), 'text/plain', 'file.txt')
    getDocumentFromCache('doc-1')

    resetCacheStats()

    const stats = getCacheStatsExtended()
    expect(stats.hitCount).toBe(0)
    expect(stats.count).toBe(1) // cache entries remain
  })
})

describe('KidsMap: Semantic Cache TTL', () => {
  beforeEach(() => {
    clearCache()
  })

  it('uses 7-day TTL with useSemanticTTL option', () => {
    cacheDocument('doc-1', makeBuffer('semantic'), 'text/plain', 'file.txt', {
      useSemanticTTL: true,
    })

    // Time travel: 6 days later (should still be valid)
    const realNow = Date.now
    const originalTime = realNow()
    Date.now = () => originalTime + 6 * 24 * 60 * 60 * 1000 // 6 days

    const result = getDocumentFromCache('doc-1')
    expect(result).not.toBeNull()
    expect(result?.buffer.toString()).toBe('semantic')

    Date.now = realNow
  })

  it('expires after 7 days with useSemanticTTL', () => {
    cacheDocument('doc-1', makeBuffer('expired'), 'text/plain', 'file.txt', {
      useSemanticTTL: true,
    })

    // Time travel: 8 days later (should be expired)
    const realNow = Date.now
    const originalTime = realNow()
    Date.now = () => originalTime + 8 * 24 * 60 * 60 * 1000 // 8 days

    const result = getDocumentFromCache('doc-1')
    expect(result).toBeNull()

    Date.now = realNow
  })
})

describe('KidsMap: LRU Eviction by Access Time', () => {
  beforeEach(() => {
    clearCache()
  })

  it('evicts least recently used entry', () => {
    // Fill cache to capacity
    for (let i = 0; i < MAX_CACHE_ENTRIES; i++) {
      cacheDocument(`doc-${i}`, makeBuffer(`data-${i}`), 'text/plain', `file-${i}.txt`)
    }

    // Access doc-0 to make it recently used
    getDocumentFromCache('doc-0')

    // Add new entry - should evict doc-1 (oldest unused), not doc-0
    cacheDocument('overflow', makeBuffer('new'), 'text/plain', 'overflow.txt')

    // doc-0 should still exist (recently accessed)
    expect(getDocumentFromCache('doc-0')).not.toBeNull()
  })
})
