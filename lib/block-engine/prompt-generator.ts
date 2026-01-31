/**
 * QETTA Block Engine - Prompt Generator
 *
 * 3-Layer Context를 Claude API용 프롬프트로 변환합니다.
 *
 * @see lib/block-engine/assembler.ts (컨텍스트 조립)
 * @see lib/claude/index.ts (Claude API 통합)
 */

import type { AssembledContext, AssembledPrompt, CompanyBlock, CompanyFact } from './types'
import type { EnginePresetType } from '@/lib/super-model'

// ================== Prompt Templates ==================

const PROPOSAL_SYSTEM_TEMPLATE = `당신은 QETTA AI 제안서 작성 전문가입니다.

## 역할
정부지원사업 제안서를 작성합니다. 산업별 전문 용어를 정확히 사용하고, 정부사업 규정을 준수합니다.

## 현재 도메인
{domain_info}

## 회사 프로필
{company_profile}

## 핵심 Fact (우선순위순)
{company_facts}

## 작성 규칙
1. 구체적인 수치와 실적 사용 (추상적 표현 금지)
2. 산업 전문 용어 정확히 사용
3. 탈락 패턴 회피 (rejection_pattern 참조)
4. 성공 패턴 활용 (success_pattern 참조)
5. 지원사업 요구사항과 회사 역량 매칭`

const PROPOSAL_USER_TEMPLATE = `## 지원 프로그램
프로그램명: {program_name}
프로그램 ID: {program_id}

## 요청 사항
{user_request}

## 작성할 제안서 섹션
{sections}

위 정보를 바탕으로 제안서를 작성해주세요.
각 섹션별로 구체적인 내용을 포함하고, 회사의 강점과 프로그램 요구사항을 연결해주세요.`

// ================== Prompt Generator Class ==================

export interface ProposalPromptOptions {
  /** 지원 프로그램 ID */
  programId: string
  /** 지원 프로그램명 */
  programName: string
  /** 사용자 요청 사항 */
  userRequest?: string
  /** 작성할 섹션 목록 */
  sections?: string[]
  /** 최대 토큰 수 */
  maxTokens?: number
}

export interface GeneratedPrompt {
  /** 시스템 프롬프트 */
  system: string
  /** 사용자 프롬프트 */
  user: string
  /** 예상 토큰 수 */
  estimatedTokens: number
  /** 사용된 Facts 목록 */
  usedFacts: string[]
}

export class PromptGenerator {
  /**
   * 제안서 생성용 프롬프트를 생성합니다.
   */
  generateProposalPrompt(
    context: AssembledContext,
    options: ProposalPromptOptions
  ): GeneratedPrompt {
    const { programId, programName, userRequest, sections, maxTokens } = options

    // 회사 프로필 포맷팅
    const companyProfile = this.formatCompanyProfile(context.company)

    // Facts 우선순위 정렬 및 포맷팅
    const sortedFacts = this.sortFactsByPriority(context.company.facts)
    const formattedFacts = this.formatFacts(sortedFacts, maxTokens)

    // 도메인 정보 포맷팅
    const domainInfo = this.formatDomainInfo(context.domain.presetId)

    // 시스템 프롬프트 생성
    const system = PROPOSAL_SYSTEM_TEMPLATE
      .replace('{domain_info}', domainInfo)
      .replace('{company_profile}', companyProfile)
      .replace('{company_facts}', formattedFacts.text)

    // 섹션 목록
    const sectionList = sections?.length
      ? sections.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '1. 사업 개요\n2. 기술 역량\n3. 추진 계획\n4. 기대 효과'

    // 사용자 프롬프트 생성
    const user = PROPOSAL_USER_TEMPLATE
      .replace('{program_id}', programId)
      .replace('{program_name}', programName)
      .replace('{user_request}', userRequest ?? '표준 제안서 작성')
      .replace('{sections}', sectionList)

    // 토큰 추정
    const estimatedTokens = this.estimateTokens(system + user)

    return {
      system,
      user,
      estimatedTokens,
      usedFacts: formattedFacts.usedIds,
    }
  }

  /**
   * 채팅용 프롬프트를 생성합니다 (기존 AssembledPrompt 포맷).
   */
  generateChatPrompt(context: AssembledContext): AssembledPrompt {
    const { domain, company, session } = context

    // 시스템 프롬프트 (간결 버전)
    const system = this.generateChatSystemPrompt(domain.presetId, company)

    // 컨텍스트 섹션
    const contextSection = this.generateContextSection(domain, company)

    // 대화 히스토리
    const history = this.generateHistory(session)

    // 마지막 사용자 입력
    const lastUserMessage = session.messages
      .filter(m => m.role === 'user')
      .pop()
    const userInput = lastUserMessage?.content ?? ''

    return {
      system,
      context: contextSection,
      history,
      userInput,
      estimatedTokens: this.estimateTokens([system, contextSection, history, userInput].join('\n')),
    }
  }

  // ================== Private Methods ==================

