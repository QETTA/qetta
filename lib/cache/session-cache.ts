/**
 * Session Cache
 *
 * Redis 기반 세션 캐싱 레이어.
 * SessionContextManager와 통합하여 분산 환경에서도 세션 유지.
 *
 * Key 패턴: session:{sessionId}
 * TTL: 30분 (활동 시 갱신)
 */

import { UniversalCache, getCache, CACHE_TTL } from './redis-client'
import { logger } from '@/lib/api/logger'
import type {
  SessionContext,
  SessionIntent,
  SessionMessage,
  ActiveDocument,
  ActiveProgram,
} from '@/lib/block-engine/types'

// ============================================
// Constants
// ============================================

const SESSION_PREFIX = 'session:'
const SESSION_TTL = CACHE_TTL.SESSION_CONTEXT

// ============================================
// Session Cache Class
// ============================================

export class SessionCache {
  private cache: UniversalCache

  constructor(cache?: UniversalCache) {
    this.cache = cache ?? getCache()
  }

  /**
   * 세션 키 생성
   */
  private key(sessionId: string): string {
    return `${SESSION_PREFIX}${sessionId}`
  }

  /**
   * 새 세션을 생성합니다.
   */
  async create(): Promise<SessionContext> {
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

    await this.cache.setJson(this.key(sessionId), session, SESSION_TTL)
    logger.debug(`[SessionCache] Created session: ${sessionId}`)

    return session
  }

  /**
   * 세션을 조회합니다.
   */
  async get(sessionId: string): Promise<SessionContext | null> {
    const session = await this.cache.getJson<SessionContext>(this.key(sessionId))

    if (session) {
      // TTL 갱신 (활동)
      await this.cache.expire(this.key(sessionId), SESSION_TTL)
    }

    return session
  }

  /**
   * 세션을 저장합니다.
   */
  async save(session: SessionContext): Promise<void> {
    session.lastActivityAt = new Date().toISOString()
    await this.cache.setJson(this.key(session.sessionId), session, SESSION_TTL)
  }

  /**
   * 세션을 삭제합니다.
   */
  async destroy(sessionId: string): Promise<void> {
    await this.cache.del(this.key(sessionId))
    logger.debug(`[SessionCache] Destroyed session: ${sessionId}`)
  }

  /**
   * 세션 존재 여부를 확인합니다.
   */
  async exists(sessionId: string): Promise<boolean> {
    return this.cache.exists(this.key(sessionId))
  }

  // ============================================
  // Message Management
  // ============================================

