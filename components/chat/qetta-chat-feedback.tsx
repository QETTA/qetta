'use client'

import { useChatStore } from '@/stores/chat-store'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import {
  HandThumbDownIcon as HandThumbDownSolidIcon,
  HandThumbUpIcon as HandThumbUpSolidIcon,
} from '@heroicons/react/24/solid'
import clsx from 'clsx'

/**
 * Chat Feedback Component
 *
 * Provides 👍👎 feedback buttons for assistant messages.
 * Feedback is persisted in Zustand store with localStorage.
 */

interface QettaChatFeedbackProps {
  messageId: string
  isDark?: boolean
}

export function QettaChatFeedback({
  messageId,
  isDark = false,
}: QettaChatFeedbackProps) {
  const { getFeedback, setFeedback } = useChatStore()
  const currentFeedback = getFeedback(messageId)

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    // Toggle if same feedback, otherwise set new
    if (currentFeedback === feedback) {
      setFeedback(messageId, null)
    } else {
      setFeedback(messageId, feedback)
    }
  }

  const buttonBase = clsx(
    'p-1 rounded transition-colors',
    isDark
      ? 'hover:bg-white/10 text-zinc-500 hover:text-zinc-300'
      : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
  )

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={() => handleFeedback('positive')}
        className={clsx(
          buttonBase,
          currentFeedback === 'positive' &&
            (isDark ? 'text-emerald-400' : 'text-emerald-600')
        )}
        aria-label="Like"
        title="This was helpful"
      >
        {currentFeedback === 'positive' ? (
          <HandThumbUpSolidIcon className="w-4 h-4" />
        ) : (
          <HandThumbUpIcon className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={() => handleFeedback('negative')}
        className={clsx(
          buttonBase,
          currentFeedback === 'negative' &&
            (isDark ? 'text-red-400' : 'text-red-500')
        )}
        aria-label="Dislike"
        title="Needs improvement"
      >
        {currentFeedback === 'negative' ? (
          <HandThumbDownSolidIcon className="w-4 h-4" />
        ) : (
          <HandThumbDownIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
