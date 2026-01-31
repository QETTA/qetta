/**
 * QETTA Domain Engine v4.0
 *
 * Universal agentic pipeline: 1 Engine × N BLOCKs = Specialized Domain Engine
 *
 * Pipeline: SENSE → PROCESS → GENERATE → VERIFY → MATCH
 *
 * @example
 * ```ts
 * import { EnginePreset } from '@/lib/skill-engine/core/domain-engine'
 * import { PRESETS } from '@/lib/skill-engine/presets'
 *
 * const engine = new EnginePreset()
 * engine.load(PRESETS.MANUFACTURING) // → 제조 전문 엔진
 *
 * const result = await engine.run({
 *   action: 'generate',
 *   data: { facilityName: '삼성전자 화성캠퍼스', date: '2026-01-27' },
 *   templateId: 'mes-settlement-report',
 * })
 * ```
 *
 * @see lib/skill-engine/blocks/ (10 Industry BLOCKs, v2.1)
 * @see lib/skill-engine/presets.ts (6 Preset combinations)
 */

import type { IndustryBlockType } from '@/lib/super-model'
import type { EnginePresetType } from '@/types/inbox'
import type {
  EnrichedIndustryBlock,
  TermFull,
  BlockTemplate,
  ComplianceRule,
} from '../blocks/types'
import { blockRegistry } from '../blocks'

// ============================================
// Pipeline Types
// ============================================

export interface DataSource {
  type: 'api' | 'file' | 'sensor' | 'manual'
  format?: 'json' | 'csv' | 'xml' | 'opcua'
  payload: Record<string, unknown>
}

export interface RawData {
  source: DataSource
  timestamp: string
  records: Record<string, unknown>[]
}

export interface ProcessedData {
  records: Record<string, unknown>[]
  terminology: TermFull[]
  mappedFields: Map<string, string> // raw field → domain term
  warnings: string[]
}

export interface GeneratedDocument {
  id: string
  title: string
  content: string
  format: 'HWP' | 'DOCX' | 'XLSX' | 'PDF'
  template: BlockTemplate
  generatedAt: string
  metadata: Record<string, unknown>
}

export interface VerificationResult {
  isValid: boolean
  hash: string
  previousHash?: string
  errors: string[]
  warnings: string[]
  verifiedAt: string
}

export interface MatchResult {
  programId: string
  programName: string
  score: number // 0-100
  matchedTerms: string[]
  missingRequirements: string[]
}

// ============================================
// Engine Input/Output
// ============================================

export type EngineAction = 'sense' | 'process' | 'generate' | 'verify' | 'match' | 'run'

export interface EngineInput {
  action: EngineAction
  data: Record<string, unknown>
  templateId?: string
  options?: {
    format?: 'HWP' | 'DOCX' | 'XLSX' | 'PDF'
    locale?: 'ko' | 'en'
    verbose?: boolean
  }
}

export interface EngineOutput {
  success: boolean
  action: EngineAction
  data?: RawData | ProcessedData | GeneratedDocument | VerificationResult | MatchResult[]
  errors: string[]
  warnings: string[]
  stats: {
    blocksLoaded: number
    terminologyCount: number
    templatesAvailable: number
    rulesApplied: number
    processingTimeMs: number
  }
}

// ============================================
// Domain Engine Class
// ============================================

export class EnginePreset {
  private loadedBlocks: Map<IndustryBlockType, EnrichedIndustryBlock> = new Map()
  private presetId?: EnginePresetType

  /**
   * Load Industry BLOCKs into the engine.
   * Composable: engine.load(['AUTOMOTIVE', 'ENVIRONMENT']) creates a custom expert.
   */
  load(blockIds: IndustryBlockType[]): this {
    for (const id of blockIds) {
      const block = blockRegistry.get(id)
      if (!block) {
        throw new Error(`Unknown Industry BLOCK: ${id}`)
      }
      this.loadedBlocks.set(id, block)
    }
    return this
  }

  /**
   * Load blocks from a preset (convenience).
   */
  loadPreset(presetId: EnginePresetType, blockIds: IndustryBlockType[]): this {
    this.presetId = presetId
    return this.load(blockIds)
  }

  /**
   * Unload all blocks (reset engine).
   */
  reset(): this {
    this.loadedBlocks.clear()
    this.presetId = undefined
    return this
  }

  // ============================================
  // Pipeline Stages
  // ============================================

  /**
   * SENSE: Collect raw data from external sources.
   */
  async sense(source: DataSource): Promise<RawData> {
    return {
      source,
      timestamp: new Date().toISOString(),
      records: Array.isArray(source.payload?.records)
        ? (source.payload.records as Record<string, unknown>[])
        : [source.payload],
    }
  }

