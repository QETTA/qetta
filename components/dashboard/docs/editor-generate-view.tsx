'use client'

import { DOMAIN_OPTIONS, DOMAIN_COLORS } from '@/constants/domain-colors'
import { DISPLAY_METRICS } from '@/constants/metrics'
import type { EnginePresetType } from '@/types/inbox'
import type { EditorStatus } from './editor-types'
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  DocumentPlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import GenerationProgress from './generation-progress'

interface PipelineResult {
  documentId: string
  filename: string
  downloadUrl: string
  hashChain: string
}

interface EditorGenerateViewProps {
  status: EditorStatus
  selectedPreset: EnginePresetType
  selectedDocType: string
  pipelineStep: number
  pipelineError: string | null
  pipelineResult: PipelineResult | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onPresetChange: (preset: EnginePresetType) => void
  onDocTypeChange: (docType: string) => void
  onGenerateDocument: () => void
  onPipelineGenerate: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function EditorGenerateView({
  status,
  selectedPreset,
  selectedDocType,
  pipelineStep,
  pipelineError,
  pipelineResult,
  fileInputRef,
  onPresetChange,
  onDocTypeChange,
  onGenerateDocument,
  onPipelineGenerate,
  onFileSelect,
}: EditorGenerateViewProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-zinc-700/50 to-zinc-800/50 flex items-center justify-center ring-1 ring-white/20">
            <SparklesIcon className="h-8 w-8 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Auto Generate Document</h2>
          <p className="text-zinc-400 text-sm">
            Domain engine generates industry-compliant documents in {DISPLAY_METRICS.docSpeed.value}
          </p>
        </div>

        {/* Domain selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Domain Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DOMAIN_OPTIONS.map((domain) => (
                <button
                  key={domain.value}
                  onClick={() => onPresetChange(domain.value)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedPreset === domain.value
                      ? domain.activeClass
                      : domain.inactiveClass
                  }`}
                >
                  <div className="font-medium text-sm">{domain.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Document type selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Document Type
            </label>
            <select
              value={selectedDocType}
              onChange={(e) => onDocTypeChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-800/50 text-white rounded-lg ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 outline-none transition-all"
            >
              {selectedPreset === 'ENVIRONMENT' && (
                <>
                  <option value="daily_report">Daily Report</option>
                  <option value="measurement_log">Measurement Log</option>
                  <option value="emission_analysis">Emission Analysis Report</option>
                </>
              )}
              {selectedPreset === 'MANUFACTURING' && (
                <>
                  <option value="settlement_report">Settlement Report</option>
                  <option value="equipment_history">Equipment History</option>
                  <option value="oee_report">OEE Report</option>
                </>
              )}
              {selectedPreset === 'DIGITAL' && (
                <>
                  <option value="performance_report">Performance Report</option>
                  <option value="matching_analysis">Matching Analysis</option>
                  <option value="settlement">Settlement</option>
                </>
              )}
              {selectedPreset === 'EXPORT' && (
                <>
                  <option value="proposal_draft">Proposal Draft</option>
                  <option value="bid_analysis">Bid Analysis</option>
                  <option value="requirements_checklist">Requirements Checklist</option>
                </>
              )}
              {selectedPreset === 'FINANCE' && (
                <>
                  <option value="application">Loan/Guarantee Application</option>
                </>
              )}
              {selectedPreset === 'STARTUP' && (
                <>
                  <option value="business_plan">Business Plan</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={onGenerateDocument}
          disabled={status === 'generating'}
          className="w-full py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {status === 'generating' ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Generating Document...
            </>
          ) : (
            <>
              <DocumentPlusIcon className="h-5 w-5" />
              Generate Document
            </>
          )}
        </button>

        {/* Pipeline: Announcement Analysis -> Auto Generate */}
        <button
          type="button"
          onClick={onPipelineGenerate}
          disabled={status === 'generating'}
          className="w-full mt-3 py-2.5 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ring-1 ring-zinc-700"
        >
          <SparklesIcon className="h-4 w-4 text-zinc-400" />
          Analyze Announcement &rarr; Auto Generate
        </button>

        {/* Pipeline progress display */}
        <GenerationProgress
          isGenerating={status === 'generating'}
          currentStep={pipelineStep}
          error={pipelineError}
          className="mt-4"
        />

        {/* Pipeline result (on success) */}
        {pipelineResult && status === 'ready' && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-emerald-400">Generation Complete</h4>
                <p className="text-xs text-zinc-400 mt-1">{pipelineResult.filename}</p>
                <code className="text-xs text-zinc-600 mt-1 block">
                  sha256:{pipelineResult.hashChain.slice(0, 16)}...
                </code>
              </div>
              <a
                href={pipelineResult.downloadUrl}
                download={pipelineResult.filename}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>
        )}

        {/* Or upload file */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div
            className="text-center p-6 border-2 border-dashed border-white/10 rounded-lg hover:border-white/30 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            aria-label="Upload document"
          >
            <CloudArrowUpIcon className="h-8 w-8 mx-auto mb-2 text-zinc-500" />
            <p className="text-zinc-400 text-sm">Or upload existing document</p>
            <p className="text-xs text-zinc-500 mt-1">DOCX, HWP, HWPX, PDF</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.hwp,.hwpx,.pdf"
              onChange={onFileSelect}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
