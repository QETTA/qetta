'use client'

import { memo, useEffect } from 'react'
import { useAIPanelStore } from '@/stores/ai-panel-store'
import { DomainSelector } from './domain-selector'
import { ChatThread } from './chat-thread'
import { AIPanelErrorBoundary } from './error-boundary'
import type { ProductTab, AIAgentContext } from '@/types/inbox'
import { DOMAIN_ENGINE_CONFIGS } from '@/lib/domain-engines/constants'

export interface QettaAiPanelProps {
  activeTab: ProductTab
  selectedDocument: string | null
  externalContext?: AIAgentContext | null
}

/**
 * QettaAiPanel - Collapsible AI Assistant Panel (Claude-inspired Design)
 *
 * Design Philosophy:
 * - Minimal, professional aesthetic
 * - Single accent color (zinc-500/titanium silver)
 * - Clean typography, no emoji overload
 * - Generous whitespace
 */
export const QettaAiPanel = memo(function QettaAiPanel({
  activeTab,
  selectedDocument,
  externalContext,
}: QettaAiPanelProps) {
  const { isOpen, toggleOpen, setOpen, selectedPreset } = useAIPanelStore()
  const domainConfig = DOMAIN_ENGINE_CONFIGS[selectedPreset]

  // ESC key handler to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setOpen])

  // Collapsed state - minimal toggle button
  if (!isOpen) {
    return (
      <aside
        className="w-12 flex-shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col items-center py-4"
        role="complementary"
        aria-label="AI Panel (collapsed)"
        data-testid="ai-panel"
      >
        {/* Toggle button */}
        <button
          onClick={toggleOpen}
          className="w-9 h-9 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/20 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Open AI panel"
        >
          <SparklesIcon className="w-4 h-4 text-zinc-400" />
        </button>

        {/* Domain indicator - subtle */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${domainConfig.styles.iconBg.replace('/10', '')}`} />
          <span className="text-[9px] text-zinc-500 font-medium tracking-tight">
            {domainConfig.shortLabel}
          </span>
        </div>
      </aside>
    )
  }

  // Expanded state - full panel
  return (
    <aside
      className="w-[360px] flex-shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col"
      role="complementary"
      aria-label="AI Analysis Panel"
      data-testid="ai-panel"
    >
      {/* Header - Clean and minimal */}
      <div className="h-12 px-4 flex items-center gap-3 border-b border-white/5">
        <SparklesIcon className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-medium text-zinc-50">Assistant</span>

        {/* Minimize button */}
        <button
          onClick={toggleOpen}
          className="ml-auto p-1.5 text-zinc-500 hover:text-zinc-400 hover:bg-white/5 rounded-md transition-colors"
          aria-label="Minimize panel"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Domain selector - compact tabs */}
      <div className="px-3 py-2 border-b border-white/5">
        <DomainSelector compact />
      </div>

      {/* Chat thread - main content with error boundary */}
      <div className="flex-1 overflow-hidden">
        <AIPanelErrorBoundary>
          <ChatThread activeTab={activeTab} selectedDocument={selectedDocument} externalContext={externalContext} />
        </AIPanelErrorBoundary>
      </div>

      {/* Footer - subtle branding */}
      <div className="px-4 py-2 border-t border-white/5">
        <p className="text-[10px] text-zinc-600 text-center">
          QETTA Domain Engine • {domainConfig.shortLabel}
        </p>
      </div>
    </aside>
  )
})

// Icons (inline SVG for minimal dependencies)
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

// Re-export subcomponents
export { DomainSelector } from './domain-selector'
export { ChatThread } from './chat-thread'
export { LayerVisualization } from './layer-visualization'
export { ArtifactPreview } from './artifact-preview'
export { MobileBottomSheet, MobileFAB } from './mobile-bottom-sheet'
export { AIPanelErrorBoundary, AIErrorFallback } from './error-boundary'
