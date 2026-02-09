/**
 * Cost Tracking & Monitoring
 * Track API usage costs for budgeting and optimization
 *
 * @see Plan: Part C4 - Infrastructure & Observability
 */

import { logger } from './logger'

export type CostService = 'claude' | 'database' | 'redis' | 'vercel' | 'storage'

export interface CostMetric {
  service: CostService
  operation: string
  quantity: number // tokens, queries, MB, etc.
  estimatedCost: number // USD
  timestamp: Date
  metadata?: Record<string, any>
}

/**
 * In-memory cost accumulator (reset daily)
 * In production, this would be backed by Redis/database
 */
const dailyCosts = new Map<string, number>()
let lastReset = new Date().toDateString()

/**
 * Track cost for a specific operation
 *
 * Usage:
 * ```typescript
 * import { trackCost } from '@/lib/telemetry/cost-tracker'
 *
 * const response = await anthropic.messages.create({ ... })
 * await trackCost({
 *   service: 'claude',
 *   operation: 'payout_recommendation',
 *   quantity: response.usage.input_tokens + response.usage.output_tokens,
 *   estimatedCost: calculateClaudeCost(response.usage)
 * })
 * ```
 */
export async function trackCost(metric: Omit<CostMetric, 'timestamp'>) {
  // Reset daily accumulator if new day
  const today = new Date().toDateString()
  if (today !== lastReset) {
    dailyCosts.clear()
    lastReset = today
  }

  // Accumulate costs
  const key = `${metric.service}:${metric.operation}`
  const current = dailyCosts.get(key) || 0
  dailyCosts.set(key, current + metric.estimatedCost)

  // Log cost event
  logger.info(
    {
      ...metric,
      dailyTotal: dailyCosts.get(key),
      timestamp: new Date().toISOString()
    },
    `Cost tracked: ${metric.service} - ${metric.operation}`
  )

  // Send to Datadog (if configured)
  if (process.env.DD_API_KEY) {
    await sendToDatadog({
      ...metric,
      timestamp: new Date()
    })
  }

  // Alert if daily budget exceeded
  const totalDailyCost = Array.from(dailyCosts.values()).reduce((sum, cost) => sum + cost, 0)
  const dailyBudget = parseFloat(process.env.DAILY_BUDGET_USD || '50')

  if (totalDailyCost > dailyBudget) {
    logger.warn(
      {
        totalDailyCost,
        dailyBudget,
        breakdown: Object.fromEntries(dailyCosts)
      },
      '⚠️ Daily budget exceeded!'
    )

    // Future: Send to PagerDuty/Slack
  }
}

/**
 * Calculate Claude API cost based on usage
 * Pricing: https://www.anthropic.com/pricing
 */
export function calculateClaudeCost(usage: {
  model: string
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}): number {
  const { model, input_tokens, output_tokens, cache_creation_input_tokens = 0, cache_read_input_tokens = 0 } = usage

  let inputCostPerMTok = 3.0 // Sonnet default
  let outputCostPerMTok = 15.0
  let cacheWriteCostPerMTok = 3.75
  let cacheReadCostPerMTok = 0.3

  // Adjust for model
  if (model.includes('opus')) {
    inputCostPerMTok = 15.0
    outputCostPerMTok = 75.0
    cacheWriteCostPerMTok = 18.75
    cacheReadCostPerMTok = 1.5
  } else if (model.includes('haiku')) {
    inputCostPerMTok = 0.25
    outputCostPerMTok = 1.25
    cacheWriteCostPerMTok = 0.3
    cacheReadCostPerMTok = 0.03
  }

  const inputCost = (input_tokens / 1_000_000) * inputCostPerMTok
  const outputCost = (output_tokens / 1_000_000) * outputCostPerMTok
  const cacheWriteCost = (cache_creation_input_tokens / 1_000_000) * cacheWriteCostPerMTok
  const cacheReadCost = (cache_read_input_tokens / 1_000_000) * cacheReadCostPerMTok

  return inputCost + outputCost + cacheWriteCost + cacheReadCost
}

/**
 * Calculate database query cost (estimated)
 * Based on query complexity and result size
 */
export function calculateDatabaseCost(metadata: {
  queryType: 'read' | 'write' | 'aggregate'
  executionTime: number // ms
  rowsAffected: number
}): number {
  const { queryType, executionTime, rowsAffected } = metadata

  // Cost model (simplified):
  // - Base cost per query: $0.000001
  // - Time penalty: $0.0000001 per ms
  // - Row penalty: $0.0000001 per row
  const baseCost = 0.000001
  const timeCost = (executionTime / 1000) * 0.0000001
  const rowCost = rowsAffected * 0.0000001

  const multiplier = queryType === 'write' ? 2 : queryType === 'aggregate' ? 1.5 : 1

  return (baseCost + timeCost + rowCost) * multiplier
}

