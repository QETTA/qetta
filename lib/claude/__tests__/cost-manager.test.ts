import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CLAUDE_PRICING,
  getCostManager,
  initCostManager,
  estimateCost,
  selectModelWithBudget,
  formatCost,
  formatTokens,
} from '../cost-manager'
import type { ClaudeModelId, BudgetConfig } from '../cost-manager'

// ============================================
// CLAUDE_PRICING Constants Tests
// ============================================

describe('CLAUDE_PRICING', () => {
  it('defines pricing for all three Claude models', () => {
    expect(CLAUDE_PRICING['claude-opus-4-5-20251101']).toBeDefined()
    expect(CLAUDE_PRICING['claude-sonnet-4-20250514']).toBeDefined()
    expect(CLAUDE_PRICING['claude-haiku-4-20250514']).toBeDefined()
  })

  it('has correct Opus pricing rates (per million tokens)', () => {
    const opus = CLAUDE_PRICING['claude-opus-4-5-20251101']
    expect(opus.input).toBe(15.0) // $15/MTok
    expect(opus.output).toBe(75.0) // $75/MTok
    expect(opus.cachedInput).toBe(1.5) // 90% discount
    expect(opus.extendedThinking).toBe(15.0) // thinking tokens at input rate
  })

  it('has correct Sonnet pricing rates (per million tokens)', () => {
    const sonnet = CLAUDE_PRICING['claude-sonnet-4-20250514']
    expect(sonnet.input).toBe(3.0) // $3/MTok
    expect(sonnet.output).toBe(15.0) // $15/MTok
    expect(sonnet.cachedInput).toBe(0.3) // 90% discount
  })

  it('has correct Haiku pricing rates (per million tokens)', () => {
    const haiku = CLAUDE_PRICING['claude-haiku-4-20250514']
    expect(haiku.input).toBe(0.25) // $0.25/MTok
    expect(haiku.output).toBe(1.25) // $1.25/MTok
    expect(haiku.cachedInput).toBe(0.025) // 90% discount
  })

  it('cachedInput is 10% of input price (90% discount)', () => {
    // Verify discount calculation for all models
    for (const [modelId, pricing] of Object.entries(CLAUDE_PRICING)) {
      const expectedCached = pricing.input * 0.1
      expect(pricing.cachedInput).toBeCloseTo(expectedCached, 5)
    }
  })

  it('only Opus has extendedThinking pricing', () => {
    expect('extendedThinking' in CLAUDE_PRICING['claude-opus-4-5-20251101']).toBe(true)
    expect('extendedThinking' in CLAUDE_PRICING['claude-sonnet-4-20250514']).toBe(false)
    expect('extendedThinking' in CLAUDE_PRICING['claude-haiku-4-20250514']).toBe(false)
  })
})

// ============================================
// CostManager.calculateCost Tests
// ============================================

