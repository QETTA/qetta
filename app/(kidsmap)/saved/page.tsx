'use client'

import { useState, useMemo } from 'react'
import { useBookmarkStore } from '@/stores/kidsmap/bookmark-store'
import { ContentCard } from '@/components/kidsmap/feed/content-card'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'
import { clsx } from 'clsx'

type SortOption = 'newest' | 'oldest' | 'title'

const SOURCE_FILTERS: { label: string; value: ContentSource | null }[] = [
  { label: '전체', value: null },
  { label: 'YouTube', value: 'YOUTUBE' },
  { label: '네이버 클립', value: 'NAVER_CLIP' },
  { label: '블로그', value: 'NAVER_BLOG' },
]

export default function SavedPage() {
  const { bookmarks, removeBookmark, clear } = useBookmarkStore()
  const [sourceFilter, setSourceFilter] = useState<ContentSource | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const filtered = useMemo(() => {
    let items = sourceFilter
      ? bookmarks.filter((b) => b.source === sourceFilter)
      : bookmarks

    if (sortBy === 'oldest') {
      items = [...items].reverse()
    } else if (sortBy === 'title') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    }

    return items
  }, [bookmarks, sourceFilter, sortBy])

  return (
    <div className="min-h-screen bg-white pb-16 dark:bg-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex h-12 items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">저장한 콘텐츠</h1>
            {bookmarks.length > 0 && (
              <button
                onClick={clear}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                전체 삭제
              </button>
            )}
          </div>

          {/* Source filter tabs */}
          {bookmarks.length > 0 && (
            <div className="-mb-px flex gap-4 overflow-x-auto">
              {SOURCE_FILTERS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setSourceFilter(tab.value)}
                  className={clsx(
                    'whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors',
                    sourceFilter === tab.value
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Sort bar */}
      {bookmarks.length > 0 && (
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <p className="text-xs text-gray-400">{filtered.length}개 저장됨</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl">❤️</p>
          <p className="mt-3 text-sm text-gray-500">저장한 콘텐츠가 없습니다</p>
          <p className="mt-1 text-xs text-gray-400">피드에서 마음에 드는 콘텐츠를 저장해보세요</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-gray-500">해당 소스의 저장된 콘텐츠가 없습니다</p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl px-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {filtered.map((item) => (
              <div key={item.id} className="group relative">
                <ContentCard {...item} />
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    removeBookmark(item.id)
                  }}
                  className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                  aria-label="저장 취소"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
