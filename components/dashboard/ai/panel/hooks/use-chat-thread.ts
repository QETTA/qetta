'use client'

import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from 'react'
import { useAIPanelStore, type ArtifactReference } from '@/stores/ai-panel-store'
import { useChatStore } from '@/stores/chat-store'
import { DOMAIN_ENGINE_CONFIGS } from '@/lib/domain-engines/constants'
import type { ProductTab } from '@/types/inbox'
import { useInlineCommand } from '../inline-command'
import { apiPost } from '@/lib/api/client'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { useSkillEngine } from './use-skill-engine'
import {
  useIntelligentAgent,
  useProactiveSuggestions,
} from '@/hooks/use-intelligent-agent'
import type { InlineCommand } from '@/lib/domain-engines/constants'
import type { Message } from '../chat-types'
import { DOMAIN_DOCUMENT_TYPES, isDocumentRequest } from '../chat-types'
import { clientLogger } from '@/lib/logger/client'

interface UseChatThreadOptions {
  activeTab: ProductTab
  selectedDocument: string | null
}

export function useChatThread({ activeTab, selectedDocument }: UseChatThreadOptions) {
  const { selectedPreset, startSession, addArtifact, conversations } = useAIPanelStore()
  const { setFeedback, getFeedback } = useChatStore()

  // Intelligent agent hook
  const {
    intelligentContext,
    memoryContext,
    analyzeMessage,
    recordExchange,
    recordAction,
  } = useIntelligentAgent({ activeTab, selectedDocument })

  // Quick suggestions
  const quickSuggestions = useProactiveSuggestions(selectedPreset, activeTab)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const domainConfig = DOMAIN_ENGINE_CONFIGS[selectedPreset]
  const { isCommandPaletteOpen, closeCommandPalette } = useInlineCommand(input)

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start session
  useEffect(() => {
    startSession()
  }, [startSession])

  // Clear on domain change
  useEffect(() => {
    setMessages([])
    setError(null)
  }, [selectedPreset])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [input])

  // Skill Engine (extracted to hooks/use-skill-engine.ts)
  const { executeSkillEngineCommand } = useSkillEngine({
    selectedPreset,
    setMessages,
    setIsLoading,
    setError,
  })

  // Command selection handler
  const handleCommandSelect = useCallback(
    (command: InlineCommand) => {
      closeCommandPalette()

      // Skill Engine Commands (직접 API 호출)
      const skillEngineActions: Record<string, string> = {
        'rejection-analysis': 'analyze-rejection',
        'pre-validate': 'pre-validate',
        'find-programs': 'find-programs',
        'business-plan': 'generate-plan',
        'qetta-test': 'qetta-test',
        'qetta-metrics': 'get-qetta-metrics',
        // 기업마당 API
        'bizinfo-search': 'bizinfo-search',
        'bizinfo-active': 'bizinfo-search', // activeOnly=true로 호출
      }

      if (command.id in skillEngineActions) {
        // 명령어별 기본 데이터 설정
        let extraData: Record<string, unknown> | undefined

        switch (command.id) {
          case 'bizinfo-active':
            extraData = { activeOnly: true }
            break
          case 'rejection-analysis':
            // 기본 샘플 탈락 사유 (QETTA 테스트용)
            extraData = {
              rejectionText: '사업성 부족: 시장 분석이 구체적이지 않음. 기술 차별성 부족: 기존 솔루션 대비 우위 불명확. 팀 구성 미흡: 핵심 인력 이탈 리스크.',
              companyHistory: [
                { year: 2024, event: 'TIPS 예비창업패키지 탈락', reason: '사업성 부족' },
                { year: 2025, event: '웰컴투 동남권 TIPS 최종 선정', reason: null },
              ]
            }
            break
          case 'pre-validate':
            // QETTA 사업계획서 컨텍스트로 사전검증
            extraData = {
              context: {
                companyName: 'QETTA',
                businessIdea: '도메인 엔진 기반 정부지원사업 문서 자동화 플랫폼',
                targetMarket: 'B2B2B 화이트라벨',
                competitiveAdvantage: `${DISPLAY_METRICS.timeSaved.value} 시간 단축, ${DISPLAY_METRICS.termAccuracy.value} 용어 정확도`,
                fundingNeeded: 100000000,
              }
            }
            break
          case 'find-programs':
            // QETTA 기업 정보로 프로그램 매칭
            extraData = {
              company: {
                age: 1, // 2025년 설립
                employees: 3,
                revenue: 0,
                region: '부산',
                certifications: ['예비창업패키지 수료', 'TIPS 선정'],
              }
            }
            break
        }

        executeSkillEngineCommand(skillEngineActions[command.id], command.labelKo, extraData)
        setInput('')
        return
      }

      // Open in Browser (한컴독스 연동)
      if (command.id === 'open-in-browser') {
        // Find the last generated artifact
        const lastArtifact = messages
          .filter((m) => m.artifact)
          .map((m) => m.artifact)
          .pop()

        if (lastArtifact?.previewUrl) {
          // Open in new tab (한컴독스 웹 뷰어 URL)
          window.open(lastArtifact.previewUrl, '_blank')

          // Add confirmation message
          const confirmMsg: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `📄 **${lastArtifact.title}**을(를) 웹 브라우저에서 열었습니다.\n\n새 탭에서 한컴독스 뷰어가 열립니다.`,
          }
          setMessages((prev) => [...prev, confirmMsg])
        } else {
          // No artifact to open
          const errorMsg: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ 열 수 있는 문서가 없습니다.\n\n먼저 \`/보고서\` 또는 \`/사업계획서\` 명령어로 문서를 생성해 주세요.`,
          }
          setMessages((prev) => [...prev, errorMsg])
        }
        setInput('')
        return
      }

      // 기존 명령어 처리 (프롬프트 설정)
      let prompt = ''
      switch (command.id) {
        case 'analyze':
          prompt = 'Analyze current data'
          break
        case 'summary':
        case 'summarize':
          prompt = 'Summarize document'
          break
        case 'translate':
          prompt = 'Translate to English'
          break
        case 'report':
          prompt = `Generate ${domainConfig.outputs[0]}`
          break
        case 'verify':
          prompt = 'Verify hash chain integrity'
          break
        case 'terminology':
          prompt = '도메인 용어 확인'
          break
        default:
          prompt = command.labelKo
      }
      setInput(prompt)
    },
    [messages, domainConfig.outputs, closeCommandPalette, executeSkillEngineCommand]
  )

  // Document generation
  const generateDocument = useCallback(
    async (documentTitle: string, messageId: string) => {
      const domainDocs = DOMAIN_DOCUMENT_TYPES[selectedPreset] || {}
      let documentType: string | null = null

      for (const [title, type] of Object.entries(domainDocs)) {
        if (documentTitle.includes(title)) {
          documentType = type
          break
        }
      }

      if (!documentType) {
        const types = Object.values(domainDocs)
        documentType = types[0] || 'daily_report'
      }

      setIsGeneratingDoc(true)

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await apiPost<any>('/api/generate-document', {
          enginePreset: selectedPreset,
          documentType,
          data: { requestedAt: new Date().toISOString() },
        })

        if (result.success && result.artifact) {
          const artifact: ArtifactReference = {
            id: result.artifact.id,
            type: result.artifact.type,
            title: result.artifact.title,
            format: result.artifact.format,
            previewUrl: result.artifact.previewUrl,
            downloadUrl: result.artifact.downloadUrl,
            hashChain: result.artifact.hashChain,
            verified: result.artifact.verified,
            createdAt: result.artifact.createdAt,
          }

          addArtifact(artifact)
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, artifact } : m))
          )
        }
      } catch (err) {
        clientLogger.error('[Document Generation Error]', err)
      } finally {
        setIsGeneratingDoc(false)
      }
    },
    [selectedPreset, addArtifact]
  )

  // Download handler
  const handleDownload = useCallback((artifact: ArtifactReference) => {
    const link = document.createElement('a')
    link.href = artifact.downloadUrl || '#'
    link.download = `${artifact.title}.${artifact.format.toLowerCase()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Hancom edit handler
  const handleEditInHancom = useCallback((artifact: ArtifactReference) => {
    const hancomUrl = `https://office.hancom.com/document/edit?id=${artifact.id}`
    window.open(hancomUrl, '_blank')
  }, [])

  // Submit handler
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      const trimmedInput = input.trim()
      if (!trimmedInput || isLoading) return

      setError(null)
      const { intent, topics } = analyzeMessage(trimmedInput)

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmedInput,
        intent,
      }
      setMessages((prev) => [...prev, userMessage])
      setLastUserMessage(trimmedInput)
      recordAction('message_sent', { intent, topics })
      setInput('')

      const assistantId = `assistant-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ])
      setIsLoading(true)

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            enginePreset: selectedPreset,
            intelligentContext,
            memoryContext,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Request failed')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error('No response body')

        let fullContent = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  fullContent += parsed.text
                  if (isMountedRef.current) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, content: fullContent } : m
                      )
                    )
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        if (fullContent) {
          recordExchange(trimmedInput, fullContent.slice(0, 200))
        }

        const documentTitle = isDocumentRequest(trimmedInput)
        if (documentTitle) {
          generateDocument(documentTitle, assistantId)
          recordAction('document_generated', { title: documentTitle })
        }
      } catch (err) {
        if (!isMountedRef.current) return

        if (err instanceof Error && err.name === 'AbortError') {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        } else {
          setError(err instanceof Error ? err.message : 'An error occurred')
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [
      input,
      isLoading,
      messages,
      selectedPreset,
      generateDocument,
      analyzeMessage,
      recordAction,
      recordExchange,
      intelligentContext,
      memoryContext,
    ]
  )

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // Stop handler
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  // Feedback handler
  const handleFeedback = useCallback(
    (messageId: string, feedback: 'positive' | 'negative') => {
      const current = getFeedback(messageId)
      setFeedback(messageId, current === feedback ? null : feedback)
    },
    [getFeedback, setFeedback]
  )

  // Quick suggestion handler
  const handleQuickSuggestion = useCallback((suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }, [])

  // Retry last message (when error occurs)
  const handleRetry = useCallback(() => {
    if (lastUserMessage) {
      setInput(lastUserMessage)
      setError(null)
      // Auto-submit after setting input
      const timer = setTimeout(() => {
        const form = document.querySelector('form')
        form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [lastUserMessage])

  // Regenerate assistant message
  const handleRegenerate = useCallback(
    (messageId: string) => {
      // Find the user message that preceded this assistant message
      const messageIndex = messages.findIndex((m) => m.id === messageId)
      if (messageIndex <= 0) return

      // Get the previous user message
      const prevUserMessage = messages
        .slice(0, messageIndex)
        .reverse()
        .find((m) => m.role === 'user')

      if (!prevUserMessage) return

      // Remove this assistant message and any after it
      setMessages((prev) => prev.slice(0, messageIndex))

      // Set input to regenerate
      setInput(prevUserMessage.content)

      // Auto-submit
      const timer = setTimeout(() => {
        const form = document.querySelector('form')
        form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }, 100)
      return () => clearTimeout(timer)
    },
    [messages]
  )

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    isGeneratingDoc,
    error,
    lastUserMessage,
    selectedPreset,
    domainConfig,
    conversations,
    quickSuggestions,
    isCommandPaletteOpen,

    // Refs
    messagesEndRef,
    textareaRef,

    // Handlers
    handleCommandSelect,
    handleDownload,
    handleEditInHancom,
    handleSubmit,
    handleKeyDown,
    handleStop,
    handleFeedback,
    handleQuickSuggestion,
    handleRetry,
    handleRegenerate,
    closeCommandPalette,
    getFeedback,
  }
}
