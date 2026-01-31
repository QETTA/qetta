/**
 * Claude Integration Tests
 *
 * Claude API 모델 전략 및 비용 최적화 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  MODEL_STRATEGY,
  getModelForTask,
  COST_SCENARIOS,
  COST_BREAKDOWN,
  CACHED_SYSTEM_PROMPTS,
  calculateCacheEfficiency,
} from '../index'

describe('MODEL_STRATEGY', () => {
  it('defines Opus for complex tasks', () => {
    expect(MODEL_STRATEGY.opus).toBeDefined()
    expect(MODEL_STRATEGY.opus.id).toContain('claude')
    expect(MODEL_STRATEGY.opus.id).toContain('opus')
    expect(MODEL_STRATEGY.opus.tasks).toBeInstanceOf(Array)
    expect(MODEL_STRATEGY.opus.tasks.length).toBeGreaterThan(0)
  })

  it('defines Sonnet for standard tasks', () => {
    expect(MODEL_STRATEGY.sonnet).toBeDefined()
    expect(MODEL_STRATEGY.sonnet.id).toContain('claude')
    expect(MODEL_STRATEGY.sonnet.id).toContain('sonnet')
    expect(MODEL_STRATEGY.sonnet.tasks).toBeInstanceOf(Array)
    expect(MODEL_STRATEGY.sonnet.tasks.length).toBeGreaterThan(0)
  })

  it('defines Haiku for simple tasks', () => {
    expect(MODEL_STRATEGY.haiku).toBeDefined()
    expect(MODEL_STRATEGY.haiku.id).toContain('claude')
    expect(MODEL_STRATEGY.haiku.id).toContain('haiku')
    expect(MODEL_STRATEGY.haiku.tasks).toBeInstanceOf(Array)
    expect(MODEL_STRATEGY.haiku.tasks.length).toBeGreaterThan(0)
  })

  it('has cost information for each tier', () => {
    expect(MODEL_STRATEGY.opus.monthlyCost).toBeDefined()
    expect(MODEL_STRATEGY.sonnet.monthlyCost).toBeDefined()
    expect(MODEL_STRATEGY.haiku.monthlyCost).toBeDefined()
  })

  it('has usage percentages for each tier', () => {
    expect(MODEL_STRATEGY.opus.usage).toBe('20%')
    expect(MODEL_STRATEGY.sonnet.usage).toBe('60%')
    expect(MODEL_STRATEGY.haiku.usage).toBe('20%')
  })
})

describe('getModelForTask', () => {
  describe('Opus tasks', () => {
    it('returns Opus for rejection_analysis', () => {
      expect(getModelForTask('rejection_analysis')).toBe(MODEL_STRATEGY.opus.id)
    })
  })

  describe('Sonnet tasks', () => {
    const sonnetTasks = ['chat', 'document_generation', 'announcement_parsing', 'matching'] as const

    sonnetTasks.forEach((task) => {
      it(`returns Sonnet for ${task}`, () => {
        expect(getModelForTask(task)).toBe(MODEL_STRATEGY.sonnet.id)
      })
    })
  })

  describe('Haiku tasks', () => {
    const haikuTasks = ['validation', 'classification', 'email_detection'] as const

    haikuTasks.forEach((task) => {
      it(`returns Haiku for ${task}`, () => {
        expect(getModelForTask(task)).toBe(MODEL_STRATEGY.haiku.id)
      })
    })
  })

  describe('default fallback', () => {
    it('returns Sonnet for unknown task', () => {
      // @ts-expect-error Testing invalid task type
      expect(getModelForTask('unknown_task_xyz')).toBe(MODEL_STRATEGY.sonnet.id)
    })

    it('returns Sonnet for empty string', () => {
      // @ts-expect-error Testing invalid empty task type
      expect(getModelForTask('')).toBe(MODEL_STRATEGY.sonnet.id)
    })
  })
})

describe('COST_SCENARIOS', () => {
  it('defines basic scenario', () => {
    expect(COST_SCENARIOS.basic).toBeDefined()
    expect(COST_SCENARIOS.basic.cost).toBe('$55/월')
    expect(COST_SCENARIOS.basic.reduction).toBe('63%')
  })

  it('defines standard scenario as recommended', () => {
    expect(COST_SCENARIOS.standard).toBeDefined()
    expect(COST_SCENARIOS.standard.recommended).toBe(true)
    expect(COST_SCENARIOS.standard.cost).toBe('$95/월')
  })

  it('defines multiAgent scenario', () => {
    expect(COST_SCENARIOS.multiAgent).toBeDefined()
    expect(COST_SCENARIOS.multiAgent.cost).toBe('$145/월')
  })
})

describe('COST_BREAKDOWN', () => {
  it('defines current and optimized costs', () => {
    expect(COST_BREAKDOWN.current).toBe('$150/월')
    expect(COST_BREAKDOWN.optimized).toBe('$55-145/월')
  })

  it('defines savings breakdown', () => {
    expect(COST_BREAKDOWN.savings.promptCaching).toBe('-20%')
    expect(COST_BREAKDOWN.savings.modelTiering).toBe('-25%')
    expect(COST_BREAKDOWN.savings.batchAPI).toBe('-18%')
  })
})

describe('CACHED_SYSTEM_PROMPTS', () => {
  it('includes base prompt with QETTA info', () => {
    expect(CACHED_SYSTEM_PROMPTS.base).toContain('QETTA')
    expect(CACHED_SYSTEM_PROMPTS.base).toContain('해시체인')
  })

  it('includes domain-specific prompts', () => {
    expect(CACHED_SYSTEM_PROMPTS.tms).toContain('TMS')
    expect(CACHED_SYSTEM_PROMPTS.tms).toContain('NOx')

    expect(CACHED_SYSTEM_PROMPTS.smartFactory).toContain('스마트공장')
    expect(CACHED_SYSTEM_PROMPTS.smartFactory).toContain('MES')

    expect(CACHED_SYSTEM_PROMPTS.aiVoucher).toContain('AI 바우처')
    expect(CACHED_SYSTEM_PROMPTS.aiVoucher).toContain('NIPA')

    expect(CACHED_SYSTEM_PROMPTS.globalTender).toContain('SAM.gov')
  })
})

describe('calculateCacheEfficiency', () => {
  it('returns 0 for zero total tokens', () => {
    expect(calculateCacheEfficiency(100, 0)).toBe(0)
  })

  it('calculates correct percentage for partial cache', () => {
    expect(calculateCacheEfficiency(50, 100)).toBe(50)
    expect(calculateCacheEfficiency(25, 100)).toBe(25)
  })

  it('returns 100 for fully cached content', () => {
    expect(calculateCacheEfficiency(1000, 1000)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    expect(calculateCacheEfficiency(33, 100)).toBe(33)
    expect(calculateCacheEfficiency(333, 1000)).toBe(33)
  })
})