describe('CostManager.calculateCost', () => {
  beforeEach(() => {
    initCostManager()
  })

  it('calculates cost for simple input/output tokens', () => {
    const manager = getCostManager()
    // 1M input + 1M output with Sonnet: $3 + $15 = $18
    const cost = manager.calculateCost(
      'claude-sonnet-4-20250514',
      1_000_000,
      1_000_000
    )
    expect(cost).toBeCloseTo(18.0, 2)
  })

  it('calculates cost with cached input tokens', () => {
    const manager = getCostManager()
    // 1M input (500K cached) + 500K output with Sonnet
    // Regular: 500K * $3/M = $1.5
    // Cached: 500K * $0.3/M = $0.15
    // Output: 500K * $15/M = $7.5
    // Total: $9.15
    const cost = manager.calculateCost(
      'claude-sonnet-4-20250514',
      1_000_000,
      500_000,
      500_000
    )
    expect(cost).toBeCloseTo(9.15, 2)
  })

  it('calculates cost with extended thinking tokens (Opus only)', () => {
    const manager = getCostManager()
    // 100K input + 50K output + 200K thinking with Opus
    // Input: 100K * $15/M = $1.5
    // Output: 50K * $75/M = $3.75
    // Thinking: 200K * $15/M = $3.0
    // Total: $8.25
    const cost = manager.calculateCost(
      'claude-opus-4-5-20251101',
      100_000,
      50_000,
      0,
      200_000
    )
    expect(cost).toBeCloseTo(8.25, 2)
  })

  it('ignores thinking tokens for non-Opus models', () => {
    const manager = getCostManager()
    // With Sonnet, thinking tokens should be ignored
    const costWithThinking = manager.calculateCost(
      'claude-sonnet-4-20250514',
      100_000,
      50_000,
      0,
      200_000 // This should be ignored
    )
    const costWithoutThinking = manager.calculateCost(
      'claude-sonnet-4-20250514',
      100_000,
      50_000,
      0,
      0
    )
    expect(costWithThinking).toBeCloseTo(costWithoutThinking, 5)
  })

  it('handles zero tokens gracefully', () => {
    const manager = getCostManager()
    const cost = manager.calculateCost('claude-sonnet-4-20250514', 0, 0, 0, 0)
    expect(cost).toBe(0)
  })

  it('uses Sonnet pricing for unknown model (with warning)', () => {
    const manager = getCostManager()
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // @ts-expect-error - Testing unknown model
    const cost = manager.calculateCost('claude-unknown-model', 1_000_000, 1_000_000)

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown model'))
    expect(cost).toBeCloseTo(18.0, 2) // Sonnet pricing
    consoleSpy.mockRestore()
  })

  it('calculates Haiku costs correctly (cheapest model)', () => {
    const manager = getCostManager()
    // 1M input + 1M output with Haiku: $0.25 + $1.25 = $1.50
    const cost = manager.calculateCost(
      'claude-haiku-4-20250514',
      1_000_000,
      1_000_000
    )
    expect(cost).toBeCloseTo(1.5, 2)
  })
})

// ============================================
// estimateCost Function Tests
// ============================================

describe('estimateCost', () => {
  beforeEach(() => {
    initCostManager()
  })

  it('estimates cost with default 70% cache hit rate', () => {
    // 1M input with 70% cached + 500K output with Sonnet
    // Regular: 300K * $3/M = $0.9
    // Cached: 700K * $0.3/M = $0.21
    // Output: 500K * $15/M = $7.5
    // Total: $8.61
    const cost = estimateCost('claude-sonnet-4-20250514', 1_000_000, 500_000)
    expect(cost).toBeCloseTo(8.61, 2)
  })

  it('estimates cost with custom cache hit rate', () => {
    // 1M input with 50% cached + 500K output with Sonnet
    // Regular: 500K * $3/M = $1.5
    // Cached: 500K * $0.3/M = $0.15
    // Output: 500K * $15/M = $7.5
    // Total: $9.15
    const cost = estimateCost('claude-sonnet-4-20250514', 1_000_000, 500_000, 0.5)
    expect(cost).toBeCloseTo(9.15, 2)
  })

  it('estimates cost with 0% cache hit rate', () => {
    // 1M input with 0% cached + 500K output with Sonnet
    // Regular: 1M * $3/M = $3
    // Cached: 0 * $0.3/M = $0
    // Output: 500K * $15/M = $7.5
    // Total: $10.5
    const cost = estimateCost('claude-sonnet-4-20250514', 1_000_000, 500_000, 0)
    expect(cost).toBeCloseTo(10.5, 2)
  })

  it('estimates cost with 100% cache hit rate', () => {
    // 1M input with 100% cached + 500K output with Sonnet
    // Regular: 0 * $3/M = $0
    // Cached: 1M * $0.3/M = $0.3
    // Output: 500K * $15/M = $7.5
    // Total: $7.8
    const cost = estimateCost('claude-sonnet-4-20250514', 1_000_000, 500_000, 1.0)
    expect(cost).toBeCloseTo(7.8, 2)
  })
})

// ============================================
// Budget Checking Logic Tests
// ============================================

