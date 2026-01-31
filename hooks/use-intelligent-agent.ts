/**
 * useIntelligentAgent Hook
 *
 * Provides intelligent AI agent capabilities:
 * - Context-aware responses
 * - Proactive recommendations
 * - Conversation memory
 * - Intent detection
 */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAIPanelStore } from '@/stores/ai-panel-store'
import { clientLogger } from '@/lib/logger/client'
import {
  buildIntelligentContext,
  generateRecommendations,
  detectUserIntent,
  extractMentionedDocuments,
  extractTopics,
  createSessionMemory,
  rememberDocument,
  rememberAction,
  summarizeExchange,
  getMemoryContext,
  type DocumentContext,
  type TabContext,
  type ConversationContext,
  type ProactiveRecommendation,
  type SessionMemory,
  type UserIntent,
} from '@/lib/ai/intelligent-context'
import type { ProductTab, EnginePresetType } from '@/types/inbox'

// ============================================
// Hook Interface
// ============================================

interface UseIntelligentAgentParams {
  activeTab: ProductTab
  selectedDocument: string | null
  // Document data fetcher (to be implemented with actual data source)
  getDocumentData?: (id: string) => DocumentContext | null
}

interface UseIntelligentAgentReturn {
  // Context for AI
  intelligentContext: string
  memoryContext: string

  // Recommendations
  recommendations: ProactiveRecommendation[]
  dismissRecommendation: (id: string) => void

  // Intent & Topics
  analyzeMessage: (message: string) => {
    intent: UserIntent
    topics: string[]
    mentionedDocs: string[]
  }

  // Memory management
  recordExchange: (userMessage: string, assistantSummary: string) => void
  recordAction: (type: string, details?: Record<string, unknown>) => void

  // State
  isContextReady: boolean
}

// ============================================
// Fallback Document Data (API 실패 시 사용)
// ============================================

const FALLBACK_DOCUMENTS: Record<string, DocumentContext> = {
  'doc-tms-001': {
    id: 'doc-tms-001',
    title: 'TMS 일일보고서 생성 요청',
    type: 'request',
    status: 'processing',
    domain: 'ENVIRONMENT',
    summary: '측정 데이터 기반 환경부 제출용 TMS 일일보고서',
    metadata: {
      priority: 'high',
      assignee: '김민수',
    },
  },
  'doc-sf-001': {
    id: 'doc-sf-001',
    title: '스마트공장 정산 보고서',
    type: 'report',
    status: 'pending',
    domain: 'MANUFACTURING',
    summary: '중기부 제출용 MES 기반 정산 보고서',
    metadata: {
      priority: 'high',
    },
  },
  'doc-ai-001': {
    id: 'doc-ai-001',
    title: 'AI 바우처 실적 보고서',
    type: 'report',
    status: 'completed',
    domain: 'DIGITAL',
    summary: 'NIPA 제출용 공급기업 실적 보고서',
  },
  'doc-gt-001': {
    id: 'doc-gt-001',
    title: '해외 입찰 제안서 초안',
    type: 'proposal',
    status: 'warning',
    domain: 'EXPORT',
    summary: 'SAM.gov 환경 모니터링 장비 조달 제안서',
    metadata: {
      priority: 'critical',
    },
  },
}

// ============================================
// API Response Type
// ============================================

interface DocumentApiResponse {
  success: boolean
  document?: DocumentContext
  error?: {
    code: string
    message: string
  }
}

// ============================================
// Hook Implementation
// ============================================

