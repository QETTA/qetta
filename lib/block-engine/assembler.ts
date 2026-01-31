/**
 * QETTA Block Engine - Context Assembler
 *
 * 3개 Layer를 조립하여 단일 컨텍스트를 생성합니다.
 *
 * Token Budget Allocation:
 * - System Prompt: ~500 tokens (고정)
 * - Layer 1 (Domain): ~2000 tokens
 * - Layer 2 (Company): ~1500 tokens
 * - Layer 3 (Session): ~500 tokens
 * - Headroom: ~3500 tokens (사용자 입력 + AI 응답)
 * - Total Base: ~4500 tokens
 */

import type { EnginePresetType } from '@/lib/super-model'
import type {
  AssembledContext,
  AssembledPrompt,
  AssemblyOptions,
  AssemblyMetadata,
  TokenBreakdown,
  DomainContext,
  CompanyBlock,
  SessionContext,
} from './types'
import {
  DEFAULT_TOKEN_BUDGET,
  DEFAULT_DOMAIN_TOKENS,
  DEFAULT_COMPANY_TOKENS,
  DEFAULT_SESSION_TOKENS,
  DEFAULT_SYSTEM_TOKENS,
} from './types'
import { DomainEngineLayer } from './domain-engine'
import { CompanyBlockManager } from './company-block'
import { SessionContextManager } from './session-context'

// ================== Context Assembler ==================

export class ContextAssembler {
  private domain: DomainEngineLayer
  private company: CompanyBlockManager
  private session: SessionContextManager

  constructor(
    domain: DomainEngineLayer,
    company: CompanyBlockManager,
    session: SessionContextManager
  ) {
    this.domain = domain
    this.company = company
    this.session = session
  }

  /**
   * 3개 Layer를 조립하여 통합 컨텍스트를 생성합니다.
   */
  assemble(
    presetId: EnginePresetType,
    companyId: string,
    sessionId: string,
    options?: AssemblyOptions
  ): AssembledContext {
    const maxTokens = options?.maxTokens ?? DEFAULT_TOKEN_BUDGET
    const now = new Date().toISOString()

    // 토큰 예산 분배
    const budget = this.allocateBudget(maxTokens, options)

    // Layer 1: Domain 로드
    const domainContext = this.domain.loadWithBudget(presetId, budget.domain)

    // Layer 2: Company 로드
    const companyBlock = this.company.get(companyId)
    if (!companyBlock) {
      throw new Error(`Company not found: ${companyId}`)
    }

    // Layer 3: Session 로드
    const sessionContext = this.session.get(sessionId)
    if (!sessionContext) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    // 토큰 사용량 계산
    const domainTokens = domainContext.tokenBudget.current
    const companyTokens = companyBlock.compression.compressedTokens
    const sessionTokens = this.estimateSessionTokens(sessionContext, budget.session)
    const totalTokens = domainTokens + companyTokens + sessionTokens

    const assembly: AssemblyMetadata = {
      totalTokens,
      tokenBreakdown: {
        domain: domainTokens,
        company: companyTokens,
        session: sessionTokens,
      },
      assembledAt: now,
      withinBudget: totalTokens <= maxTokens,
    }

    return {
      domain: domainContext,
      company: companyBlock,
      session: sessionContext,
      assembly,
    }
  }

  /**
   * 조립된 컨텍스트를 프롬프트 형식으로 변환합니다.
   */
  toPrompt(context: AssembledContext): AssembledPrompt {
    const { domain, company, session } = context

    // 시스템 프롬프트 생성
    const system = this.generateSystemPrompt(domain)

    // 컨텍스트 섹션 생성 (Domain + Company)
    const contextSection = this.generateContextSection(domain, company)

    // 대화 히스토리 생성
    const history = this.generateHistory(session)

    // 현재 사용자 입력 (마지막 user 메시지)
    const lastUserMessage = session.messages
      .filter(m => m.role === 'user')
      .pop()
    const userInput = lastUserMessage?.content ?? ''

    // 토큰 추정
    const estimatedTokens = this.estimateTokens([system, contextSection, history, userInput].join('\n'))

    return {
      system,
      context: contextSection,
      history,
      userInput,
      estimatedTokens,
    }
  }

