'use client'

/**
 * QETTA Chatbot Component
 *
 * CSS 기반 애니메이션 (framer-motion 대체)
 *
 * Features:
 * - HeadlessUI Popover for floating panel
 * - Responsive: Mobile fullscreen, Desktop floating
 * - Dark mode detection based on route (dashboard = dark)
 * - Keyboard shortcuts (Ctrl+/ to toggle, Escape to close)
 * - Custom streaming implementation
 * - Welcome message with quick suggestions
 *
 * @module chat/qetta-chatbot
 */

import { useChatStore } from '@/stores/chat-store'
import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react'
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { QettaChatInput } from './qetta-chat-input'
import { QettaChatMessages } from './qetta-chat-messages'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function QettaChatbot() {
  const pathname = usePathname()
  const isDark = pathname?.startsWith('/box') ?? false

  const { isOpen, startSession } = useChatStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messageIdCounter = useRef(0)
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Generate unique message ID
  const generateId = useCallback(() => {
    messageIdCounter.current += 1
    return `msg-${Date.now()}-${messageIdCounter.current}`
  }, [])

  // Handle quick suggestion clicks
  useEffect(() => {
    const handleSuggestion = (e: CustomEvent<string>) => {
      setInput(e.detail)
    }

    window.addEventListener(
      'qetta-chat-suggestion',
      handleSuggestion as EventListener
    )
    return () => {
      window.removeEventListener(
        'qetta-chat-suggestion',
        handleSuggestion as EventListener
      )
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ to toggle - click the button to sync with Popover state
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        buttonRef.current?.click()
      }

      // Escape handled natively by HeadlessUI Popover
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Start session on first open
  useEffect(() => {
    if (isOpen) {
      startSession()
    }
  }, [isOpen, startSession])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Submit handler with streaming
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      const response = await fetch('/api/chat', {
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
  }

  return (
    <Popover>
      {({ open }) => (
        <>
          {/* Floating Action Button (Widget) */}
          <PopoverButton
            ref={buttonRef}
            className={clsx(
              'fixed z-50 p-4 rounded-full shadow-lg transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isDark
                ? 'bg-zinc-700 text-white hover:bg-zinc-600 focus:ring-white/30 focus:ring-offset-zinc-900'
                : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 focus:ring-offset-white',
              // Position: right bottom with safe area
              'right-4 bottom-4 sm:right-6 sm:bottom-6',
              // Hide when panel is open on mobile
              open && 'max-sm:hidden'
            )}
            aria-label={open ? 'Close chat' : 'Open chat'}
          >
            {/* CSS-based icon transition */}
            <div className="relative w-6 h-6">
              {/* Close icon */}
              <XMarkIcon
                className={cn(
                  'w-6 h-6 absolute inset-0 transition-all duration-150',
                  'motion-reduce:transition-none',
                  open
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-0 rotate-90'
                )}
              />
              {/* Chat icon */}
              <ChatBubbleLeftRightIcon
                className={cn(
                  'w-6 h-6 absolute inset-0 transition-all duration-150',
                  'motion-reduce:transition-none',
                  open
                    ? 'opacity-0 scale-0 -rotate-90'
                    : 'opacity-100 scale-100 rotate-0'
                )}
              />
            </div>
          </PopoverButton>

          {/* Mobile Backdrop */}
          <PopoverBackdrop
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
            transition
          />

          {/* Chat Panel */}
          <PopoverPanel
            id={panelId}
            className={clsx(
              'fixed z-50 flex flex-col',
              // Mobile: fullscreen
              'inset-0 max-sm:inset-0',
              // Desktop: floating panel
              'sm:inset-auto sm:right-6 sm:bottom-20',
              'sm:w-96 sm:h-[600px] sm:max-h-[calc(100vh-120px)]',
              'sm:rounded-2xl sm:shadow-2xl',
              // Theme
              isDark
                ? 'bg-zinc-900 sm:ring-1 sm:ring-white/10'
                : 'bg-white sm:ring-1 sm:ring-gray-200',
              // Safe area padding for mobile
              'pb-safe'
            )}
            transition
            role="dialog"
            aria-label="QETTA Chat"
          >
            {({ close }) => (
              <>
                {/* Header */}
                <div
                  className={clsx(
                    'flex items-center justify-between px-4 py-3',
                    'border-b',
                    isDark ? 'border-white/10' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isDark
                          ? 'bg-zinc-700'
                          : 'bg-zinc-800'
                      )}
                    >
                      <span className="text-sm font-bold text-white">Q</span>
                    </div>
                    <div>
                      <h2
                        className={clsx(
                          'text-sm font-semibold',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}
                      >
                        QETTA Assistant
                      </h2>
                      <p
                        className={clsx(
                          'text-xs',
                          isDark ? 'text-zinc-400' : 'text-gray-500'
                        )}
                      >
                        Ask anything
                      </p>
                    </div>
                  </div>

                  {/* Close button - visible on mobile */}
                  <button
                    onClick={() => close()}
                    className={clsx(
                      'p-2 rounded-lg sm:hidden',
                      isDark
                        ? 'text-zinc-400 hover:bg-white/10'
                        : 'text-gray-400 hover:bg-gray-100'
                    )}
                    aria-label="Close chat"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages */}
                <QettaChatMessages
                  messages={messages}
                  isLoading={isLoading}
                  isDark={isDark}
                />

                {/* Error message */}
                {error && (
                  <div
                    className={clsx(
                      'mx-4 mb-2 px-3 py-2 rounded-lg text-sm',
                      isDark
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-red-50 text-red-600'
                    )}
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* Input */}
                <div
                  className={clsx(
                    'p-4 border-t',
                    isDark ? 'border-white/10' : 'border-gray-200'
                  )}
                >
                  <QettaChatInput
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    isDark={isDark}
                  />

                  {/* Keyboard hint */}
                  <p
                    className={clsx(
                      'text-xs text-center mt-2 hidden sm:block',
                      isDark ? 'text-zinc-600' : 'text-gray-400'
                    )}
                  >
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-[10px]">
                      Ctrl
                    </kbd>
                    {' + '}
                    <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-[10px]">
                      /
                    </kbd>
                    {' to open/close'}
                  </p>
                </div>
              </>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}
