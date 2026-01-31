'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { QettaLeftSidebar } from './sidebar'
import { QettaCenterPanel } from './center-panel'
import { QettaRightPanel } from './right-panel'
import { QettaAiPanel, MobileBottomSheet, MobileFAB } from '../ai/panel'
import type {
  ProductTab,
  ApplyInboxItem,
  AIAgentContext,
  AGILayer,
} from '@/types/inbox'

// Re-export for backwards compatibility
export type { ProductTab }

export interface DocumentItem {
  id: string
  title: string
  preview: string
  time: string
  status: 'active' | 'pending' | 'completed' | 'warning'
  unread?: boolean
  assignee?: string
  isResponding?: boolean
  count?: number
  priority?: 'critical' | 'high' | 'medium' | 'low'
}

export interface DocumentDetail {
  id: string
  title: string
  from: string
  email: string
  date: string
  content: string
  replies?: {
    from: string
    email: string
    date: string
    content: string
  }[]
}

import { CrossFunctionalContext, type CrossFunctionalContextType } from '../context'

// ============================================
// Toast Component
// ============================================

interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[], onDismiss: (id: string) => void }) {
  const bgColors = {
    success: 'bg-emerald-500/90',
    info: 'bg-zinc-500/90',
    warning: 'bg-amber-500/90',
    error: 'bg-red-500/90',
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-lg ring-1 ring-white/10 flex items-center gap-3 animate-slide-in backdrop-blur-sm`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================
// Main Layout Component
// ============================================

export function QettaDashboardLayout() {
  const [activeTab, setActiveTab] = useState<ProductTab>('DOCS')
  const [selectedDocument, setSelectedDocument] = useState<string | null>('doc-1')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [agentContext, setAgentContext] = useState<AIAgentContext | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Toast management
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      toastTimers.current.delete(id)
    }, 4000)
    toastTimers.current.set(id, timer)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer))
      toastTimers.current.clear()
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id)
    if (timer) clearTimeout(timer)
    toastTimers.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ============================================
  // Cross-functional Action: APPLY → DOCS
  // ============================================
  const createDocsFromApply = useCallback((applyItem: ApplyInboxItem) => {
    const newDocsId = `docs-${applyItem.id}-${Date.now()}`

    // Determine languages based on platform
    const languages = applyItem.platform === 'goszakup'
      ? ['ru', 'kk'] as const
      : ['ko', 'en'] as const

    // Update AI Agent context
    setAgentContext({
      entityInfo: {
        name: applyItem.platform,
        badge: 'Tender Link',
        badgeColor: 'blue',
        role: 'Auto Generate',
        organization: applyItem.country,
      },
      analysis: {
        summary: `Proposal is being auto-generated for ${applyItem.title}. Expected languages: ${languages.join(', ')}`,
        layer: 3 as AGILayer,
        confidence: 0.85,
      },
      suggestedActions: {
        primary: {
          label: 'Check Generation Progress',
          action: () => {
            setActiveTab('DOCS')
            setSelectedDocument(newDocsId)
          },
        },
        secondary: {
          label: 'View Original Tender',
          action: () => {
            setActiveTab('APPLY')
            setSelectedDocument(applyItem.id)
          },
        },
      },
      relatedItems: [
        {
          title: applyItem.title,
          time: 'now',
          preview: `Original tender (${applyItem.platform})`,
        },
      ],
    })

    // Navigate to DOCS
    setActiveTab('DOCS')
    setSelectedDocument(newDocsId)

    // Show toast
    showToast(`Started generating proposal for "${applyItem.title}"`, 'info')
  }, [showToast])

  // ============================================
  // Cross-functional Action: DOCS → VERIFY
  // ============================================
  const requestVerifyFromDocs = useCallback((docsId: string) => {
    const newVerifyId = `verify-${docsId}-${Date.now()}`

    // Update AI Agent context
    setAgentContext({
      entityInfo: {
        name: 'QETTA Cert Authority',
        badge: 'Verify Request',
        badgeColor: 'emerald',
        role: 'Hash Verification',
        organization: 'Internal',
      },
      analysis: {
        summary: 'Starting hashchain integrity verification for document. Using SHA-256 algorithm to trace all sensor data origins.',
        layer: 1 as AGILayer,
        confidence: 0.99,
      },
      suggestedActions: {
        primary: {
          label: 'Check Verification Results',
          action: () => {
            setActiveTab('VERIFY')
            setSelectedDocument(newVerifyId)
          },
        },
      },
      relatedItems: [
        {
          title: `Document ID: ${docsId}`,
          time: 'now',
          preview: 'Document to verify',
        },
      ],
    })

    // Navigate to VERIFY
    setActiveTab('VERIFY')
    setSelectedDocument(newVerifyId)

    // Show toast
    showToast('Verification request submitted', 'success')
  }, [showToast])

  // ============================================
  // Cross-functional Action: MONITOR → DOCS
  // ============================================
  const createEmergencyReport = useCallback((monitorId: string) => {
    const newDocsId = `docs-emergency-${monitorId}-${Date.now()}`

    // Update AI Agent context
    setAgentContext({
      entityInfo: {
        name: 'Emergency Report',
        badge: 'Auto Generate',
        badgeColor: 'red',
        role: 'Anomaly Alert',
        organization: 'QETTA MONITOR',
      },
      analysis: {
        summary: 'Auto-generating emergency report for equipment anomaly detection. TMS submission format applied.',
        layer: 2 as AGILayer,
        confidence: 0.92,
      },
      suggestedActions: {
        primary: {
          label: 'Check Report',
          action: () => {
            setActiveTab('DOCS')
            setSelectedDocument(newDocsId)
          },
        },
      },
      relatedItems: [
        {
          title: `Alert ID: ${monitorId}`,
          time: 'now',
          preview: 'Source alert',
        },
      ],
    })

    // Navigate to DOCS
    setActiveTab('DOCS')
    setSelectedDocument(newDocsId)

    // Show toast
    showToast('Started generating emergency report', 'warning')
  }, [showToast])

  // ============================================
  // Cross-functional Action: MONITOR → VERIFY
  // ============================================
  const submitSensorDataForVerify = useCallback((monitorId: string) => {
    const newVerifyId = `verify-sensor-${monitorId}-${Date.now()}`

    // Update AI Agent context
    setAgentContext({
      entityInfo: {
        name: 'Ministry of Environment TMS',
        badge: 'Data Submission',
        badgeColor: 'emerald',
        role: 'Sensor Verification',
        organization: 'Government',
      },
      analysis: {
        summary: 'Submitting OTT sensor data for TMS verification. Integrity guaranteed by hashchain.',
        layer: 1 as AGILayer,
        confidence: 0.99,
      },
      suggestedActions: {
        primary: {
          label: 'Check Verification Status',
          action: () => {
            setActiveTab('VERIFY')
            setSelectedDocument(newVerifyId)
          },
        },
      },
      relatedItems: [
        {
          title: `Sensor Data: ${monitorId}`,
          time: 'now',
          preview: 'Submission target',
        },
      ],
    })

    // Navigate to VERIFY
    setActiveTab('VERIFY')
    setSelectedDocument(newVerifyId)

    // Show toast
    showToast('Sensor data verification request complete', 'success')
  }, [showToast])

  // Context value - memoized to prevent unnecessary re-renders
  const contextValue = useMemo<CrossFunctionalContextType>(() => ({
    activeTab,
    setActiveTab,
    selectedDocument,
    setSelectedDocument,
    createDocsFromApply,
    requestVerifyFromDocs,
    createEmergencyReport,
    submitSensorDataForVerify,
    agentContext,
    setAgentContext,
    showToast,
  }), [
    activeTab,
    selectedDocument,
    agentContext,
    createDocsFromApply,
    requestVerifyFromDocs,
    createEmergencyReport,
    submitSensorDataForVerify,
    showToast,
  ])

  return (
    <CrossFunctionalContext.Provider value={contextValue}>
      <div className="flex h-screen bg-zinc-950 overflow-hidden">
        {/* Left Sidebar - 240px, Radiant Light style */}
        <QettaLeftSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Center Panel - 380px, white, document list */}
        <QettaCenterPanel
          activeTab={activeTab}
          selectedDocument={selectedDocument}
          onSelectDocument={setSelectedDocument}
        />

        {/* Right Panel - flex-1, document detail */}
        <QettaRightPanel
          selectedDocument={selectedDocument}
        />

        {/* AI Panel - Desktop only (hidden on mobile) */}
        <div className="hidden md:flex">
          <QettaAiPanel
            activeTab={activeTab}
            selectedDocument={selectedDocument}
            externalContext={agentContext}
          />
        </div>

        {/* Mobile AI Panel - Bottom Sheet + FAB */}
        <MobileBottomSheet
          activeTab={activeTab}
          selectedDocument={selectedDocument}
          externalContext={agentContext}
        />
        <MobileFAB />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </CrossFunctionalContext.Provider>
  )
}
