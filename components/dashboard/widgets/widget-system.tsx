'use client'

import { useCallback } from 'react'
import ReactGridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { MinusIcon, XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { type ProductTab } from '@/types/inbox'
import { getOeeColor } from '@/constants/colors'

interface WidgetDataItem {
  id?: string
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
}

interface WidgetDataEvent {
  id?: string
  title: string
  time?: string
  type?: string
}

interface WidgetData {
  value?: string | number
  unit?: string
  items?: WidgetDataItem[]
  events?: WidgetDataEvent[]
  chartType?: string
  [key: string]: unknown
}

export interface DashboardWidget {
  id: string
  type: 'stats' | 'chart' | 'list' | 'timeline' | 'calendar'
  title: string
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number; w: number; h: number }
  data?: WidgetData
  minimized?: boolean
}

interface WidgetSystemProps {
  activeTab: ProductTab
  widgets: DashboardWidget[]
  onWidgetUpdate: (widgets: DashboardWidget[]) => void
  editMode?: boolean
}

export function QettaWidgetSystem({
  activeTab: _activeTab,
  widgets,
  onWidgetUpdate,
  editMode = false,
}: WidgetSystemProps) {
  const { width, containerRef, mounted } = useContainerWidth()

  const layout: LayoutItem[] = widgets.map((widget) => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: 1,
    minH: 1,
    maxW: 4,
    maxH: 3,
    resizeHandles: ['se'], // Southeast corner only
  }))

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!editMode) return
      const updatedWidgets = widgets.map((widget) => {
        const layoutItem = newLayout.find((item) => item.i === widget.id)
        if (!layoutItem) return widget
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        }
      })
      onWidgetUpdate(updatedWidgets)
    },
    [widgets, onWidgetUpdate, editMode]
  )

  const handleMinimize = useCallback(
    (widgetId: string) => {
      const updatedWidgets = widgets.map((widget) => {
        if (widget.id !== widgetId) return widget
        return {
          ...widget,
          minimized: !widget.minimized,
        }
      })
      onWidgetUpdate(updatedWidgets)
    },
    [widgets, onWidgetUpdate]
  )

  const handleRemove = useCallback(
    (widgetId: string) => {
      const updatedWidgets = widgets.filter((w) => w.id !== widgetId)
      onWidgetUpdate(updatedWidgets)
    },
    [widgets, onWidgetUpdate]
  )

  const handleMaximize = useCallback(
    (widgetId: string) => {
      const updatedWidgets = widgets.map((widget) => {
        if (widget.id !== widgetId) return widget
        return {
          ...widget,
          position: { ...widget.position, w: 4, h: 3 },
        }
      })
      onWidgetUpdate(updatedWidgets)
    },
    [widgets, onWidgetUpdate]
  )

  return (
    <div ref={containerRef} className="relative w-full">
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{
            cols: 4,
            rowHeight: 150,
            margin: [10, 10],
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: editMode,
            handle: '.drag-handle',
          }}
          resizeConfig={{
            enabled: editMode,
          }}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange}
          autoSize={true}
          className="layout"
        >
          {widgets.map((widget) => {
            const isMinimized = widget.minimized || false
            return (
              <div key={widget.id} className="widget-container">
                <div className={editMode ? 'drag-handle bg-zinc-900 rounded-xl ring-1 ring-white/10 p-4 transition-all hover:ring-white/20 h-full' : 'bg-zinc-900 rounded-xl ring-1 ring-white/10 p-4 transition-all hover:ring-white/20 h-full'}>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                    <h3 className="text-sm font-medium text-white">{widget.title}</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleMinimize(widget.id)} className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors" aria-label="Minimize widget">
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      {editMode && (
                        <button onClick={() => handleMaximize(widget.id)} className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors" aria-label="Maximize widget">
                          <ArrowsPointingOutIcon className="w-4 h-4" />
                        </button>
                      )}
                      {editMode && (
                        <button onClick={() => handleRemove(widget.id)} className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" aria-label="Remove widget">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {!isMinimized && <div className="text-sm text-zinc-300 overflow-auto">{renderWidgetContent(widget)}</div>}
                </div>
              </div>
            )
          })}
        </ReactGridLayout>
      )}
    </div>
  )
}

function renderWidgetContent(widget: DashboardWidget) {
  switch (widget.type) {
    case 'stats':
      return (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{widget.data?.value || '0'}</span>
            <span className="text-xs text-zinc-500">{widget.data?.unit || ''}</span>
          </div>
        </div>
      )
    case 'list':
      return (
        <div className="space-y-2">
          {widget.data?.items?.slice(0, 5).map((item: WidgetDataItem) => (
            <div key={item.title} className="p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
              <div className="text-xs text-white truncate">{item.title}</div>
            </div>
          )) || <div className="text-zinc-500 text-xs text-center">No data</div>}
        </div>
      )
    case 'timeline':
      return (
        <div className="space-y-2">
          {widget.data?.events?.slice(0, 3).map((event: WidgetDataEvent) => (
            <div key={event.title} className="flex gap-2">
              <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-400" />
              <div className="flex-1">
                <div className="text-xs text-white">{event.title}</div>
              </div>
            </div>
          )) || <div className="text-zinc-500 text-xs text-center">No events</div>}
        </div>
      )
    case 'chart':
      if (widget.data?.chartType === 'gauge') {
        const value = Number(widget.data?.value) || 0
        const max = Number(widget.data?.max) || 100
        const percentage = value / max

        const color = getOeeColor(value)

        return (
          <div className="flex items-center justify-center h-full w-full">
            <svg viewBox="0 0 200 200" className="w-full h-full max-w-[160px] max-h-[160px]">
              {/* Background arc */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="16"
              />
              {/* Value arc */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke={color}
                strokeWidth="16"
                strokeDasharray={`${percentage * 439.6} 439.6`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{
                  transition: 'stroke-dasharray 0.5s ease-in-out, stroke 0.5s ease',
                }}
              />
              {/* Value text */}
              <text
                x="100"
                y="100"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-3xl font-bold fill-white"
              >
                {value.toFixed(1)}
              </text>
              {/* Unit text */}
              <text
                x="100"
                y="120"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-zinc-500"
              >
                {widget.data?.unit || '%'}
              </text>
            </svg>
          </div>
        )
      }
      return <div className="text-zinc-500 text-xs">Unknown chart type</div>
    default:
      return <div className="text-zinc-500 text-xs">Loading widget</div>
  }
}
