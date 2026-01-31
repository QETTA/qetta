/**
 * QETTA Block Engine - Layer 2: Company Block
 *
 * Mem0 패턴 기반 회사 컨텍스트 관리.
 * 80% 토큰 압축을 목표로 합니다.
 *
 * 압축 예시:
 * Before (200 tokens):
 * { name: "ABC Corp", foundedDate: "2020-01-15", certifications: ["ISO 9001", "벤처기업", "이노비즈"], ... }
 *
 * After (40 tokens):
 * "ABC Corp(2020년 설립, 4년차). ISO 9001/벤처/이노비즈 보유. TIPS 탈락(기술성 미달, 2024.06)."
 */

import type {
  CompanyBlock,
  CompanyFact,
  CompanyFactType,
  CompressionStats,
  FactSource,
} from './types'
import type { CompanyProfile, ApplicationHistory, RejectionPattern } from '@/lib/skill-engine/types'
import { DEFAULT_COMPANY_TOKENS } from './types'

// ================== Internal Storage ==================

const companyStore = new Map<string, CompanyBlock>()

// ================== Company Block Manager ==================

export class CompanyBlockManager {
  /**
   * 새 Company Block을 생성합니다.
   */
  create(profile: CompanyProfile): CompanyBlock {
    const companyId = profile.id
    const now = new Date().toISOString()

    // 프로필에서 초기 Facts 추출
    const initialFacts = this.extractFactsFromProfile(profile)

    const block: CompanyBlock = {
      companyId,
      profile,
      facts: initialFacts,
      compression: {
        originalTokens: 0,
        compressedTokens: 0,
        ratio: 0,
      },
      updatedAt: now,
    }

    // 압축 수행
    const compression = this.compress(block)
    block.compression = compression

    companyStore.set(companyId, block)
    return block
  }

  /**
   * Company Block을 조회합니다.
   */
  get(companyId: string): CompanyBlock | undefined {
    return companyStore.get(companyId)
  }

  /**
   * Company Block을 업데이트합니다.
   */
  update(companyId: string, updates: Partial<CompanyBlock>): CompanyBlock {
    const existing = companyStore.get(companyId)
    if (!existing) {
      throw new Error(`Company not found: ${companyId}`)
    }

    const updated: CompanyBlock = {
      ...existing,
      ...updates,
      companyId, // ID는 변경 불가
      updatedAt: new Date().toISOString(),
    }

    // 재압축
    updated.compression = this.compress(updated)

    companyStore.set(companyId, updated)
    return updated
  }

  /**
   * Company Block을 삭제합니다.
   */
  delete(companyId: string): boolean {
    return companyStore.delete(companyId)
  }

  // ================== Fact Management ==================