describe('Budget checking logic', () => {
  beforeEach(() => {
    initCostManager()
  })

  it('tracks daily usage correctly', () => {
    const manager = getCostManager({ dailyLimit: 100, monthlyLimit: 500 })
    manager.clearHistory()

    // Record some usage
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    const summary = manager.getSummary()
    expect(summary.daily.requests).toBe(2)
    expect(summary.daily.cost).toBeGreaterThan(0)
  })

  it('detects when daily budget is exceeded', () => {
    const manager = getCostManager({ dailyLimit: 0.01, monthlyLimit: 500 })
    manager.clearHistory()

    // Record usage that exceeds daily limit
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    const summary = manager.getSummary()
    expect(summary.budgetStatus.isOverDaily).toBe(true)
    expect(summary.budgetStatus.dailyUsedPercent).toBeGreaterThan(100)
  })

  it('detects when monthly budget is exceeded', () => {
    const manager = getCostManager({ dailyLimit: 100, monthlyLimit: 0.01 })
    manager.clearHistory()

    // Record usage that exceeds monthly limit
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    const summary = manager.getSummary()
    expect(summary.budgetStatus.isOverMonthly).toBe(true)
    expect(summary.budgetStatus.monthlyUsedPercent).toBeGreaterThan(100)
  })

  it('calculates remaining budget correctly', () => {
    const manager = getCostManager({ dailyLimit: 50, monthlyLimit: 500 })
    manager.clearHistory()

    const initialRemaining = manager.getRemainingBudget()
    expect(initialRemaining.daily).toBe(50)
    expect(initialRemaining.monthly).toBe(500)

    // Record some usage
    manager.recordUsage('claude-sonnet-4-20250514', 1_000_000, 500_000, 'test')

    const afterRemaining = manager.getRemainingBudget()
    expect(afterRemaining.daily).toBeLessThan(50)
    expect(afterRemaining.monthly).toBeLessThan(500)
  })

  it('remaining budget never goes negative', () => {
    const manager = getCostManager({ dailyLimit: 0.001, monthlyLimit: 0.001 })
    manager.clearHistory()

    // Record usage that far exceeds limit
    manager.recordUsage('claude-opus-4-5-20251101', 1_000_000, 500_000, 'expensive')

    const remaining = manager.getRemainingBudget()
    expect(remaining.daily).toBe(0)
    expect(remaining.monthly).toBe(0)
  })
})

// ============================================
// Alert Threshold Detection Tests
// ============================================

