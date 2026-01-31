'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useMonitorSSE } from '@/hooks/use-monitor-sse'
import { useMonitorDataStore } from '@/stores/monitor-data-store'
import { EquipmentSelectionProvider, useEquipmentSelection } from './equipment-selection-context'
import { AIPanelErrorBoundary } from '@/components/dashboard/ai/panel/error-boundary'
import { MonitorSidebar } from './monitor-sidebar'
import { MonitorEquipmentList } from './monitor-equipment-list'
import { MonitorEquipmentDetail } from './monitor-equipment-detail'
import { MonitorAgentPanel } from './monitor-agent-panel'

// Dynamic import for heavy widget dashboard (reduces bundle by ~25%)
const MonitorWidgetDashboard = dynamic(
  () => import('./widget-dashboard').then(mod => ({ default: mod.MonitorWidgetDashboard })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
          <p className="text-xs text-zinc-500">Loading widgets...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

// Feature flag for widget system - enabled by default
const ENABLE_WIDGETS = process.env.NEXT_PUBLIC_ENABLE_MONITOR_WIDGETS !== 'false'

/**
 * QettaMonitorPreviewInner - Monitor Preview with Equipment Selection Context
 *
 * Layout:
 * - MonitorSidebar (left navigation)
 * - MonitorEquipmentList (equipment list)
 * - MonitorWidgetDashboard (optional widget dashboard)
 * - MonitorEquipmentDetail (equipment detail view)
 * - MonitorAgentPanel (AI agent sidebar)
 */
function QettaMonitorPreviewInner() {
  // SSE connection management
  const { isConnected, error: sseError } = useMonitorSSE()

  // Get data from Zustand store
  const equipment = useMonitorDataStore((state) => state.equipment)
  const alerts = useMonitorDataStore((state) => state.alerts)
  const summary = useMonitorDataStore((state) => state.summary)

  // Equipment selection state
  const { selectedEquipmentId, setSelectedEquipment } = useEquipmentSelection()

  // Get selected equipment from store
  const selectedEquipment = useMonitorDataStore((state) =>
    state.equipment.find((eq) => eq.id === selectedEquipmentId)
  )

  // Local UI state
  const [confidence] = useState(94.2)
  const [detailPanelOpen] = useState(true)

  // Auto-select first equipment if none selected
  useEffect(() => {
    if (!selectedEquipmentId && equipment.length > 0) {
      setSelectedEquipment(equipment[0].id)
    }
  }, [equipment, selectedEquipmentId, setSelectedEquipment])

  return (
    <div className="rounded-lg bg-zinc-900 shadow-2xl ring-1 ring-white/10 overflow-hidden flex flex-col lg:flex-row max-h-[580px] lg:h-[580px] transition-shadow hover:shadow-3xl text-[13px]" data-testid="monitor-content">
      {/* LEFT SIDEBAR */}
      <MonitorSidebar
        isConnected={isConnected}
        sseError={sseError}
        equipmentCount={equipment.length}
        alerts={alerts}
        summary={summary}
      />

      {/* EQUIPMENT LIST */}
      <MonitorEquipmentList
        equipment={equipment}
        selectedEquipmentId={selectedEquipmentId}
        onSelectEquipment={setSelectedEquipment}
      />

      {/* WIDGET DASHBOARD (when enabled) */}
      {ENABLE_WIDGETS && (
        <div className="hidden lg:flex flex-1 border-r border-white/10">
          <MonitorWidgetDashboard />
        </div>
      )}

      {/* EQUIPMENT DETAIL */}
      <MonitorEquipmentDetail
        selectedEquipment={selectedEquipment}
        isConnected={isConnected}
        sseError={sseError}
        showWidgets={ENABLE_WIDGETS}
        detailPanelOpen={detailPanelOpen}
      />

      {/* MONITOR AGENT */}
      <MonitorAgentPanel
        confidence={confidence}
        summary={summary}
      />
    </div>
  )
}

/**
 * Main MONITOR Tab Component
 *
 * Wraps QettaMonitorPreviewInner with EquipmentSelectionProvider
 * to synchronize selected equipment state across all columns:
 * - Equipment List (left)
 * - Widget Dashboard (center)
 * - Detail Panel (right)
 */
export function QettaMonitorPreview() {
  return (
    <AIPanelErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center h-[580px] rounded-lg bg-zinc-900 ring-1 ring-white/10 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-zinc-200 mb-2">Monitoring Connection Error</h3>
          <p className="text-xs text-zinc-500 max-w-[280px] mb-4">
            Failed to connect to SSE. Please check your network connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors ring-1 ring-white/20"
          >
            Reconnect
          </button>
        </div>
      }
    >
      <EquipmentSelectionProvider>
        <QettaMonitorPreviewInner />
      </EquipmentSelectionProvider>
    </AIPanelErrorBoundary>
  )
}
