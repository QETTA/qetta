'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { QettaGlobalSearch } from './global-search'
import { useCrossFunctional } from '../context'
import { clientLogger } from '@/lib/logger/client'

// Dynamic imports for heavy components (reduces initial bundle by ~30%)
const QettaMatchingAnalysis = dynamic(
  () => import('./matching-analysis').then(mod => ({ default: mod.QettaMatchingAnalysis })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    ),
    ssr: false,
  }
)

const QettaProposalGenerator = dynamic(
  () => import('./proposal-generator').then(mod => ({ default: mod.QettaProposalGenerator })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500" />
      </div>
    ),
    ssr: false,
  }
)
import { QETTA_METRICS } from '@/lib/super-model'
import { apiGet } from '@/lib/api/client'
import type { ApplyPlatform } from '@/types/inbox'

// View modes
type ViewMode = 'search' | 'analysis' | 'proposal'

// Tender item from API
interface TenderItem {
  id: string
  platform: ApplyPlatform
  country: string
  title: string
  budget: string
  deadline: string
  matchScore: number
  status: 'qualified' | 'pending' | 'new' | 'notQualified'
  category?: string
  agency?: string
  detailUrl?: string
}

// API Response type
interface TenderResponse {
  success: boolean
  data: {
    tenders: TenderItem[]
    totalCount: number
    currentPage: number
    totalPages: number
    fetchedAt: string
  }
  error?: string
}

const statusStyles = {
  qualified: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Qualified' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending' },
  new: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'New' },
  notQualified: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Not Qualified' },
}

interface QettaApplyContentProps {
  selectedTenderId?: string | null
}

