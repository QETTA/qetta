'use client'

import { type DashboardWidget } from './widget-system'
import { ChartBarIcon, ListBulletIcon, ClockIcon, CalendarIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline'

interface WidgetCatalogProps {
  onAddWidget: (widget: Omit<DashboardWidget, 'id'>) => void
}

const WIDGET_TEMPLATES: Array<Omit<DashboardWidget, 'id'>> = [
  {
    type: 'stats',
    title: 'Stats Widget',
    size: 'small',
    position: { x: 0, y: 0, w: 1, h: 1 },
    data: { value: '0', unit: '' },
  },
  {
    type: 'chart',
    title: 'Chart Widget',
    size: 'large',
    position: { x: 0, y: 0, w: 2, h: 2 },
  },
  {
    type: 'list',
    title: 'List Widget',
    size: 'medium',
    position: { x: 0, y: 0, w: 2, h: 1 },
    data: { items: [] },
  },
  {
    type: 'timeline',
    title: 'Timeline Widget',
    size: 'medium',
    position: { x: 0, y: 0, w: 2, h: 1 },
    data: { events: [] },
  },
  {
    type: 'calendar',
    title: 'Calendar Widget',
    size: 'large',
    position: { x: 0, y: 0, w: 2, h: 2 },
  },
]

export function QettaWidgetCatalog({ onAddWidget }: WidgetCatalogProps) {
  const getIcon = (type: DashboardWidget['type']) => {
    switch (type) {
      case 'stats':
        return ChartBarIcon
      case 'chart':
        return PresentationChartLineIcon
      case 'list':
        return ListBulletIcon
      case 'timeline':
        return ClockIcon
      case 'calendar':
        return CalendarIcon
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-white">Widget Catalog</div>
      <div className="grid grid-cols-2 gap-2">
        {WIDGET_TEMPLATES.map((template) => {
          const Icon = getIcon(template.type)
          return (
            <button
              key={template.title}
              onClick={() => onAddWidget(template)}
              className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-zinc-400" />
                <div className="text-xs text-white">{template.title}</div>
              </div>
              <div className="text-[10px] text-zinc-500">
                {template.size === 'small' && '1x1'}
                {template.size === 'medium' && '2x1'}
                {template.size === 'large' && '2x2'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
