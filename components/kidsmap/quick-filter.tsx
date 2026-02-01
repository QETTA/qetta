'use client'

/**
 * QuickFilter - Category Filter Buttons
 *
 * Quick access buttons for primary place categories
 * 야외 (Outdoor) / 실내 (Indoor) / 공공 (Public) / 식당 (Restaurant)
 *
 * Features:
 * - Single-tap category selection
 * - Clear active state indication
 * - Compact chip-style design
 * - Syncs with filterStore
 * - Mobile-optimized with horizontal scroll
 *
 * @module kidsmap/quick-filter
 */

import { useFilterStore } from '@/stores/kidsmap/filter-store'
import { cn } from '@/lib/utils'
import type { FilterCategory } from '@/lib/skill-engine/data-sources/kidsmap/types'

// ============================================
// Filter Categories Configuration
// ============================================

const QUICK_FILTERS: Array<{
  value: FilterCategory
  label: string
  labelKo: string
  icon: string
  color: string
}> = [
  {
    value: 'outdoor',
    label: 'Outdoor',
    labelKo: '야외',
    icon: '🌳',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  },
  {
    value: 'indoor',
    label: 'Indoor',
    labelKo: '실내',
    icon: '🏠',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  },
  {
    value: 'public',
    label: 'Public',
    labelKo: '공공',
    icon: '🏛️',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  },
  {
    value: 'restaurant',
    label: 'Restaurant',
    labelKo: '식당',
    icon: '🍽️',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  },
]

// ============================================
// Main Component
// ============================================

export function QuickFilter() {
  const { filterCategory, setFilterCategory, reset: clearFilters } = useFilterStore()

  const handleFilterClick = (category: FilterCategory) => {
    if (filterCategory === category) {
      // Deselect if already selected
      setFilterCategory(null)
    } else {
      setFilterCategory(category)
    }
  }

  const handleClearAll = () => {
    clearFilters()
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      {/* Quick Filter Chips */}
      {QUICK_FILTERS.map((filter) => {
        const isActive = filterCategory === filter.value

        return (
          <button
            key={filter.value}
            onClick={() => handleFilterClick(filter.value)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all',
              'text-sm font-medium whitespace-nowrap',
              'hover:shadow-md active:scale-95',
              isActive
                ? filter.color
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
              isActive && 'ring-2 ring-offset-2 ring-offset-transparent',
            )}
            aria-pressed={isActive}
            aria-label={`Filter by ${filter.label}`}
          >
            <span className="text-base">{filter.icon}</span>
            <span className="hidden sm:inline">{filter.label}</span>
            <span className="sm:hidden">{filter.labelKo}</span>
            {isActive && (
              <span className="text-xs opacity-75">✓</span>
            )}
          </button>
        )
      })}

      {/* Clear All Button (shown when filters are active) */}
      {filterCategory && (
        <button
          onClick={handleClearAll}
          className="flex-shrink-0 px-3 py-2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium transition-colors active:scale-95"
          aria-label="Clear all filters"
        >
          <span className="hidden sm:inline">Clear</span>
          <span className="sm:hidden">✕</span>
        </button>
      )}
    </div>
  )
}

// ============================================
// Compact Variant (for header/toolbar)
// ============================================

export function QuickFilterCompact() {
  const { filterCategory, setFilterCategory } = useFilterStore()

  return (
    <div className="flex items-center gap-1.5">
      {QUICK_FILTERS.map((filter) => {
        const isActive = filterCategory === filter.value

        return (
          <button
            key={filter.value}
            onClick={() => setFilterCategory(isActive ? null : filter.value)}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full border transition-all',
              'hover:shadow-md active:scale-95',
              isActive
                ? filter.color
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
            )}
            aria-pressed={isActive}
            aria-label={`Filter by ${filter.label}`}
            title={filter.label}
          >
            <span className="text-lg">{filter.icon}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// Badge Variant (shows active filter)
// ============================================

export function QuickFilterBadge() {
  const { filterCategory } = useFilterStore()

  if (!filterCategory) return null

  const filter = QUICK_FILTERS.find((f) => f.value === filterCategory)
  if (!filter) return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        filter.color,
      )}
    >
      <span>{filter.icon}</span>
      <span>{filter.label}</span>
    </div>
  )
}
