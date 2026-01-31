/**
 * QETTA Intelligent Context System
 *
 * Provides context-aware AI capabilities:
 * - Document state awareness
 * - Tab/navigation context
 * - Proactive recommendations
 * - Conversation memory
 *
 * @see CLAUDE.md - Business-Driven Development
 */

import type { ProductTab, EnginePresetType } from '@/types/inbox'

// ============================================
// Context Types
// ============================================

export interface DocumentContext {
  id: string
  title: string
  type: 'report' | 'request' | 'analysis' | 'proposal'
  status: 'pending' | 'processing' | 'completed' | 'warning' | 'failed'
  domain: EnginePresetType
  summary?: string
  metadata?: {
    createdAt?: string
    updatedAt?: string
    assignee?: string
    priority?: 'critical' | 'high' | 'medium' | 'low'
    deadline?: string
  }
}

export interface TabContext {
  activeTab: ProductTab
  previousTab?: ProductTab
  tabSwitchTime?: number
}

export interface ConversationContext {
  recentTopics: string[]
  mentionedDocuments: string[]
  lastIntent?: UserIntent
  sessionStartTime: number
}

export type UserIntent =
  | 'create_document'
  | 'analyze_data'
  | 'verify_hash'
  | 'search_tender'
  | 'ask_question'
  | 'get_help'
  | 'follow_up'

// ============================================
// Proactive Recommendation Types
// ============================================

export interface ProactiveRecommendation {
  id: string
  type: 'action' | 'info' | 'warning' | 'suggestion'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: {
    label: string
    command?: string // e.g., "/검증", "/보고서"
    handler?: () => void
  }
  dismissable: boolean
  expiresAt?: number
}

// ============================================
// Context Builder
// ============================================

/**
 * Build AI context string from current state
 * This is appended to the system prompt for context-aware responses
 */
export function buildIntelligentContext(params: {
  tab: TabContext
  document?: DocumentContext | null
  conversation: ConversationContext
  domain: EnginePresetType
}): string {
  const { tab, document, conversation, domain } = params

  const parts: string[] = []

  // Tab context
  parts.push(`## 현재 사용자 컨텍스트`)
  parts.push(`- **활성 탭**: ${getTabDisplayName(tab.activeTab)}`)
  if (tab.previousTab && tab.previousTab !== tab.activeTab) {
    parts.push(`- **이전 탭**: ${getTabDisplayName(tab.previousTab)} (방금 전환됨)`)
  }

  // Document context
  if (document) {
    parts.push(`\n## 현재 선택된 문서`)
    parts.push(`- **제목**: ${document.title}`)
    parts.push(`- **상태**: ${getStatusDisplayName(document.status)}`)
    parts.push(`- **유형**: ${document.type}`)
    if (document.summary) {
      parts.push(`- **요약**: ${document.summary}`)
    }
    if (document.metadata?.priority) {
      parts.push(`- **우선순위**: ${document.metadata.priority}`)
    }
    if (document.metadata?.deadline) {
      parts.push(`- **마감일**: ${document.metadata.deadline}`)
    }
  }

  // Conversation context
  if (conversation.recentTopics.length > 0) {
    parts.push(`\n## 대화 컨텍스트`)
    parts.push(`- **최근 주제**: ${conversation.recentTopics.slice(-3).join(', ')}`)
  }
  if (conversation.mentionedDocuments.length > 0) {
    parts.push(`- **언급된 문서**: ${conversation.mentionedDocuments.slice(-3).join(', ')}`)
  }
  if (conversation.lastIntent) {
    parts.push(`- **추정 의도**: ${getIntentDisplayName(conversation.lastIntent)}`)
  }

  // Domain-specific guidance
  parts.push(`\n## 응답 가이드`)
  parts.push(getDomainSpecificGuidance(domain, tab.activeTab, document?.status))

  return parts.join('\n')
}

// ============================================
// Recommendation Engine
// ============================================

/**
 * Generate proactive recommendations based on current context
 */
