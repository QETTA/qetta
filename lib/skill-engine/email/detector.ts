/**
 * QETTA Email Event Detector
 *
 * 🎯 킬러 기능: 이메일에서 선정/불합격 자동 감지
 *
 * 지원 이벤트:
 * - 신청 완료
 * - 심사 중
 * - 추가 서류 요청
 * - 면접/발표 일정
 * - 선정/불합격 결과 ← 핵심!
 * - 계약 안내
 * - 정산/지급 안내
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type {
  EmailEventType,
  EmailIntegrationConfig,
  DetectedEmailEvent,
  EnginePresetType,
  RejectionAnalysisResult,
} from '../types'

import { rejectionAnalyzer } from '../rejection/analyzer'

// ============================================
// Email Detection Patterns
// ============================================

interface EmailPattern {
  eventType: EmailEventType
  subjectPatterns: RegExp[]
  bodyPatterns: RegExp[]
  senderPatterns: string[]
  priority: number // 높을수록 우선
}

const EMAIL_PATTERNS: EmailPattern[] = [
  // 선정 결과 (가장 중요!)
  {
    eventType: 'selection_result',
    subjectPatterns: [
      /선정.*결과/i,
      /최종.*선정/i,
      /합격.*통보/i,
      /탈락.*통보/i,
      /불합격.*안내/i,
      /선정.*안내/i,
      /지원.*결과/i,
      /평가.*결과/i,
    ],
    bodyPatterns: [
      /선정되었습니다/i,
      /선정.*되셨습니다/i,
      /탈락하였습니다/i,
      /불합격.*되었습니다/i,
      /아쉽게도.*선정되지/i,
      /축하드립니다.*선정/i,
      /심사.*결과.*안내/i,
    ],
    senderPatterns: [
      'noreply@koita.or.kr', // KOITA
      'k-startup@',
      'noreply@smba.go.kr',
      'noreply@kised.or.kr',
      'noreply@nipa.kr',
      'tips@',
      'support@',
    ],
    priority: 100,
  },

  // 추가 서류 요청
  {
    eventType: 'document_request',
    subjectPatterns: [
      /추가.*서류/i,
      /보완.*요청/i,
      /서류.*제출.*안내/i,
      /증빙.*요청/i,
      /필수.*서류/i,
    ],
    bodyPatterns: [
      /추가로.*제출/i,
      /보완.*서류/i,
      /아래.*서류.*제출/i,
      /기한.*내.*제출/i,
      /마감일.*까지/i,
    ],
    senderPatterns: ['noreply@', 'support@', 'admin@'],
    priority: 80,
  },

  // 면접/발표 일정
  {
    eventType: 'interview_scheduled',
    subjectPatterns: [
      /면접.*안내/i,
      /발표.*일정/i,
      /IR.*일정/i,
      /대면.*심사/i,
      /현장.*평가/i,
    ],
    bodyPatterns: [
      /면접.*일시/i,
      /발표.*시간/i,
      /장소.*안내/i,
      /참석.*확인/i,
      /발표자료.*제출/i,
    ],
    senderPatterns: ['noreply@', 'interview@', 'schedule@'],
    priority: 70,
  },

  // 계약 안내
  {
    eventType: 'contract_notice',
    subjectPatterns: [
      /계약.*안내/i,
      /협약.*체결/i,
      /사업.*착수/i,
      /협약식/i,
      /계약서.*작성/i,
    ],
    bodyPatterns: [
      /협약.*체결/i,
      /계약.*진행/i,
      /사업.*시작/i,
      /착수.*보고/i,
      /협약.*기한/i,
    ],
    senderPatterns: ['noreply@', 'contract@', 'admin@'],
    priority: 60,
  },

  // 정산/지급 안내
  {
    eventType: 'payment_notice',
    subjectPatterns: [
      /정산.*안내/i,
      /지급.*안내/i,
      /사업비.*지급/i,
      /보조금.*지급/i,
      /바우처.*지급/i,
    ],
    bodyPatterns: [
      /정산서.*제출/i,
      /지급.*완료/i,
      /입금.*예정/i,
      /사업비.*정산/i,
      /증빙.*제출/i,
    ],
    senderPatterns: ['noreply@', 'payment@', 'finance@'],
    priority: 50,
  },

  // 신청 완료
  {
    eventType: 'application_submitted',
    subjectPatterns: [
      /접수.*완료/i,
      /신청.*완료/i,
      /지원.*접수/i,
      /신청서.*접수/i,
    ],
    bodyPatterns: [
      /접수되었습니다/i,
      /신청.*완료/i,
      /접수번호/i,
      /접수.*확인/i,
    ],
    senderPatterns: ['noreply@', 'system@', 'auto@'],
    priority: 40,
  },

  // 심사 중
  {
    eventType: 'under_review',
    subjectPatterns: [
      /심사.*진행/i,
      /평가.*중/i,
      /검토.*안내/i,
      /서류.*심사/i,
    ],
    bodyPatterns: [
      /심사.*진행.*중/i,
      /평가.*중/i,
      /검토.*예정/i,
      /결과.*발표.*예정/i,
    ],
    senderPatterns: ['noreply@', 'info@'],
    priority: 30,
  },
]

// ============================================
// Known Government Program Senders
// ============================================

interface KnownSender {
  email: string
  domain: string
  organization: string
  enginePreset: EnginePresetType | 'general'
}

const KNOWN_SENDERS: KnownSender[] = [
  // 중기부 계열
  {
    email: 'noreply@smba.go.kr',
    domain: 'smba.go.kr',
    organization: '중소벤처기업부',
    enginePreset: 'MANUFACTURING',
  },
  {
    email: 'noreply@kised.or.kr',
    domain: 'kised.or.kr',
    organization: '창업진흥원',
    enginePreset: 'general',
  },
  {
    email: 'k-startup@kised.or.kr',
    domain: 'kised.or.kr',
    organization: 'K-Startup',
    enginePreset: 'general',
  },
  {
    email: 'tips@kised.or.kr',
    domain: 'kised.or.kr',
    organization: 'TIPS',
    enginePreset: 'general',
  },

  // NIPA (AI바우처)
  {
    email: 'noreply@nipa.kr',
    domain: 'nipa.kr',
    organization: 'NIPA',
    enginePreset: 'DIGITAL',
  },
  {
    email: 'aivoucher@nipa.kr',
    domain: 'nipa.kr',
    organization: 'AI바우처',
    enginePreset: 'DIGITAL',
  },

  // 환경부
  {
    email: 'noreply@me.go.kr',
    domain: 'me.go.kr',
    organization: '환경부',
    enginePreset: 'ENVIRONMENT',
  },
  {
    email: 'cleansys@me.go.kr',
    domain: 'me.go.kr',
    organization: 'CleanSYS',
    enginePreset: 'ENVIRONMENT',
  },

  // KOITA
  {
    email: 'noreply@koita.or.kr',
    domain: 'koita.or.kr',
    organization: '한국산업기술진흥협회',
    enginePreset: 'general',
  },

  // 기술보증기금
  {
    email: 'noreply@kibo.or.kr',
    domain: 'kibo.or.kr',
    organization: '기술보증기금',
    enginePreset: 'general',
  },

  // 신용보증기금
  {
    email: 'noreply@kodit.co.kr',
    domain: 'kodit.co.kr',
    organization: '신용보증기금',
    enginePreset: 'general',
  },
]

// ============================================
// Email Detector Class
// ============================================

export class EmailEventDetector {
  private config: EmailIntegrationConfig | null = null

  /**
   * OAuth 설정 초기화
   */
  initialize(config: EmailIntegrationConfig): void {
    this.config = config
  }

  /**
   * 이메일 이벤트 감지
   */
  detect(email: {
    subject: string
    from: string
    date: string
    body: string
  }): DetectedEmailEvent | null {
    // 1. 발신자 확인
    const knownSender = this.identifySender(email.from)

    // 2. 패턴 매칭
    const matchedPattern = this.matchPattern(email.subject, email.body, email.from)
    if (!matchedPattern) {
      return null
    }

    // 3. 정보 추출
    const extracted = this.extractInformation(
      email.subject,
      email.body,
      matchedPattern.eventType
    )

    // 4. 결과 생성
    const event: DetectedEmailEvent = {
      id: this.generateEventId(),
      type: matchedPattern.eventType,
      provider: this.config?.provider || 'gmail',
      email: {
        subject: email.subject,
        from: email.from,
        date: email.date,
        snippet: email.body.substring(0, 200),
        bodyPreview: email.body.substring(0, 500),
      },
      extracted: {
        programName: extracted.programName || '(프로그램명 추출 실패)',
        programId: extracted.programId,
        result: extracted.result,
        rejectionReason: extracted.rejectionReason,
        nextStep: extracted.nextStep,
        deadline: extracted.deadline,
      },
      confidence: this.calculateConfidence(matchedPattern, extracted, knownSender),
      processedAt: new Date().toISOString(),
    }

    return event
  }

  /**
   * 발신자 식별
   */
  private identifySender(from: string): KnownSender | null {
    const email = from.toLowerCase()
    return (
      KNOWN_SENDERS.find(
        (sender) => email.includes(sender.email) || email.includes(sender.domain)
      ) || null
    )
  }

  /**
   * 패턴 매칭
   */
  private matchPattern(
    subject: string,
    body: string,
    from: string
  ): EmailPattern | null {
    const normalizedSubject = subject.toLowerCase()
    const normalizedBody = body.toLowerCase()
    const normalizedFrom = from.toLowerCase()

    // 우선순위 순으로 정렬
    const sortedPatterns = [...EMAIL_PATTERNS].sort(
      (a, b) => b.priority - a.priority
    )

    for (const pattern of sortedPatterns) {
      // 제목 패턴 매칭
      const subjectMatch = pattern.subjectPatterns.some((regex) =>
        regex.test(normalizedSubject)
      )

      // 본문 패턴 매칭
      const bodyMatch = pattern.bodyPatterns.some((regex) =>
        regex.test(normalizedBody)
      )

      // 발신자 패턴 매칭 (선택)
      const senderMatch =
        pattern.senderPatterns.length === 0 ||
        pattern.senderPatterns.some((sender) =>
          normalizedFrom.includes(sender.toLowerCase())
        )

      // 제목 + (본문 또는 발신자) 매칭
      if (subjectMatch && (bodyMatch || senderMatch)) {
        return pattern
      }
    }

    return null
  }

  /**
   * 정보 추출
   */
  private extractInformation(
    subject: string,
    body: string,
    eventType: EmailEventType
  ): {
    programName?: string
    programId?: string
    result?: 'selected' | 'rejected' | 'pending'
    rejectionReason?: string
    nextStep?: string
    deadline?: string
  } {
    const info: ReturnType<typeof this.extractInformation> = {}

    // 프로그램명 추출 (괄호 또는 따옴표 안의 텍스트)
    const programNameMatch =
      subject.match(/[『「\[](.*?)[』」\]]/)?.[1] ||
      body.match(/사업명[:\s]*([^\n,]+)/)?.[1] ||
      body.match(/지원사업[:\s]*([^\n,]+)/)?.[1]
    if (programNameMatch) {
      info.programName = programNameMatch.trim()
    }

    // 접수번호/사업번호 추출
    const programIdMatch = body.match(
      /(?:접수번호|신청번호|사업번호)[:\s]*([A-Z0-9\-]+)/i
    )
    if (programIdMatch) {
      info.programId = programIdMatch[1]
    }

    // 선정/탈락 결과 추출
    if (eventType === 'selection_result') {
      if (/선정.*되었습니다|합격|축하/i.test(body)) {
        info.result = 'selected'
      } else if (/탈락|불합격|선정되지|아쉽게도/i.test(body)) {
        info.result = 'rejected'

        // 탈락 사유 추출
        const reasonMatch = body.match(
          /(?:탈락\s*사유|불합격\s*사유|사유)[:\s]*([^\n]+)/i
        )
        if (reasonMatch) {
          info.rejectionReason = reasonMatch[1].trim()
        }
      } else {
        info.result = 'pending'
      }
    }

    // 다음 단계 추출
    const nextStepMatch = body.match(
      /(?:향후\s*일정|다음\s*단계|진행\s*절차)[:\s]*([^\n]+)/i
    )
    if (nextStepMatch) {
      info.nextStep = nextStepMatch[1].trim()
    }

    // 마감일 추출
    const deadlineMatch = body.match(
      /(?:마감일|제출기한|기한)[:\s]*(\d{4}[-./]\d{1,2}[-./]\d{1,2})/
    )
    if (deadlineMatch) {
      info.deadline = deadlineMatch[1]
    }

    return info
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    pattern: EmailPattern,
    extracted: ReturnType<typeof this.extractInformation>,
    knownSender: KnownSender | null
  ): number {
    let confidence = 0.5 // 기본 신뢰도

    // 패턴 우선순위 반영
    confidence += pattern.priority / 200 // max 0.5

    // 알려진 발신자면 신뢰도 증가
    if (knownSender) {
      confidence += 0.2
    }

    // 프로그램명 추출 성공 시
    if (extracted.programName) {
      confidence += 0.1
    }

    // 결과 추출 성공 시
    if (extracted.result) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * 이벤트 ID 생성
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 탈락 이메일 처리 후 RejectionAnalyzer 연동
   *
   * @param event - 감지된 이메일 이벤트
   * @param companyHistory - 기업 신청 이력 (선택, 패턴 분석에 활용)
   * @returns 분석 결과 및 도메인 엔진 피드백
   */
  async processRejectionEmail(
    event: DetectedEmailEvent,
    companyHistory?: import('../types').ApplicationHistory[]
  ): Promise<{
    processed: boolean
    patternId?: string
    feedbackGenerated: boolean
    analysis?: RejectionAnalysisResult
  }> {
    if (event.type !== 'selection_result' || event.extracted.result !== 'rejected') {
      return { processed: false, feedbackGenerated: false }
    }

    // 탈락 사유가 있으면 분석으로 전달 준비
    const rejectionReason = event.extracted.rejectionReason
    if (!rejectionReason) {
      return { processed: true, feedbackGenerated: false }
    }

    // 발신자에서 도메인 엔진 타입 추론
    const knownSender = this.identifySender(event.email.from)
    const domain: EnginePresetType | 'general' = knownSender?.enginePreset || 'general'

    // RejectionAnalyzer 연동 - Extended Thinking으로 심층 분석
    const analysis = await rejectionAnalyzer.analyze(
      rejectionReason,
      domain,
      companyHistory
    )

    // 분석 결과에서 피드백 생성 확인
    const feedbackGenerated = !!analysis.feedbackToEngine
    const patternId = analysis.patterns.length > 0 ? analysis.patterns[0].id : undefined

    return {
      processed: true,
      patternId,
      feedbackGenerated,
      analysis,
    }
  }
}