  /**
   * 메시지를 추가합니다.
   */
  async addMessage(
    sessionId: string,
    message: Omit<SessionMessage, 'id' | 'timestamp'>
  ): Promise<SessionMessage | null> {
    const session = await this.get(sessionId)
    if (!session) {
      logger.warn(`[SessionCache] Session not found: ${sessionId}`)
      return null
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

    await this.save(session)
    return newMessage
  }

  /**
   * 최근 메시지를 조회합니다.
   */
  async getRecentMessages(sessionId: string, limit: number = 10): Promise<SessionMessage[]> {
    const session = await this.get(sessionId)
    if (!session) return []

    return session.messages.slice(-limit)
  }

  /**
   * 토큰 예산에 맞게 메시지를 가져옵니다.
   */
  async getMessagesWithinBudget(
    sessionId: string,
    maxTokens: number = 2000
  ): Promise<SessionMessage[]> {
    const session = await this.get(sessionId)
    if (!session) return []

    const result: SessionMessage[] = []
    let totalTokens = 0

    for (let i = session.messages.length - 1; i >= 0; i--) {
      const msg = session.messages[i]
      const msgTokens = msg.tokens ?? this.estimateTokens(msg.content)

      if (totalTokens + msgTokens > maxTokens) break

      result.unshift(msg)
      totalTokens += msgTokens
    }

    return result
  }

  // ============================================
  // Intent Management
  // ============================================

  /**
   * 의도를 업데이트합니다.
   */
  async updateIntent(sessionId: string, intent: Partial<SessionIntent>): Promise<void> {
    const session = await this.get(sessionId)
    if (!session) return

    session.intent = {
      ...session.intent,
      ...intent,
      detectedAt: new Date().toISOString(),
    }

    await this.save(session)
  }

  /**
   * 메시지에서 의도를 자동 감지합니다.
   */
  private detectIntent(session: SessionContext, content: string): void {
    const lowerContent = content.toLowerCase()

    const intentPatterns = [
      { type: 'document_generation', keywords: ['제안서', '사업계획서', '신청서', '작성', '생성'], confidence: 0.8 },
      { type: 'application_review', keywords: ['검토', '확인', '피드백', '수정'], confidence: 0.7 },
      { type: 'program_search', keywords: ['사업', '공고', '지원', '매칭', '추천'], confidence: 0.75 },
      { type: 'rejection_analysis', keywords: ['탈락', '불합격', '왜', '이유', '분석'], confidence: 0.85 },
      { type: 'question_answer', keywords: ['뭐', '어떻게', '무엇', '?'], confidence: 0.5 },
    ] as const

    let bestMatch: { type: SessionIntent['type']; confidence: number } | null = null

    for (const pattern of intentPatterns) {
      const matchCount = pattern.keywords.filter(k => lowerContent.includes(k)).length
      if (matchCount > 0) {
        const adjustedConfidence = Math.min(pattern.confidence * (1 + matchCount * 0.1), 1.0)
        if (!bestMatch || adjustedConfidence > bestMatch.confidence) {
          bestMatch = { type: pattern.type, confidence: adjustedConfidence }
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
   * 엔티티 추출
   */
  private extractEntities(content: string): Record<string, string> {
    const entities: Record<string, string> = {}

    // 사업명
    const programMatch = content.match(/(?:AI바우처|스마트공장|TIPS|예비창업패키지|초기창업패키지)/g)
    if (programMatch) entities['program'] = programMatch[0]

    // 금액
    const amountMatch = content.match(/(\d+(?:,\d{3})*)\s*(?:만원|억원|원)/g)
    if (amountMatch) entities['amount'] = amountMatch[0]

    // 기한
    const dateMatch = content.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}월\s*\d{1,2}일)/g)
    if (dateMatch) entities['deadline'] = dateMatch[0]

    return entities
  }

  // ============================================
  // Active Document/Program
  // ============================================

  /**
   * 활성 문서를 설정합니다.
   */
  async setActiveDocument(sessionId: string, doc: ActiveDocument): Promise<void> {
    const session = await this.get(sessionId)
    if (!session) return

    session.activeDocument = doc
    await this.save(session)
  }

  /**
   * 활성 문서를 해제합니다.
   */
  async clearActiveDocument(sessionId: string): Promise<void> {
    const session = await this.get(sessionId)
    if (!session) return

    session.activeDocument = undefined
    await this.save(session)
  }

  /**
   * 활성 프로그램을 설정합니다.
   */
  async setActiveProgram(sessionId: string, program: ActiveProgram): Promise<void> {
    const session = await this.get(sessionId)
    if (!session) return

    session.activeProgram = program
    await this.save(session)
  }

  /**
   * 활성 프로그램을 해제합니다.
   */
  async clearActiveProgram(sessionId: string): Promise<void> {
    const session = await this.get(sessionId)
    if (!session) return

    session.activeProgram = undefined
    await this.save(session)
  }

  // ============================================
  // Serialization
  // ============================================

  /**
   * 세션을 프롬프트용 문자열로 직렬화합니다.
   */
  async serialize(sessionId: string, maxTokens?: number): Promise<string> {
    const session = await this.get(sessionId)
    if (!session) return ''

    const lines: string[] = []

    // 의도 정보
    if (session.intent.confidence > 0.5) {
      const intentLabel = this.formatIntentType(session.intent.type)
      lines.push(`[의도: ${intentLabel} (${Math.round(session.intent.confidence * 100)}%)]`)
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
    const headerTokens = this.estimateTokens(lines.join('\n'))
    const messageTokens = maxTokens ? maxTokens - headerTokens : 2000
    const messages = await this.getMessagesWithinBudget(sessionId, messageTokens)

    for (const msg of messages) {
      const roleLabel = msg.role === 'user' ? '사용자' : msg.role === 'assistant' ? 'AI' : '시스템'
      lines.push(`${roleLabel}: ${msg.content}`)
    }

    return lines.join('\n')
  }

  private formatIntentType(type: SessionIntent['type']): string {
    const labels: Record<SessionIntent['type'], string> = {
      document_generation: '문서 생성',
      application_review: '신청서 검토',
      program_search: '사업 매칭',
      rejection_analysis: '탈락 분석',
      question_answer: 'Q&A',
    }
    return labels[type] ?? type
  }

  // ============================================
  // Utilities
  // ============================================

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
   * 모든 세션 키를 조회합니다.
   */
  async getAllSessionIds(): Promise<string[]> {
    const keys = await this.cache.keys(`${SESSION_PREFIX}*`)
    return keys.map(key => key.replace(SESSION_PREFIX, ''))
  }

  /**
   * 캐시 통계를 조회합니다.
   */
  getStats(): { backend: 'redis' | 'memory' } {
    return { backend: this.cache.isUsingRedis() ? 'redis' : 'memory' }
  }
}

// ============================================
// Singleton Instance
// ============================================

let sessionCacheInstance: SessionCache | null = null

export function getSessionCache(): SessionCache {
  if (!sessionCacheInstance) {
    sessionCacheInstance = new SessionCache()
  }
  return sessionCacheInstance
}

// ============================================
// Factory Function
// ============================================

export function createSessionCache(cache?: UniversalCache): SessionCache {
  return new SessionCache(cache)
}
