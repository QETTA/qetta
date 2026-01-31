'use client'

import { useState, useCallback } from 'react'
import { QETTA_METRICS } from '@/lib/super-model'
import { DISPLAY_METRICS } from '@/constants/metrics'

const GLOBAL_TENDER_COUNT = 630_000

// Platform definitions
const PLATFORMS = [
  {
    id: 'all',
    name: 'All',
    icon: '🌐',
    count: GLOBAL_TENDER_COUNT,
    color: 'bg-zinc-500',
  },
  {
    id: 'goszakup',
    name: 'Goszakup',
    icon: '🇰🇿',
    count: GLOBAL_TENDER_COUNT,
    country: 'Kazakhstan',
    color: 'bg-emerald-500',
    highlight: true,
  },
  {
    id: 'sam',
    name: 'SAM.gov',
    icon: '🇺🇸',
    count: 8234,
    country: 'USA',
    color: 'bg-red-500',
  },
  {
    id: 'ungm',
    name: 'UNGM',
    icon: '🇺🇳',
    count: 991,
    country: 'UN',
    color: 'bg-sky-500',
  },
  {
    id: 'g2b',
    name: 'Naranjangter',
    icon: '🇰🇷',
    count: 12450,
    country: 'Korea',
    color: 'bg-blue-500',
  },
] as const

// Category filters
const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📋' },
  { id: 'env', name: 'Environment/Water', icon: '🌱' },
  { id: 'factory', name: 'Smart Factory', icon: '🏭' },
  { id: 'iot', name: 'IoT/Sensors', icon: '📡' },
  { id: 'ai', name: 'AI/Data', icon: '🤖' },
] as const

// Format number with K/M suffix
const formatCount = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${Math.round(num / 1000)}K`
  return num.toString()
}

interface QettaGlobalSearchProps {
  onSearch?: (query: string, platform: string, category: string) => void
  onPlatformSelect?: (platform: string) => void
}

export function QettaGlobalSearch({ onSearch, onPlatformSelect }: QettaGlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim() && selectedPlatform === 'all') return

    setIsSearching(true)
    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    onSearch?.(query, selectedPlatform, selectedCategory)
    setIsSearching(false)
  }, [query, selectedPlatform, selectedCategory, onSearch])

  const handlePlatformSelect = useCallback(
    (platformId: string) => {
      setSelectedPlatform(platformId)
      onPlatformSelect?.(platformId)
    },
    [onPlatformSelect]
  )

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search tenders... (e.g., water treatment, IoT sensor, environmental monitoring)"
              className="w-full h-11 pl-11 pr-4 bg-zinc-800/50 border border-white/10 rounded-lg
                         text-white placeholder:text-zinc-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30
                         transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="h-11 px-5 bg-white hover:bg-zinc-200 disabled:bg-zinc-700
                       text-zinc-900 text-sm font-medium rounded-lg transition-colors
                       flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </>
            )}
          </button>
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full
                         whitespace-nowrap transition-all ${
                           selectedCategory === cat.id
                             ? 'bg-white/10 text-white ring-1 ring-white/30'
                             : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                         }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handlePlatformSelect(platform.id)}
            className={`relative p-3 rounded-lg transition-all duration-200 text-left ${
              selectedPlatform === platform.id
                ? 'bg-white/10 ring-2 ring-white/30'
                : 'highlight' in platform && platform.highlight
                  ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30 hover:ring-emerald-500/50'
                  : 'bg-zinc-800/50 ring-1 ring-white/10 hover:ring-white/20'
            }`}
          >
            {/* KEY badge for Goszakup */}
            {'highlight' in platform && platform.highlight && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[8px] font-bold rounded-full">
                ★ {DISPLAY_METRICS.globalTenders.value}
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-lg">{platform.icon}</span>
              <span className="text-[10px] text-zinc-500">
                {'country' in platform ? platform.country : ''}
              </span>
            </div>

            <div
              className={`text-lg font-bold font-mono tabular-nums ${
                'highlight' in platform && platform.highlight
                  ? 'text-emerald-400'
                  : selectedPlatform === platform.id
                    ? 'text-white'
                    : 'text-white'
              }`}
            >
              {formatCount(platform.count)}
            </div>

            <div className="text-[10px] text-zinc-500 truncate">{platform.name}</div>
          </button>
        ))}
      </div>

      {/* Total stats */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time sync</span>
        </div>
        <span>
          Total <span className="text-white font-medium">{QETTA_METRICS.GLOBAL_TENDER_DB}</span> tenders
        </span>
      </div>
    </div>
  )
}
