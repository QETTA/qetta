'use client'

/**
 * useStreamingChat - Custom hook for streaming chat functionality
 *
 * Extracts streaming chat logic from QettaChatbot for better reusability
 * and smaller component size.
 *
 * @module chat/hooks/use-streaming-chat
 */

import { useCallback, useRef, useState, type FormEvent } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface UseStreamingChatOptions {
  apiEndpoint?: string
}

interface UseStreamingChatReturn {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  error: string | null
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
  clearMessages: () => void
}

export function useStreamingChat(
  options: UseStreamingChatOptions = {}
): UseStreamingChatReturn {
  const { apiEndpoint = '/api/chat' } = options

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const messageIdCounter = useRef(0)

  // Generate unique message ID
  const generateId = useCallback(() => {
    messageIdCounter.current += 1
    return `msg-${Date.now()}-${messageIdCounter.current}`
  }, [])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  // Submit handler with streaming
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      const trimmedInput = input.trim()
      if (!trimmedInput || isLoading) return

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: trimmedInput,
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
      setIsLoading(true)
      setError(null)

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let accumulatedContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  accumulatedContent += parsed.text
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastIndex = updated.length - 1
                    if (updated[lastIndex]?.role === 'assistant') {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: accumulatedContent,
                      }
                    }
                    return updated
                  })
                }
              } catch {
                // Ignore JSON parse errors for malformed chunks
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return // Request was cancelled
        }

        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)

        // Update last message with error
        setMessages((prev) => {
          const updated = [...prev]
          const lastIndex = updated.length - 1
          if (updated[lastIndex]?.role === 'assistant') {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: `Sorry, an error occurred: ${errorMessage}\n\nPlease try again.`,
            }
          }
          return updated
        })
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [apiEndpoint, generateId, input, isLoading, messages]
  )

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    handleSubmit,
    clearMessages,
  }
}
