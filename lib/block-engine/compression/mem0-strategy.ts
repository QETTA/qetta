/**
 * Mem0 압축 전략
 *
 * Mem0 패턴 기반의 컨텍스트 압축.
 * 원본 데이터에서 핵심 정보만 추출하여 80% 이상 압축률 달성.
 *
 * 압축 원칙:
 * 1. 중복 제거 (semantic deduplication)
 * 2. 핵심 정보 우선 (priority-based selection)
 * 3. 자연어 변환 (structured → natural language)
 * 4. 토큰 예산 관리 (budget-aware truncation)
 */

import type { CompanyFact, CompanyFactType, CompressionStats } from '../types'
import type { CompanyProfile } from '@/lib/skill-engine/types'
import { semanticDedup, calculateSimilarity } from './semantic-dedup'

// ============================================
// Types
// ============================================

export interface CompressionConfig {
  /** 목표 압축률 (0-100) */
  targetRatio: number
  /** 최대 Facts 개수 */
  maxFacts: number
  /** 최소 confidence 임계값 */
  minConfidence: number
  /** 중복 제거 유사도 임계값 (0-1) */
  dedupThreshold: number
}

export interface CompressionResult {
  /** 압축된 자연어 컨텍스트 */
  context: string
  /** 선택된 Facts */
  selectedFacts: CompanyFact[]
  /** 압축 통계 */
  stats: CompressionStats
  /** 압축 단계별 상세 */
  breakdown: {
    originalFactCount: number
    afterDedupCount: number
    afterFilterCount: number
    finalCount: number
  }
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  targetRatio: 80,
  maxFacts: 5,
  minConfidence: 0.5,
  dedupThreshold: 0.85,
}

// ============================================
// Priority Configuration
// ============================================

const FACT_PRIORITY: Record<CompanyFactType, number> = {
  rejection_pattern: 10,  // 최우선: 탈락 방지에 핵심
  success_pattern: 8,     // 성공 패턴
  capability: 6,          // 기술 역량
  application: 4,         // 신청 이력
  certification: 3,       // 인증
  preference: 2,          // 선호도
  profile: 1,             // 기본 정보
}

// ============================================
// Mem0 Compressor
// ============================================

export class Mem0Compressor {
  private config: CompressionConfig

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = { ...DEFAULT_COMPRESSION_CONFIG, ...config }
  }

  /**
   * CompanyBlock 데이터를 압축합니다.
   */
  compress(
    profile: CompanyProfile,
    facts: CompanyFact[]
  ): CompressionResult {
    const originalFactCount = facts.length

    // Step 1: 중복 제거
    const dedupedFacts = this.deduplicateFacts(facts)
    const afterDedupCount = dedupedFacts.length

    // Step 2: Confidence 필터링
    const filteredFacts = dedupedFacts.filter(
      f => f.confidence >= this.config.minConfidence
    )
    const afterFilterCount = filteredFacts.length

    // Step 3: 우선순위 정렬 및 선택
    const selectedFacts = this.selectTopFacts(filteredFacts, this.config.maxFacts)
    const finalCount = selectedFacts.length

    // Step 4: 자연어 컨텍스트 생성
    const context = this.generateContext(profile, selectedFacts)

    // Step 5: 압축 통계 계산
    const stats = this.calculateStats(profile, facts, context)

    return {
      context,
      selectedFacts,
      stats,
      breakdown: {
        originalFactCount,
        afterDedupCount,
        afterFilterCount,
        finalCount,
      },
    }
  }

  /**
   * 의미적으로 유사한 Facts를 제거합니다.
   */
  private deduplicateFacts(facts: CompanyFact[]): CompanyFact[] {
    return semanticDedup(facts, this.config.dedupThreshold)
  }

  /**
   * 우선순위 기반으로 상위 Facts를 선택합니다.
   */
  private selectTopFacts(facts: CompanyFact[], limit: number): CompanyFact[] {
    return [...facts]
      .sort((a, b) => {
        // 1차: 타입 우선순위
        const priorityDiff = (FACT_PRIORITY[b.type] ?? 0) - (FACT_PRIORITY[a.type] ?? 0)
        if (priorityDiff !== 0) return priorityDiff

        // 2차: Confidence
        return b.confidence - a.confidence
      })
      .slice(0, limit)
  }

  /**
   * 압축된 자연어 컨텍스트를 생성합니다.
   */
  private generateContext(profile: CompanyProfile, facts: CompanyFact[]): string {
    const parts: string[] = []

    // 1. 핵심 프로필 (1줄)
    parts.push(this.compressProfile(profile))

    // 2. 인증 요약 (인증이 있는 경우만)
    const certSummary = this.compressCertifications(profile)
    if (certSummary) {
      parts.push(certSummary)
    }

    // 3. 신청 이력 요약
    const historySummary = this.compressHistory(profile)
    if (historySummary) {
      parts.push(historySummary)
    }

    // 4. 핵심 Facts
    for (const fact of facts) {
      parts.push(`• ${fact.content}`)
    }

    return parts.join(' ')
  }

  /**
   * 프로필을 1줄로 압축합니다.
   */
  private compressProfile(profile: CompanyProfile): string {
    const age = this.calculateAge(profile.basic.foundedDate)
    const revenue = profile.basic.annualRevenue

    return `${profile.name}(${age}년차, ${profile.basic.employeeCount}명, ${revenue}억).`
  }

  /**
   * 인증 정보를 압축합니다.
   */
  private compressCertifications(profile: CompanyProfile): string | null {
    const certs = profile.qualifications.certifications
    if (certs.length === 0) return null

    // 최대 4개까지만 표시
    const displayed = certs.slice(0, 4)
    const suffix = certs.length > 4 ? ` 외 ${certs.length - 4}개` : ''

    return `인증: ${displayed.join('/')}${suffix}.`
  }

  /**
   * 신청 이력을 압축합니다.
   */
  private compressHistory(profile: CompanyProfile): string | null {
    const { totalApplications, selectionCount, rejectionCount } = profile.history
    if (totalApplications === 0) return null

    const rate = Math.round((selectionCount / totalApplications) * 100)
    return `신청${totalApplications}(선정${selectionCount}/탈락${rejectionCount}, ${rate}%).`
  }

  /**
   * 압축 통계를 계산합니다.
   */
  private calculateStats(
    profile: CompanyProfile,
    originalFacts: CompanyFact[],
    compressedContext: string
  ): CompressionStats {
    // 원본 토큰 추정
    const originalJson = JSON.stringify({ profile, facts: originalFacts })
    const originalTokens = this.estimateTokens(originalJson)

    // 압축 토큰 추정
    const compressedTokens = this.estimateTokens(compressedContext)

    // 압축률 계산
    const ratio = originalTokens > 0
      ? Math.round((1 - compressedTokens / originalTokens) * 100)
      : 0

    return {
      originalTokens,
      compressedTokens,
      ratio,
    }
  }

  /**
   * 토큰 수를 추정합니다.
   * 한글: 약 1.5 토큰/글자, 영어: 약 0.25 토큰/글자
   */
  private estimateTokens(text: string): number {
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
   * 회사 업력을 계산합니다.
   */
  private calculateAge(foundedDate: string): number {
    const founded = new Date(foundedDate)
    const now = new Date()
    return Math.floor((now.getTime() - founded.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }
}

// ============================================
// Factory Function
// ============================================

export function createMem0Compressor(config?: Partial<CompressionConfig>): Mem0Compressor {
  return new Mem0Compressor(config)
}