export function QettaApplyContent({ selectedTenderId }: QettaApplyContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('search')
  const [selectedTender, setSelectedTender] = useState<TenderItem | null>(null)
  const [filteredTenders, setFilteredTenders] = useState<TenderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { createDocsFromApply, showToast } = useCrossFunctional()

  // Fetch tenders from API on mount
  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await apiGet<TenderResponse>('/api/apply/tenders')

        if (data.success) {
          setFilteredTenders(data.data.tenders)

          // Set selected tender if ID provided
          if (selectedTenderId) {
            const found = data.data.tenders.find((t) => t.id === selectedTenderId)
            if (found) {
              setSelectedTender(found)
              setViewMode('analysis')
            }
          }
        } else {
          setError(data.error || 'Failed to fetch tenders')
        }
      } catch (err) {
        clientLogger.error('[APPLY] Error fetching tenders:', err)
        setError('A network error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenders()
  }, [selectedTenderId])

  const handleSearch = useCallback(async (query: string, platform: string, category: string) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (platform !== 'all') params.set('platform', platform)
      if (query.trim()) params.set('keyword', query)
      if (category !== 'all') params.set('category', category)

      const response = await fetch(`/api/apply/tenders?${params.toString()}`)
      const data: TenderResponse = await response.json()

      if (data.success) {
        setFilteredTenders(data.data.tenders)
      } else {
        showToast(data.error || 'Search failed', 'error')
      }
    } catch (err) {
      clientLogger.error('[APPLY] Search error:', err)
      showToast('An error occurred while searching', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  const handleTenderSelect = useCallback((tender: TenderItem) => {
    setSelectedTender(tender)
    setViewMode('analysis')
  }, [])

  const handleGenerateProposal = useCallback(() => {
    setViewMode('proposal')
  }, [])

  const handleProposalComplete = useCallback(() => {
    showToast('Proposal generation complete', 'success')
  }, [showToast])

  const handleViewInDocs = useCallback(
    (proposalId: string) => {
      if (selectedTender) {
        // Map TenderItem status to ApplyStatus
        const statusMap: Record<string, 'discovered' | 'analyzing' | 'qualified' | 'not_qualified' | 'applied' | 'awarded'> = {
          qualified: 'qualified',
          pending: 'analyzing',
          new: 'discovered',
          notQualified: 'not_qualified',
        }

        createDocsFromApply({
          id: proposalId,
          type: 'APPLY',
          title: selectedTender.title,
          platform: selectedTender.platform,
          country: selectedTender.country,
          status: statusMap[selectedTender.status] || 'discovered',
          matchScore: selectedTender.matchScore,
          budget: selectedTender.budget,
          deadline: new Date(selectedTender.deadline),
          dDay: selectedTender.deadline.startsWith('D-') ? selectedTender.deadline : `D-0`,
          createdAt: new Date(),
        })
      }
    },
    [createDocsFromApply, selectedTender]
  )

  return (
    <div className="flex flex-col h-full" data-testid="apply-content">
      {/* Header with view toggle */}
      <div className="px-4 py-3 border-b border-white/10 bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">QETTA APPLY</h2>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-500/10 text-zinc-400 rounded-full ring-1 ring-zinc-500/20">
              {QETTA_METRICS.GLOBAL_TENDER_DB} Global DB
            </span>
          </div>
          <div className="flex items-center gap-1 p-1 bg-zinc-800 rounded-lg">
            {[
              { id: 'search', icon: '🔍', label: 'Search' },
              { id: 'analysis', icon: '📊', label: 'Analysis' },
              { id: 'proposal', icon: '📄', label: 'Proposal' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                disabled={
                  (mode.id === 'analysis' || mode.id === 'proposal') && !selectedTender
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === mode.id
                    ? 'bg-white text-zinc-900'
                    : 'text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed'
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Breadcrumb */}
        {selectedTender && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setSelectedTender(null)
                setViewMode('search')
              }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Search Results
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{selectedTender.country} {selectedTender.id}</span>
            {viewMode === 'proposal' && (
              <>
                <span className="text-zinc-600">/</span>
                <span className="text-white">Generate Proposal</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'search' && (
          <div className="p-4 space-y-4">
            {/* Global Search */}
            <QettaGlobalSearch
              onSearch={handleSearch}
              onPlatformSelect={(platform) => handleSearch('', platform, 'all')}
            />

            {/* Results List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  AI Matching Results
                  <span className="text-zinc-500 font-normal ml-2">
                    ({filteredTenders.length} items)
                  </span>
                </h3>
                <span className="text-[10px] text-zinc-500">
                  Sorted by match score
                </span>
              </div>

              {!isLoading && !error && filteredTenders.map((tender) => {
                const style = statusStyles[tender.status]
                return (
                  <button
                    key={tender.id}
                    onClick={() => handleTenderSelect(tender)}
                    className="w-full p-4 bg-zinc-800/50 rounded-lg ring-1 ring-white/10
                               hover:ring-white/20 hover:bg-zinc-800 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Country Flag */}
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
                        {tender.country}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                          <span className="text-[10px] text-zinc-500">[{tender.platform}]</span>
                          <span className="text-[10px] text-zinc-600 font-mono">#{tender.id}</span>
                        </div>
                        <h4 className="text-sm font-medium text-white truncate mb-1">
                          {tender.title}
                        </h4>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="text-zinc-500">
                            Budget: <span className="text-white font-medium">{tender.budget}</span>
                          </span>
                          <span className="text-zinc-500">
                            Match:{' '}
                            <span
                              className={`font-medium ${
                                tender.matchScore >= 90
                                  ? 'text-emerald-400'
                                  : tender.matchScore >= 70
                                    ? 'text-amber-400'
                                    : 'text-zinc-400'
                              }`}
                            >
                              {tender.matchScore}%
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Deadline */}
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`text-sm font-bold ${
                            tender.deadline === 'D-3'
                              ? 'text-red-400'
                              : tender.deadline.includes('7') ||
                                  tender.deadline.includes('14')
                                ? 'text-amber-400'
                                : 'text-zinc-400'
                          }`}
                        >
                          {tender.deadline}
                        </div>
                        <div className="text-[10px] text-zinc-500">Deadline</div>
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Loading State */}
              {isLoading && (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 mx-auto mb-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-zinc-400">Loading tenders...</p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {filteredTenders.length === 0 && !isLoading && !error && (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm text-zinc-400">No results found</p>
                  <p className="text-xs text-zinc-500 mt-1">Try different keywords</p>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'analysis' && selectedTender && (
          <div className="h-full p-4">
            <QettaMatchingAnalysis
              tenderId={selectedTender.id}
              onGenerateProposal={handleGenerateProposal}
            />
          </div>
        )}

        {viewMode === 'proposal' && selectedTender && (
          <div className="h-full p-4">
            <QettaProposalGenerator
              tenderId={selectedTender.id}
              tenderTitle={selectedTender.title}
              supportedLanguages={
                selectedTender.platform === 'goszakup'
                  ? ['ru', 'kk', 'en']
                  : selectedTender.platform === 'UNGM'
                    ? ['en', 'fr', 'es']
                    : selectedTender.platform === 'SAM'
                      ? ['en']
                      : ['ko', 'en']
              }
              onComplete={handleProposalComplete}
              onViewDocs={handleViewInDocs}
            />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-white/10 bg-zinc-900/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time updates
            </div>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500">
              AIFC LAB <span className="text-white">Verified</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
              UNGM Registered
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
              SAM.gov Registered
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
