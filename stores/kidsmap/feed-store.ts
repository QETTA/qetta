/**
 * KidsMap Feed Store
 *
 * 피드 콘텐츠 상태 관리 (Zustand)
 */

import { create } from 'zustand'
import type { ContentSource, ContentType } from '@/lib/skill-engine/data-sources/kidsmap/types'

// ============================================
// Types
// ============================================

export interface FeedItem {
  id: string
  source: ContentSource
  type: ContentType
  sourceUrl: string
  title: string
  description?: string
  thumbnailUrl?: string
  author: string
  authorThumbnail?: string
  publishedAt: string
  viewCount?: number
  likeCount?: number
  duration?: number
  relatedPlaceId?: string
  relatedPlaceName?: string
  tags?: string[]
  qualityGrade?: string
}

export type FeedMode = 'grid' | 'shorts'
export type FeedSort = 'recent' | 'popular' | 'trending'

interface FeedState {
  // Data
  items: FeedItem[]
  page: number
  hasMore: boolean
  total: number

  // UI state
  mode: FeedMode
  sort: FeedSort
  sourceFilter: ContentSource | null
  isLoading: boolean
  error: string | null

  // Actions
  setMode: (mode: FeedMode) => void
  setSort: (sort: FeedSort) => void
  setSourceFilter: (source: ContentSource | null) => void
  fetchFeed: (reset?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
}

const INITIAL_STATE = {
  items: [],
  page: 1,
  hasMore: false,
  total: 0,
  mode: 'grid' as FeedMode,
  sort: 'recent' as FeedSort,
  sourceFilter: null as ContentSource | null,
  isLoading: false,
  error: null as string | null,
}

export const useFeedStore = create<FeedState>((set, get) => ({
  ...INITIAL_STATE,

  setMode: (mode) => set({ mode }),

  setSort: (sort) => {
    set({ sort })
    get().fetchFeed(true)
  },

  setSourceFilter: (source) => {
    set({ sourceFilter: source })
    get().fetchFeed(true)
  },

  fetchFeed: async (reset = false) => {
    const state = get()
    if (state.isLoading) return

    const page = reset ? 1 : state.page
    set({ isLoading: true, error: null })

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        sort: state.sort,
      })
      if (state.sourceFilter) {
        params.set('source', state.sourceFilter)
      }

      const res = await fetch(`/api/kidsmap/feed?${params}`)
      if (!res.ok) throw new Error('Failed to fetch feed')

      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Unknown error')

      const { items: newItems, hasMore, total } = json.data

      set({
        items: reset ? newItems : [...state.items, ...newItems],
        page: page + 1,
        hasMore,
        total,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch feed',
      })
    }
  },

  loadMore: async () => {
    const state = get()
    if (!state.hasMore || state.isLoading) return
    await get().fetchFeed(false)
  },

  reset: () => set(INITIAL_STATE),
}))