export function generateRecommendations(params: {
  tab: TabContext
  document?: DocumentContext | null
  domain: EnginePresetType
  existingRecommendations?: ProactiveRecommendation[]
}): ProactiveRecommendation[] {
  const { tab, document, domain, existingRecommendations = [] } = params
  const recommendations: ProactiveRecommendation[] = []
  const now = Date.now()

  // Track existing recommendation types to avoid duplicates
  const existingTypes = new Set(existingRecommendations.map((r) => r.id.split('-')[0]))

  // Tab-based recommendations
  if (tab.previousTab && tab.previousTab !== tab.activeTab) {
    const tabRec = getTabTransitionRecommendation(tab.previousTab, tab.activeTab, domain)
    if (tabRec) recommendations.push({ ...tabRec, id: `tab-${now}` })
  }

  // Document status-based recommendations
  if (document) {
    const docRecs = getDocumentStatusRecommendations(document, domain)
    recommendations.push(...docRecs.map((r, i) => ({ ...r, id: `doc-${now}-${i}` })))
  }

  // Domain-specific recommendations
  const domainRecs = getDomainRecommendations(domain, tab.activeTab)
  recommendations.push(...domainRecs.map((r, i) => ({ ...r, id: `domain-${now}-${i}` })))

  // Filter out duplicate types from existing recommendations
  const filteredRecommendations = recommendations.filter((r) => {
    const type = r.id.split('-')[0]
    return !existingTypes.has(type)
  })

  // Sort by priority and limit
  return filteredRecommendations
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 3) // Max 3 recommendations
}

// ============================================
// Intent Detection
// ============================================

/**
 * Detect user intent from message content
 */
export function detectUserIntent(message: string): UserIntent {
  const lowerMessage = message.toLowerCase()

  // Document creation patterns
  if (/작성|생성|만들|초안|보고서/.test(lowerMessage)) {
    return 'create_document'
  }

  // Analysis patterns
  if (/분석|검토|확인|살펴|리뷰/.test(lowerMessage)) {
    return 'analyze_data'
  }

  // Verification patterns
  if (/검증|무결성|해시|역추적|확인/.test(lowerMessage)) {
    return 'verify_hash'
  }

  // Tender search patterns
  if (/입찰|공고|sam\.gov|ungm|해외/.test(lowerMessage)) {
    return 'search_tender'
  }

  // Follow-up patterns
  if (/아까|이전|그거|그것|위에/.test(lowerMessage)) {
    return 'follow_up'
  }

  // Help patterns
  if (/도움|어떻게|뭐|방법|알려/.test(lowerMessage)) {
    return 'get_help'
  }

  return 'ask_question'
}

/**
 * Extract mentioned documents from message
 */
export function extractMentionedDocuments(message: string): string[] {
  const patterns = [
    /(?:아까|이전|그|방금)\s*(?:만든|작성한|생성한)?\s*(.+?(?:보고서|문서|리포트|제안서))/g,
    /(.+?(?:보고서|문서|리포트|제안서))(?:를|을|이|가)/g,
  ]

  const mentions: string[] = []
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(message)) !== null) {
      mentions.push(match[1].trim())
    }
  }

  return [...new Set(mentions)]
}

/**
 * Extract topics from message
 */
export function extractTopics(message: string, domain: EnginePresetType): string[] {
  const domainKeywords: Record<EnginePresetType, string[]> = {
    MANUFACTURING: ['제조', '스마트공장', '중기부', '산업부', 'MES', '정산', 'PLC', 'OEE', '설비', '품질', '4M1E'],
    ENVIRONMENT: ['환경', 'ENVIRONMENT', '탄소중립', '환경부', 'NOx', 'SOx', 'PM', '배출', '측정', 'CleanSYS'],
    DIGITAL: ['AI', 'SW', '바우처', '과기정통부', 'NIPA', '클라우드', '공급기업', '수요기업', '실적'],
    FINANCE: ['융자', '보증', '기보', '신보', '소진공', '중기부'],
    STARTUP: ['창업', 'TIPS', '액셀러레이팅', '창업진흥원', 'IR'],
    EXPORT: ['수출', '글로벌', 'KOTRA', 'SAM.gov', 'UNGM', '입찰', '제안서', '번역', '해외'],
  }

  const keywords = domainKeywords[domain]
  const foundTopics: string[] = []

  for (const keyword of keywords) {
    if (message.toLowerCase().includes(keyword.toLowerCase())) {
      foundTopics.push(keyword)
    }
  }

  return foundTopics
}

// ============================================
// Helper Functions
// ============================================