// ============================================
// Gmail API 연동
// ============================================

export interface GmailConfig extends EmailIntegrationConfig {
  provider: 'gmail'
  oauth: {
    clientId: string
    clientSecret: string
    scopes: ['https://www.googleapis.com/auth/gmail.readonly']
    redirectUri: string
  }
}

/**
 * Gmail 메시지 인터페이스
 */
export interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  payload?: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body?: { data?: string }
    }>
  }
  internalDate?: string
}

/**
 * Gmail 연동 인터페이스
 *
 * 실제 연동 시 OAuth 설정 필요:
 * - GMAIL_CLIENT_ID: 환경변수로 설정
 * - GMAIL_CLIENT_SECRET: 환경변수로 설정
 * - 리다이렉트 URI: /api/auth/callback/gmail
 */
export interface GmailIntegration {
  /** OAuth 인증 연결 */
  connect(credentials: { clientId: string; clientSecret: string; redirectUri: string }): Promise<{
    authUrl: string
  }>

  /** 액세스 토큰 교환 */
  exchangeToken(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresAt: number
  }>

  /** 받은 편지함 감시 (Pub/Sub) */
  watchInbox(
    accessToken: string,
    topicName: string
  ): Promise<{
    historyId: string
    expiration: string
  }>

  /** 이메일 검색 */
  searchEmails(
    accessToken: string,
    query: string,
    maxResults?: number
  ): Promise<GmailMessage[]>

