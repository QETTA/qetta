'use client'

import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { type FormEvent, type KeyboardEvent, useRef } from 'react'

/**
 * Chat Input Component
 *
 * Features:
 * - Auto-resize textarea
 * - Enter to send, Shift+Enter for newline
 * - Disabled state during loading
 * - Accessible with proper labels
 */

interface QettaChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  isDark?: boolean
}

export function QettaChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  isDark = false,
}: QettaChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        const form = e.currentTarget.form
        if (form) {
          form.requestSubmit()
        }
      }
    }
  }

  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      // Auto-resize
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <div
        className={clsx(
          'flex items-end gap-2 rounded-2xl p-2',
          isDark
            ? 'bg-zinc-800/50 ring-1 ring-white/10'
            : 'bg-gray-100 ring-1 ring-gray-200'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask anything..."
          disabled={isLoading}
          rows={1}
          className={clsx(
            'flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none',
            'placeholder:text-gray-400',
            'max-h-[120px] min-h-[36px]',
            isDark ? 'text-white' : 'text-gray-900',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Message input"
        />

        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className={clsx(
            'flex-shrink-0 p-2 rounded-xl transition-all',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            isDark
              ? 'bg-zinc-700 text-white hover:bg-zinc-600 disabled:hover:bg-zinc-700'
              : 'bg-gray-900 text-white hover:bg-gray-800 disabled:hover:bg-gray-900'
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {isLoading && (
        <p
          className={clsx(
            'text-xs mt-1 ml-2',
            isDark ? 'text-zinc-500' : 'text-gray-500'
          )}
          aria-live="polite"
        >
          Generating response...
        </p>
      )}
    </form>
  )
}
