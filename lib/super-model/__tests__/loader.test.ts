import { describe, it, expect } from 'vitest'
import { getMetrics, QETTA_METRICS, getEnginePresets, getIndustryBlocks } from '../loader'

describe('getMetrics', () => {
  it('returns all 6 core metrics', () => {
    const metrics = getMetrics()
    expect(Object.keys(metrics)).toHaveLength(6)
  })

  it('returns correct metric values', () => {
    const metrics = getMetrics()
    expect(metrics.timeReduction).toBe('93.8%')
    expect(metrics.rejectionReduction).toBe('91%')
    expect(metrics.generationSpeed).toBe('45초/건')
    expect(metrics.apiUptime).toBe('99.9%')
    expect(metrics.accuracy).toBe('99.2%')
    expect(metrics.globalTenderDB).toBe('630,000+')
  })
})

describe('QETTA_METRICS constant', () => {
  it('matches getMetrics values', () => {
    expect(QETTA_METRICS.TIME_REDUCTION).toBe('93.8%')
    expect(QETTA_METRICS.REJECTION_REDUCTION).toBe('91%')
    expect(QETTA_METRICS.GENERATION_SPEED).toBe('45초/건')
    expect(QETTA_METRICS.API_UPTIME).toBe('99.9%')
    expect(QETTA_METRICS.ACCURACY).toBe('99.2%')
    expect(QETTA_METRICS.GLOBAL_TENDER_DB).toBe('630,000+')
  })
})

describe('getEnginePresets', () => {
  it('returns 6 domain engines', () => {
    const engines = getEnginePresets()
    expect(engines).toHaveLength(6)
  })

  it('contains all expected engine IDs', () => {
    const engines = getEnginePresets()
    const ids = engines.map(e => e.id)
    expect(ids).toContain('MANUFACTURING')
    expect(ids).toContain('ENVIRONMENT')
    expect(ids).toContain('DIGITAL')
    expect(ids).toContain('FINANCE')
    expect(ids).toContain('STARTUP')
    expect(ids).toContain('EXPORT')
  })

  it('each engine has required fields', () => {
    for (const engine of getEnginePresets()) {
      expect(engine.id).toBeTruthy()
      expect(engine.name).toBeTruthy()
      expect(engine.color).toBeTruthy()
      expect(engine.description).toBeTruthy()
      expect(engine.industryBlocks.length).toBeGreaterThan(0)
      expect(engine.templates.length).toBeGreaterThan(0)
      expect(engine.regulatoryBody).toBeTruthy()
    }
  })
})

describe('getIndustryBlocks', () => {
  it('returns 10 industry blocks', () => {
    expect(getIndustryBlocks()).toHaveLength(10)
  })

  it('each block has required fields (line 155)', () => {
    const blocks = getIndustryBlocks()
    for (const block of blocks) {
      expect(block.id).toBeTruthy()
      expect(block.name).toBeTruthy()
      expect(block.category).toBeTruthy()
      expect(block.description).toBeTruthy()
      expect(block.templates.length).toBeGreaterThan(0)
      expect(block.keywords.length).toBeGreaterThan(0)
      expect(block.regulatoryBodies.length).toBeGreaterThan(0)
      expect(block.color).toBeTruthy()
    }
  })

  it('contains all expected block categories', () => {
    const blocks = getIndustryBlocks()
    const categories = blocks.map((b) => b.category)
    expect(categories).toContain('manufacturing')
    expect(categories).toContain('healthcare')
    expect(categories).toContain('energyEnvironment')
  })
})
