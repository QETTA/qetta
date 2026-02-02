'use client'

/**
 * Widget System Demo Page
 *
 * Demonstrates Phase 1: Interactive Customizable Dashboards
 * - Drag-and-drop widget grid
 * - Resize and rearrange widgets
 * - Add/remove widgets
 * - Save/load custom layouts
 */

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { DashboardWidget } from '@/components/dashboard/widgets/widget-system'
import { DISPLAY_METRICS } from '@/constants/metrics'

// Dynamic imports for heavy widget components (react-grid-layout is ~50KB)
const QettaWidgetSystem = dynamic(
  () =>
    import('@/components/dashboard/widgets/widget-system').then((mod) => ({
      default: mod.QettaWidgetSystem,
    })),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-zinc-500" />
      </div>
    ),
    ssr: false,
  }
)

const QettaLayoutEditor = dynamic(
  () =>
    import('@/components/dashboard/widgets/layout-editor').then((mod) => ({
      default: mod.QettaLayoutEditor,
    })),
  {
    ssr: false,
  }
)

// Mock data for demonstration
const INITIAL_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget-1',
    type: 'stats',
    title: 'Time Reduction',
    size: 'small',
    position: { x: 0, y: 0, w: 3, h: 1 },
    data: {
      metric: 'Time Reduction',
      value: DISPLAY_METRICS.timeSaved.value,
      change: 5.2,
      trend: 'up',
      unit: '',
    },
  },
  {
    id: 'widget-2',
    type: 'stats',
    title: 'Rejection Rate',
    size: 'small',
    position: { x: 3, y: 0, w: 3, h: 1 },
    data: {
      metric: 'Rejection Reduction',
      value: DISPLAY_METRICS.rejectionReduction.value,
      change: 8.1,
      trend: 'up',
      unit: '',
    },
  },
  {
    id: 'widget-3',
    type: 'chart',
    title: 'Domain Match Analysis',
    size: 'medium',
    position: { x: 0, y: 1, w: 6, h: 3 },
    data: {
      chartType: 'bar',
      data: [
        { label: 'TMS', value: 45 },
        { label: 'Smart Factory', value: 67 },
        { label: 'AI Voucher', value: 89 },
        { label: 'Global Tender', value: 52 },
      ],
    },
  },
  {
    id: 'widget-4',
    type: 'timeline',
    title: 'Recent Activity',
    size: 'medium',
    position: { x: 6, y: 0, w: 6, h: 4 },
    data: {
      events: [
        {
          id: 'evt-1',
          title: 'Document "TIPS Application" created',
          time: '2 minutes ago',
          type: 'created',
        },
        {
          id: 'evt-2',
          title: 'Hash chain verification completed',
          time: '15 minutes ago',
          type: 'verified',
        },
        {
          id: 'evt-3',
          title: 'Document "EPA Report" updated',
          time: '1 hour ago',
          type: 'updated',
        },
        {
          id: 'evt-4',
          title: 'Application submitted to NIPA',
          time: '3 hours ago',
          type: 'submitted',
        },
      ],
    },
  },
  {
    id: 'widget-5',
    type: 'chart',
    title: 'OEE - Equipment 1',
    size: 'medium',
    position: { x: 0, y: 4, w: 3, h: 2 },
    data: {
      chartType: 'gauge',
      value: 85,
      max: 100,
      label: 'Overall Equipment Effectiveness',
      unit: '%',
      thresholds: {
        warning: 70,
        critical: 50,
      },
    },
  },
  {
    id: 'widget-6',
    type: 'list',
    title: 'Pending Documents',
    size: 'medium',
    position: { x: 3, y: 4, w: 3, h: 2 },
    data: {
      items: [
        {
          id: 'doc-1',
          title: 'Q4 Environmental Report',
          subtitle: 'Due in 2 days',
          badge: 'Urgent',
          badgeColor: 'red',
        },
        {
          id: 'doc-2',
          title: 'Smart Factory Settlement',
          subtitle: 'Draft',
          badge: 'In Progress',
          badgeColor: 'yellow',
        },
        {
          id: 'doc-3',
          title: 'AI Voucher Performance',
          subtitle: 'Ready for review',
          badge: 'Ready',
          badgeColor: 'green',
        },
      ],
    },
  },
]

export default function WidgetsDemoPage() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    // Lazy initializer - runs only once on mount
    if (typeof window === 'undefined') return INITIAL_WIDGETS

    const saved = localStorage.getItem('dashboard-layout')
    if (saved) {
      try {
        return JSON.parse(saved) as DashboardWidget[]
      } catch {
        return INITIAL_WIDGETS
      }
    }
    return INITIAL_WIDGETS
  })
  const [editMode, setEditMode] = useState(false)

  // Handle widget updates
  const handleWidgetUpdate = (updatedWidgets: DashboardWidget[]) => {
    setWidgets(updatedWidgets)
  }

  // Handle save layout
  const handleSaveLayout = () => {
    localStorage.setItem('dashboard-layout', JSON.stringify(widgets))
    setEditMode(false)
  }

  // Handle reset layout
  const handleResetLayout = () => {
    setWidgets(INITIAL_WIDGETS)
    localStorage.removeItem('dashboard-layout')
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      {/* Page Header */}
      <div className="mx-auto mb-8 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">Customizable Dashboard</h1>
            <p className="text-zinc-400">
              Phase 1 Demo: Drag-and-drop widgets, resize, and save your layout
            </p>
          </div>

          {/* Layout Editor Controls */}
          <QettaLayoutEditor
            widgets={widgets}
            onWidgetsChange={handleWidgetUpdate}
            onSaveLayout={handleSaveLayout}
            onResetLayout={handleResetLayout}
            editMode={editMode}
            onEditModeChange={setEditMode}
          />
        </div>
      </div>

      {/* Widget System */}
      <div className="mx-auto max-w-7xl">
        <QettaWidgetSystem
          activeTab="DOCS"
          widgets={widgets}
          onWidgetUpdate={handleWidgetUpdate}
          editMode={editMode}
        />
      </div>

      {/* Instructions */}
      <div className="mx-auto mt-8 max-w-7xl rounded-xl bg-zinc-900 p-6 ring-1 ring-white/10">
        <h2 className="mb-3 text-sm font-medium text-white">How to use:</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-white">1.</span>
            Click <strong className="text-white">Edit Layout</strong> to enter edit mode
          </li>
          <li className="flex items-start gap-2">
            <span className="text-white">2.</span>
            <strong className="text-white">Drag</strong> widgets to rearrange them
          </li>
          <li className="flex items-start gap-2">
            <span className="text-white">3.</span>
            <strong className="text-white">Resize</strong> widgets by dragging the bottom-right
            corner
          </li>
          <li className="flex items-start gap-2">
            <span className="text-white">4.</span>
            Click <strong className="text-white">Add Widget</strong> to choose from the catalog
          </li>
          <li className="flex items-start gap-2">
            <span className="text-white">5.</span>
            Use <strong className="text-white">Save/Load</strong> buttons to persist your layout
          </li>
          <li className="flex items-start gap-2">
            <span className="text-white">6.</span>
            Click <strong className="text-white">X</strong> on a widget to remove it (edit mode
            only)
          </li>
        </ul>
      </div>
    </div>
  )
}