  /**
   * 새 Fact를 추가합니다.
   */
  addFact(
    companyId: string,
    fact: Omit<CompanyFact, 'id' | 'createdAt'>
  ): CompanyFact {
    const block = companyStore.get(companyId)
    if (!block) {
      throw new Error(`Company not found: ${companyId}`)
    }

    const newFact: CompanyFact = {
      ...fact,
      id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    block.facts.push(newFact)
    block.updatedAt = new Date().toISOString()
    block.compression = this.compress(block)

    return newFact
  }

  /**
   * 특정 유형의 Facts를 조회합니다.
   */
  getFacts(companyId: string, filter?: CompanyFactType[]): CompanyFact[] {
    const block = companyStore.get(companyId)
    if (!block) {
      return []
    }

    if (!filter || filter.length === 0) {
      return block.facts
    }

    return block.facts.filter(f => filter.includes(f.type))
  }

  /**
   * Fact를 삭제합니다.
   */
  removeFact(companyId: string, factId: string): boolean {
    const block = companyStore.get(companyId)
    if (!block) {
      return false
    }

    const initialLength = block.facts.length
    block.facts = block.facts.filter(f => f.id !== factId)

    if (block.facts.length < initialLength) {
      block.updatedAt = new Date().toISOString()
      block.compression = this.compress(block)
      return true
    }

    return false
  }

  /**
   * 만료된 Facts를 정리합니다.
   */
  cleanupExpiredFacts(companyId: string): number {
    const block = companyStore.get(companyId)
    if (!block) {
      return 0
    }

    const now = new Date().toISOString()
    const initialLength = block.facts.length

    block.facts = block.facts.filter(f => {
      if (!f.expiresAt) return true
      return f.expiresAt > now
    })

    const removed = initialLength - block.facts.length

    if (removed > 0) {
      block.updatedAt = new Date().toISOString()
      block.compression = this.compress(block)
    }

    return removed
  }

  // ================== Compression (Mem0 Pattern) ==================

  /**
   * Company Block을 압축하고 통계를 반환합니다.
   * 목표: 80% 압축률
   */
  compress(block: CompanyBlock): CompressionStats {
    // 원본 토큰 추정 (전체 데이터 직렬화)
    const originalJson = JSON.stringify({
      profile: block.profile,
      facts: block.facts,
    })
    const originalTokens = this.estimateTokens(originalJson)

    // 압축된 컨텍스트 생성
    const compressed = this.generateCompressedContext(block)
    const compressedTokens = this.estimateTokens(compressed)

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
   * 토큰 예산에 맞는 압축 컨텍스트를 반환합니다.
   */
  getCompressedContext(companyId: string, maxTokens: number = DEFAULT_COMPANY_TOKENS): string {
    const block = companyStore.get(companyId)
    if (!block) {
      return ''
    }

    let context = this.generateCompressedContext(block)
    let tokens = this.estimateTokens(context)

    // 예산 초과 시 점진적 축소
    if (tokens > maxTokens) {
      context = this.generateMinimalContext(block)
      tokens = this.estimateTokens(context)
    }

    return context
  }

  /**
   * 압축된 자연어 컨텍스트를 생성합니다.
   */
  private generateCompressedContext(block: CompanyBlock): string {
    const { profile, facts } = block
    const lines: string[] = []

    // 기본 정보 (1줄)
    const age = this.calculateCompanyAge(profile.basic.foundedDate)
    lines.push(
      `${profile.name}(${profile.basic.foundedDate.substring(0, 4)}년 설립, ${age}년차). ` +
      `직원 ${profile.basic.employeeCount}명, 매출 ${profile.basic.annualRevenue}억.`
    )

    // 인증 정보 (1줄)
    const certs = profile.qualifications.certifications
    if (certs.length > 0) {
      lines.push(`인증: ${certs.slice(0, 5).join('/')}.`)
    }

    // 신청 이력 요약 (1줄)
    const { totalApplications, selectionCount, rejectionCount } = profile.history
    if (totalApplications > 0) {
      const rate = Math.round((selectionCount / totalApplications) * 100)
      lines.push(
        `신청 ${totalApplications}건 (선정 ${selectionCount}, 탈락 ${rejectionCount}, 선정률 ${rate}%).`
      )
    }

    // 핵심 Facts (최대 5개)
    const keyFacts = this.selectKeyFacts(facts, 5)
    for (const fact of keyFacts) {
      lines.push(`• ${fact.content}`)
    }

    return lines.join(' ')
  }

  /**
   * 최소 컨텍스트를 생성합니다 (예산 초과 시).
   */
  private generateMinimalContext(block: CompanyBlock): string {
    const { profile, facts } = block
    const age = this.calculateCompanyAge(profile.basic.foundedDate)

    // 1줄 요약만
    const topFact = facts.sort((a, b) => b.confidence - a.confidence)[0]
    const factStr = topFact ? ` ${topFact.content}` : ''

    return `${profile.name}(${age}년차, ${profile.basic.employeeCount}명, ${profile.basic.annualRevenue}억).${factStr}`
  }

  /**
   * 중요도가 높은 Facts를 선택합니다.
   */
  private selectKeyFacts(facts: CompanyFact[], limit: number): CompanyFact[] {
    // 우선순위: rejection_pattern > success_pattern > capability > application > 기타
    const priority: Record<CompanyFactType, number> = {
      rejection_pattern: 5,
      success_pattern: 4,
      capability: 3,
      application: 2,
      certification: 1,
      preference: 1,
      profile: 0,
    }

    return [...facts]
      .sort((a, b) => {
        const priorityDiff = (priority[b.type] ?? 0) - (priority[a.type] ?? 0)
        if (priorityDiff !== 0) return priorityDiff
        return b.confidence - a.confidence
      })
      .slice(0, limit)
  }

  // ================== Learning ==================

  /**
   * 신청 이력에서 학습합니다.
   */
  learnFromApplication(companyId: string, history: ApplicationHistory): void {
    const block = companyStore.get(companyId)
    if (!block) return

    // 신청 이력 Fact 추가
    const content = history.result === 'selected'
      ? `${history.programName} 선정 (${history.amount?.toLocaleString() ?? '금액 미상'}만원, ${history.appliedAt.substring(0, 7)})`
      : history.result === 'rejected'
        ? `${history.programName} 탈락 (${history.rejectionReason ?? '사유 불명'}, ${history.appliedAt.substring(0, 7)})`
        : `${history.programName} ${history.result} (${history.appliedAt.substring(0, 7)})`

    this.addFact(companyId, {
      type: 'application',
      content,
      confidence: 1.0,
      source: 'document_parsed',
      relatedId: history.id,
    })
  }

  /**
   * 탈락 패턴에서 학습합니다.
   */
  learnFromRejection(companyId: string, pattern: RejectionPattern): void {
    const block = companyStore.get(companyId)
    if (!block) return

    // 탈락 패턴 Fact 추가
    const content = `${pattern.category} 주의: ${pattern.solution.prevention}`

    this.addFact(companyId, {
      type: 'rejection_pattern',
      content,
      confidence: pattern.metadata.confidence,
      source: pattern.metadata.source as FactSource,
      relatedId: pattern.id,
    })
  }

  // ================== Profile Extraction ==================

  /**
   * 프로필에서 초기 Facts를 추출합니다.
   */
  private extractFactsFromProfile(profile: CompanyProfile): CompanyFact[] {
    const facts: CompanyFact[] = []
    const now = new Date().toISOString()

    // 주요 인증 Fact
    const certs = profile.qualifications.certifications
    if (certs.length > 0) {
      facts.push({
        id: `fact-cert-${Date.now()}`,
        type: 'certification',
        content: `${certs.slice(0, 3).join(', ')} 등 ${certs.length}개 인증 보유`,
        confidence: 1.0,
        source: 'user_input',
        createdAt: now,
      })
    }

    // 기술 역량 Fact (특허/상표)
    const { patents, trademarks } = profile.qualifications
    if (patents > 0 || trademarks > 0) {
      facts.push({
        id: `fact-ip-${Date.now()}`,
        type: 'capability',
        content: `특허 ${patents}건, 상표 ${trademarks}건 보유`,
        confidence: 1.0,
        source: 'user_input',
        createdAt: now,
      })
    }

    // 최근 탈락 이력 Fact
    const recentRejections = profile.history.applications
      .filter(a => a.result === 'rejected')
      .slice(-3)

    for (const rejection of recentRejections) {
      facts.push({
        id: `fact-rej-${rejection.id}`,
        type: 'rejection_pattern',
        content: `${rejection.programName} 탈락: ${rejection.rejectionReason ?? '사유 불명'} (${rejection.appliedAt.substring(0, 7)})`,
        confidence: 0.9,
        source: 'document_parsed',
        createdAt: now,
        relatedId: rejection.id,
      })
    }

    return facts
  }

  // ================== Utilities ==================

  /**
   * 토큰 수를 추정합니다.
   */
  private estimateTokens(text: string): number {
    // 한글은 약 2토큰/글자, 영어는 약 0.25토큰/글자
    // 간단한 휴리스틱 적용
    let koreanChars = 0
    let otherChars = 0

    for (const char of text) {
      if (/[\u3131-\uD79D]/.test(char)) {
        koreanChars++
      } else {
        otherChars++
      }
    }

    return Math.ceil(koreanChars * 1.5 + otherChars * 0.3)
  }

  /**
   * 회사 업력을 계산합니다.
   */
  private calculateCompanyAge(foundedDate: string): number {
    const founded = new Date(foundedDate)
    const now = new Date()
    return Math.floor((now.getTime() - founded.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  /**
   * 모든 Company Block을 조회합니다.
   */
  getAll(): CompanyBlock[] {
    return Array.from(companyStore.values())
  }

  /**
   * 저장소를 초기화합니다 (테스트용).
   */
  clear(): void {
    companyStore.clear()
  }
}

// ================== Singleton Instance ==================

let managerInstance: CompanyBlockManager | null = null

export function getCompanyBlockManager(): CompanyBlockManager {
  if (!managerInstance) {
    managerInstance = new CompanyBlockManager()
  }
  return managerInstance
}

// ================== Factory Function ==================

export function createCompanyBlockManager(): CompanyBlockManager {
  return new CompanyBlockManager()
}
