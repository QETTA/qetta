/**
 * QETTA Block Engine - Layer 1: Domain Engine
 *
 * 기존 skill-engine의 EnginePreset을 래핑하여
 * 3-Layer 아키텍처의 Domain Layer로 제공합니다.
 *
 * @see lib/skill-engine/core/domain-engine.ts (기존 구현)
 */

import type { EnginePresetType, IndustryBlockType } from '@/lib/super-model'
import type {
  DomainContext,
  TokenBudget,
  TokenBudgetLevel,
} from './types'
import type {
  TermFull,
  BlockTemplate,
  ComplianceRule,
} from '@/lib/skill-engine/blocks/types'
import { EnginePreset } from '@/lib/skill-engine/core/domain-engine'
import { PRESETS } from '@/lib/skill-engine/presets'
import {
  DEFAULT_DOMAIN_TOKENS,
} from './types'

// ================== Token Budget Limits by Level ==================

const TOKEN_LIMITS: Record<TokenBudgetLevel, number> = {
  metadata: 50,      // ~50 tokens per block
  terminology: 500,  // ~500 tokens per block
  full: 2000,        // ~2000 tokens per block
}

// ================== Domain Engine Layer ==================

export class DomainEngineLayer {
  private enginePreset: EnginePreset
  private currentPresetId?: EnginePresetType
  private currentLevel: TokenBudgetLevel = 'full'

  constructor() {
    this.enginePreset = new EnginePreset()
  }

  /**
   * 프리셋으로 Domain 컨텍스트를 로드합니다.
   * 전체 레벨(full)로 로드됩니다.
   */
  load(presetId: EnginePresetType): DomainContext {
    return this.loadWithBudget(presetId, DEFAULT_DOMAIN_TOKENS)
  }

  /**
   * 토큰 예산을 지정하여 Domain 컨텍스트를 로드합니다.
   * 예산에 맞게 자동으로 로딩 레벨이 결정됩니다.
   */
  loadWithBudget(presetId: EnginePresetType, maxTokens: number): DomainContext {
    const blockIds = PRESETS[presetId]
    if (!blockIds) {
      throw new Error(`Unknown preset: ${presetId}`)
    }

    // 예산에 맞는 레벨 결정
    const level = this.determineLevelForBudget(blockIds.length, maxTokens)
    this.currentLevel = level
    this.currentPresetId = presetId

    // 기존 엔진에 블록 로드
    this.enginePreset.reset().loadPreset(presetId, [...blockIds])

    return this.buildContext(presetId, level, maxTokens)
  }

  /**
   * 특정 레벨로 Domain 컨텍스트를 빌드합니다.
   */
  private buildContext(
    presetId: EnginePresetType,
    level: TokenBudgetLevel,
    maxTokens: number
  ): DomainContext {
    const blockIds = this.enginePreset.getLoadedBlockIds()

    // 레벨에 따른 데이터 필터링
    const terminology = this.getTerminologyForLevel(level)
    const templates = this.getTemplates()
    const rules = this.getRules()

    // 현재 토큰 추정
    const currentTokens = this.estimateTokens(terminology, templates, rules)

    return {
      presetId,
      loadedBlocks: blockIds,
      terminology,
      templates,
      rules,
      tokenBudget: {
        current: currentTokens,
        max: maxTokens,
        level,
      },
    }
  }

  /**
   * 예산에 맞는 최적의 로딩 레벨을 결정합니다.
   */
  private determineLevelForBudget(blockCount: number, maxTokens: number): TokenBudgetLevel {
    const fullTokens = blockCount * TOKEN_LIMITS.full
    const terminologyTokens = blockCount * TOKEN_LIMITS.terminology
    const metadataTokens = blockCount * TOKEN_LIMITS.metadata

    if (fullTokens <= maxTokens) {
      return 'full'
    } else if (terminologyTokens <= maxTokens) {
      return 'terminology'
    } else {
      return 'metadata'
    }
  }

  /**
   * 레벨에 따른 용어 사전을 반환합니다.
   * - metadata: id, korean, english, category만
   * - terminology: + description, aliases
   * - full: 전체
   */
  private getTerminologyForLevel(level: TokenBudgetLevel): TermFull[] {
    const allTerms = this.enginePreset.getAllTerminology()

    switch (level) {
      case 'metadata':
        // 메타데이터만 포함 (간소화된 버전)
        return allTerms.map(term => ({
          ...term,
          description: '',
          examples: undefined,
          legalLimit: undefined,
          regulatoryRef: undefined,
          validationRange: undefined,
        }))

      case 'terminology':
        // 용어 설명까지 포함
        return allTerms.map(term => ({
          ...term,
          examples: undefined,
          legalLimit: undefined,
          regulatoryRef: undefined,
          validationRange: undefined,
        }))

      case 'full':
      default:
        return allTerms
    }
  }

