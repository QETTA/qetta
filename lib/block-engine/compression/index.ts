/**
 * QETTA Block Engine - Compression Module
 *
 * Mem0 패턴 기반 토큰 압축 모듈.
 * 80% 이상의 압축률을 목표로 합니다.
 *
 * @example
 * ```ts
 * import { createMem0Compressor } from '@/lib/block-engine/compression'
 *
 * const compressor = createMem0Compressor({ targetRatio: 80 })
 * const result = compressor.compress(profile, facts)
 *
 * console.log(result.context)        // 압축된 자연어 컨텍스트
 * console.log(result.stats.ratio)    // 압축률 (%)
 * ```
 */

// ============================================
// Exports
// ============================================

// Mem0 Strategy
export {
  Mem0Compressor,
  createMem0Compressor,
  DEFAULT_COMPRESSION_CONFIG,
  type CompressionConfig,
  type CompressionResult,
} from './mem0-strategy'

// Semantic Deduplication
export {
  calculateSimilarity,
  semanticDedup,
  extractKeywords,
  clusterFacts,
  selectRepresentative,
  mergeSimilarFacts,
} from './semantic-dedup'

// ============================================
// Convenience Functions
// ============================================

import { createMem0Compressor, type CompressionConfig } from './mem0-strategy'
import type { CompanyFact, CompressionStats } from '../types'
import type { CompanyProfile } from '@/lib/skill-engine/types'

/**
 * Quick compress function for simple use cases.
 */
export function compressCompanyData(
  profile: CompanyProfile,
  facts: CompanyFact[],
  config?: Partial<CompressionConfig>
): { context: string; stats: CompressionStats } {
  const compressor = createMem0Compressor(config)
  const result = compressor.compress(profile, facts)
  return {
    context: result.context,
    stats: result.stats,
  }
}

/**
 * Estimate token count for text.
 */
export function estimateTokens(text: string): number {
  let koreanChars = 0
  let otherChars = 0

  for (const char of text) {
    if (/[\u3131-\uD79D]/.test(char)) {
      koreanChars++
    } else {
      otherChars++
    }
  }

  return Math.ceil(koreanChars * 1.5 + otherChars * 0.25)
}

/**
 * Check if compression meets target ratio.
 */
export function meetsTargetRatio(stats: CompressionStats, targetRatio: number = 80): boolean {
  return stats.ratio >= targetRatio
}