export function useIntelligentAgent({
  activeTab,
  selectedDocument,
  getDocumentData,
}: UseIntelligentAgentParams): UseIntelligentAgentReturn {
  const { selectedPreset } = useAIPanelStore()

  // State
  const [recommendations, setRecommendations] = useState<ProactiveRecommendation[]>([])
  const [tabContext, setTabContext] = useState<TabContext>({ activeTab })
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    recentTopics: [],
    mentionedDocuments: [],
    sessionStartTime: Date.now(),
  })

  // API fetched document state
  const [apiDocument, setApiDocument] = useState<DocumentContext | null>(null)
  const [isDocumentLoading, setIsDocumentLoading] = useState(false)

  // Session memory ref (persists across renders)
  const sessionMemoryRef = useRef<SessionMemory>(createSessionMemory())

  // Previous recommendations ref (for comparison without stale closure)
  const prevRecommendationsRef = useRef<ProactiveRecommendation[]>([])

  // Fetch document from API
  useEffect(() => {
    if (!selectedDocument) {
      setApiDocument(null)
      return
    }

    // If custom fetcher provided, skip API call
    if (getDocumentData) {
      return
    }

    const fetchDocument = async () => {
      setIsDocumentLoading(true)
      try {
        const response = await fetch(`/api/documents?id=${encodeURIComponent(selectedDocument)}`)
        const data: DocumentApiResponse = await response.json()

        if (data.success && data.document) {
          setApiDocument(data.document)
        } else {
          // API 실패 시 fallback 사용
          clientLogger.warn('[useIntelligentAgent] API failed, using fallback:', data.error?.message)
          setApiDocument(FALLBACK_DOCUMENTS[selectedDocument] || null)
        }
      } catch (error) {
        clientLogger.error('[useIntelligentAgent] Fetch error:', error)
        // 네트워크 에러 시 fallback 사용
        setApiDocument(FALLBACK_DOCUMENTS[selectedDocument] || null)
      } finally {
        setIsDocumentLoading(false)
      }
    }

    fetchDocument()
  }, [selectedDocument, getDocumentData])

  // Get document data (API -> custom fetcher -> fallback)
  const documentContext = useMemo((): DocumentContext | null => {
    if (!selectedDocument) return null

    // 1. Use provided custom fetcher if available
    if (getDocumentData) {
      return getDocumentData(selectedDocument)
    }

    // 2. Use API fetched document
    if (apiDocument) {
      return apiDocument
    }

    // 3. Fallback to local data while loading or if API fails
    return FALLBACK_DOCUMENTS[selectedDocument] || null
  }, [selectedDocument, getDocumentData, apiDocument])

  // Update tab context when tab changes
  useEffect(() => {
    setTabContext((prev) => ({
      activeTab,
      previousTab: prev.activeTab !== activeTab ? prev.activeTab : prev.previousTab,
      tabSwitchTime: prev.activeTab !== activeTab ? Date.now() : prev.tabSwitchTime,
    }))
  }, [activeTab])

  // Generate recommendations when context changes
  useEffect(() => {
    const newRecommendations = generateRecommendations({
      tab: tabContext,
      document: documentContext,
      domain: selectedPreset,
      existingRecommendations: prevRecommendationsRef.current,
    })

    // Only update if recommendations actually changed (using ref to avoid stale closure)
    if (JSON.stringify(newRecommendations) !== JSON.stringify(prevRecommendationsRef.current)) {
      prevRecommendationsRef.current = newRecommendations
      setRecommendations(newRecommendations)
    }
  }, [tabContext, documentContext, selectedPreset])

  // Remember document when selected
  useEffect(() => {
    if (documentContext) {
      sessionMemoryRef.current = rememberDocument(sessionMemoryRef.current, documentContext)
    }
  }, [documentContext])

  // Build intelligent context string
  const intelligentContext = useMemo(() => {
    return buildIntelligentContext({
      tab: tabContext,
      document: documentContext,
      conversation: conversationContext,
      domain: selectedPreset,
    })
  }, [tabContext, documentContext, conversationContext, selectedPreset])

  // Get memory context
  const memoryContext = useMemo(() => {
    return getMemoryContext(sessionMemoryRef.current)
  }, []) // Ref updates don't trigger re-renders, so no dependencies needed

  // Dismiss recommendation
  const dismissRecommendation = useCallback((id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // Analyze user message
  const analyzeMessage = useCallback(
    (message: string) => {
      const intent = detectUserIntent(message)
      const topics = extractTopics(message, selectedPreset)
      const mentionedDocs = extractMentionedDocuments(message)

      // Update conversation context
      setConversationContext((prev) => ({
        ...prev,
        lastIntent: intent,
        recentTopics: [...prev.recentTopics, ...topics].slice(-10),
        mentionedDocuments: [...prev.mentionedDocuments, ...mentionedDocs].slice(-5),
      }))

      return { intent, topics, mentionedDocs }
    },
    [selectedPreset]
  )

  // Record exchange to memory
  const recordExchange = useCallback((userMessage: string, assistantSummary: string) => {
    sessionMemoryRef.current = summarizeExchange(
      sessionMemoryRef.current,
      userMessage,
      assistantSummary
    )
    // Trigger re-render for memoryContext
    setConversationContext((prev) => ({ ...prev }))
  }, [])

  // Record action to memory
  const recordAction = useCallback((type: string, details?: Record<string, unknown>) => {
    sessionMemoryRef.current = rememberAction(sessionMemoryRef.current, type, details)
  }, [])

  return {
    intelligentContext,
    memoryContext,
    recommendations,
    dismissRecommendation,
    analyzeMessage,
    recordExchange,
    recordAction,
    isContextReady: !isDocumentLoading,
  }
}

// ============================================
// Utility Hook: Proactive Suggestions
// ============================================

export function useProactiveSuggestions(domain: EnginePresetType, tab: ProductTab) {
  const suggestions = useMemo(() => {
    const baseSuggestions: string[] = []

    // Domain-specific suggestions
    if (domain === 'ENVIRONMENT') {
      baseSuggestions.push('일일보고서 작성해줘', '배출량 분석해줘', '측정기록부 생성해줘')
    } else if (domain === 'MANUFACTURING') {
      baseSuggestions.push('OEE 분석 리포트 만들어줘', '정산보고서 생성해줘', '설비이력 확인해줘')
    } else if (domain === 'DIGITAL') {
      baseSuggestions.push('실적보고서 작성해줘', '바우처 정산 도와줘', '수요기업 매칭 분석해줘')
    } else if (domain === 'EXPORT') {
      baseSuggestions.push('입찰 공고 찾아줘', '제안서 초안 만들어줘', '영문 번역해줘')
    }

    // Tab-specific additions
    if (tab === 'VERIFY') {
      baseSuggestions.unshift('해시체인 검증해줘')
    } else if (tab === 'MONITOR') {
      baseSuggestions.unshift('실시간 데이터 분석해줘')
    }

    return baseSuggestions.slice(0, 4)
  }, [domain, tab])

  return suggestions
}