  /** 이메일 상세 조회 */
  getEmail(accessToken: string, messageId: string): Promise<GmailMessage>
}

/**
 * Gmail 메시지 목록 조회
 *
 * @param accessToken - OAuth 액세스 토큰
 * @param query - Gmail 검색 쿼리 (예: "from:noreply@koita.or.kr subject:선정")
 * @param maxResults - 최대 조회 건수 (기본: 20)
 * @returns 메시지 ID 목록
 *
 * @example
 * ```typescript
 * // 정부 지원사업 관련 이메일 검색
 * const messages = await fetchGmailMessages(
 *   accessToken,
 *   'from:noreply@koita.or.kr OR from:noreply@nipa.kr subject:(선정 OR 탈락)',
 *   20
 * )
 * ```
 */
export async function fetchGmailMessages(
  accessToken: string,
  query: string,
  maxResults: number = 20
): Promise<Array<{ id: string; threadId: string }>> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
  url.searchParams.set('q', query)
  url.searchParams.set('maxResults', maxResults.toString())

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new GmailApiError(
      `Gmail API error: ${response.status} ${response.statusText}`,
      response.status,
      errorData
    )
  }

  const data = await response.json()
  return data.messages || []
}

/**
 * Gmail 메시지 상세 조회
 *
 * @param accessToken - OAuth 액세스 토큰
 * @param messageId - 메시지 ID
 * @returns 메시지 상세 정보
 */
