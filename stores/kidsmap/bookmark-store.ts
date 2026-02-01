/**
 * KidsMap Bookmark Store
 *
 * 콘텐츠 저장/북마크 관리 (Zustand + localStorage)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FeedItem } from './feed-store'

interface BookmarkState {
  bookmarks: FeedItem[]
  bookmarkIds: Set<string>

  // Actions
  addBookmark: (item: FeedItem) => void
  removeBookmark: (id: string) => void
  toggleBookmark: (item: FeedItem) => void
  isBookmarked: (id: string) => boolean
  getBookmarks: () => FeedItem[]
  clear: () => void
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      bookmarkIds: new Set<string>(),

      addBookmark: (item) => {
        const state = get()
        if (state.bookmarkIds.has(item.id)) return
        set({
          bookmarks: [item, ...state.bookmarks],
          bookmarkIds: new Set([...state.bookmarkIds, item.id]),
        })
      },

      removeBookmark: (id) => {
        const state = get()
        const newIds = new Set(state.bookmarkIds)
        newIds.delete(id)
        set({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
          bookmarkIds: newIds,
        })
      },

      toggleBookmark: (item) => {
        const state = get()
        if (state.bookmarkIds.has(item.id)) {
          state.removeBookmark(item.id)
        } else {
          state.addBookmark(item)
        }
      },

      isBookmarked: (id) => get().bookmarkIds.has(id),

      getBookmarks: () => get().bookmarks,

      clear: () => set({ bookmarks: [], bookmarkIds: new Set() }),
    }),
    {
      name: 'kidsmap-bookmarks',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.bookmarkIds = new Set(state.bookmarks.map((b) => b.id))
        }
      },
    },
  ),
)
