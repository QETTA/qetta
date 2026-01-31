import { memo } from 'react'
import dynamic from 'next/dynamic'
import type { ArtifactReference } from '@/stores/ai-panel-store'
import type { EnginePresetConfig } from '@/lib/domain-engines/constants'
import { DOMAIN_COLORS } from '@/lib/design/brand-colors'
import { ArtifactPreview } from './artifact-preview'
import { MetricCard } from '@/components/editor/MetricCard'

const QettaReadOnlyEditor = dynamic(
  () => import('@/components/editor/QettaReadOnlyEditor').then((mod) => mod.QettaReadOnlyEditor),
  {
    ssr: false,
    loading: () => <div className="h-6 animate-pulse bg-zinc-800/50 rounded" />,
  },
)
import {
  RejectionAnalysisBlock,
  ValidationResultBlock,
  ProgramMatchBlock,
  QettaMetricsBlock,
  QettaTestResultBlock,
  BizInfoResultBlock,
  type RejectionAnalysisResult,
  type ValidationResult,
  type ProgramMatch,
  type QettaMetrics,
  type QettaTestResult,
  type BizInfoSearchResultData,
} from './skill-blocks'
import type { Message } from './chat-types'
import { detectMetricContext } from './chat-types'
import { ThumbUpIcon, ThumbDownIcon, RegenerateIcon, CopyIcon } from './chat-icons'

export interface ChatMessageProps {
  message: Message
  selectedPreset: string
  domainConfig: EnginePresetConfig
  isLoading: boolean
  isLastMessage: boolean
  isGeneratingDoc: boolean
  getFeedback: (id: string) => 'positive' | 'negative' | null
  onFeedback: (id: string, feedback: 'positive' | 'negative') => void
  onRegenerate: (id: string) => void
  onDownload: (artifact: ArtifactReference) => void
  onEditInHancom: (artifact: ArtifactReference) => void
}

function ChatMessageInner({
  message,
  selectedPreset,
  domainConfig,
  isLoading,
  isLastMessage,
  isGeneratingDoc,
  getFeedback,
  onFeedback,
  onRegenerate,
  onDownload,
  onEditInHancom,
}: ChatMessageProps) {
  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] ${
          message.role === 'user'
            ? 'bg-zinc-600 text-white rounded-2xl rounded-br-md'
            : 'bg-zinc-800 text-zinc-200 rounded-2xl rounded-bl-md ring-1 ring-white/5'
        } px-4 py-2.5`}
      >
        {/* Assistant header - subtle domain indicator */}
        {message.role === 'assistant' && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              DOMAIN_COLORS[selectedPreset as keyof typeof DOMAIN_COLORS]?.dot || 'bg-zinc-500'
            }`} />
            <span className="text-[10px] font-medium text-zinc-500">
              {domainConfig.shortLabel}
            </span>
          </div>
        )}

        {/* Message content */}
        {message.role === 'assistant' && message.content && !isLoading ? (
          // Rich text rendering for completed assistant messages
          <div className="text-sm leading-relaxed">
            <QettaReadOnlyEditor
              content={message.content.replace(/\n/g, '<br/>')}
              className="prose-zinc"
            />
          </div>
        ) : (
          // Plain text for user messages and streaming
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
            {isLoading &&
              message.role === 'assistant' &&
              isLastMessage && (
                <span className="inline-block w-1 h-4 bg-zinc-400 ml-0.5 animate-pulse rounded-sm" />
              )}
          </p>
        )}

        {/* Skill Result Blocks - visual rendering of skill engine results */}
        {message.role === 'assistant' && message.skillResult && !isLoading && (
          <>
            {message.skillResult.type === 'qetta-test' && (
              <QettaTestResultBlock result={message.skillResult.data as QettaTestResult} />
            )}
            {message.skillResult.type === 'qetta-metrics' && (
              <QettaMetricsBlock metrics={message.skillResult.data as QettaMetrics} />
            )}
            {message.skillResult.type === 'program-match' && (
              <ProgramMatchBlock matches={message.skillResult.data as ProgramMatch[]} />
            )}
            {message.skillResult.type === 'validation' && (
              <ValidationResultBlock
                result={message.skillResult.data as ValidationResult}
                programName={message.skillResult.programName || 'Program'}
              />
            )}
            {message.skillResult.type === 'rejection-analysis' && (
              <RejectionAnalysisBlock result={message.skillResult.data as RejectionAnalysisResult} />
            )}
            {message.skillResult.type === 'bizinfo-search' && (
              <BizInfoResultBlock
                result={message.skillResult.data as BizInfoSearchResultData}
                keyword={message.skillResult.keyword}
              />
            )}
          </>
        )}

        {/* Metric blocks - show relevant metrics for assistant responses */}
        {message.role === 'assistant' && message.content && !isLoading && !message.skillResult && (() => {
          const metrics = detectMetricContext(message.content)
          return metrics ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          ) : null
        })()}

        {/* Document generation indicator */}
        {isGeneratingDoc &&
          message.role === 'assistant' &&
          isLastMessage &&
          !message.artifact && (
            <div className="mt-3 p-3 bg-zinc-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">Generating document...</span>
              </div>
            </div>
          )}

        {/* Artifact preview */}
        {message.artifact && (
          <div className="mt-3">
            <ArtifactPreview
              artifact={message.artifact}
              onDownload={() => onDownload(message.artifact!)}
              onEditInHancom={() => onEditInHancom(message.artifact!)}
            />
          </div>
        )}

        {/* Feedback buttons + Regenerate */}
        {message.role === 'assistant' && message.content && !isLoading && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
            <button
              onClick={() => onFeedback(message.id, 'positive')}
              className={`p-1 rounded transition-colors ${
                getFeedback(message.id) === 'positive'
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-500 hover:text-zinc-400 hover:bg-white/5'
              }`}
              aria-label="Helpful"
            >
              <ThumbUpIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 'negative')}
              className={`p-1 rounded transition-colors ${
                getFeedback(message.id) === 'negative'
                  ? 'text-red-400 bg-red-500/10'
                  : 'text-zinc-500 hover:text-zinc-400 hover:bg-white/5'
              }`}
              aria-label="Not helpful"
            >
              <ThumbDownIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRegenerate(message.id)}
              className="p-1 text-zinc-500 hover:text-zinc-400 hover:bg-white/5 rounded transition-colors"
              aria-label="Regenerate"
              title="Regenerate response"
            >
              <RegenerateIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="p-1 text-zinc-500 hover:text-zinc-400 hover:bg-white/5 rounded transition-colors ml-auto"
              aria-label="Copy"
            >
              <CopyIcon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const ChatMessage = memo(ChatMessageInner)