export async function fetchGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new GmailApiError(
      `Gmail API error: ${response.status} ${response.statusText}`,
      response.status,
      errorData
    )
  }

  return response.json()
}

/**
 * Gmail 메시지를 EmailDetector용 형식으로 변환
 *
 * @param message - Gmail 메시지
 * @returns EmailDetector.detect()에 전달할 형식
 */
export function parseGmailMessage(message: GmailMessage): {
  subject: string
  from: string
  date: string
  body: string
} {
  const headers = message.payload?.headers || []

  const getHeader = (name: string): string => {
    const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
    return header?.value || ''
  }

  // 본문 추출 (Base64 디코딩)
  let body = ''
  if (message.payload?.body?.data) {
    body = decodeBase64Url(message.payload.body.data)
  } else if (message.payload?.parts) {
    const textPart = message.payload.parts.find(
      (p) => p.mimeType === 'text/plain' || p.mimeType === 'text/html'
    )
    if (textPart?.body?.data) {
      body = decodeBase64Url(textPart.body.data)
    }
  }

  // HTML 태그 제거 (간단한 처리)
  body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  return {
    subject: getHeader('Subject'),
    from: getHeader('From'),
    date: message.internalDate
      ? new Date(parseInt(message.internalDate, 10)).toISOString()
      : new Date().toISOString(),
    body,
  }
}

