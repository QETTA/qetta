/**
 * KidsMap View History Store
 *
 * 콘텐츠 시청/열람 기록 관리 (Zustand + localStorage)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ViewRecord {
  contentId: string
  title: string
  source: string
  thumbnailUrl?: string
  viewedAt: string
}

interface ViewHistoryState {
  history: ViewRecord[]
  viewedIds: Set<string>

  addView: (record: Omit<ViewRecord, 'viewedAt'>) => void
  isViewed: (contentId: string) => boolean
  getHistory: () => ViewRecord[]
  removeItem: (contentId: string) => void
  clear: () => void
}

const MAX_HISTORY = 100

export const useViewHistoryStore = create<ViewHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      viewedIds: new Set<string>(),

      addView: (record) => {
        const state = get()
        // Remove existing entry if present (move to top)
        const filtered = state.history.filter((h) => h.contentId !== record.contentId)
        const newRecord: ViewRecord = { ...record, viewedAt: new Date().toISOString() }
        const updated = [newRecord, ...filtered].slice(0, MAX_HISTORY)

        set({
          history: updated,
          viewedIds: new Set(updated.map((h) => h.contentId)),
        })
      },

      isViewed: (contentId) => get().viewedIds.has(contentId),

      getHistory: () => get().history,

      removeItem: (contentId) => {
        const state = get()
        const updated = state.history.filter((h) => h.contentId !== contentId)
        const newIds = new Set(state.viewedIds)
        newIds.delete(contentId)
        set({ history: updated, viewedIds: newIds })
      },

      clear: () => set({ history: [], viewedIds: new Set() }),
    }),
    {
      name: 'kidsmap-view-history',
      partialize: (state) => ({ history: state.history }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.viewedIds = new Set(state.history.map((h) => h.contentId))
        }
      },
    },
  ),
)