function getTabDisplayName(tab: ProductTab): string {
  const names: Record<ProductTab, string> = {
    DOCS: 'DOCS (문서 생성)',
    VERIFY: 'VERIFY (해시체인 검증)',
    APPLY: 'APPLY (해외 입찰)',
    MONITOR: 'MONITOR (실시간 관제)',
  }
  return names[tab]
}

function getStatusDisplayName(status: DocumentContext['status']): string {
  const names: Record<DocumentContext['status'], string> = {
    pending: '대기 중',
    processing: 'AI 처리 중',
    completed: '완료됨',
    warning: '주의 필요',
    failed: '실패',
  }
  return names[status]
}

function getIntentDisplayName(intent: UserIntent): string {
  const names: Record<UserIntent, string> = {
    create_document: '문서 생성',
    analyze_data: '데이터 분석',
    verify_hash: '무결성 검증',
    search_tender: '입찰 검색',
    ask_question: '질문',
    get_help: '도움 요청',
    follow_up: '후속 질문',
  }
  return names[intent]
}

function getDomainSpecificGuidance(
  domain: EnginePresetType,
  tab: ProductTab,
  status?: DocumentContext['status']
): string {
  const guidance: string[] = []

  // Tab + Domain combinations
  if (tab === 'DOCS') {
    guidance.push('- 사용자가 문서 생성/편집 중이니 보고서 작성을 적극 지원하세요')
    if (status === 'processing') {
      guidance.push('- 현재 AI가 처리 중인 문서가 있으니 진행 상황을 안내해주세요')
    }
  } else if (tab === 'VERIFY') {
    guidance.push('- 사용자가 검증 탭에 있으니 해시체인 무결성 관련 답변에 집중하세요')
    guidance.push('- SHA-256 기반 검증 과정을 쉽게 설명해주세요')
  } else if (tab === 'APPLY') {
    guidance.push('- 사용자가 해외 입찰을 보고 있으니 매칭 및 제안서 작성을 지원하세요')
    guidance.push('- 마감일(D-day)을 강조하고 필요 서류를 안내하세요')
  } else if (tab === 'MONITOR') {
    guidance.push('- 실시간 관제 데이터를 기반으로 이상 징후를 설명하세요')
    guidance.push('- 필요시 긴급 보고서 생성을 제안하세요')
  }

  // Domain-specific
  if (domain === 'ENVIRONMENT') {
    guidance.push('- 환경부 규정 용어를 정확히 사용하세요')
  } else if (domain === 'EXPORT') {
    guidance.push('- 다국어 번역 지원이 가능함을 안내하세요')
  }

  return guidance.join('\n')
}

function getTabTransitionRecommendation(
  fromTab: ProductTab,
  toTab: ProductTab,
  domain: EnginePresetType
): Omit<ProactiveRecommendation, 'id'> | null {
  // DOCS → VERIFY: Suggest verification
  if (fromTab === 'DOCS' && toTab === 'VERIFY') {
    return {
      type: 'suggestion',
      priority: 'medium',
      title: '문서 검증 준비',
      description: '방금 작성한 문서의 해시체인 무결성을 검증하시겠어요?',
      action: {
        label: '검증 시작',
        command: '/검증',
      },
      dismissable: true,
    }
  }

  // APPLY → DOCS: Suggest proposal
  if (fromTab === 'APPLY' && toTab === 'DOCS' && domain === 'EXPORT') {
    return {
      type: 'suggestion',
      priority: 'high',
      title: '제안서 초안 생성',
      description: '선택한 입찰 공고에 맞는 제안서 초안을 생성할까요?',
      action: {
        label: '제안서 생성',
        command: '/보고서',
      },
      dismissable: true,
    }
  }

  // MONITOR → DOCS: Suggest emergency report
  if (fromTab === 'MONITOR' && toTab === 'DOCS') {
    return {
      type: 'suggestion',
      priority: 'medium',
      title: '모니터링 보고서',
      description: '관제 데이터 기반 보고서를 생성하시겠어요?',
      action: {
        label: '보고서 생성',
        command: '/보고서',
      },
      dismissable: true,
    }
  }

  return null
}

