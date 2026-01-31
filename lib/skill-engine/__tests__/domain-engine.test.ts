/**
 * Domain Engine v4 Unit Tests
 *
 * Covers: EnginePreset, blockRegistry, PRESETS
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EnginePreset, createEnginePreset } from '../core/domain-engine'
import { blockRegistry } from '../blocks'
import { ALL_BLOCK_IDS } from '../blocks/types'
import { PRESETS, PRESET_INFO, findPresetsForBlock, getPresetBlocks, getAllPresetIds, getPresetInfo } from '../presets'

// ============================================
// DomainEngine
// ============================================

describe('EnginePreset', () => {
  let engine: EnginePreset

  beforeEach(() => {
    engine = new EnginePreset()
  })

  describe('load()', () => {
    it('loads valid BLOCKs', () => {
      engine.load(['AUTOMOTIVE', 'ENVIRONMENT'])
      expect(engine.getLoadedBlockIds()).toEqual(['AUTOMOTIVE', 'ENVIRONMENT'])
    })

    it('throws on unknown BLOCK', () => {
      expect(() => engine.load(['NONEXISTENT' as never])).toThrow('Unknown Industry BLOCK: NONEXISTENT')
    })

    it('supports chaining', () => {
      const result = engine.load(['AUTOMOTIVE'])
      expect(result).toBe(engine)
    })
  })

  describe('loadPreset()', () => {
    it('loads MANUFACTURING preset (4 BLOCKs)', () => {
      engine.loadPreset('MANUFACTURING', [...PRESETS.MANUFACTURING])
      expect(engine.getLoadedBlockIds()).toHaveLength(4)
      expect(engine.getPresetId()).toBe('MANUFACTURING')
    })

    it('loads ENVIRONMENT preset (2 BLOCKs)', () => {
      engine.loadPreset('ENVIRONMENT', [...PRESETS.ENVIRONMENT])
      expect(engine.getLoadedBlockIds()).toHaveLength(2)
    })

    it('loads FINANCE preset (10 BLOCKs — all)', () => {
      engine.loadPreset('FINANCE', [...PRESETS.FINANCE])
      expect(engine.getLoadedBlockIds()).toHaveLength(10)
    })
  })

  describe('getAllTerminology()', () => {
    it('aggregates terminology from loaded BLOCKs', () => {
      engine.load(['AUTOMOTIVE'])
      const terms = engine.getAllTerminology()
      expect(terms.length).toBeGreaterThan(0)
      expect(terms[0]).toHaveProperty('korean')
      expect(terms[0]).toHaveProperty('english')
    })

    it('returns empty when no BLOCKs loaded', () => {
      expect(engine.getAllTerminology()).toEqual([])
    })

    it('grows when more BLOCKs are loaded', () => {
      engine.load(['AUTOMOTIVE'])
      const count1 = engine.getAllTerminology().length
      engine.load(['ENVIRONMENT'])
      const count2 = engine.getAllTerminology().length
      expect(count2).toBeGreaterThan(count1)
    })
  })

  describe('run()', () => {
    it('returns error when no BLOCKs loaded', async () => {
      const result = await engine.run({ action: 'generate', data: {} })
      expect(result.success).toBe(false)
      expect(result.errors).toContain('No BLOCKs loaded. Call engine.load() or engine.loadPreset() first.')
    })

    it('runs generate action with loaded BLOCKs', async () => {
      engine.load(['AUTOMOTIVE'])
      const result = await engine.run({
        action: 'generate',
        data: { facilityName: '테스트 공장', date: '2026-01-27' },
      })
      expect(result.success).toBe(true)
      expect(result.action).toBe('generate')
      expect(result.stats.blocksLoaded).toBe(1)
      expect(result.stats.terminologyCount).toBeGreaterThan(0)
    })

    it('runs sense action', async () => {
      engine.load(['ENVIRONMENT'])
      const result = await engine.run({ action: 'sense', data: { type: 'manual', value: 100 } })
      expect(result.success).toBe(true)
      expect(result.action).toBe('sense')
    })

    it('runs process action', async () => {
      engine.load(['AUTOMOTIVE'])
      const result = await engine.run({ action: 'process', data: { OEE: 85 } })
      expect(result.success).toBe(true)
    })

    it('runs match action', async () => {
      engine.load(['AUTOMOTIVE'])
      const result = await engine.run({ action: 'match', data: { industry: '자동차' } })
      expect(result.success).toBe(true)
    })

    it('runs full pipeline (run action)', async () => {
      engine.load(['AUTOMOTIVE'])
      const result = await engine.run({
        action: 'run',
        data: { facilityName: '테스트', date: '2026-01-27' },
      })
      expect(result.success).toBe(true)
      expect(result.action).toBe('run')
    })

    it('runs verify action', async () => {
      engine.load(['AUTOMOTIVE'])
      // First generate a document to verify
      const generateResult = await engine.run({
        action: 'generate',
        data: { facilityName: '테스트 공장', date: '2026-01-27' },
      })
      expect(generateResult.success).toBe(true)

      // Now verify the generated document
      const verifyResult = await engine.run({
        action: 'verify',
        data: generateResult.data as unknown as Record<string, unknown>,
      })
      expect(verifyResult.success).toBe(true)
      expect(verifyResult.action).toBe('verify')
    })

    it('runs verify action with previousHash', async () => {
      engine.load(['AUTOMOTIVE'])
      // First generate a document
      const generateResult = await engine.run({
        action: 'generate',
        data: { facilityName: '테스트 공장', date: '2026-01-27' },
      })
      expect(generateResult.success).toBe(true)

      // Verify with a previous hash
      const docWithPrevHash = {
        ...(generateResult.data as unknown as Record<string, unknown>),
        previousHash: 'abc123previoushash',
      }

      const verifyResult = await engine.run({
        action: 'verify',
        data: docWithPrevHash,
      })
      expect(verifyResult.action).toBe('verify')
    })

    it('runs run action with verification failure scenario', async () => {
      engine.load(['AUTOMOTIVE'])
      // Run full pipeline with minimal data
      const result = await engine.run({
        action: 'run',
        data: { type: 'manual', facilityName: 'Test', date: '2026-01-27' },
      })
      // The run action includes verification step
      expect(result.action).toBe('run')
      // Check that stats are populated
      expect(result.stats).toBeDefined()
      expect(result.stats.blocksLoaded).toBeGreaterThan(0)
    })

    it('handles errors in catch block', async () => {
      engine.load(['AUTOMOTIVE'])
      // Pass invalid data that might cause an error in processing
      const result = await engine.run({
        action: 'generate',
        data: null as never, // This might trigger an error
      })
      // Should still return a result object (not throw)
      expect(result).toBeDefined()
      expect(result.action).toBe('generate')
    })

    it('match action returns results with matched terms (line 326)', async () => {
      engine.load(['AUTOMOTIVE'])
      // Use actual Korean terminology from AUTOMOTIVE block to trigger match
      // Terminology includes: '생산 부품 승인 절차', '공정 능력 지수', '통계적 공정 관리'
      const result = await engine.run({
        action: 'match',
        data: {
          industry: '자동차 제조',
          description: '생산 부품 승인 절차를 통한 품질 관리',
          keywords: ['공정 능력 지수', '통계적 공정 관리'],
        },
      })
      expect(result.success).toBe(true)
      expect(result.action).toBe('match')
      // Data should contain match results with matchedTerms
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect((result.data as unknown[]).length).toBeGreaterThan(0)
    })

    it('generate action with invalid templateId throws error (line 242-243)', async () => {
      engine.load(['AUTOMOTIVE'])
      const result = await engine.run({
        action: 'generate',
        data: { facilityName: '테스트' },
        templateId: 'NON_EXISTENT_TEMPLATE_ID',
      })
      // Should catch the error and return success: false
      expect(result.success).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
      expect(result.errors?.[0]).toContain('Template not found')
    })

    it('process action triggers validation range warning (lines 208-210)', async () => {
      engine.load(['AUTOMOTIVE'])
      // cpk has validationRange: { min: 0, max: 3 }
      // Providing a value of 5 should trigger range warning
      // Note: run() wraps input.data as records: [input.data]
      const result = await engine.run({
        action: 'process',
        data: { cpk: 5 }, // Out of range (max: 3)
      })
      expect(result.success).toBe(true)
      expect(result.action).toBe('process')
      // The validation should have triggered a warning for out-of-range value
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
      expect(result.warnings![0]).toContain('cpk')
      expect(result.warnings![0]).toContain('유효 범위 초과')
    })

    it('process action triggers validation for below min range', async () => {
      engine.load(['AUTOMOTIVE'])
      // cpk has validationRange: { min: 0, max: 3 }, value -1 is below min
      const result = await engine.run({
        action: 'process',
        data: { cpk: -1 }, // Below min (0)
      })
      expect(result.success).toBe(true)
      expect(result.action).toBe('process')
      expect(result.warnings!.length).toBeGreaterThan(0)
      expect(result.warnings![0]).toContain('유효 범위 초과')
    })
  })

  describe('reset()', () => {
    it('clears loaded BLOCKs', () => {
      engine.load(['AUTOMOTIVE'])
      engine.reset()
      expect(engine.getLoadedBlockIds()).toHaveLength(0)
      expect(engine.getPresetId()).toBeUndefined()
    })
  })

  describe('hasBlock()', () => {
    it('returns true for loaded BLOCK', () => {
      engine.load(['AUTOMOTIVE'])
      expect(engine.hasBlock('AUTOMOTIVE')).toBe(true)
    })

    it('returns false for unloaded BLOCK', () => {
      expect(engine.hasBlock('AUTOMOTIVE')).toBe(false)
    })
  })
})

describe('createEnginePreset()', () => {
  it('creates engine without blocks', () => {
    const engine = createEnginePreset()
    expect(engine.getLoadedBlockIds()).toHaveLength(0)
  })

  it('creates engine with pre-loaded blocks', () => {
    const engine = createEnginePreset(['AUTOMOTIVE', 'ENVIRONMENT'])
    expect(engine.getLoadedBlockIds()).toHaveLength(2)
  })
})

// ============================================
// Block Registry
// ============================================

describe('blockRegistry', () => {
  describe('get()', () => {
    it.each(ALL_BLOCK_IDS)('returns block for %s', (id) => {
      const block = blockRegistry.get(id)
      expect(block).toBeDefined()
      expect(block!.id).toBe(id)
      expect(block!.terminology.length).toBeGreaterThan(0)
    })

    it('returns undefined for unknown id', () => {
      expect(blockRegistry.get('NONEXISTENT' as never)).toBeUndefined()
    })
  })

  describe('getByCategory()', () => {
    it('filters manufacturing blocks', () => {
      const blocks = blockRegistry.getByCategory('manufacturing')
      expect(blocks.length).toBeGreaterThan(0)
      blocks.forEach((b) => expect(b.category).toBe('manufacturing'))
    })

    it('returns empty for unknown category', () => {
      expect(blockRegistry.getByCategory('unknown')).toEqual([])
    })
  })

  describe('getAllIds()', () => {
    it('returns all 10 block IDs (v2.1)', () => {
      expect(blockRegistry.getAllIds()).toHaveLength(10)
      expect(blockRegistry.getAllIds()).toEqual(ALL_BLOCK_IDS)
    })
  })

  describe('load()', () => {
    it('loads multiple blocks', () => {
      const blocks = blockRegistry.load(['AUTOMOTIVE', 'ELECTRONICS'])
      expect(blocks).toHaveLength(2)
    })

    it('throws on unknown block', () => {
      expect(() => blockRegistry.load(['NONEXISTENT' as never])).toThrow()
    })
  })
})

// ============================================
// Presets
// ============================================

describe('PRESETS', () => {
  it('has 6 presets', () => {
    expect(Object.keys(PRESETS)).toHaveLength(6)
  })

  it('MANUFACTURING has 4 BLOCKs', () => {
    expect(PRESETS.MANUFACTURING).toHaveLength(4)
  })

  it('ENVIRONMENT has 2 BLOCKs (v2.1)', () => {
    expect(PRESETS.ENVIRONMENT).toHaveLength(2)
  })

  it('DIGITAL has 4 BLOCKs', () => {
    expect(PRESETS.DIGITAL).toHaveLength(4)
  })

  it('FINANCE has 10 BLOCKs (all, v2.1)', () => {
    expect(PRESETS.FINANCE).toHaveLength(10)
  })

  it('STARTUP has 10 BLOCKs (all, v2.1)', () => {
    expect(PRESETS.STARTUP).toHaveLength(10)
  })

  it('EXPORT has 10 BLOCKs (all, v2.1)', () => {
    expect(PRESETS.EXPORT).toHaveLength(10)
  })

  it('all preset blocks exist in registry', () => {
    for (const [, blocks] of Object.entries(PRESETS)) {
      for (const blockId of blocks) {
        expect(blockRegistry.get(blockId)).toBeDefined()
      }
    }
  })
})

describe('PRESET_INFO', () => {
  it('has metadata for all 6 presets', () => {
    expect(Object.keys(PRESET_INFO)).toHaveLength(6)
  })

  it('blockCount matches actual array length', () => {
    for (const [key, info] of Object.entries(PRESET_INFO)) {
      expect(info.blockCount).toBe(PRESETS[key as keyof typeof PRESETS].length)
    }
  })
})

describe('findPresetsForBlock()', () => {
  it('AUTOMOTIVE appears in MANUFACTURING, FINANCE, STARTUP, EXPORT (v2.1)', () => {
    const presets = findPresetsForBlock('AUTOMOTIVE')
    expect(presets).toContain('MANUFACTURING')
    expect(presets).toContain('FINANCE')
    expect(presets).toContain('STARTUP')
    expect(presets).toContain('EXPORT')
    // v2.1: AUTOMOTIVE는 DIGITAL에서 제외됨
    expect(presets).not.toContain('DIGITAL')
  })

  it('ENVIRONMENT appears in ENVIRONMENT, FINANCE, STARTUP, EXPORT (v2.1)', () => {
    const presets = findPresetsForBlock('ENVIRONMENT')
    expect(presets).toContain('ENVIRONMENT')
    expect(presets).toContain('FINANCE')
    expect(presets).toContain('STARTUP')
    expect(presets).toContain('EXPORT')
  })
})

describe('getPresetBlocks()', () => {
  it('returns a copy (not same reference)', () => {
    const a = getPresetBlocks('MANUFACTURING')
    const b = getPresetBlocks('MANUFACTURING')
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
  })
})

describe('getAllPresetIds()', () => {
  it('returns 6 preset IDs', () => {
    expect(getAllPresetIds()).toHaveLength(6)
  })
})

describe('getPresetInfo()', () => {
  it('returns info for MANUFACTURING preset', () => {
    const info = getPresetInfo('MANUFACTURING')
    expect(info.id).toBe('MANUFACTURING')
    expect(info.name).toBe('Manufacturing')
    expect(info.nameKo).toBe('제조/스마트공장')
    expect(info.blockCount).toBe(4)
    expect(info.ministry).toBe('중기부/산업부')
    expect(info.color).toBe('blue')
  })

  it('returns info for ENVIRONMENT preset', () => {
    const info = getPresetInfo('ENVIRONMENT')
    expect(info.id).toBe('ENVIRONMENT')
    expect(info.nameKo).toBe('환경/TMS')
    expect(info.blockCount).toBe(2)  // v2.1: ENERGY→ENVIRONMENT 흡수
    expect(info.color).toBe('emerald')
  })

  it('returns info for DIGITAL preset', () => {
    const info = getPresetInfo('DIGITAL')
    expect(info.id).toBe('DIGITAL')
    expect(info.nameKo).toBe('AI/SW 바우처')
    expect(info.color).toBe('violet')
  })

  it('returns info for FINANCE preset', () => {
    const info = getPresetInfo('FINANCE')
    expect(info.blockCount).toBe(10)  // v2.1: 10개 블록
    expect(info.color).toBe('indigo')
  })

  it('returns info for STARTUP preset', () => {
    const info = getPresetInfo('STARTUP')
    expect(info.blockCount).toBe(10)  // v2.1: 10개 블록
    expect(info.color).toBe('fuchsia')
  })

  it('returns info for EXPORT preset', () => {
    const info = getPresetInfo('EXPORT')
    expect(info.blockCount).toBe(10)  // v2.1: 10개 블록
    expect(info.color).toBe('amber')
    expect(info.description).toContain('SAM.gov')
  })
})