  /**
   * 토큰 예산에 맞게 컨텍스트를 조정합니다.
   */
  fitToTokenBudget(context: AssembledContext, maxTokens: number): AssembledContext {
    const { assembly } = context

    if (assembly.totalTokens <= maxTokens) {
      return context
    }

    // 초과분 계산
    const excess = assembly.totalTokens - maxTokens

    // 우선순위에 따라 축소: Session → Company → Domain
    let newContext = { ...context }

    // 1. Session 축소 시도
    const sessionReduction = Math.min(excess, assembly.tokenBreakdown.session * 0.5)
    if (sessionReduction > 0) {
      newContext = this.reduceSessionContext(newContext, sessionReduction)
    }

    // 여전히 초과하면 Company 축소
    if (newContext.assembly.totalTokens > maxTokens) {
      const companyReduction = Math.min(
        newContext.assembly.totalTokens - maxTokens,
        assembly.tokenBreakdown.company * 0.3
      )
      newContext = this.reduceCompanyContext(newContext, companyReduction)
    }

    // 여전히 초과하면 Domain 축소
    if (newContext.assembly.totalTokens > maxTokens) {
      const domainContext = this.domain.fitToTokenBudget(
        newContext.domain,
        DEFAULT_DOMAIN_TOKENS * 0.5
      )
      newContext.domain = domainContext
      newContext.assembly = this.recalculateAssembly(newContext)
    }

    return newContext
  }

  // ================== Prompt Generation ==================

  private generateSystemPrompt(domain: DomainContext): string {
    const blockNames = domain.loadedBlocks.join(', ')
    const ruleCount = domain.rules.length

    return `당신은 QETTA AI 어시스턴트입니다.
현재 활성화된 도메인: ${domain.presetId} (${blockNames})
적용 규칙: ${ruleCount}개
역할: 정부지원사업 신청서 및 제안서 작성 전문가

핵심 역량:
- 산업별 전문 용어 이해 및 적용
- 정부사업 규정 준수 검증
- 탈락 패턴 분석 및 예방
- 문서 자동 생성 및 검토`
  }

  private generateContextSection(domain: DomainContext, company: CompanyBlock): string {
    const lines: string[] = []

    // 회사 컨텍스트 (압축된 형태)
    lines.push('## 회사 정보')
    lines.push(this.company.getCompressedContext(company.companyId, DEFAULT_COMPANY_TOKENS))
    lines.push('')

    // 도메인 용어 요약
    lines.push('## 도메인 용어')
    const topTerms = domain.terminology.slice(0, 10)
    for (const term of topTerms) {
      lines.push(`- ${term.korean} (${term.english}): ${term.description.slice(0, 50)}...`)
    }
    lines.push('')

    // 적용 규칙 요약
    if (domain.rules.length > 0) {
      lines.push('## 주요 규칙')
      const topRules = domain.rules.slice(0, 5)
      for (const rule of topRules) {
        lines.push(`- [${rule.severity}] ${rule.name}: ${rule.description.slice(0, 50)}...`)
      }
    }

    return lines.join('\n')
  }

  private generateHistory(session: SessionContext): string {
    const lines: string[] = []

    // 의도 정보
    if (session.intent.confidence > 0.5) {
      lines.push(`[감지된 의도: ${session.intent.type} (${Math.round(session.intent.confidence * 100)}%)]`)
    }

    // 활성 문서/프로그램
    if (session.activeDocument) {
      lines.push(`[작업 중인 문서: ${session.activeDocument.title}]`)
    }
    if (session.activeProgram) {
      lines.push(`[대상 프로그램: ${session.activeProgram.name}]`)
    }

    // 최근 대화 (마지막 5개)
    lines.push('')
    lines.push('## 최근 대화')
    const recentMessages = session.messages.slice(-5)
    for (const msg of recentMessages) {
      const roleLabel = msg.role === 'user' ? '사용자' : msg.role === 'assistant' ? 'AI' : '시스템'
      lines.push(`${roleLabel}: ${msg.content}`)
    }

    return lines.join('\n')
  }

  // ================== Budget Allocation ==================

  private allocateBudget(maxTokens: number, options?: AssemblyOptions): TokenBreakdown & { headroom: number } {
    // 기본 분배 (비율 기준)
    const availableForContext = maxTokens - DEFAULT_SYSTEM_TOKENS

    // 옵션에 따른 조정
    const domainRatio = 0.45  // 45%
    const companyRatio = 0.35 // 35%
    const sessionRatio = 0.20 // 20%

    return {
      domain: options?.maxTokens
        ? Math.min(availableForContext * domainRatio, DEFAULT_DOMAIN_TOKENS)
        : DEFAULT_DOMAIN_TOKENS,
      company: DEFAULT_COMPANY_TOKENS,
      session: options?.messageLimit
        ? Math.min(availableForContext * sessionRatio, DEFAULT_SESSION_TOKENS)
        : DEFAULT_SESSION_TOKENS,
      headroom: maxTokens - (DEFAULT_DOMAIN_TOKENS + DEFAULT_COMPANY_TOKENS + DEFAULT_SESSION_TOKENS + DEFAULT_SYSTEM_TOKENS),
    }
  }

