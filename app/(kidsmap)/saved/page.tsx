'use client'

import { useBookmarkStore } from '@/stores/kidsmap/bookmark-store'
import { ContentCard } from '@/components/kidsmap/feed/content-card'

export default function SavedPage() {
  const { bookmarks, clear } = useBookmarkStore()

  return (
    <div className="min-h-screen bg-white pb-16 dark:bg-gray-950">
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">저장한 콘텐츠</h1>
        {bookmarks.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            전체 삭제
          </button>
        )}
      </header>

      {bookmarks.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl">❤️</p>
          <p className="mt-3 text-sm text-gray-500">저장한 콘텐츠가 없습니다</p>
          <p className="mt-1 text-xs text-gray-400">피드에서 마음에 드는 콘텐츠를 저장해보세요</p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl px-4 py-4">
          <p className="mb-4 text-xs text-gray-400">{bookmarks.length}개 저장됨</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {bookmarks.map((item) => (
              <ContentCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
