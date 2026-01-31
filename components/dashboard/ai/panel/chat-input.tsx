'use client'

import type { KeyboardEvent } from 'react'
import { InlineCommandPalette } from './inline-command'
import type { InlineCommand } from '@/lib/domain-engines/constants'
import { SendIcon, StopIcon } from './chat-icons'

export interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  isCommandPaletteOpen: boolean
  onSubmit: (e?: React.FormEvent) => void
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onStop: () => void
  onCommandSelect: (command: InlineCommand) => void
  onCloseCommandPalette: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export function ChatInput({
  input,
  setInput,
  isLoading,
  isCommandPaletteOpen,
  onSubmit,
  onKeyDown,
  onStop,
  onCommandSelect,
  onCloseCommandPalette,
  textareaRef,
}: ChatInputProps) {
  return (
    <div className="p-3 border-t border-white/5">
      <form onSubmit={onSubmit} className="relative" role="search" aria-label="Ask AI Assistant">
        {isCommandPaletteOpen && (
          <InlineCommandPalette
            onSelect={onCommandSelect}
            onClose={onCloseCommandPalette}
          />
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter your question... (/ for commands)"
          aria-label="Enter message to AI Assistant"
          rows={1}
          disabled={isLoading}
          className="w-full px-4 py-2.5 pr-12 bg-zinc-800 text-zinc-50 text-sm rounded-xl ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 resize-none placeholder:text-zinc-500 disabled:opacity-50 transition-all"
        />
        <div className="absolute right-2 bottom-1.5 flex items-center">
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              aria-label="Stop"
            >
              <StopIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-500/10 rounded-lg disabled:text-zinc-600 disabled:hover:bg-transparent transition-colors"
              aria-label="Send"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
      <p className="mt-1.5 text-[9px] text-zinc-600 text-center">
        Type <span className="text-zinc-500">/</span> for commands • Enter to send
      </p>
    </div>
  )
}
