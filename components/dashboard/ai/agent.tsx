'use client'

/**
 * QettaAiAgent Component
 *
 * AI analysis panel showing 3-tier AGI analysis for selected documents.
 * Refactored to use extracted constants and sub-components.
 *
 * @module components/dashboard/ai/agent
 */

import type { ProductTab, AIAgentContext } from '@/types/inbox'
import { AGI_LAYER_BADGES } from '@/types/inbox'
import { Badge } from '@/components/catalyst/badge'
import { AgentLayerVisualization } from './agent-layer-visualization'
import { AI_ANALYSIS_DATA } from './agent-constants'

// =============================================================================
// Types
// =============================================================================

export interface QettaAiAgentProps {
  activeTab: ProductTab
  selectedDocument: string | null
  externalContext?: AIAgentContext | null
}

// =============================================================================
// Sub-components
// =============================================================================

function AgentHeader() {
  return (
    <div className="h-14 px-4 flex items-center gap-2 border-b border-white/5">
      <svg
        className="w-5 h-5 text-zinc-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
      <span className="text-sm font-semibold text-white">QETTA Agent</span>
      <Badge color="zinc" className="ml-auto text-[10px]">
        3-Tier AGI
      </Badge>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-500/10 flex items-center justify-center ring-1 ring-white/10">
          <svg
            className="w-6 h-6 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </div>
        <p className="text-sm text-zinc-500">
          Select a document to view AI analysis
        </p>
      </div>
    </div>
  )
}

interface AgentFooterProps {
  layerIndex: number
}

function AgentFooter({ layerIndex }: AgentFooterProps) {
  return (
    <div className="p-4 border-t border-white/5">
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
        <span>Analysis Engine</span>
        <span>{AGI_LAYER_BADGES[layerIndex].cost}</span>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
        <svg
          className="w-4 h-4 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
        <span>Powered by QETTA 3-Tier AGI</span>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function QettaAiAgent({
  activeTab,
  selectedDocument,
  externalContext,
}: QettaAiAgentProps) {
  // Use external context if provided, otherwise use static data
  const staticAnalysis = selectedDocument
    ? AI_ANALYSIS_DATA[selectedDocument]
    : null

  // Merge external context with static data
  const hasExternalContext =
    externalContext !== null && externalContext !== undefined
  const analysis = hasExternalContext
    ? {
        customer: externalContext.entityInfo,
        analysis: externalContext.analysis.summary,
        layer: externalContext.analysis.layer,
        confidence: externalContext.analysis.confidence,
        suggestedAction: '',
        suggestedReply: '',
        previousConversations: externalContext.relatedItems.map((item) => ({
          title: item.title,
          time: item.time,
          preview: item.preview,
        })),
        primaryAction: externalContext.suggestedActions.primary,
        secondaryAction: externalContext.suggestedActions.secondary,
      }
    : staticAnalysis
      ? {
          ...staticAnalysis,
          primaryAction: undefined,
          secondaryAction: undefined,
        }
      : null

  // Empty state when no analysis available
  if (!analysis) {
    return (
      <aside
        className="w-72 flex-shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col"
        role="complementary"
        aria-label="AI Analysis Panel"
        data-testid="ai-panel"
      >
        <AgentHeader />
        <EmptyState />
      </aside>
    )
  }

  const customerBadgeColor =
    'badgeColor' in analysis.customer ? analysis.customer.badgeColor : 'blue'

  return (
    <aside
      className="w-72 flex-shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col"
      role="complementary"
      aria-label="AI Analysis Panel"
      data-testid="ai-panel"
    >
      <AgentHeader />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 3-Tier AGI Visualization */}
        <div className="mb-4">
          <AgentLayerVisualization
            layer={analysis.layer}
            confidence={analysis.confidence}
          />
        </div>

        {/* Customer Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">
              {analysis.customer.name}
            </span>
            <Badge
              color={
                customerBadgeColor as
                  | 'amber'
                  | 'blue'
                  | 'emerald'
                  | 'red'
                  | 'purple'
              }
              className="text-[10px]"
            >
              {analysis.customer.badge}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            {analysis.customer.role}
            {'company' in analysis.customer && `, ${analysis.customer.company}`}
            {'organization' in analysis.customer &&
              `, ${analysis.customer.organization}`}
          </p>
        </div>

        {/* AI Analysis */}
        <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg ring-1 ring-white/5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            {analysis.analysis}
          </p>
        </div>

        {/* Suggested Action (static data only) */}
        {analysis.suggestedAction && (
          <div className="mb-4">
            <p className="text-sm text-zinc-300 mb-2">
              {analysis.suggestedAction}
            </p>
            {analysis.suggestedReply && (
              <div className="relative group">
                <div className="p-3 bg-zinc-500/5 border-l-2 border-zinc-500 rounded-r-lg">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap pr-8">
                    {analysis.suggestedReply}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(analysis.suggestedReply || '')
                  }}
                  className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Copy response"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 space-y-2">
          {/* Primary Action Button */}
          {analysis.primaryAction ? (
            <button
              onClick={analysis.primaryAction.action}
              className="w-full px-4 py-2 bg-white text-zinc-950 text-sm font-medium rounded-full hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {analysis.primaryAction.label}
            </button>
          ) : (
            <button className="w-full px-4 py-2 bg-white text-zinc-950 text-sm font-medium rounded-full hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-900">
              {activeTab === 'DOCS' && 'Schedule Follow-up'}
              {activeTab === 'VERIFY' && 'Issue Verification Certificate'}
              {activeTab === 'APPLY' && 'Auto-generate Document'}
              {activeTab === 'MONITOR' && 'Set Alert'}
            </button>
          )}

          {/* Secondary Action Button */}
          {analysis.secondaryAction && (
            <button
              onClick={analysis.secondaryAction.action}
              className="w-full px-4 py-2 bg-transparent hover:bg-white/5 text-zinc-300 text-sm font-medium rounded-full ring-1 ring-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {analysis.secondaryAction.label}
            </button>
          )}
        </div>

        {/* Previous Conversations */}
        <div>
          <h4
            id="related-items-title"
            className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3"
          >
            {hasExternalContext ? 'Related Items' : 'Previous Conversations'}
          </h4>
          <div
            className="space-y-3"
            role="list"
            aria-labelledby="related-items-title"
          >
            {analysis.previousConversations.map((conv) => (
              <button
                key={`${conv.title}-${conv.time}`}
                role="listitem"
                className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label={`${conv.title}, ${conv.time}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white truncate pr-2">
                    {conv.title}
                  </span>
                  <span className="text-xs text-zinc-500 flex-shrink-0">
                    {conv.time}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2">
                  {conv.preview}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AgentFooter layerIndex={analysis.layer - 1} />
    </aside>
  )
}

export default QettaAiAgent
