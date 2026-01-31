'use client'

import { memo, useState } from 'react'

// Company qualification criteria
interface QualificationCriteria {
  id: string
  name: string
  required: boolean
  status: 'met' | 'partial' | 'unmet' | 'checking'
  detail: string
  suggestion?: string
}

// Tender analysis result
interface TenderAnalysis {
  id: string
  platform: string
  country: string
  title: string
  budget: string
  deadline: string
  matchScore: number
  qualifications: QualificationCriteria[]
  languages: string[]
  aiSuggestion: string
}

// Sample analysis data
const sampleAnalysis: TenderAnalysis = {
  id: 'KZ-2026-4521',
  platform: 'goszakup',
  country: '🇰🇿',
  title: 'Smart Factory Environmental Monitoring Equipment Supply',
  budget: '$2.5M',
  deadline: 'D-26',
  matchScore: 94,
  qualifications: [
    {
      id: 'cert-1',
      name: 'ISO 14001 Certification',
      required: true,
      status: 'met',
      detail: 'Environmental Management System certified (renewed 2025.03)',
    },
    {
      id: 'cert-2',
      name: 'AIFC LAB Verification',
      required: true,
      status: 'met',
      detail: 'Astana International Financial Center verified (2025.11)',
    },
    {
      id: 'exp-1',
      name: 'Similar Project Experience',
      required: true,
      status: 'met',
      detail: '13 TMS/Smart Factory projects completed',
    },
    {
      id: 'fin-1',
      name: 'Financial Stability',
      required: false,
      status: 'partial',
      detail: 'Credit rating B+ (required: A or higher)',
      suggestion: 'Can be supplemented with bank guarantee letter',
    },
    {
      id: 'lang-1',
      name: 'Russian Document Submission',
      required: true,
      status: 'checking',
      detail: 'QETTA auto-translation support (Russian, Kazakh)',
    },
  ],
  languages: ['ru', 'kk', 'en'],
  aiSuggestion:
    'This tender shows high compatibility with your TMS domain engine and AIFC verification experience. We recommend attaching a bank guarantee letter to supplement financial stability. Proposal drafts are supported with automatic Russian/Kazakh translation.',
}

// Status styles
const statusStyles = {
  met: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
    icon: '✓',
    label: 'Met',
  },
  partial: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    ring: 'ring-amber-500/20',
    icon: '△',
    label: 'Partial',
  },
  unmet: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    ring: 'ring-red-500/20',
    icon: '✕',
    label: 'Not Met',
  },
  checking: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    ring: 'ring-blue-500/20',
    icon: '⟳',
    label: 'Checking',
  },
}

interface QettaMatchingAnalysisProps {
  tenderId?: string
  onGenerateProposal?: (tenderId: string) => void
}

function QettaMatchingAnalysisInner({ onGenerateProposal }: QettaMatchingAnalysisProps) {
  const [analysis] = useState<TenderAnalysis>(sampleAnalysis)
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null)

  const metCount = analysis.qualifications.filter((q) => q.status === 'met').length
  const totalRequired = analysis.qualifications.filter((q) => q.required).length

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg ring-1 ring-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-800/50 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{analysis.country}</span>
            <div>
              <div className="text-xs text-zinc-500">{analysis.platform}</div>
              <div className="text-xs text-zinc-400 font-mono">#{analysis.id}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{analysis.budget}</div>
            <div
              className={`text-xs font-medium ${
                analysis.deadline.includes('3') ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              {analysis.deadline}
            </div>
          </div>
        </div>
        <h3 className="text-sm font-medium text-white">{analysis.title}</h3>
      </div>

      {/* Match Score */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">AI Match Score</span>
          <span className="text-xs text-zinc-500">
            {metCount}/{totalRequired} requirements met
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.matchScore >= 90
                  ? 'bg-emerald-500'
                  : analysis.matchScore >= 70
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${analysis.matchScore}%` }}
            />
          </div>
          <span
            className={`text-lg font-bold ${
              analysis.matchScore >= 90
                ? 'text-emerald-400'
                : analysis.matchScore >= 70
                  ? 'text-amber-400'
                  : 'text-red-400'
            }`}
          >
            {analysis.matchScore}%
          </span>
        </div>
      </div>

      {/* Qualifications List */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <h4 className="text-xs font-medium text-zinc-400 mb-3">Qualification Analysis</h4>
        <div className="space-y-2">
          {analysis.qualifications.map((qual) => {
            const style = statusStyles[qual.status]
            const isExpanded = expandedCriteria === qual.id

            return (
              <div
                key={qual.id}
                className={`p-3 rounded-lg ring-1 transition-all cursor-pointer ${style.bg} ${style.ring} hover:ring-opacity-50`}
                onClick={() => setExpandedCriteria(isExpanded ? null : qual.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${style.bg} ${style.text}`}
                  >
                    {qual.status === 'checking' ? (
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      style.icon
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{qual.name}</span>
                      {qual.required && (
                        <span className="px-1.5 py-0.5 text-[9px] font-medium bg-red-500/10 text-red-400 rounded">
                          Required
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{qual.detail}</p>

                    {/* Expanded suggestion */}
                    {isExpanded && qual.suggestion && (
                      <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <div>
                            <div className="text-[10px] text-zinc-400 font-medium mb-0.5">AI Suggestion</div>
                            <p className="text-xs text-zinc-300">{qual.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand indicator */}
                  {qual.suggestion && (
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="px-4 py-3 bg-zinc-800/30 border-t border-white/5">
        <div className="flex items-start gap-2 mb-3">
          <svg className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <div className="text-[10px] text-zinc-400 font-medium mb-1">AI Comprehensive Analysis</div>
            <p className="text-xs text-zinc-300 leading-relaxed">{analysis.aiSuggestion}</p>
          </div>
        </div>

        {/* Language badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-zinc-500">Supported languages:</span>
          {analysis.languages.map((lang) => (
            <span
              key={lang}
              className="px-2 py-0.5 text-[9px] font-medium bg-zinc-800 text-zinc-400 rounded"
            >
              {lang === 'ru' ? '🇷🇺 Russian' : lang === 'kk' ? '🇰🇿 Kazakh' : lang === 'en' ? '🇺🇸 English' : lang}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-zinc-800/50 border-t border-white/10 flex items-center justify-between">
        <button className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          View detailed analysis
        </button>
        <button
          onClick={() => onGenerateProposal?.(analysis.id)}
          className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-900 text-sm font-medium rounded-lg
                     flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Proposal Draft
        </button>
      </div>
    </div>
  )
}

export const QettaMatchingAnalysis = memo(QettaMatchingAnalysisInner)
