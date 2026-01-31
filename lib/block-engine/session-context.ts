/**
 * QETTA Block Engine - Layer 3: Session Context
 *
 * 실시간 대화 컨텍스트 관리.
 * 30분 TTL로 자동 만료됩니다.
 */

import type {
  SessionContext,
  SessionIntent,
  SessionIntentType,
  SessionMessage,
  MessageRole,
  ActiveDocument,
  ActiveProgram,
} from './types'
import { SESSION_TTL_MS, DEFAULT_SESSION_TOKENS } from './types'

// ================== Internal Storage ==================

const sessionStore = new Map<string, SessionContext>()
const sessionTimers = new Map<string, NodeJS.Timeout>()

// ================== Session Context Manager ==================

export class SessionContextManager {
  private ttlMs: number

  constructor(ttlMs: number = SESSION_TTL_MS) {
    this.ttlMs = ttlMs
  }

  /**
   * 새 세션을 생성합니다.
   */
  create(): SessionContext {
    const sessionId = this.generateSessionId()
    const now = new Date().toISOString()

    const session: SessionContext = {
      sessionId,
      intent: {
        type: 'question_answer',
        confidence: 0,
        entities: {},
        detectedAt: now,
      },
      messages: [],
      createdAt: now,
      lastActivityAt: now,
    }

    sessionStore.set(sessionId, session)
    this.scheduleExpiry(sessionId)

    return session
  }

  /**
   * 세션을 조회합니다.
   */
  get(sessionId: string): SessionContext | undefined {
    const session = sessionStore.get(sessionId)
    if (session) {
      this.refreshExpiry(sessionId)
    }
    return session
  }

  /**
   * 세션을 삭제합니다.
   */
  destroy(sessionId: string): void {
    const timer = sessionTimers.get(sessionId)
    if (timer) {
      clearTimeout(timer)
      sessionTimers.delete(sessionId)
    }
    sessionStore.delete(sessionId)
  }

  // ================== Message Management ==================

  /**
   * 메시지를 추가합니다.
   */
  addMessage(
    sessionId: string,
    message: Omit<SessionMessage, 'id' | 'timestamp'>
  ): SessionMessage | undefined {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return undefined
    }