/**
 * Calculate Redis operation cost (estimated)
 */
export function calculateRedisCost(metadata: {
  operation: 'get' | 'set' | 'del' | 'zadd' | 'zremrangebyscore' | 'publish'
  keySize?: number // bytes
  valueSize?: number // bytes
}): number {
  const { operation, keySize = 0, valueSize = 0 } = metadata

  // Cost model (simplified):
  // - GET: $0.0000001
  // - SET: $0.0000002 + storage
  // - Pub/Sub: $0.0000005
  const operationCosts = {
    get: 0.0000001,
    set: 0.0000002,
    del: 0.0000001,
    zadd: 0.0000003,
    zremrangebyscore: 0.0000002,
    publish: 0.0000005
  }

  const storageCost = operation === 'set' ? (valueSize / 1_000_000) * 0.0001 : 0

  return operationCosts[operation] + storageCost
}

/**
 * Get daily cost summary
 */
export function getDailyCostSummary() {
  const totalCost = Array.from(dailyCosts.values()).reduce((sum, cost) => sum + cost, 0)

  const breakdown = Array.from(dailyCosts.entries()).map(([key, cost]) => {
    const [service, operation] = key.split(':')
    return { service, operation, cost }
  })

  return {
    date: lastReset,
    totalCost,
    breakdown: breakdown.sort((a, b) => b.cost - a.cost),
    budget: parseFloat(process.env.DAILY_BUDGET_USD || '50'),
    percentUsed: (totalCost / parseFloat(process.env.DAILY_BUDGET_USD || '50')) * 100
  }
}

/**
 * Send cost metrics to Datadog
 */
async function sendToDatadog(metric: CostMetric) {
  if (!process.env.DD_API_KEY) return

  try {
    const response = await fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'DD-API-KEY': process.env.DD_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        series: [
          {
            metric: 'qetta.accounting.cost',
            type: 'gauge',
            points: [[Math.floor(metric.timestamp.getTime() / 1000), metric.estimatedCost]],
            tags: [
              `service:${metric.service}`,
              `operation:${metric.operation}`,
              `environment:${process.env.NODE_ENV}`
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      logger.warn({ status: response.status }, 'Failed to send cost metric to Datadog')
    }
  } catch (error) {
    logger.error({ err: error }, 'Error sending cost metric to Datadog')
  }
}

/**
 * Wrapper for Claude API calls with automatic cost tracking
 *
 * Usage:
 * ```typescript
 * import { withCostTracking } from '@/lib/telemetry/cost-tracker'
 *
 * const response = await withCostTracking(
 *   'payout_recommendation',
 *   async () => {
 *     return await anthropic.messages.create({ ... })
 *   }
 * )
 * ```
 */
export async function withCostTracking<T extends { usage: any }>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const response = await fn()

  if (response.usage) {
    const cost = calculateClaudeCost({
      model: 'claude-sonnet-4.5', // Default
      ...response.usage
    })

    await trackCost({
      service: 'claude',
      operation: operationName,
      quantity: response.usage.input_tokens + response.usage.output_tokens,
      estimatedCost: cost,
      metadata: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      }
    })
  }

  return response
}

/**
 * Cost optimization recommendations
 */
export function getCostOptimizationTips() {
  const summary = getDailyCostSummary()
  const tips: string[] = []

  // High Claude usage
  const claudeCosts = summary.breakdown.filter((b) => b.service === 'claude')
  const totalClaudeCost = claudeCosts.reduce((sum, c) => sum + c.cost, 0)

  if (totalClaudeCost > summary.totalCost * 0.7) {
    tips.push('💡 Claude API costs > 70% of total. Consider:')
    tips.push('   - Enable prompt caching for repeated content')
    tips.push('   - Use Haiku for simple operations')
    tips.push('   - Batch similar requests together')
  }

  // High database costs
  const dbCosts = summary.breakdown.filter((b) => b.service === 'database')
  if (dbCosts.length > 100) {
    tips.push('💡 High database query count. Consider:')
    tips.push('   - Enable query result caching')
    tips.push('   - Use materialized views for aggregations')
    tips.push('   - Batch similar queries together')
  }

  return tips
}
