'use client'

/**
 * Document Generation Page
 *
 * QETTA Widget v2.0 - AI Document Generation Wizard
 */

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { SparklesIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline'
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-500/20 to-fuchsia-500/20 ring-1 ring-zinc-500/30">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Document Generation</h1>
              <p className="text-zinc-400">
                Generate government compliance documents with AI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {completedDocs.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-zinc-500" />
                  <span className="text-zinc-400">
                    Documents: <span className="text-white font-medium">{completedDocs.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-emerald-500" />
                  <span className="text-zinc-400">
                    Time saved:{' '}
                    <span className="text-emerald-400 font-medium">
                      {Math.floor(totalTimeSaved / 60)}h {totalTimeSaved % 60}m
                    </span>
                  </span>
                </div>
              </div>
              {!showWizard && (
                <button
                  onClick={() => setShowWizard(true)}
                  className="px-4 py-2 bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                >
                  + New document
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {showWizard ? (
          <WizardContainer
            config={config}
            onClose={() => setShowWizard(false)}
          />
        ) : (
          <div className="space-y-6">
            {/* Empty state or document list */}
            {completedDocs.length === 0 ? (
              <div className="text-center py-16">
                <DocumentTextIcon className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  No documents generated yet
                </h2>
                <p className="text-zinc-400 mb-6">
                  Create your first document
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="px-6 py-3 bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                >
                  Start generating
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{doc.title}</h3>
                        <p className="text-sm text-zinc-500">
                          {doc.format} • {doc.createdAt.toLocaleDateString('en-US')}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded">
                        -{Math.round(doc.timeSavedMinutes / 60)}h
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={doc.url}
                        download
                        className="flex-1 px-4 py-2 text-center text-sm bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                      >
                        Download
                      </a>
                      {doc.previewUrl && (
                        <a
                          href={doc.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                          Preview
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-white">93.8%</p>
              <p className="text-sm text-zinc-500">Time saved</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">91%</p>
              <p className="text-sm text-zinc-500">Rejection reduction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">630K+</p>
              <p className="text-sm text-zinc-500">Tender data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
