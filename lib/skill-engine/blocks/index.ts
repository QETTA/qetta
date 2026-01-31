/**
 * QETTA Industry BLOCK Registry
 *
 * v2.1: 10개 블록 (KSIC 기반)
 * - 신규: FOOD, TEXTILE, METAL, GENERAL
 * - 유지: AUTOMOTIVE, CHEMICAL, ELECTRONICS, MACHINERY, BIO_PHARMA, ENVIRONMENT
 * - 삭제: SEMICONDUCTOR→ELECTRONICS, ENERGY→ENVIRONMENT, HEALTHCARE→BIO_PHARMA
 *         AUTONOMOUS, LOGISTICS, CONSTRUCTION (완전 삭제)
 *
 * Lazy-loads blocks on demand for token budget optimization.
 */
import type { IndustryBlockType } from '@/lib/super-model'
import type { EnrichedIndustryBlock, BlockRegistry } from './types'
import { ALL_BLOCK_IDS } from './types'

// Static imports (tree-shakeable) - v2.1 10개 블록
import { FOOD_BLOCK } from './food'
import { TEXTILE_BLOCK } from './textile'
import { METAL_BLOCK } from './metal'
import { CHEMICAL_BLOCK } from './chemical'
import { ELECTRONICS_BLOCK } from './electronics'
import { MACHINERY_BLOCK } from './machinery'
import { AUTOMOTIVE_BLOCK } from './automotive'
import { BIO_PHARMA_BLOCK } from './bio-pharma'
import { ENVIRONMENT_BLOCK } from './environment'
import { GENERAL_BLOCK } from './general'

const BLOCK_MAP: Record<IndustryBlockType, EnrichedIndustryBlock> = {
  FOOD: FOOD_BLOCK,
  TEXTILE: TEXTILE_BLOCK,
  METAL: METAL_BLOCK,
  CHEMICAL: CHEMICAL_BLOCK,
  ELECTRONICS: ELECTRONICS_BLOCK,
  MACHINERY: MACHINERY_BLOCK,
  AUTOMOTIVE: AUTOMOTIVE_BLOCK,
  BIO_PHARMA: BIO_PHARMA_BLOCK,
  ENVIRONMENT: ENVIRONMENT_BLOCK,
  GENERAL: GENERAL_BLOCK,
}

export function createBlockRegistry(): BlockRegistry {
  const blocks = new Map<IndustryBlockType, EnrichedIndustryBlock>(
    Object.entries(BLOCK_MAP) as [IndustryBlockType, EnrichedIndustryBlock][]
  )

  return {
    blocks,
    load(ids: IndustryBlockType[]): EnrichedIndustryBlock[] {
      return ids.map((id) => {
        const block = blocks.get(id)
        if (!block) throw new Error(`Unknown BLOCK: ${id}`)
        return block
      })
    },
    get(id: IndustryBlockType): EnrichedIndustryBlock | undefined {
      return blocks.get(id)
    },
    getByCategory(category: string): EnrichedIndustryBlock[] {
      return Array.from(blocks.values()).filter((b) => b.category === category)
    },
    getAllIds(): IndustryBlockType[] {
      return ALL_BLOCK_IDS
    },
  }
}

export const blockRegistry = createBlockRegistry()

// Re-exports
export { ALL_BLOCK_IDS } from './types'
export type {
  EnrichedIndustryBlock,
  BlockRegistry,
  TermFull,
  TermMapping,
  TermMetadata,
  BlockTemplate,
  ComplianceRule,
} from './types'

// v2.1 Block exports
export { FOOD_BLOCK } from './food'
export { TEXTILE_BLOCK } from './textile'
export { METAL_BLOCK } from './metal'
export { CHEMICAL_BLOCK } from './chemical'
export { ELECTRONICS_BLOCK } from './electronics'
export { MACHINERY_BLOCK } from './machinery'
export { AUTOMOTIVE_BLOCK } from './automotive'
export { BIO_PHARMA_BLOCK } from './bio-pharma'
export { ENVIRONMENT_BLOCK } from './environment'
export { GENERAL_BLOCK } from './general'
