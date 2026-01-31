'use client'

import { DOMAIN_COLORS } from '@/lib/design/brand-colors'
import type { EnginePresetConfig } from '@/lib/domain-engines/constants'
import type { ConversationMessage } from '@/stores/ai-panel-store'
import { SparklesIcon, HistoryIcon } from './chat-icons'

interface ChatEmptyStateProps {
  selectedPreset: string
  domainConfig: EnginePresetConfig
  quickSuggestions: string[]
  conversations: Record<string, ConversationMessage[]>
  onQuickSuggestion: (suggestion: string) => void
}

/**
 * ChatEmptyState - Empty state for chat thread
 *
 * Displays:
 * - Domain-branded welcome message
 * - Quick suggestion pills
 * - Recent conversation history
 */
export function ChatEmptyState({
  selectedPreset,
  domainConfig,
  quickSuggestions,
  conversations,
  onQuickSuggestion,
}: ChatEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full text-center px-4"
      role="status"
      aria-label="AI Assistant Ready"
      aria-live="polite"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
        DOMAIN_COLORS[selectedPreset as keyof typeof DOMAIN_COLORS]?.bg || 'bg-zinc-500/10'
      }`}>
        <SparklesIcon className={`w-6 h-6 ${
          DOMAIN_COLORS[selectedPreset as keyof typeof DOMAIN_COLORS]?.text || 'text-zinc-400'
        }`} />
      </div>
      <h3 className="text-sm font-medium text-zinc-200 mb-1">
        {domainConfig.shortLabel} Assistant
      </h3>
      <p className="text-[11px] text-zinc-500 max-w-[260px] mb-2">
        Your Industry, Your Intelligence.
      </p>
      <p className="text-xs text-zinc-500 max-w-[240px] mb-6">
        Document generation, pre-validation, and announcement analysis powered by{' '}
        <span className="text-zinc-400 font-medium">{domainConfig.label}</span> engine.
      </p>

      {/* Quick suggestions - subtle pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {quickSuggestions.slice(0, 3).map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onQuickSuggestion(suggestion)}
            className="px-3 py-1.5 text-xs text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 rounded-full ring-1 ring-white/5 hover:ring-white/10 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Recent History - last 5 conversations */}
      {conversations[selectedPreset]?.length > 0 && (
        <div className="mt-6 w-full max-w-[280px]">
          <div className="flex items-center gap-2 mb-2">
            <HistoryIcon className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Recent</span>
          </div>
          <div className="space-y-1">
            {conversations[selectedPreset]
              .filter((m) => m.role === 'user')
              .slice(-5)
              .reverse()
              .map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => onQuickSuggestion(msg.content)}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-400 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg truncate transition-colors"
                >
                  {msg.content.length > 40 ? `${msg.content.slice(0, 40)}...` : msg.content}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
