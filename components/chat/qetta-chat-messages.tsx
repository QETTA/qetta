'use client'

import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import { QettaChatMessage } from './qetta-chat-message'

/**
 * Chat Messages Component
 *
 * Features:
 * - Auto-scroll to latest message
 * - ARIA live region for accessibility
 * - Welcome message when empty
 * - Smooth scroll behavior
 */

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface QettaChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  isDark?: boolean
}

export function QettaChatMessages({
  messages,
  isLoading,
  isDark = false,
}: QettaChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  return (
    <div
      ref={containerRef}
      className={clsx(
        'flex-1 overflow-y-auto px-4 py-4',
        'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'
      )}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <WelcomeMessage isDark={isDark} />
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <QettaChatMessage
              key={message.id}
              id={message.id}
              role={message.role}
              content={message.content}
              isDark={isDark}
              isStreaming={
                isLoading &&
                index === messages.length - 1 &&
                message.role === 'assistant'
              }
            />
          ))}

          {/* Loading indicator for new assistant response */}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-3">
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'text-sm font-bold',
                    isDark
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-800 text-white'
                  )}
                >
                  Q
                </div>
                <div
                  className={clsx(
                    'px-4 py-3 rounded-2xl',
                    isDark ? 'bg-zinc-800' : 'bg-gray-100'
                  )}
                >
                  <div className="flex gap-1">
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full animate-bounce',
                        isDark ? 'bg-zinc-500' : 'bg-gray-400'
                      )}
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full animate-bounce',
                        isDark ? 'bg-zinc-500' : 'bg-gray-400'
                      )}
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full animate-bounce',
                        isDark ? 'bg-zinc-500' : 'bg-gray-400'
                      )}
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Screen reader announcement */}
      {isLoading && (
        <div aria-live="assertive" className="sr-only">
          Assistant is responding...
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}

function WelcomeMessage({ isDark }: { isDark: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      {/* Logo */}
      <div
        className={clsx(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          isDark
            ? 'bg-zinc-700'
            : 'bg-zinc-800'
        )}
      >
        <span className="text-3xl font-bold text-white">Q</span>
      </div>

      <h2
        className={clsx(
          'text-lg font-semibold mb-2',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        QETTA Assistant
      </h2>

      <p
        className={clsx(
          'text-sm mb-6 max-w-xs',
          isDark ? 'text-zinc-400' : 'text-gray-600'
        )}
      >
        Get help with QETTA products, pricing, and technical support.
        <br />
        Ask me anything!
      </p>

      {/* Quick suggestions */}
      <div className="space-y-2 w-full max-w-xs">
        <p
          className={clsx(
            'text-xs uppercase tracking-wider mb-2',
            isDark ? 'text-zinc-500' : 'text-gray-400'
          )}
        >
          Frequently Asked
        </p>
        {[
          'What is QETTA?',
          'What are the pricing plans?',
          'What is white-label?',
          'How do I get government support?',
        ].map((question) => (
          <button
            key={question}
            className={clsx(
              'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
              isDark
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            onClick={() => {
              // This will be handled by the parent component
              const event = new CustomEvent('qetta-chat-suggestion', {
                detail: question,
              })
              window.dispatchEvent(event)
            }}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