  // ================== Context Reduction ==================

  private reduceSessionContext(context: AssembledContext, reduction: number): AssembledContext {
    // 메시지 수 줄이기
    const currentMessages = context.session.messages
    const targetTokens = context.assembly.tokenBreakdown.session - reduction

    let totalTokens = 0
    const keptMessages = []

    // 최신 메시지부터 유지
    for (let i = currentMessages.length - 1; i >= 0; i--) {
      const msg = currentMessages[i]
      const msgTokens = msg.tokens ?? this.estimateTokens(msg.content)

      if (totalTokens + msgTokens > targetTokens) {
        break
      }

      keptMessages.unshift(msg)
      totalTokens += msgTokens
    }

    const newSession: SessionContext = {
      ...context.session,
      messages: keptMessages,
    }

    return {
      ...context,
      session: newSession,
      assembly: this.recalculateAssembly({ ...context, session: newSession }),
    }
  }

  private reduceCompanyContext(context: AssembledContext, _reduction: number): AssembledContext {
    // Company의 Facts 수 줄이기
    const currentFacts = context.company.facts.length
    const targetFacts = Math.max(3, Math.floor(currentFacts * 0.7))

    // 중요도 순으로 정렬 후 상위만 유지
    const sortedFacts = [...context.company.facts]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, targetFacts)

    const newCompany: CompanyBlock = {
      ...context.company,
      facts: sortedFacts,
    }

    return {
      ...context,
      company: newCompany,
      assembly: this.recalculateAssembly({ ...context, company: newCompany }),
    }
  }

  private recalculateAssembly(context: AssembledContext): AssemblyMetadata {
    const domainTokens = context.domain.tokenBudget.current
    const companyTokens = context.company.compression.compressedTokens
    const sessionTokens = this.estimateSessionTokens(context.session, DEFAULT_SESSION_TOKENS)
    const totalTokens = domainTokens + companyTokens + sessionTokens

    return {
      totalTokens,
      tokenBreakdown: {
        domain: domainTokens,
        company: companyTokens,
        session: sessionTokens,
      },
      assembledAt: new Date().toISOString(),
      withinBudget: totalTokens <= DEFAULT_TOKEN_BUDGET,
    }
  }

  // ================== Utilities ==================

  private estimateSessionTokens(session: SessionContext, _maxTokens: number): number {
    let totalTokens = 0

    // Intent + metadata
    totalTokens += 50

    // Messages
    for (const msg of session.messages) {
      totalTokens += msg.tokens ?? this.estimateTokens(msg.content)
    }

    return totalTokens
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

/**
 * 새 Context Assembler를 생성합니다.
 */
export function createContextAssembler(
  domain?: DomainEngineLayer,
  company?: CompanyBlockManager,
  session?: SessionContextManager
): ContextAssembler {
  return new ContextAssembler(
    domain ?? new DomainEngineLayer(),
    company ?? new CompanyBlockManager(),
    session ?? new SessionContextManager()
  )
}

/**
 * 싱글톤 인스턴스를 반환합니다.
 */
let assemblerInstance: ContextAssembler | null = null

export function getContextAssembler(): ContextAssembler {
  if (!assemblerInstance) {
    assemblerInstance = createContextAssembler()
  }
  return assemblerInstance
}

// ================== Convenience Functions ==================

/**
 * 빠른 컨텍스트 조립을 위한 헬퍼 함수
 */
export async function quickAssemble(
  presetId: EnginePresetType,
  companyId: string,
  userMessage: string,
  options?: AssemblyOptions
): Promise<{ context: AssembledContext; prompt: AssembledPrompt }> {
  const assembler = getContextAssembler()

  // 새 세션 생성
  const sessionManager = new SessionContextManager()
  const session = sessionManager.create()

  // 사용자 메시지 추가
  sessionManager.addMessage(session.sessionId, {
    role: 'user',
    content: userMessage,
  })

  // 조립
  const tempAssembler = createContextAssembler(
    new DomainEngineLayer(),
    new CompanyBlockManager(),
    sessionManager
  )

  // Company가 없으면 기본 생성 (실제로는 DB에서 로드)
  const companyManager = new CompanyBlockManager()
  const existingCompany = companyManager.get(companyId)
  if (!existingCompany) {
    // 임시 프로필 생성 (실제로는 DB에서 로드해야 함)
    throw new Error(`Company not found: ${companyId}. Please create a company first.`)
  }

  const context = tempAssembler.assemble(presetId, companyId, session.sessionId, options)
  const prompt = tempAssembler.toPrompt(context)

  return { context, prompt }
}