/**
 * Base64 URL Safe 디코딩
 */
function decodeBase64Url(data: string): string {
  // URL-safe Base64를 표준 Base64로 변환
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')

  // Node.js 환경
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8')
  }

  // 브라우저 환경
  return atob(base64)
}

/**
 * Gmail API 에러 클래스
 */
export class GmailApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message)
    this.name = 'GmailApiError'
  }
}

/**
 * 탈락 이메일 감지 후 분석 트리거 (편의 함수)
 *
 * Gmail 메시지를 받아 탈락 이메일이면 자동으로 분석을 수행합니다.
 *
 * @param message - Gmail 메시지
 * @param companyHistory - 기업 신청 이력 (선택)
 * @returns 탈락 분석 결과 (탈락 이메일이 아니면 null)
 *
 * @example
 * ```typescript
 * const messages = await fetchGmailMessages(accessToken, 'subject:탈락')
 * for (const msg of messages) {
 *   const fullMessage = await fetchGmailMessage(accessToken, msg.id)
 *   const result = await processGmailRejection(fullMessage, companyHistory)
 *   if (result?.analysis) {
 *     console.log('탈락 패턴:', result.analysis.patterns)
 *     console.log('추천사항:', result.analysis.recommendations)
 *   }
 * }
 * ```
 */
export async function processGmailRejection(
  message: GmailMessage,
  companyHistory?: import('../types').ApplicationHistory[]
): Promise<{
  event: DetectedEmailEvent
  analysis: RejectionAnalysisResult
} | null> {
  // Gmail 메시지를 파싱
  const parsed = parseGmailMessage(message)

  // EmailDetector로 이벤트 감지
  const event = emailDetector.detect(parsed)

  // 탈락 이메일이 아니면 null 반환
  if (!event || event.type !== 'selection_result' || event.extracted.result !== 'rejected') {
    return null
  }

  // RejectionAnalyzer로 분석
  const result = await emailDetector.processRejectionEmail(event, companyHistory)

  if (!result.analysis) {
    return null
  }

  return {
    event,
    analysis: result.analysis,
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const emailDetector = new EmailEventDetector()