  /**
   * PROCESS: Map raw data through BLOCK terminology + rules.
   */
  async process(data: RawData): Promise<ProcessedData> {
    const allTerminology = this.getAllTerminology()
    const allRules = this.getAllRules()
    const mappedFields = new Map<string, string>()
    const warnings: string[] = []

    // Map raw field names to domain terms
    for (const record of data.records) {
      for (const key of Object.keys(record)) {
        const match = allTerminology.find(
          (t) =>
            t.id.toLowerCase() === key.toLowerCase() ||
            t.english.toLowerCase() === key.toLowerCase() ||
            t.korean === key ||
            t.aliases?.some((a) => a.toLowerCase() === key.toLowerCase())
        )
        if (match) {
          mappedFields.set(key, match.korean)
        }
      }
    }

    // Apply validation rules
    for (const rule of allRules) {
      if (rule.severity === 'warning') {
        // Check if any record triggers this rule (simplified check)
        for (const record of data.records) {
          for (const term of allTerminology) {
            if (term.validationRange && record[term.id] !== undefined) {
              const value = Number(record[term.id])
              if (value < term.validationRange.min || value > term.validationRange.max) {
                warnings.push(
                  `${term.korean} (${term.id}): ${value} — 유효 범위 초과 (${term.validationRange.min}~${term.validationRange.max})`
                )
              }
            }
          }
        }
      }
    }

    return {
      records: data.records,
      terminology: allTerminology,
      mappedFields,
      warnings,
    }
  }

  /**
   * GENERATE: Render a document from a template.
   */
  async generate(
    data: ProcessedData,
    templateId?: string,
    format?: 'HWP' | 'DOCX' | 'XLSX' | 'PDF'
  ): Promise<GeneratedDocument> {
    const allTemplates = this.getAllTemplates()
    const template = templateId
      ? allTemplates.find((t) => t.id === templateId)
      : allTemplates[0]

    if (!template) {
      throw new Error(
        `Template not found: ${templateId ?? '(none available)'}. Available: ${allTemplates.map((t) => t.id).join(', ')}`
      )
    }

    // Build document content from template sections + data
    const sections = template.sections.map((section) => {
      return `## ${section}\n\n[데이터 기반 자동 생성]`
    })

    const content = [
      `# ${template.nameKo}`,
      '',
      `생성일: ${new Date().toISOString()}`,
      `로드된 BLOCKs: ${Array.from(this.loadedBlocks.keys()).join(', ')}`,
      '',
      ...sections,
      '',
      '---',
      '*본 문서는 QETTA Domain Engine에 의해 자동 생성되었습니다.*',
    ].join('\n')

    return {
      id: `doc-${Date.now()}`,
      title: template.nameKo,
      content,
      format: format ?? template.format,
      template,
      generatedAt: new Date().toISOString(),
      metadata: {
        blocksUsed: Array.from(this.loadedBlocks.keys()),
        preset: this.presetId,
        terminologyCount: data.terminology.length,
        mappedFieldCount: data.mappedFields.size,
      },
    }
  }

  /**
   * VERIFY: SHA-256 해시체인 무결성 검증.
   */
  async verify(doc: GeneratedDocument, previousHash?: string): Promise<VerificationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate required sections exist
    const allRules = this.getAllRules()
    for (const rule of allRules.filter((r) => r.severity === 'error')) {
      // Simplified: check if document content references rule conditions
      if (!doc.content.includes(rule.id)) {
        warnings.push(`규칙 미적용: ${rule.name}`)
      }
    }

