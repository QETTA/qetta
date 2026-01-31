'use client'

import { useState, useEffect } from 'react'
import {
  QettaWidgetSystem,
  type DashboardWidget,
} from '@/components/dashboard/widgets/widget-system'
import { QettaLayoutEditor } from '@/components/dashboard/widgets/layout-editor'
import {
  useMonitorDataStore,
  selectSelectedEquipment,
} from '@/stores/monitor-data-store'
import { useEquipmentSelection } from './equipment-selection-context'
import { clientLogger } from '@/lib/logger/client'

const STORAGE_KEY = 'monitor-widget-layout'

const INITIAL_WIDGETS: DashboardWidget[] = [
  {
    id: 'monitor-oee-gauge',
    type: 'chart',
    title: 'OEE Overall',
    size: 'small',
    position: { x: 0, y: 0, w: 1, h: 1 },
    data: { chartType: 'gauge', value: 0, max: 100, unit: '%' },
  },
  {
    id: 'monitor-availability-gauge',
    type: 'chart',
    title: 'Availability',
    size: 'small',
    position: { x: 1, y: 0, w: 1, h: 1 },
    data: { chartType: 'gauge', value: 0, max: 100, unit: '%' },
  },
  {
    id: 'monitor-performance-gauge',
    type: 'chart',
    title: 'Performance',
    size: 'small',
    position: { x: 0, y: 1, w: 1, h: 1 },
    data: { chartType: 'gauge', value: 0, max: 100, unit: '%' },
  },
  {
    id: 'monitor-quality-gauge',
    type: 'chart',
    title: 'Quality',
    size: 'small',
    position: { x: 1, y: 1, w: 1, h: 1 },
    data: { chartType: 'gauge', value: 0, max: 100, unit: '%' },
  },
  {
    id: 'monitor-sensor-stats',
    type: 'stats',
    title: 'Sensor Status',
    size: 'medium',
    position: { x: 0, y: 2, w: 2, h: 1 },
    data: {
      stats: [
        { label: 'Normal', value: '0', change: 0, trend: 'neutral' },
        { label: 'Warning', value: '0', change: 0, trend: 'neutral' },
        { label: 'Critical', value: '0', change: 0, trend: 'neutral' },
      ],
    },
  },
  {
    id: 'monitor-timeline',
    type: 'timeline',
    title: 'Recent Alerts',
    size: 'large',
    position: { x: 0, y: 3, w: 2, h: 2 },
    data: { events: [] },
  },
]

/**
 * Monitor Widget Dashboard Component
 *
 * Features:
 * - Live data updates from SSE stream via Zustand store
 * - Selective subscriptions: only re-renders when selected equipment changes
 * - User customization: drag-and-drop layout editing
 * - Layout persistence: saves to localStorage
 * - Controlled component: parent manages state
 */
export function MonitorWidgetDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [editMode, setEditMode] = useState(false)

  const { selectedEquipmentId } = useEquipmentSelection()

  // Subscribe to selected equipment data only
  // This prevents unnecessary re-renders when other equipment updates
  const selectedEquipment = useMonitorDataStore(selectSelectedEquipment)

  // Load widgets on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setWidgets(parsed)
      } catch (err) {
        clientLogger.error('[WidgetDashboard] Failed to parse saved layout:', err)
        setWidgets(INITIAL_WIDGETS)
      }
    } else {
      setWidgets(INITIAL_WIDGETS)
    }
  }, [])

  // Update widget data when selected equipment changes
  useEffect(() => {
    if (!selectedEquipment) return

    setWidgets((prev) =>
      prev.map((widget) => {
        switch (widget.id) {
          case 'monitor-oee-gauge':
            return {
              ...widget,
              data: {
                chartType: 'gauge',
                value: selectedEquipment.oee.overall,
                max: 100,
                unit: '%',
              },
            }

          case 'monitor-availability-gauge':
            return {
              ...widget,
              data: {
                chartType: 'gauge',
                value: selectedEquipment.oee.availability,
                max: 100,
                unit: '%',
              },
            }

          case 'monitor-performance-gauge':
            return {
              ...widget,
              data: {
                chartType: 'gauge',
                value: selectedEquipment.oee.performance,
                max: 100,
                unit: '%',
              },
            }

          case 'monitor-quality-gauge':
            return {
              ...widget,
              data: {
                chartType: 'gauge',
                value: selectedEquipment.oee.quality,
                max: 100,
                unit: '%',
              },
            }

          case 'monitor-sensor-stats': {
            const normal = selectedEquipment.sensors.filter(
              (s) => s.status === 'normal'
            ).length
            const warning = selectedEquipment.sensors.filter(
              (s) => s.status === 'warning'
            ).length
            const critical = selectedEquipment.sensors.filter(
              (s) => s.status === 'critical'
            ).length

            return {
              ...widget,
              data: {
                stats: [
                  {
                    label: 'Normal',
                    value: String(normal),
                    change: 0,
                    trend: 'neutral' as const,
                  },
                  {
                    label: 'Warning',
                    value: String(warning),
                    change: 0,
                    trend: 'neutral' as const,
                  },
                  {
                    label: 'Critical',
                    value: String(critical),
                    change: 0,
                    trend: 'neutral' as const,
                  },
                ],
              },
            }
          }

          case 'monitor-timeline': {
            // Get alerts for this equipment from store
            const alerts = useMonitorDataStore
              .getState()
              .alerts.filter(
                (alert) => alert.equipmentId === selectedEquipment.id
              )
              .slice(0, 10) // Last 10 alerts

            return {
              ...widget,
              data: {
                events: alerts.map((alert) => ({
                  id: alert.id,
                  title: alert.message,
                  description: `Severity: ${alert.severity}`,
                  timestamp: alert.timestamp,
                  type:
                    alert.severity === 'critical'
                      ? ('error' as const)
                      : alert.severity === 'warning'
                        ? ('warning' as const)
                        : ('info' as const),
                })),
              },
            }
          }

          default:
            return widget
        }
      })
    )
  }, [selectedEquipment])

  const handleWidgetUpdate = (updatedWidgets: DashboardWidget[]) => {
    setWidgets(updatedWidgets)
  }

  const handleSaveLayout = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
    setEditMode(false)
  }

  const handleResetLayout = () => {
    setWidgets(INITIAL_WIDGETS)
    localStorage.removeItem(STORAGE_KEY)
  }

  if (!selectedEquipmentId) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        <div className="text-center">
          <div className="text-sm font-medium mb-2">No Equipment Selected</div>
          <div className="text-xs text-zinc-600">
            Select equipment from the left panel to view widgets
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-sm font-medium text-white">Widget Dashboard</h2>
          {selectedEquipment && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {selectedEquipment.name} ({selectedEquipment.id})
            </p>
          )}
        </div>
        <QettaLayoutEditor
          widgets={widgets}
          onWidgetsChange={handleWidgetUpdate}
          onSaveLayout={handleSaveLayout}
          onResetLayout={handleResetLayout}
          editMode={editMode}
          onEditModeChange={setEditMode}
        />
      </div>

      {/* Widget Grid */}
      <div className="flex-1 overflow-auto p-6">
        <QettaWidgetSystem
          activeTab="MONITOR"
          widgets={widgets}
          onWidgetUpdate={handleWidgetUpdate}
          editMode={editMode}
        />
      </div>
    </div>
  )
}