  /**
   * 현재 로드된 블록의 용어 사전을 반환합니다.
   */
  getTerminology(): TermFull[] {
    return this.enginePreset.getAllTerminology()
  }

  /**
   * 현재 로드된 블록의 템플릿을 반환합니다.
   */
  getTemplates(): BlockTemplate[] {
    return this.enginePreset.getAllTemplates()
  }

  /**
   * 현재 로드된 블록의 규칙(Program Block 역할)을 반환합니다.
   */
  getRules(): ComplianceRule[] {
    return this.enginePreset.getAllRules()
  }

  /**
   * 현재 로드된 블록 ID 목록을 반환합니다.
   */
  getLoadedBlockIds(): IndustryBlockType[] {
    return this.enginePreset.getLoadedBlockIds()
  }

  /**
   * 현재 프리셋 ID를 반환합니다.
   */
  getPresetId(): EnginePresetType | undefined {
    return this.currentPresetId
  }

  /**
   * 현재 로딩 레벨을 반환합니다.
   */
  getCurrentLevel(): TokenBudgetLevel {
    return this.currentLevel
  }

  /**
   * 토큰 수를 추정합니다 (간단한 휴리스틱).
   * 실제로는 tiktoken 등을 사용해야 합니다.
   */
  private estimateTokens(
    terminology: TermFull[],
    templates: BlockTemplate[],
    rules: ComplianceRule[]
  ): number {
    // 간단한 추정: 문자열 길이 / 4 (영어 기준, 한글은 약 2배)
    let totalChars = 0

    for (const term of terminology) {
      totalChars += (term.korean?.length ?? 0) * 2
      totalChars += term.english?.length ?? 0
      totalChars += term.description?.length ?? 0
    }

    for (const template of templates) {
      totalChars += (template.nameKo?.length ?? 0) * 2
      totalChars += template.name?.length ?? 0
      totalChars += template.sections.join(' ').length
    }

    for (const rule of rules) {
      totalChars += rule.name.length
      totalChars += rule.description.length
      totalChars += rule.condition.length
      totalChars += rule.action.length
    }

    return Math.ceil(totalChars / 4)
  }

  /**
   * 특정 토큰 예산에 맞게 컨텍스트를 축소합니다.
   */
  fitToTokenBudget(context: DomainContext, maxTokens: number): DomainContext {
    const { current } = context.tokenBudget

    if (current <= maxTokens) {
      return context
    }

    // 레벨을 낮춰서 다시 빌드
    const lowerLevel = this.getLowerLevel(context.tokenBudget.level)
    if (lowerLevel === context.tokenBudget.level) {
      // 이미 최저 레벨
      return context
    }

    return this.buildContext(context.presetId, lowerLevel, maxTokens)
  }

  private getLowerLevel(level: TokenBudgetLevel): TokenBudgetLevel {
    switch (level) {
      case 'full':
        return 'terminology'
      case 'terminology':
        return 'metadata'
      case 'metadata':
      default:
        return 'metadata'
    }
  }

  /**
   * 엔진을 리셋합니다.
   */
  reset(): this {
    this.enginePreset.reset()
    this.currentPresetId = undefined
    this.currentLevel = 'full'
    return this
  }

  /**
   * 내부 EnginePreset 인스턴스에 접근합니다.
   * (고급 사용을 위한 직접 접근)
   */
  getUnderlyingEngine(): EnginePreset {
    return this.enginePreset
  }
}

// ================== Factory Function ==================

/**
 * Domain Engine Layer 인스턴스를 생성합니다.
 */
export function createDomainEngineLayer(): DomainEngineLayer {
  return new DomainEngineLayer()
}

/**
 * 프리셋을 로드한 Domain Engine Layer를 생성합니다.
 */
export function createDomainEngineWithPreset(
  presetId: EnginePresetType,
  maxTokens?: number
): { layer: DomainEngineLayer; context: DomainContext } {
  const layer = new DomainEngineLayer()
  const context = maxTokens
    ? layer.loadWithBudget(presetId, maxTokens)
    : layer.load(presetId)
  return { layer, context }
}