describe('Alert threshold detection (80%)', () => {
  beforeEach(() => {
    initCostManager()
  })

  it('triggers alert when 80% of daily budget is used', () => {
    const manager = getCostManager({
      dailyLimit: 1.0,
      monthlyLimit: 500,
      alertThreshold: 0.8,
    })
    manager.clearHistory()

    let alertTriggered = false
    manager.onAlert(() => {
      alertTriggered = true
    })

    // Use 85% of daily budget (Sonnet: 100K in + 50K out ~ $1.05)
    // Need to calculate exact amount to hit 80%+
    // With $1 daily limit, need > $0.80
    // Sonnet: 100K input = $0.30, 50K output = $0.75 = $1.05 total
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    expect(alertTriggered).toBe(true)
  })

  it('triggers alert when 80% of monthly budget is used', () => {
    const manager = getCostManager({
      dailyLimit: 100,
      monthlyLimit: 1.0,
      alertThreshold: 0.8,
    })
    manager.clearHistory()

    let alertTriggered = false
    manager.onAlert(() => {
      alertTriggered = true
    })

    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    expect(alertTriggered).toBe(true)
  })

  it('does not trigger alert below 80% threshold', () => {
    const manager = getCostManager({
      dailyLimit: 100,
      monthlyLimit: 500,
      alertThreshold: 0.8,
    })
    manager.clearHistory()

    let alertTriggered = false
    manager.onAlert(() => {
      alertTriggered = true
    })

    // Small usage that won't exceed 80%
    manager.recordUsage('claude-haiku-4-20250514', 1000, 500, 'test')

    expect(alertTriggered).toBe(false)
  })

  it('handles custom alert threshold', () => {
    const manager = getCostManager({
      dailyLimit: 1.0,
      monthlyLimit: 500,
      alertThreshold: 0.5, // 50% threshold
    })
    manager.clearHistory()

    let alertCount = 0
    manager.onAlert(() => {
      alertCount++
    })

    // Use > 50% of daily budget
    manager.recordUsage('claude-sonnet-4-20250514', 50_000, 25_000, 'test')

    expect(alertCount).toBeGreaterThan(0)
  })

  it('handles multiple alert callbacks', () => {
    const manager = getCostManager({
      dailyLimit: 1.0,
      monthlyLimit: 500,
      alertThreshold: 0.8,
    })
    manager.clearHistory()

    let callback1Called = false
    let callback2Called = false

    manager.onAlert(() => {
      callback1Called = true
    })
    manager.onAlert(() => {
      callback2Called = true
    })

    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    expect(callback1Called).toBe(true)
    expect(callback2Called).toBe(true)
  })

  it('continues even if alert callback throws error', () => {
    const manager = getCostManager({
      dailyLimit: 1.0,
      monthlyLimit: 500,
      alertThreshold: 0.8,
    })
    manager.clearHistory()

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    manager.onAlert(() => {
      throw new Error('Callback error')
    })

    // Should not throw
    expect(() => {
      manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')
    }).not.toThrow()

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

// ============================================
// Auto-fallback Model Selection Tests
// ============================================

describe('Auto-fallback model selection (Opus -> Sonnet -> Haiku)', () => {
  beforeEach(() => {
    initCostManager()
  })

  it('returns preferred model when within budget', () => {
    const manager = getCostManager({
      dailyLimit: 100,
      monthlyLimit: 500,
      autoFallback: true,
    })
    manager.clearHistory()

    const model = manager.getModelWithBudgetCheck(
      'claude-opus-4-5-20251101',
      'rejection_analysis'
    )
    expect(model).toBe('claude-opus-4-5-20251101')
  })

  it('downgrades Opus to Sonnet when budget exceeded', () => {
    const manager = getCostManager({
      dailyLimit: 0.001,
      monthlyLimit: 500,
      autoFallback: true,
    })
    manager.clearHistory()

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Exceed budget
    manager.recordUsage('claude-opus-4-5-20251101', 100_000, 50_000, 'test')

    const model = manager.getModelWithBudgetCheck(
      'claude-opus-4-5-20251101',
      'rejection_analysis'
    )
    expect(model).toBe('claude-sonnet-4-20250514')
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('downgrading'))

    consoleSpy.mockRestore()
  })

  it('downgrades Sonnet to Haiku when budget exceeded', () => {
    const manager = getCostManager({
      dailyLimit: 0.001,
      monthlyLimit: 500,
      autoFallback: true,
    })
    manager.clearHistory()

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Exceed budget
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    const model = manager.getModelWithBudgetCheck(
      'claude-sonnet-4-20250514',
      'chat'
    )
    expect(model).toBe('claude-haiku-4-20250514')

    consoleSpy.mockRestore()
  })

  it('keeps Haiku as Haiku (cannot downgrade further)', () => {
    const manager = getCostManager({
      dailyLimit: 0.001,
      monthlyLimit: 500,
      autoFallback: true,
    })
    manager.clearHistory()

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Exceed budget
    manager.recordUsage('claude-haiku-4-20250514', 100_000, 50_000, 'test')

    const model = manager.getModelWithBudgetCheck(
      'claude-haiku-4-20250514',
      'validation'
    )
    expect(model).toBe('claude-haiku-4-20250514')

    consoleSpy.mockRestore()
  })

  it('does not fallback when autoFallback is disabled', () => {
    const manager = getCostManager({
      dailyLimit: 0.001,
      monthlyLimit: 500,
      autoFallback: false,
    })
    manager.clearHistory()

    // Exceed budget
    manager.recordUsage('claude-opus-4-5-20251101', 100_000, 50_000, 'test')

    const model = manager.getModelWithBudgetCheck(
      'claude-opus-4-5-20251101',
      'rejection_analysis'
    )
    // Should return preferred model even when over budget
    expect(model).toBe('claude-opus-4-5-20251101')
  })

  it('fallback applies based on monthly budget too', () => {
    const manager = getCostManager({
      dailyLimit: 1000, // High daily limit
      monthlyLimit: 0.001, // Very low monthly limit
      autoFallback: true,
    })
    manager.clearHistory()

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Exceed monthly budget
    manager.recordUsage('claude-opus-4-5-20251101', 100_000, 50_000, 'test')

    const model = manager.getModelWithBudgetCheck(
      'claude-opus-4-5-20251101',
      'rejection_analysis'
    )
    expect(model).toBe('claude-sonnet-4-20250514')

    consoleSpy.mockRestore()
  })
})

// ============================================
// selectModelWithBudget Function Tests
// ============================================

describe('selectModelWithBudget', () => {
  beforeEach(() => {
    initCostManager({ dailyLimit: 100, monthlyLimit: 500, autoFallback: true })
  })

  it('selects Opus for rejection_analysis', () => {
    const manager = getCostManager()
    manager.clearHistory()

    const model = selectModelWithBudget('rejection_analysis')
    expect(model).toBe('claude-opus-4-5-20251101')
  })

  it('selects Sonnet for chat', () => {
    const manager = getCostManager()
    manager.clearHistory()

    const model = selectModelWithBudget('chat')
    expect(model).toBe('claude-sonnet-4-20250514')
  })

  it('selects Haiku for validation', () => {
    const manager = getCostManager()
    manager.clearHistory()

    const model = selectModelWithBudget('validation')
    expect(model).toBe('claude-haiku-4-20250514')
  })
})

// ============================================
// Formatting Utility Tests
// ============================================

describe('formatCost', () => {
  it('formats very small costs as <$0.01', () => {
    expect(formatCost(0.001)).toBe('<$0.01')
    expect(formatCost(0.009)).toBe('<$0.01')
  })

  it('formats costs less than $1 with two decimals', () => {
    expect(formatCost(0.01)).toBe('$0.01')
    expect(formatCost(0.50)).toBe('$0.50')
    expect(formatCost(0.99)).toBe('$0.99')
  })

  it('formats costs $1 and above with two decimals', () => {
    expect(formatCost(1.0)).toBe('$1.00')
    expect(formatCost(10.5)).toBe('$10.50')
    expect(formatCost(100.99)).toBe('$100.99')
  })
})

describe('formatTokens', () => {
  it('formats tokens under 1000 as plain numbers', () => {
    expect(formatTokens(0)).toBe('0')
    expect(formatTokens(999)).toBe('999')
  })

  it('formats tokens in thousands with K suffix', () => {
    expect(formatTokens(1000)).toBe('1.0K')
    expect(formatTokens(1500)).toBe('1.5K')
    expect(formatTokens(999_999)).toBe('1000.0K')
  })

  it('formats tokens in millions with M suffix', () => {
    expect(formatTokens(1_000_000)).toBe('1.00M')
    expect(formatTokens(2_500_000)).toBe('2.50M')
    expect(formatTokens(10_000_000)).toBe('10.00M')
  })
})

// ============================================
// CostManager Instance Management Tests
// ============================================

describe('CostManager instance management', () => {
  it('getCostManager returns singleton instance', () => {
    const manager1 = getCostManager()
    const manager2 = getCostManager()
    expect(manager1).toBe(manager2)
  })

  it('initCostManager creates new instance', () => {
    const manager1 = getCostManager()
    const manager2 = initCostManager()
    // After init, getCostManager should return the new instance
    const manager3 = getCostManager()
    expect(manager2).toBe(manager3)
  })

  it('getCostManager updates budget on existing instance', () => {
    initCostManager({ dailyLimit: 50, monthlyLimit: 500 })
    getCostManager({ dailyLimit: 100 })

    const manager = getCostManager()
    manager.clearHistory()
    const remaining = manager.getRemainingBudget()
    expect(remaining.daily).toBe(100)
  })

  it('clearHistory resets all usage data', () => {
    const manager = initCostManager()
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    const beforeClear = manager.getSummary()
    expect(beforeClear.daily.requests).toBe(1)

    manager.clearHistory()

    const afterClear = manager.getSummary()
    expect(afterClear.daily.requests).toBe(0)
    expect(afterClear.daily.cost).toBe(0)
  })

  it('updateBudget modifies budget settings', () => {
    const manager = initCostManager({ dailyLimit: 50 })
    manager.clearHistory()

    expect(manager.getRemainingBudget().daily).toBe(50)

    manager.updateBudget({ dailyLimit: 100 })

    expect(manager.getRemainingBudget().daily).toBe(100)
  })
})

// ============================================
// recordUsage and getModelBreakdown Tests
// ============================================

describe('recordUsage and getModelBreakdown', () => {
  beforeEach(() => {
    initCostManager()
  })

  it('records usage with all optional parameters', () => {
    const manager = getCostManager()
    manager.clearHistory()

    const record = manager.recordUsage(
      'claude-opus-4-5-20251101',
      100_000,
      50_000,
      'rejection_analysis',
      {
        cachedInputTokens: 50_000,
        thinkingTokens: 100_000,
        requestId: 'req-123',
      }
    )

    expect(record.model).toBe('claude-opus-4-5-20251101')
    expect(record.inputTokens).toBe(100_000)
    expect(record.outputTokens).toBe(50_000)
    expect(record.cachedInputTokens).toBe(50_000)
    expect(record.thinkingTokens).toBe(100_000)
    expect(record.taskType).toBe('rejection_analysis')
    expect(record.requestId).toBe('req-123')
    expect(record.cost).toBeGreaterThan(0)
    expect(record.timestamp).toBeInstanceOf(Date)
  })

  it('getModelBreakdown shows usage by model', () => {
    const manager = getCostManager()
    manager.clearHistory()

    manager.recordUsage('claude-opus-4-5-20251101', 100_000, 50_000, 'analysis')
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'chat')
    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'chat')
    manager.recordUsage('claude-haiku-4-20250514', 100_000, 50_000, 'validation')

    const breakdown = manager.getModelBreakdown()

    expect(breakdown['claude-opus-4-5-20251101'].requests).toBe(1)
    expect(breakdown['claude-sonnet-4-20250514'].requests).toBe(2)
    expect(breakdown['claude-haiku-4-20250514'].requests).toBe(1)

    // Verify costs are tracked
    expect(breakdown['claude-opus-4-5-20251101'].cost).toBeGreaterThan(
      breakdown['claude-sonnet-4-20250514'].cost / 2 // Opus is more expensive
    )
  })

  it('getModelBreakdown sums tokens correctly', () => {
    const manager = getCostManager()
    manager.clearHistory()

    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')
    manager.recordUsage('claude-sonnet-4-20250514', 200_000, 100_000, 'test')

    const breakdown = manager.getModelBreakdown()

    // 100K+50K + 200K+100K = 450K total tokens
    expect(breakdown['claude-sonnet-4-20250514'].tokens).toBe(450_000)
  })
})

// ============================================
// getSummary Tests
// ============================================

describe('getSummary', () => {
  beforeEach(() => {
    initCostManager()
  })

  it('returns complete summary structure', () => {
    const manager = getCostManager()
    manager.clearHistory()

    const summary = manager.getSummary()

    // Check daily stats
    expect(summary.daily).toHaveProperty('cost')
    expect(summary.daily).toHaveProperty('requests')
    expect(summary.daily).toHaveProperty('inputTokens')
    expect(summary.daily).toHaveProperty('outputTokens')

    // Check monthly stats
    expect(summary.monthly).toHaveProperty('cost')
    expect(summary.monthly).toHaveProperty('requests')
    expect(summary.monthly).toHaveProperty('inputTokens')
    expect(summary.monthly).toHaveProperty('outputTokens')

    // Check budget status
    expect(summary.budgetStatus).toHaveProperty('dailyUsedPercent')
    expect(summary.budgetStatus).toHaveProperty('monthlyUsedPercent')
    expect(summary.budgetStatus).toHaveProperty('isOverDaily')
    expect(summary.budgetStatus).toHaveProperty('isOverMonthly')
    expect(summary.budgetStatus).toHaveProperty('shouldAlert')
  })

  it('rounds cost to two decimal places', () => {
    const manager = getCostManager()
    manager.clearHistory()

    manager.recordUsage('claude-haiku-4-20250514', 1234, 567, 'test')

    const summary = manager.getSummary()

    // Cost should be rounded
    const costStr = summary.daily.cost.toString()
    const decimals = costStr.split('.')[1]
    expect(decimals?.length || 0).toBeLessThanOrEqual(2)
  })

  it('rounds percentage to one decimal place', () => {
    const manager = getCostManager({ dailyLimit: 100 })
    manager.clearHistory()

    manager.recordUsage('claude-sonnet-4-20250514', 100_000, 50_000, 'test')

    const summary = manager.getSummary()

    const percentStr = summary.budgetStatus.dailyUsedPercent.toString()
    const decimals = percentStr.split('.')[1]
    expect(decimals?.length || 0).toBeLessThanOrEqual(1)
  })
})
