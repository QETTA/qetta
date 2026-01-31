'use client'

/**
 * QettaChatHeader - Chat panel header component
 *
 * Displays the QETTA Assistant branding and close button for mobile.
 *
 * @module chat/qetta-chat-header
 */

import { XMarkIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'

interface QettaChatHeaderProps {
  isDark: boolean
  onClose: () => void
}

export function QettaChatHeader({ isDark, onClose }: QettaChatHeaderProps) {
  return (
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
            isDark ? 'bg-zinc-700' : 'bg-zinc-800'
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
        onClick={onClose}
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
  )
}
