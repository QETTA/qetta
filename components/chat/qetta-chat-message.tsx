'use client'

import clsx from 'clsx'
import { QettaChatFeedback } from './qetta-chat-feedback'

/**
 * Chat Message Component
 *
 * Renders individual message bubbles with:
 * - User messages: Right aligned
 * - Assistant messages: Left aligned with avatar
 * - Feedback buttons for assistant messages
 * - Markdown-like text rendering (basic)
 */

interface QettaChatMessageProps {
  id: string
  role: 'user' | 'assistant'
  content: string
  isDark?: boolean
  isStreaming?: boolean
}

export function QettaChatMessage({
  id,
  role,
  content,
  isDark = false,
  isStreaming = false,
}: QettaChatMessageProps) {
  const isUser = role === 'user'

  return (
    <article
      className={clsx('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
      role="article"
      aria-label={isUser ? 'User message' : 'Assistant message'}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            'text-sm font-bold',
            isDark
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-800 text-white'
          )}
          aria-hidden="true"
        >
          Q
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={clsx(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser
            ? isDark
              ? 'bg-zinc-700 text-white'
              : 'bg-gray-900 text-white'
            : isDark
              ? 'bg-zinc-800 text-zinc-100'
              : 'bg-gray-100 text-gray-900'
        )}
      >
        {/* Message Content */}
        <div
          className={clsx(
            'text-sm whitespace-pre-wrap break-words',
            isStreaming && 'animate-pulse'
          )}
        >
          {content || (isStreaming ? '...' : '')}
        </div>

        {/* Feedback for assistant messages */}
        {!isUser && !isStreaming && content && (
          <QettaChatFeedback messageId={id} isDark={isDark} />
        )}
      </div>
    </article>
  )
}