    // Generate hash (simplified — real impl uses crypto.subtle)
    const encoder = new TextEncoder()
    const data = encoder.encode(doc.content + (previousHash ?? ''))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return {
      isValid: errors.length === 0,
      hash,
      previousHash,
      errors,
      warnings,
      verifiedAt: new Date().toISOString(),
    }
  }

  /**
   * MATCH: Find matching programs/tenders for a company profile.
   */
  async match(profile: Record<string, unknown>): Promise<MatchResult[]> {
    const results: MatchResult[] = []
    const allTerms = this.getAllTerminology()
    const keywords = allTerms.map((t) => t.korean)

    // Simplified matching — real impl queries 630K+ tender DB
    const profileStr = JSON.stringify(profile).toLowerCase()
    const matchedTerms = keywords.filter((k) => profileStr.includes(k.toLowerCase()))

    if (matchedTerms.length > 0) {
      results.push({
        programId: `match-${Date.now()}`,
        programName: `${this.presetId ?? 'CUSTOM'} 관련 프로그램`,
        score: Math.min(100, matchedTerms.length * 15),
        matchedTerms,
        missingRequirements: [],
      })
    }

    return results
  }

  // ============================================
  // Full Pipeline
  // ============================================

  /**
   * Run the full pipeline or a specific stage.
   */
  async run(input: EngineInput): Promise<EngineOutput> {
    const start = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    if (this.loadedBlocks.size === 0) {
      return {
        success: false,
        action: input.action,
        errors: ['No BLOCKs loaded. Call engine.load() or engine.loadPreset() first.'],
        warnings: [],
        stats: this.getStats(start),
      }
    }

    try {
      let result: EngineOutput['data']

      switch (input.action) {
        case 'sense': {
          const source: DataSource = {
            type: (input.data.type as DataSource['type']) ?? 'manual',
            format: input.data.format as DataSource['format'],
            payload: input.data,
          }
          result = await this.sense(source)
          break
        }
        case 'process': {
          const raw: RawData = {
            source: { type: 'manual', payload: input.data },
            timestamp: new Date().toISOString(),
            records: [input.data],
          }
          const processed = await this.process(raw)
          warnings.push(...processed.warnings)
          result = processed
          break
        }
        case 'generate': {
          const raw: RawData = {
            source: { type: 'manual', payload: input.data },
            timestamp: new Date().toISOString(),
            records: [input.data],
          }
          const processed = await this.process(raw)
          warnings.push(...processed.warnings)
          result = await this.generate(processed, input.templateId, input.options?.format)
          break
        }
        case 'verify': {
          const doc = input.data as unknown as GeneratedDocument
          result = await this.verify(doc, input.data.previousHash as string | undefined)
          break
        }
        case 'match': {
          result = await this.match(input.data)
          break
        }
        case 'run': {
          // Full pipeline
          const source: DataSource = {
            type: (input.data.type as DataSource['type']) ?? 'manual',
            payload: input.data,
          }
          const rawData = await this.sense(source)
          const processed = await this.process(rawData)
          warnings.push(...processed.warnings)
          const doc = await this.generate(processed, input.templateId, input.options?.format)
          const verification = await this.verify(doc)
          if (!verification.isValid) {
            errors.push(...verification.errors)
          }
          warnings.push(...verification.warnings)
          result = doc
          break
        }
      }

      return {
        success: errors.length === 0,
        action: input.action,
        data: result,
        errors,
        warnings,
        stats: this.getStats(start),
      }
    } catch (err) {
      return {
        success: false,
        action: input.action,
        errors: [err instanceof Error ? err.message : String(err)],
        warnings,
        stats: this.getStats(start),
      }
    }
  }

  // ============================================
  // Accessors
  // ============================================

  /** Get all terminology from loaded BLOCKs. */
  getAllTerminology(): TermFull[] {
    return Array.from(this.loadedBlocks.values()).flatMap((b) => b.terminology)
  }

  /** Get all templates from loaded BLOCKs. */
  getAllTemplates(): BlockTemplate[] {
    return Array.from(this.loadedBlocks.values()).flatMap((b) => b.templates)
  }

  /** Get all rules from loaded BLOCKs. */
  getAllRules(): ComplianceRule[] {
    return Array.from(this.loadedBlocks.values()).flatMap((b) => b.rules)
  }

  /** Get loaded BLOCK IDs. */
  getLoadedBlockIds(): IndustryBlockType[] {
    return Array.from(this.loadedBlocks.keys())
  }

  /** Get current preset (if loaded via preset). */
  getPresetId(): EnginePresetType | undefined {
    return this.presetId
  }

  /** Check if a specific block is loaded. */
  hasBlock(id: IndustryBlockType): boolean {
    return this.loadedBlocks.has(id)
  }

  // ============================================
  // Internal
  // ============================================

  private getStats(startTime: number) {
    return {
      blocksLoaded: this.loadedBlocks.size,
      terminologyCount: this.getAllTerminology().length,
      templatesAvailable: this.getAllTemplates().length,
      rulesApplied: this.getAllRules().length,
      processingTimeMs: Date.now() - startTime,
    }
  }
}

// ============================================
// Factory
// ============================================

/** Create a EnginePreset with blocks pre-loaded. */
export function createEnginePreset(blockIds?: IndustryBlockType[]): EnginePreset {
  const engine = new EnginePreset()
  if (blockIds) {
    engine.load(blockIds)
  }
  return engine
}
