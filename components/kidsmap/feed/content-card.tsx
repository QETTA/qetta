'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { useBookmarkStore } from '@/stores/kidsmap/bookmark-store'
import type { ContentSource, ContentType } from '@/lib/skill-engine/data-sources/kidsmap/types'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatViewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만회`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천회`
  return `${count}회`
}

const SOURCE_LABELS: Record<ContentSource, string> = {
  YOUTUBE: 'YouTube',
  NAVER_BLOG: '네이버 블로그',
  NAVER_CLIP: '네이버 클립',
}

const SOURCE_COLORS: Record<ContentSource, string> = {
  YOUTUBE: 'bg-red-500',
  NAVER_BLOG: 'bg-green-500',
  NAVER_CLIP: 'bg-emerald-400',
}

export interface ContentCardProps {
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
  relatedPlaceName?: string
  tags?: string[]
}

export function ContentCard(props: ContentCardProps) {
  const {
    id,
    source,
    title,
    thumbnailUrl,
    author,
    authorThumbnail,
    publishedAt,
    viewCount,
    duration,
    relatedPlaceName,
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = source === 'YOUTUBE' || source === 'NAVER_CLIP'
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(id))
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark)

  const timeAgo = getTimeAgo(publishedAt)

  return (
    <Link href={`/feed/${id}`} className="group block">
      {/* Thumbnail */}
      <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            width={400}
            height={225}
            alt={title}
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
            <span className="text-2xl">🎬</span>
          </div>
        )}

        {/* Duration badge */}
        {isVideo && duration && (
          <div className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(duration)}
          </div>
        )}

        {/* Source badge */}
        <div
          className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${SOURCE_COLORS[source]}`}
        >
          {SOURCE_LABELS[source]}
        </div>

        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleBookmark(props as import('@/stores/kidsmap/feed-store').FeedItem)
          }}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          aria-label={isBookmarked ? '저장 취소' : '저장'}
        >
          <svg className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 flex gap-2.5">
        {authorThumbnail ? (
          <Image
            src={authorThumbnail}
            width={36}
            height={36}
            alt={author}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm dark:bg-gray-700">
            {author[0]}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {author} · {viewCount ? formatViewCount(viewCount) : ''} {viewCount ? '· ' : ''}{timeAgo}
          </p>
          {relatedPlaceName && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              📍 {relatedPlaceName}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 30) return `${days}일 전`
  if (days < 365) return `${Math.floor(days / 30)}개월 전`
  return `${Math.floor(days / 365)}년 전`
}
