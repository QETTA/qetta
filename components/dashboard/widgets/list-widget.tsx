'use client'

/**
 * List Widget - Document/Task List
 *
 * Displays a scrollable list of items (documents, tasks, etc.)
 * Used for recent documents, pending tasks, alerts
 */

import { memo } from 'react'
import type { ListWidgetData } from '@/types/widgets'

interface ListWidgetProps {
  data?: ListWidgetData
}

function ListWidgetInner({ data }: ListWidgetProps) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        No items to display
      </div>
    )
  }

  const { items } = data

  return (
    <div className="flex flex-col h-full overflow-auto">
      <ul className="divide-y divide-white/5">
        {items.map((item) => (
          <li
            key={item.id}
            className="px-3 py-3 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              {/* Title and Subtitle */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-zinc-500 truncate mt-1">{item.subtitle}</p>
                )}
              </div>

              {/* Badge */}
              {item.badge && (
                <span
                  className={`
                    flex-shrink-0 px-2 py-1 text-xs rounded ring-1
                    ${
                      item.badgeColor === 'green'
                        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                        : item.badgeColor === 'yellow'
                          ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                          : item.badgeColor === 'red'
                            ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                            : item.badgeColor === 'blue'
                              ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
                    }
                  `}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const ListWidget = memo(ListWidgetInner)
