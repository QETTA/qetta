'use client'

/**
 * Timeline Widget - Activity Timeline
 *
 * Displays chronological events with type-based styling
 * Used for recent activity, event logs, audit trails
 */

import { memo } from 'react'
import {
  DocumentPlusIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/20/solid'
import type { TimelineWidgetData } from '@/types/widgets'

interface TimelineWidgetProps {
  data?: TimelineWidgetData
}

const EVENT_ICONS = {
  created: DocumentPlusIcon,
  updated: DocumentCheckIcon,
  verified: ShieldCheckIcon,
  submitted: PaperAirplaneIcon,
}

const EVENT_COLORS = {
  created: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
  updated: 'text-zinc-400 bg-zinc-500/10 ring-zinc-500/20',
  verified: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  submitted: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
}

function TimelineWidgetInner({ data }: TimelineWidgetProps) {
  if (!data || !data.events || data.events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No recent activity
      </div>
    )
  }

  const { events } = data

  return (
    <div className="flex flex-col h-full overflow-auto">
      <ul className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />

        {events.map((event) => {
          const Icon = EVENT_ICONS[event.type]
          const colorClass = EVENT_COLORS[event.type]

          return (
            <li key={event.id} className="relative pl-11 pb-4 last:pb-0">
              {/* Icon */}
              <div
                className={`absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full ring-1 ${colorClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="pt-0.5">
                <p className="text-sm font-medium text-white">{event.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{event.time}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export const TimelineWidget = memo(TimelineWidgetInner)
