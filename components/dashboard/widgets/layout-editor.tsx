'use client'

import { useState, useCallback } from 'react'
import { CheckIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { type DashboardWidget } from './widget-system'
import { cn } from '@/lib/utils'
import { DISPLAY_METRICS } from '@/constants/metrics'

export type LayoutPreset = 'analytics' | 'operations' | 'executive' | 'custom'

interface LayoutEditorProps {
  widgets: DashboardWidget[]
  onWidgetsChange: (widgets: DashboardWidget[]) => void
  onSaveLayout: () => void
  onResetLayout: () => void
  editMode: boolean
  onEditModeChange: (editMode: boolean) => void
}

const LAYOUT_PRESETS: Record<Exclude<LayoutPreset, 'custom'>, { label: string; description: string; icon: string }> = {
  analytics: {
    label: 'Analytics Layout',
    description: 'Data analysis focused (charts + stats)',
    icon: '📊',
  },
  operations: {
    label: 'Operations Layout',
    description: 'Real-time monitoring focused',
    icon: '⚙️',
  },
  executive: {
    label: 'Executive Layout',
    description: 'Key metrics summary',
    icon: '📈',
  },
}

export function QettaLayoutEditor({ widgets, onWidgetsChange, onSaveLayout, onResetLayout, editMode, onEditModeChange }: LayoutEditorProps) {
  const [showPresets, setShowPresets] = useState(false)

  const handleToggleEditMode = useCallback(() => {
    if (editMode) {
      onSaveLayout()
    }
    onEditModeChange(!editMode)
    setShowPresets(false)
  }, [editMode, onSaveLayout, onEditModeChange])

  const handleApplyPreset = useCallback(
    (preset: Exclude<LayoutPreset, 'custom'>) => {
      const presetWidgets = generatePresetLayout(preset)
      onWidgetsChange(presetWidgets)
      setShowPresets(false)
    },
    [onWidgetsChange]
  )

  const handleReset = useCallback(() => {
    if (confirm('Reset to default layout?')) {
      onResetLayout()
    }
  }, [onResetLayout])

  return (
    <>
      <button
        onClick={handleToggleEditMode}
        className={cn(
          'fixed top-4 right-4 z-50 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
          editMode ? 'bg-zinc-700 text-white shadow-lg shadow-zinc-500/50' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        )}
      >
        {editMode ? (
          <>
            <CheckIcon className="w-4 h-4" />
            Save
          </>
        ) : (
          <>
            <PencilIcon className="w-4 h-4" />
            Edit Layout
          </>
        )}
      </button>

      {editMode && (
        <div className="fixed top-20 right-4 z-40 w-80 bg-zinc-900 rounded-xl ring-1 ring-white/10 shadow-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-medium text-white">Edit Layout</h3>
            <button onClick={handleReset} className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
              <ArrowPathIcon className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-zinc-400">Drag widgets to change their position.</p>
            <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
              <li>Drag corners to resize</li>
              <li>Drag title area to move</li>
              <li>Click X button to remove</li>
            </ul>
          </div>

          <div className="space-y-2">
            <button onClick={() => setShowPresets(!showPresets)} className="w-full text-left px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
              <div className="text-xs font-medium text-white">Layout Presets</div>
              <div className="text-[10px] text-zinc-500">Apply predefined layouts</div>
            </button>

            {showPresets && (
              <div className="space-y-2 pl-2">
                {(Object.keys(LAYOUT_PRESETS) as Array<Exclude<LayoutPreset, 'custom'>>).map((preset) => (
                  <button key={preset} onClick={() => handleApplyPreset(preset)} className="w-full text-left p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{LAYOUT_PRESETS[preset].icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white">{LAYOUT_PRESETS[preset].label}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{LAYOUT_PRESETS[preset].description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10">
            <div className="text-[10px] text-zinc-500">
              Active widgets: <span className="text-white">{widgets.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function generatePresetLayout(preset: Exclude<LayoutPreset, 'custom'>): DashboardWidget[] {
  switch (preset) {
    case 'analytics':
      return [
        { id: 'analytics-stats-1', type: 'stats', title: '총 문서 생성', size: 'small', position: { x: 0, y: 0, w: 1, h: 1 }, data: { value: '1,234', unit: '건' } },
        { id: 'analytics-stats-2', type: 'stats', title: '평균 생성 시간', size: 'small', position: { x: 1, y: 0, w: 1, h: 1 }, data: { value: '45', unit: '초' } },
        { id: 'analytics-timeline-1', type: 'timeline', title: '최근 활동', size: 'medium', position: { x: 0, y: 1, w: 2, h: 1 } },
      ]
    case 'operations':
      return [
        { id: 'ops-stats-1', type: 'stats', title: 'API 상태', size: 'small', position: { x: 0, y: 0, w: 1, h: 1 }, data: { value: '99.9', unit: '%' } },
        { id: 'ops-stats-2', type: 'stats', title: '활성 작업', size: 'small', position: { x: 1, y: 0, w: 1, h: 1 }, data: { value: '12', unit: '건' } },
      ]
    case 'executive':
      return [
        { id: 'exec-stats-1', type: 'stats', title: '시간 단축', size: 'small', position: { x: 0, y: 0, w: 1, h: 1 }, data: { value: DISPLAY_METRICS.timeSaved.value.replace('%', ''), unit: '%' } },
        { id: 'exec-stats-2', type: 'stats', title: '반려율 감소', size: 'small', position: { x: 1, y: 0, w: 1, h: 1 }, data: { value: DISPLAY_METRICS.rejectionReduction.value.replace('%', ''), unit: '%' } },
        { id: 'exec-stats-3', type: 'stats', title: '생성 속도', size: 'small', position: { x: 2, y: 0, w: 1, h: 1 }, data: { value: '45', unit: '초/건' } },
        { id: 'exec-stats-4', type: 'stats', title: 'API 가용성', size: 'small', position: { x: 3, y: 0, w: 1, h: 1 }, data: { value: DISPLAY_METRICS.apiUptime.value.replace('%', ''), unit: '%' } },
      ]
    default:
      return []
  }
}