    const newMessage: SessionMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      tokens: this.estimateTokens(message.content),
    }

    session.messages.push(newMessage)
    session.lastActivityAt = new Date().toISOString()

    // 의도 자동 감지
    if (message.role === 'user') {
      this.detectIntent(session, message.content)
    }

    this.refreshExpiry(sessionId)
    return newMessage
  }

  /**
   * 최근 메시지를 조회합니다.
   */
  getRecentMessages(sessionId: string, limit: number = 10): SessionMessage[] {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return []
    }

    return session.messages.slice(-limit)
  }

  /**
   * 토큰 예산에 맞게 메시지를 가져옵니다.
   */
  getMessagesWithinBudget(
    sessionId: string,
    maxTokens: number = DEFAULT_SESSION_TOKENS
  ): SessionMessage[] {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return []
    }

    const result: SessionMessage[] = []
    let totalTokens = 0

    // 최신 메시지부터 역순으로 추가
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const msg = session.messages[i]
      const msgTokens = msg.tokens ?? this.estimateTokens(msg.content)

      if (totalTokens + msgTokens > maxTokens) {
        break
      }

      result.unshift(msg)
      totalTokens += msgTokens
    }

    return result
  }

  // ================== Intent Management ==================

  /**
   * 의도를 수동으로 업데이트합니다.
   */
  updateIntent(sessionId: string, intent: Partial<SessionIntent>): void {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return
    }

    session.intent = {
      ...session.intent,
      ...intent,
      detectedAt: new Date().toISOString(),
    }
    session.lastActivityAt = new Date().toISOString()

    this.refreshExpiry(sessionId)
  }

  /**
   * 메시지에서 의도를 자동 감지합니다.
   */
  private detectIntent(session: SessionContext, content: string): void {
    const lowerContent = content.toLowerCase()

    // 키워드 기반 의도 감지
    const intentPatterns: { type: SessionIntentType; keywords: string[]; confidence: number }[] = [
      {
        type: 'document_generation',
        keywords: ['제안서', '사업계획서', '신청서', '작성', '생성', '만들어'],
        confidence: 0.8,
      },
      {
        type: 'application_review',
        keywords: ['검토', '확인', '피드백', '수정', '보완'],
        confidence: 0.7,
      },
      {
        type: 'program_search',
        keywords: ['사업', '공고', '지원', '매칭', '찾아', '추천'],
        confidence: 0.75,
      },
      {
        type: 'rejection_analysis',
        keywords: ['탈락', '불합격', '왜', '이유', '분석'],
        confidence: 0.85,
      },
      {
        type: 'question_answer',
        keywords: ['뭐', '어떻게', '무엇', '왜', '언제', '?'],
        confidence: 0.5,
      },
    ]

    let bestMatch: { type: SessionIntentType; confidence: number } | null = null

    for (const pattern of intentPatterns) {
      const matchCount = pattern.keywords.filter(k => lowerContent.includes(k)).length
      if (matchCount > 0) {
        const adjustedConfidence = pattern.confidence * (1 + matchCount * 0.1)
        if (!bestMatch || adjustedConfidence > bestMatch.confidence) {
          bestMatch = { type: pattern.type, confidence: Math.min(adjustedConfidence, 1.0) }
        }
      }
    }

    if (bestMatch) {
      session.intent = {
        type: bestMatch.type,
        confidence: bestMatch.confidence,
        entities: this.extractEntities(content),
        detectedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * 메시지에서 엔티티를 추출합니다.
   */
  private extractEntities(content: string): Record<string, string> {
    const entities: Record<string, string> = {}

    // 사업명 추출 패턴
    const programPatterns = [
      /(?:AI바우처|스마트공장|TIPS|예비창업패키지|초기창업패키지)/g,
      /(?:\d{4}년?\s*)?(?:제?\d+차?\s*)?([가-힣]+사업)/g,
    ]

    for (const pattern of programPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        entities['program'] = matches[0]
        break
      }
    }

    // 금액 추출
    const amountMatch = content.match(/(\d+(?:,\d{3})*)\s*(?:만원|억원|원)/g)
    if (amountMatch) {
      entities['amount'] = amountMatch[0]
    }

    // 기한 추출
    const dateMatch = content.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}월\s*\d{1,2}일)/g)
    if (dateMatch) {
      entities['deadline'] = dateMatch[0]
    }

    return entities
  }

  // ================== Active Document/Program ==================

  /**
   * 현재 작업 중인 문서를 설정합니다.
   */
  setActiveDocument(sessionId: string, doc: ActiveDocument): void {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return
    }

    session.activeDocument = doc
    session.lastActivityAt = new Date().toISOString()

    this.refreshExpiry(sessionId)
  }

  /**
   * 현재 작업 중인 문서를 해제합니다.
   */
  clearActiveDocument(sessionId: string): void {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return
    }

    session.activeDocument = undefined
    session.lastActivityAt = new Date().toISOString()
  }

  /**
   * 현재 대상 프로그램을 설정합니다.
   */
  setActiveProgram(sessionId: string, program: ActiveProgram): void {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return
    }

    session.activeProgram = program
    session.lastActivityAt = new Date().toISOString()

    this.refreshExpiry(sessionId)
  }

  /**
   * 현재 대상 프로그램을 해제합니다.
   */
  clearActiveProgram(sessionId: string): void {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return
    }

    session.activeProgram = undefined
    session.lastActivityAt = new Date().toISOString()
  }

  // ================== Session Serialization ==================

  /**
   * 세션을 문자열로 직렬화합니다 (프롬프트 생성용).
   */
  serialize(sessionId: string, maxTokens?: number): string {
    const session = sessionStore.get(sessionId)
    if (!session) {
      return ''
    }

    const lines: string[] = []

    // 의도 정보
    if (session.intent.confidence > 0.5) {
      lines.push(`[의도: ${this.formatIntentType(session.intent.type)} (${Math.round(session.intent.confidence * 100)}%)]`)
    }

    // 활성 문서
    if (session.activeDocument) {
      lines.push(`[문서: ${session.activeDocument.title} (${session.activeDocument.completionPercent}% 완료)]`)
    }

    // 활성 프로그램
    if (session.activeProgram) {
      lines.push(`[프로그램: ${session.activeProgram.name} (매칭 ${session.activeProgram.matchScore}점)]`)
    }

    // 최근 대화
    const messages = maxTokens
      ? this.getMessagesWithinBudget(sessionId, maxTokens - this.estimateTokens(lines.join('\n')))
      : this.getRecentMessages(sessionId, 5)

    for (const msg of messages) {
      const roleLabel = msg.role === 'user' ? '사용자' : msg.role === 'assistant' ? 'AI' : '시스템'
      lines.push(`${roleLabel}: ${msg.content}`)
    }

    return lines.join('\n')
  }

  private formatIntentType(type: SessionIntentType): string {
    const labels: Record<SessionIntentType, string> = {
      document_generation: '문서 생성',
      application_review: '신청서 검토',
      program_search: '사업 매칭',
      rejection_analysis: '탈락 분석',
      question_answer: 'Q&A',
    }
    return labels[type] ?? type
  }

  // ================== TTL Management ==================

  private scheduleExpiry(sessionId: string): void {
    const timer = setTimeout(() => {
      this.destroy(sessionId)
    }, this.ttlMs)

    sessionTimers.set(sessionId, timer)
  }

  private refreshExpiry(sessionId: string): void {
    const existingTimer = sessionTimers.get(sessionId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    this.scheduleExpiry(sessionId)
  }

  // ================== Utilities ==================

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
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

  /**
   * 모든 세션을 조회합니다.
   */
  getAll(): SessionContext[] {
    return Array.from(sessionStore.values())
  }

  /**
   * 활성 세션 수를 반환합니다.
   */
  getActiveCount(): number {
    return sessionStore.size
  }

  /**
   * 저장소를 초기화합니다 (테스트용).
   */
  clear(): void {
    sessionTimers.forEach((timer) => {
      clearTimeout(timer)
    })
    sessionTimers.clear()
    sessionStore.clear()
  }
}

// ================== Singleton Instance ==================

let managerInstance: SessionContextManager | null = null

export function getSessionContextManager(): SessionContextManager {
  if (!managerInstance) {
    managerInstance = new SessionContextManager()
  }
  return managerInstance
}

// ================== Factory Function ==================

export function createSessionContextManager(ttlMs?: number): SessionContextManager {
  return new SessionContextManager(ttlMs)
}
