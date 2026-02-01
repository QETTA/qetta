'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useFeedStore } from '@/stores/kidsmap/feed-store'
import { ContentCard } from '@/components/kidsmap/feed/content-card'
import { ShortsCard } from '@/components/kidsmap/feed/shorts-card'
import { FullscreenViewer } from '@/components/kidsmap/feed/fullscreen-viewer'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'
import { clsx } from 'clsx'

const SOURCE_TABS: { label: string; value: ContentSource | null }[] = [
  { label: '전체', value: null },
  { label: 'YouTube', value: 'YOUTUBE' },
  { label: '네이버 클립', value: 'NAVER_CLIP' },
  { label: '블로그', value: 'NAVER_BLOG' },
]

const SORT_OPTIONS = [
  { label: '최신순', value: 'recent' as const },
  { label: '인기순', value: 'popular' as const },
  { label: '트렌딩', value: 'trending' as const },
]

export default function FeedPage() {
  const {
    items,
    mode,
    sort,
    sourceFilter,
    isLoading,
    hasMore,
    error,
    setMode,
    setSort,
    setSourceFilter,
    fetchFeed,
    loadMore,
  } = useFeedStore()

  const observerRef = useRef<HTMLDivElement>(null)
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)

  // Initial fetch
  useEffect(() => {
    fetchFeed(true)
  }, [fetchFeed])

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoading, loadMore])

  return (
    <div className="min-h-screen bg-white pb-16 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto max-w-2xl px-4">
          {/* Title + mode toggle */}
          <div className="flex h-12 items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">피드</h1>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                onClick={() => setMode('grid')}
                className={clsx(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  mode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500',
                )}
              >
                그리드
              </button>
              <button
                onClick={() => setMode('shorts')}
                className={clsx(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  mode === 'shorts'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500',
                )}
              >
                숏폼
              </button>
            </div>
          </div>

          {/* Source tabs */}
          <div className="-mb-px flex gap-4 overflow-x-auto">
            {SOURCE_TABS.map((tab) => (
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
        </div>
      </header>

      {/* Sort bar */}
      <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              sort === opt.value
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-2xl px-4 py-8 text-center text-sm text-red-500">
          {error}
          <button onClick={() => fetchFeed(true)} className="ml-2 underline">
            재시도
          </button>
        </div>
      )}

      {/* Grid mode */}
      {mode === 'grid' && (
        <div className="mx-auto max-w-2xl px-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {items.map((item) => (
              <ContentCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Shorts mode */}
      {mode === 'shorts' && (
        <div className="mx-auto max-w-2xl px-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item, idx) => (
              <div key={item.id} onClick={() => setFullscreenIndex(idx)} className="cursor-pointer">
                <ShortsCard {...item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && !error && (
        <div className="py-20 text-center">
          <p className="text-4xl">📱</p>
          <p className="mt-3 text-sm text-gray-500">아직 콘텐츠가 없습니다</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />

      {/* Fullscreen viewer */}
      {fullscreenIndex !== null && (
        <FullscreenViewer
          items={items}
          initialIndex={fullscreenIndex}
          onClose={() => setFullscreenIndex(null)}
          onLoadMore={loadMore}
        />
      )}
    </div>
  )
}
