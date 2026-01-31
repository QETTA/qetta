'use client'

/**
 * Document Generation Page
 *
 * QETTA Widget v2.0 - AI Document Generation Wizard
 */

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { SparklesIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/catalyst/button'
import {
  DashboardContainer,
  PageHeader,
  DashboardCard,
  StatsGrid,
  StatCard,
} from '@/components/dashboard/dashboard-container'
import type { GeneratedWidgetDocument, EmbedConfig } from '@/components/widget'

// Dynamic import for the wizard (client-only due to Zustand stores)
const WizardContainer = dynamic(
  () => import('@/components/widget').then(mod => ({ default: mod.WizardContainer })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-500" />
      </div>
    ),
    ssr: false,
  }
)

const TimeSavedCounter = dynamic(
  () => import('@/components/widget').then(mod => ({ default: mod.TimeSavedCounter })),
  { ssr: false }
)

export default function GeneratePage() {
  const [completedDocs, setCompletedDocs] = useState<GeneratedWidgetDocument[]>([])
  const [showWizard, setShowWizard] = useState(true)

  const config: EmbedConfig = {
    theme: 'dark',
    locale: 'en',
    onComplete: (doc) => {
      console.log('Document generated:', doc)
      setCompletedDocs((prev) => [doc, ...prev])
    },
    onError: (error) => {
      console.error('Generation error:', error)
    },
    onStepChange: (step) => {
      console.log('Step changed:', step)
    },
  }

  // Calculate total time saved
  const totalTimeSaved = completedDocs.reduce(
    (acc, doc) => acc + doc.timeSavedMinutes,
    0
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <DashboardContainer>
          <PageHeader
            title="AI Document Generation"
            description="Generate government compliance documents with AI"
            icon={<SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
          />
        </DashboardContainer>
      </div>

      {/* Stats bar */}
      {completedDocs.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/30">
          <DashboardContainer className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500" />
                  <span className="text-sm sm:text-base text-zinc-400">
                    Documents: <span className="text-white font-medium">{completedDocs.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  <span className="text-sm sm:text-base text-zinc-400">
                    Time saved:{' '}
                    <span className="text-emerald-400 font-medium">
                      {Math.floor(totalTimeSaved / 60)}h {totalTimeSaved % 60}m
                    </span>
                  </span>
                </div>
              </div>
              {!showWizard && (
                <Button onClick={() => setShowWizard(true)} color="zinc">
                  + New document
                </Button>
              )}
            </div>
          </DashboardContainer>
        </div>
      )}

      {/* Main content */}
      <DashboardContainer>
        {showWizard ? (
          <WizardContainer
            config={config}
            onClose={() => setShowWizard(false)}
          />
        ) : (
          <div className="space-y-6">
            {/* Empty state or document list */}
            {completedDocs.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <DocumentTextIcon className="h-12 w-12 sm:h-16 sm:w-16 text-zinc-700 mx-auto mb-4" />
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No documents generated yet
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 mb-6">
                  Create your first document
                </p>
                <Button onClick={() => setShowWizard(true)} color="zinc">
                  Start generating
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {completedDocs.map((doc) => (
                  <DashboardCard
                    key={doc.id}
                    variant="interactive"
                    padding="md"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                          {doc.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                          {doc.format} • {doc.createdAt.toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <span className="ml-2 px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded shrink-0">
                        -{Math.round(doc.timeSavedMinutes / 60)}h
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        href={doc.url}
                        color="zinc"
                        className="flex-1 justify-center text-sm"
                      >
                        Download
                      </Button>
                      {doc.previewUrl && (
                        <Button
                          href={doc.previewUrl}
                          outline
                          className="text-sm"
                        >
                          Preview
                        </Button>
                      )}
                    </div>
                  </DashboardCard>
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardContainer>

      {/* Footer stats */}
      <div className="border-t border-zinc-800 bg-zinc-900/30 mt-8">
        <DashboardContainer className="py-6 sm:py-8">
          <StatsGrid columns={3}>
            <StatCard label="Time saved" value="93.8%" />
            <StatCard
              label="Rejection reduction"
              value="91%"
              className="[&_p:first-child+p]:text-emerald-400"
            />
            <StatCard label="Tender data" value="630K+" />
          </StatsGrid>
        </DashboardContainer>
      </div>
    </div>
  )
}
