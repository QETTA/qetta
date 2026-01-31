/**
 * QETTA Industry BLOCK Types
 *
 * Enriched BLOCK definitions for the EnginePreset pipeline.
 * Basic IndustryBlock/IndustryBlockType defined in lib/super-model/loader.ts
 */

import type { IndustryBlockType } from '@/lib/super-model'

// ============================================
// Terminology Mapping (Progressive Disclosure)
// ============================================

/** Level 1: metadata (~50 tokens) */
export interface TermMetadata {
  id: string
  korean: string
  english: string
  category: string
}

/** Level 2: terminology (~500 tokens) */
export interface TermMapping extends TermMetadata {
  unit?: string
  description: string
  aliases?: string[]
}

/** Level 3: full (~2000 tokens) */
export interface TermFull extends TermMapping {
  legalLimit?: number
  regulatoryRef?: string
  validationRange?: { min: number; max: number }
  examples?: string[]
}

// ============================================
// Document Template
// ============================================

export interface BlockTemplate {
  id: string
  name: string
  nameKo: string
  format: 'HWP' | 'DOCX' | 'XLSX' | 'PDF'
  sections: string[]
  estimatedGenerationTime: number // seconds
}

// ============================================
// Compliance Rule
// ============================================

export interface ComplianceRule {
  id: string
  name: string
  description: string
  condition: string // human-readable condition
  action: string    // what to do when triggered
  severity: 'error' | 'warning' | 'info'
  regulatoryRef?: string
}

// ============================================
// Industry BLOCK (Enriched)
// ============================================

export interface EnrichedIndustryBlock {
  id: IndustryBlockType
  name: string
  nameKo: string
  category: 'manufacturing' | 'energyEnvironment' | 'advancedTech' | 'financeService' | 'healthcare'
  description: string
  descriptionKo: string

  // Progressive Disclosure layers
  terminology: TermFull[]
  templates: BlockTemplate[]
  rules: ComplianceRule[]

  // Metadata
  keywords: string[]
  regulatoryBodies: string[]
  color: string

  // Token budget estimates
  tokenBudget: {
    metadata: number    // ~50 tokens
    terminology: number // ~500 tokens
    full: number        // ~2000 tokens
  }
}

// ============================================
// BLOCK Registry
// ============================================

export interface BlockRegistry {
  blocks: Map<IndustryBlockType, EnrichedIndustryBlock>
  load(ids: IndustryBlockType[]): EnrichedIndustryBlock[]
  get(id: IndustryBlockType): EnrichedIndustryBlock | undefined
  getByCategory(category: string): EnrichedIndustryBlock[]
  getAllIds(): IndustryBlockType[]
}

// ============================================
// ALL_BLOCK_IDS constant
// ============================================

/**
 * ALL_BLOCK_IDS - v2.1 (10개)
 *
 * KSIC 기반 재설계된 Industry Block ID 목록
 */
export const ALL_BLOCK_IDS: IndustryBlockType[] = [
  'FOOD', 'TEXTILE', 'METAL', 'CHEMICAL',
  'ELECTRONICS', 'MACHINERY', 'AUTOMOTIVE',
  'BIO_PHARMA', 'ENVIRONMENT', 'GENERAL',
]