  private formatCompanyProfile(company: CompanyBlock): string {
    const profile = company.profile
    const lines: string[] = []

    // CompanyProfile uses 'name' not 'companyName'
    lines.push(`회사명: ${profile.name}`)
    if (profile.basic?.foundedDate) {
      lines.push(`설립일: ${profile.basic.foundedDate}`)
    }
    if (profile.basic?.industry) {
      lines.push(`업종: ${profile.basic.industry}`)
    }
    if (profile.basic?.employeeCount) {
      lines.push(`직원수: ${profile.basic.employeeCount}명`)
    }
    if (profile.basic?.annualRevenue) {
      lines.push(`연매출: ${profile.basic.annualRevenue}억원`)
    }
    if (profile.basic?.region) {
      lines.push(`지역: ${profile.basic.region}`)
    }

    // 보유 인증
    if (profile.qualifications?.certifications && profile.qualifications.certifications.length > 0) {
      lines.push(`보유인증: ${profile.qualifications.certifications.join(', ')}`)
    }

    // 이력 요약
    if (profile.history) {
      lines.push(`신청이력: 총 ${profile.history.totalApplications}건 (선정 ${profile.history.selectionCount}건)`)
    }

    return lines.join('\n')
  }

  private sortFactsByPriority(facts: CompanyFact[]): CompanyFact[] {
    // 우선순위: rejection_pattern > success_pattern > capability > certification > profile
    const priorityOrder: Record<string, number> = {
      rejection_pattern: 1,
      success_pattern: 2,
      capability: 3,
      certification: 4,
      application: 5,
      preference: 6,
      profile: 7,
    }

    return [...facts].sort((a, b) => {
      const priorityDiff = (priorityOrder[a.type] ?? 99) - (priorityOrder[b.type] ?? 99)
      if (priorityDiff !== 0) return priorityDiff

      // 같은 우선순위면 confidence 높은 순
      return b.confidence - a.confidence
    })
  }

  private formatFacts(
    facts: CompanyFact[],
    maxTokens?: number
  ): { text: string; usedIds: string[] } {
    const targetTokens = maxTokens ?? 800
    const lines: string[] = []
    const usedIds: string[] = []
    let currentTokens = 0

    for (const fact of facts) {
      const factLine = `- [${fact.type}] ${fact.content} (신뢰도: ${Math.round(fact.confidence * 100)}%)`
      const factTokens = this.estimateTokens(factLine)

      if (currentTokens + factTokens > targetTokens) break

      lines.push(factLine)
      usedIds.push(fact.id)
      currentTokens += factTokens
    }

    return {
      text: lines.join('\n'),
      usedIds,
    }
  }

  private formatDomainInfo(presetId: EnginePresetType): string {
    const domainNames: Record<string, string> = {
      SMART_FACTORY: '스마트공장 (제조혁신)',
      TMS: '환경관리 (TMS/CleanSYS)',
      AI_VOUCHER: 'AI 바우처 (NIPA)',
      GLOBAL_TENDER: '해외입찰 (글로벌조달)',
    }

    return domainNames[presetId] ?? '일반 도메인'
  }

  private generateChatSystemPrompt(presetId: EnginePresetType, company: CompanyBlock): string {
    return `당신은 QETTA AI 어시스턴트입니다.
도메인: ${this.formatDomainInfo(presetId)}
회사: ${company.profile.name}

핵심 역할:
- 정부지원사업 문서 작성 지원
- 산업별 전문 용어 적용
- 탈락 패턴 예방`
  }

  private generateContextSection(
    domain: AssembledContext['domain'],
    company: CompanyBlock
  ): string {
    const lines: string[] = []

    // 회사 정보 요약
    lines.push('## 회사 요약')
    lines.push(this.formatCompanyProfile(company))

    // 상위 5개 용어
    if (domain.terminology.length > 0) {
      lines.push('')
      lines.push('## 핵심 용어')
      domain.terminology.slice(0, 5).forEach(term => {
        lines.push(`- ${term.korean}: ${term.description.slice(0, 50)}...`)
      })
    }

    return lines.join('\n')
  }

  private generateHistory(session: AssembledContext['session']): string {
    const lines: string[] = []

    // 최근 대화 5개
    const recentMessages = session.messages.slice(-5)
    for (const msg of recentMessages) {
      const role = msg.role === 'user' ? '사용자' : 'AI'
      lines.push(`${role}: ${msg.content}`)
    }

    return lines.join('\n')
  }

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

    return Math.ceil(koreanChars * 1.5 + otherChars * 0.3)
  }
}

// ================== Factory Function ==================

let promptGeneratorInstance: PromptGenerator | null = null

export function getPromptGenerator(): PromptGenerator {
  if (!promptGeneratorInstance) {
    promptGeneratorInstance = new PromptGenerator()
  }
  return promptGeneratorInstance
}

/**
 * 빠른 제안서 프롬프트 생성 헬퍼
 */
export function generateProposalPrompt(
  context: AssembledContext,
  options: ProposalPromptOptions
): GeneratedPrompt {
  const generator = getPromptGenerator()
  return generator.generateProposalPrompt(context, options)
}
