'use client'

import { useCallback } from 'react'
import type { ProactiveRecommendation } from '@/lib/ai/intelligent-context'

// ============================================
// Proactive Recommendations Component
// ============================================

interface ProactiveRecommendationsProps {
  recommendations: ProactiveRecommendation[]
  onDismiss: (id: string) => void
  onAction: (command: string) => void
}

export function ProactiveRecommendations({
  recommendations,
  onDismiss,
  onAction,
}: ProactiveRecommendationsProps) {
  if (recommendations.length === 0) return null

  return (
    <div className="px-3 py-2 space-y-2 border-b border-white/5">
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onDismiss={() => onDismiss(rec.id)}
          onAction={onAction}
        />
      ))}
    </div>
  )
}

// ============================================
// Individual Recommendation Card
// ============================================

interface RecommendationCardProps {
  recommendation: ProactiveRecommendation
  onDismiss: () => void
  onAction: (command: string) => void
}

function RecommendationCard({ recommendation, onDismiss, onAction }: RecommendationCardProps) {
  const { type, priority, title, description, action, dismissable } = recommendation

  const handleAction = useCallback(() => {
    if (action?.command) {
      onAction(action.command)
    } else if (action?.handler) {
      action.handler()
    }
    onDismiss()
  }, [action, onAction, onDismiss])

  // Style based on type
  const typeStyles: Record<typeof type, { bg: string; border: string; icon: string }> = {
    action: {
      bg: 'bg-zinc-500/10',
      border: 'border-zinc-500/20',
      icon: '⚡',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'ℹ️',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: '⚠️',
    },
    suggestion: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: '💡',
    },
  }

  const priorityIndicator =
    priority === 'high' ? (
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
    ) : null

  const style = typeStyles[type]

  return (
    <div
      className={`rounded-lg ${style.bg} border ${style.border} p-2.5 transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <span className="text-sm flex-shrink-0">{style.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {priorityIndicator}
            <span className="text-xs font-medium text-white truncate">{title}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{description}</p>

          {/* Action button */}
          {action && (
            <button
              onClick={handleAction}
              className="mt-1.5 px-2 py-1 text-[10px] font-medium bg-white/10 hover:bg-white/15 text-white rounded transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {dismissable && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-zinc-500 hover:text-zinc-400 transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Quick Suggestions Pills
// ============================================

interface QuickSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function QuickSuggestions({ suggestions, onSelect }: QuickSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="px-2.5 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full transition-colors ring-1 ring-white/5 hover:ring-white/10"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

// ============================================
// Context Indicator
// ============================================

interface ContextIndicatorProps {
  tab: string
  documentTitle?: string
  domain: string
}

export function ContextIndicator({ tab, documentTitle, domain }: ContextIndicatorProps) {
  return (
    <div className="px-3 py-1.5 bg-zinc-800/30 border-b border-white/5">
      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Context awareness active</span>
        </span>
        <span>•</span>
        <span>{tab}</span>
        {documentTitle && (
          <>
            <span>•</span>
            <span className="truncate max-w-[120px]">{documentTitle}</span>
          </>
        )}
        <span>•</span>
        <span>{domain}</span>
      </div>
    </div>
  )
}

// ============================================
// Intent Badge
// ============================================

interface IntentBadgeProps {
  intent: string
}

export function IntentBadge({ intent }: IntentBadgeProps) {
  const intentColors: Record<string, string> = {
    create_document: 'bg-zinc-500/20 text-zinc-400',
    analyze_data: 'bg-blue-500/20 text-blue-400',
    verify_hash: 'bg-emerald-500/20 text-emerald-400',
    search_tender: 'bg-amber-500/20 text-amber-400',
    ask_question: 'bg-zinc-500/20 text-zinc-400',
    get_help: 'bg-zinc-500/20 text-zinc-400',
    follow_up: 'bg-zinc-500/20 text-zinc-400',
  }

  const intentLabels: Record<string, string> = {
    create_document: 'Create Document',
    analyze_data: 'Analyze',
    verify_hash: 'Verify',
    search_tender: 'Search Tenders',
    ask_question: 'Question',
    get_help: 'Help',
    follow_up: 'Follow-up',
  }

  return (
    <span
      className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded ${intentColors[intent] || intentColors.ask_question}`}
    >
      {intentLabels[intent] || intent}
    </span>
  )
}
