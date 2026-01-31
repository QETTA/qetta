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
import { useEffect, useId, useRef } from 'react'
import { QettaChatInput } from './qetta-chat-input'
import { QettaChatMessages } from './qetta-chat-messages'
import { QettaChatHeader } from './qetta-chat-header'
import { useStreamingChat } from './hooks/use-streaming-chat'
import { cn } from '@/lib/utils'

export function QettaChatbot() {
  const pathname = usePathname()
  const isDark = pathname?.startsWith('/box') ?? false

  const { isOpen, startSession } = useChatStore()
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    handleSubmit,
  } = useStreamingChat()

  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)

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
  }, [setInput])

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
                <QettaChatHeader isDark={isDark} onClose={close} />

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
