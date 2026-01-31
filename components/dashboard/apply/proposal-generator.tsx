'use client'

import { useState, useCallback } from 'react'

// Proposal section types
interface ProposalSection {
  id: string
  name: string
  status: 'completed' | 'generating' | 'pending' | 'error'
  progress?: number
  wordCount?: number
}

// Proposal state
interface ProposalState {
  id: string
  tenderId: string
  title: string
  languages: string[]
  selectedLanguage: string
  sections: ProposalSection[]
  totalProgress: number
  status: 'idle' | 'generating' | 'completed' | 'error'
}

// Initial sections for proposal
const PROPOSAL_SECTIONS: ProposalSection[] = [
  { id: 'cover', name: 'Cover & Table of Contents', status: 'pending' },
  { id: 'executive', name: 'Executive Summary', status: 'pending' },
  { id: 'company', name: 'Company Overview', status: 'pending' },
  { id: 'technical', name: 'Technical Proposal', status: 'pending' },
  { id: 'experience', name: 'Similar Project Experience', status: 'pending' },
  { id: 'team', name: 'Team Members', status: 'pending' },
  { id: 'schedule', name: 'Project Schedule', status: 'pending' },
  { id: 'pricing', name: 'Pricing Proposal', status: 'pending' },
  { id: 'appendix', name: 'Appendix (Certificates, References)', status: 'pending' },
]

// Status styles
const sectionStatusStyles = {
  completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '✓' },
  generating: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: '⟳' },
  pending: { bg: 'bg-zinc-800', text: 'text-zinc-500', icon: '○' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', icon: '✕' },
}

interface QettaProposalGeneratorProps {
  tenderId?: string
  tenderTitle?: string
  supportedLanguages?: string[]
  onComplete?: (proposalId: string) => void
  onViewDocs?: (proposalId: string) => void
}

export function QettaProposalGenerator({
  tenderId = 'KZ-2026-4521',
  tenderTitle = 'Smart Factory Environmental Monitoring Equipment Supply',
  supportedLanguages = ['ru', 'kk', 'en'],
  onComplete,
  onViewDocs,
}: QettaProposalGeneratorProps) {
  const [proposal, setProposal] = useState<ProposalState>({
    id: `proposal-${Date.now()}`,
    tenderId,
    title: tenderTitle,
    languages: supportedLanguages,
    selectedLanguage: supportedLanguages[0],
    sections: PROPOSAL_SECTIONS,
    totalProgress: 0,
    status: 'idle',
  })

  const startGeneration = useCallback(async () => {
    setProposal((prev) => ({
      ...prev,
      status: 'generating',
      sections: prev.sections.map((s) => ({ ...s, status: 'pending' as const })),
    }))

    // Simulate section-by-section generation
    for (let i = 0; i < PROPOSAL_SECTIONS.length; i++) {
      // Update current section to generating
      setProposal((prev) => ({
        ...prev,
        sections: prev.sections.map((s, idx) =>
          idx === i ? { ...s, status: 'generating' as const, progress: 0 } : s
        ),
        totalProgress: Math.round((i / PROPOSAL_SECTIONS.length) * 100),
      }))

      // Simulate progress for this section
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setProposal((prev) => ({
          ...prev,
          sections: prev.sections.map((s, idx) =>
            idx === i ? { ...s, progress } : s
          ),
        }))
      }

      // Complete this section
      const wordCount = Math.floor(Math.random() * 500) + 200
      setProposal((prev) => ({
        ...prev,
        sections: prev.sections.map((s, idx) =>
          idx === i
            ? { ...s, status: 'completed' as const, progress: 100, wordCount }
            : s
        ),
      }))
    }

    // All done
    setProposal((prev) => ({
      ...prev,
      status: 'completed',
      totalProgress: 100,
    }))

    onComplete?.(proposal.id)
  }, [onComplete, proposal.id])

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'ru':
        return '🇷🇺 Russian'
      case 'kk':
        return '🇰🇿 Kazakh'
      case 'en':
        return '🇺🇸 English'
      case 'ko':
        return '🇰🇷 Korean'
      default:
        return lang
    }
  }

  const completedCount = proposal.sections.filter((s) => s.status === 'completed').length
  const totalWordCount = proposal.sections.reduce((sum, s) => sum + (s.wordCount || 0), 0)

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg ring-1 ring-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-800/50 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Auto-generate Proposal</h3>
            <p className="text-[10px] text-zinc-500">{tenderId}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-400 line-clamp-1">{tenderTitle}</p>
      </div>

      {/* Language Selector */}
      <div className="px-4 py-3 border-b border-white/5">
        <label className="text-xs text-zinc-400 mb-2 block">Select generation language</label>
        <div className="flex gap-2">
          {proposal.languages.map((lang) => (
            <button
              key={lang}
              onClick={() =>
                setProposal((prev) => ({ ...prev, selectedLanguage: lang }))
              }
              disabled={proposal.status === 'generating'}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                proposal.selectedLanguage === lang
                  ? 'bg-white/10 text-white ring-1 ring-white/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-50'
              }`}
            >
              {getLanguageLabel(lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Overview */}
      {proposal.status !== 'idle' && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">Overall Progress</span>
            <span className="text-xs text-zinc-500">
              {completedCount}/{proposal.sections.length} sections
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                proposal.status === 'completed' ? 'bg-emerald-500' : 'bg-zinc-500'
              }`}
              style={{ width: `${proposal.totalProgress}%` }}
            />
          </div>
          {proposal.status === 'completed' && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-emerald-400">✓ Generation Complete</span>
              <span className="text-[10px] text-zinc-500">
                Total {totalWordCount.toLocaleString()} words
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sections List */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <h4 className="text-xs font-medium text-zinc-400 mb-3">Proposal Structure</h4>
        <div className="space-y-2">
          {proposal.sections.map((section) => {
            const style = sectionStatusStyles[section.status]

            return (
              <div
                key={section.id}
                className={`p-3 rounded-lg ring-1 ring-white/5 transition-all ${
                  section.status === 'generating' ? 'ring-white/20 bg-white/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${style.bg} ${style.text}`}
                  >
                    {section.status === 'generating' ? (
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{section.name}</span>
                      {section.wordCount && (
                        <span className="text-[10px] text-zinc-500">
                          {section.wordCount} words
                        </span>
                      )}
                    </div>

                    {/* Progress bar for generating section */}
                    {section.status === 'generating' && section.progress !== undefined && (
                      <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-500 rounded-full transition-all duration-200"
                          style={{ width: `${section.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-zinc-800/50 border-t border-white/10">
        {proposal.status === 'idle' && (
          <button
            onClick={startGeneration}
            className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-900 text-sm font-medium rounded-lg
                       flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start {getLanguageLabel(proposal.selectedLanguage)} Proposal Generation
          </button>
        )}

        {proposal.status === 'generating' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
              Domain engine generating...
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              QETTA GLOBAL_TENDER engine is writing your proposal
            </p>
          </div>
        )}

        {proposal.status === 'completed' && (
          <div className="flex gap-2">
            <button
              onClick={() => onViewDocs?.(proposal.id)}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg
                         flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            <button
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg
                         flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