function getDocumentStatusRecommendations(
  document: DocumentContext,
  _domain: EnginePresetType
): Omit<ProactiveRecommendation, 'id'>[] {
  void _domain // Reserved for future domain-specific recommendations
  const recommendations: Omit<ProactiveRecommendation, 'id'>[] = []

  if (document.status === 'completed') {
    recommendations.push({
      type: 'action',
      priority: 'medium',
      title: '문서 검증 권장',
      description: `"${document.title}" 작성이 완료되었습니다. 해시체인 검증을 진행하시겠어요?`,
      action: {
        label: '검증하기',
        command: '/검증',
      },
      dismissable: true,
    })
  }

  if (document.status === 'warning') {
    recommendations.push({
      type: 'warning',
      priority: 'high',
      title: '문서 점검 필요',
      description: `"${document.title}"에 주의가 필요합니다. 상세 내용을 확인해주세요.`,
      action: {
        label: '분석하기',
        command: '/분석',
      },
      dismissable: false,
    })
  }

  if (document.metadata?.deadline) {
    const deadline = new Date(document.metadata.deadline)
    const now = new Date()
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 3 && daysLeft > 0) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: `마감 D-${daysLeft}`,
        description: `"${document.title}" 마감이 ${daysLeft}일 남았습니다.`,
        dismissable: false,
      })
    }
  }

  return recommendations
}

function getDomainRecommendations(
  domain: EnginePresetType,
  tab: ProductTab
): Omit<ProactiveRecommendation, 'id'>[] {
  const recommendations: Omit<ProactiveRecommendation, 'id'>[] = []

  // Global Tender + APPLY = Show tender stats
  if (domain === 'EXPORT' && tab === 'APPLY') {
    recommendations.push({
      type: 'info',
      priority: 'low',
      title: '해외 입찰 현황',
      description: '63만+ 건의 글로벌 입찰 DB에서 맞춤 공고를 찾아보세요.',
      dismissable: true,
    })
  }

  // TMS + DOCS = Suggest CleanSYS integration
  if (domain === 'ENVIRONMENT' && tab === 'DOCS') {
    recommendations.push({
      type: 'info',
      priority: 'low',
      title: 'CleanSYS 연동',
      description: 'TMS 센서 데이터를 CleanSYS와 자동 연동할 수 있습니다.',
      dismissable: true,
    })
  }

  return recommendations
}

// ============================================
// Session Memory
// ============================================

export interface SessionMemory {
  documents: Map<string, DocumentContext>
  recentActions: Array<{
    type: string
    timestamp: number
    details?: Record<string, unknown>
  }>
  conversationSummary: string[]
}

/**
 * Create a new session memory instance
 */
export function createSessionMemory(): SessionMemory {
  return {
    documents: new Map(),
    recentActions: [],
    conversationSummary: [],
  }
}

/**
 * Add document to session memory
 */
export function rememberDocument(
  memory: SessionMemory,
  document: DocumentContext
): SessionMemory {
  memory.documents.set(document.id, document)
  return memory
}

/**
 * Add action to session memory
 */
export function rememberAction(
  memory: SessionMemory,
  type: string,
  details?: Record<string, unknown>
): SessionMemory {
  memory.recentActions.push({
    type,
    timestamp: Date.now(),
    details,
  })
  // Keep only last 20 actions
  if (memory.recentActions.length > 20) {
    memory.recentActions = memory.recentActions.slice(-20)
  }
  return memory
}

/**
 * Add to conversation summary
 */
export function summarizeExchange(
  memory: SessionMemory,
  userMessage: string,
  assistantSummary: string
): SessionMemory {
  memory.conversationSummary.push(`사용자: ${userMessage.slice(0, 50)}...`)
  memory.conversationSummary.push(`AI: ${assistantSummary}`)
  // Keep only last 10 exchanges
  if (memory.conversationSummary.length > 20) {
    memory.conversationSummary = memory.conversationSummary.slice(-20)
  }
  return memory
}

/**
 * Get conversation context string for AI
 */
export function getMemoryContext(memory: SessionMemory): string {
  if (memory.conversationSummary.length === 0) {
    return ''
  }

  return `
## 이전 대화 요약
${memory.conversationSummary.slice(-6).join('\n')}

이 대화 맥락을 참고하여 연속성 있는 응답을 제공하세요.
"아까", "이전", "그거" 같은 참조를 이해할 수 있습니다.
`
}
