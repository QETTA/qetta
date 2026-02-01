'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ContentPlayer } from '@/components/kidsmap/feed/content-player'
import type { FeedItem } from '@/stores/kidsmap/feed-store'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'
import Link from 'next/link'

const SOURCE_LABELS: Record<ContentSource, string> = {
  YOUTUBE: 'YouTube',
  NAVER_BLOG: '네이버 블로그',
  NAVER_CLIP: '네이버 클립',
}

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만회`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천회`
  return `${count}회`
}

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [item, setItem] = useState<FeedItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchContent() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/kidsmap/feed/${id}`)
        if (!res.ok) throw new Error('Content not found')
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setItem(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-gray-500">{error || '콘텐츠를 찾을 수 없습니다'}</p>
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium dark:bg-gray-800"
        >
          뒤로 가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20 dark:bg-gray-950">
      {/* Back button */}
      <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
        <button onClick={() => router.back()} className="text-lg">
          ←
        </button>
        <span className="text-sm font-medium text-gray-500">
          {SOURCE_LABELS[item.source]}
        </span>
      </header>

      {/* Player */}
      <ContentPlayer
        source={item.source}
        sourceUrl={item.sourceUrl}
        thumbnailUrl={item.thumbnailUrl}
      />

      {/* Info */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="text-lg font-bold leading-snug text-gray-900 dark:text-white">
          {item.title}
        </h1>

        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <span>{item.author}</span>
          {item.viewCount && <span>· {formatViewCount(item.viewCount)}</span>}
          <span>· {new Date(item.publishedAt).toLocaleDateString('ko-KR')}</span>
        </div>

        {/* Place link */}
        {item.relatedPlaceName && item.relatedPlaceId && (
          <Link
            href={`/map?placeId=${item.relatedPlaceId}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          >
            📍 {item.relatedPlaceName}
            <span className="text-xs">→ 지도에서 보기</span>
          </Link>
        )}

        {/* Description */}
        {item.description && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* External link */}
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        >
          {SOURCE_LABELS[item.source]}에서 원본 보기 →
        </a>
      </div>
    </div>
  )
}
