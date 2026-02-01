'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ContentPlayer } from './content-player'
import { useBookmarkStore } from '@/stores/kidsmap/bookmark-store'
import { shareContent, getContentShareUrl } from '@/lib/kidsmap/share-utils'
import type { FeedItem } from '@/stores/kidsmap/feed-store'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'
import { clsx } from 'clsx'

const SOURCE_LABELS: Record<ContentSource, string> = {
  YOUTUBE: 'YouTube',
  NAVER_BLOG: '블로그',
  NAVER_CLIP: '클립',
}

function formatViews(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return `${count}`
}

interface FullscreenViewerProps {
  items: FeedItem[]
  initialIndex?: number
  onClose: () => void
  onLoadMore?: () => void
}

export function FullscreenViewer({
  items,
  initialIndex = 0,
  onClose,
  onLoadMore,
}: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)
  const [translateY, setTranslateY] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(items[currentIndex]?.id ?? ''))
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark)

  const currentItem = items[currentIndex]

  // Preload next items
  useEffect(() => {
    if (currentIndex >= items.length - 3) {
      onLoadMore?.()
    }
  }, [currentIndex, items.length, onLoadMore])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown' || e.key === 'j') goNext()
      if (e.key === 'ArrowUp' || e.key === 'k') goPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setIsTransitioning(true)
      setCurrentIndex((i) => i + 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }, [currentIndex, items.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsTransitioning(true)
      setCurrentIndex((i) => i - 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }, [currentIndex])

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current
    setTranslateY(deltaY)
  }, [])

  const handleTouchEnd = useCallback(() => {
    const velocity = Math.abs(translateY) / (Date.now() - touchStartTime.current)
    const threshold = velocity > 0.5 ? 30 : 80

    if (translateY < -threshold) {
      goNext()
    } else if (translateY > threshold) {
      goPrev()
    }
    setTranslateY(0)
  }, [translateY, goNext, goPrev])

  if (!currentItem) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 right-4 z-10 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm">
        {currentIndex + 1} / {items.length}
      </div>

      {/* Main content area */}
      <div
        ref={containerRef}
        className="flex h-full flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Video/Content area */}
        <div className="flex flex-1 items-center justify-center">
          {currentItem.source === 'NAVER_BLOG' ? (
            // Blog: show thumbnail + title
            <div className="relative h-full w-full">
              {currentItem.thumbnailUrl && (
                <Image
                  src={currentItem.thumbnailUrl}
                  fill
                  alt={currentItem.title}
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          ) : (
            <ContentPlayer
              source={currentItem.source}
              sourceUrl={currentItem.sourceUrl}
              thumbnailUrl={currentItem.thumbnailUrl}
              className="rounded-none"
            />
          )}
        </div>

        {/* Bottom overlay info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-6 pt-20">
          {/* Author */}
          <div className="mb-2 flex items-center gap-2">
            {currentItem.authorThumbnail ? (
              <Image
                src={currentItem.authorThumbnail}
                width={32}
                height={32}
                alt={currentItem.author}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm text-white">
                {currentItem.author[0]}
              </div>
            )}
            <span className="text-sm font-semibold text-white">{currentItem.author}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
              {SOURCE_LABELS[currentItem.source]}
            </span>
          </div>

          {/* Title */}
          <p className="mb-2 line-clamp-2 text-base font-semibold leading-snug text-white">
            {currentItem.title}
          </p>

          {/* Stats */}
          <div className="mb-3 flex items-center gap-3 text-xs text-white/70">
            {currentItem.viewCount && (
              <span>{formatViews(currentItem.viewCount)}회 시청</span>
            )}
            {currentItem.likeCount && (
              <span>{formatViews(currentItem.likeCount)} 좋아요</span>
            )}
          </div>

          {/* Place link */}
          {currentItem.relatedPlaceName && currentItem.relatedPlaceId && (
            <Link
              href={`/map?placeId=${currentItem.relatedPlaceId}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
            >
              📍 {currentItem.relatedPlaceName}
              <span className="text-white/60">→</span>
            </Link>
          )}

          {/* Tags */}
          {currentItem.tags && currentItem.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {currentItem.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-white/50"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side action buttons (TikTok-style) */}
      <div className="absolute right-3 bottom-40 z-10 flex flex-col items-center gap-5">
        {/* Like (display source count) */}
        <ActionButton
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          label={currentItem.likeCount ? formatViews(currentItem.likeCount) : '좋아요'}
        />
        {/* Share */}
        <ActionButton
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          }
          label="공유"
          onClick={async () => {
            const result = await shareContent({
              title: currentItem.title,
              text: `${currentItem.title} - ${currentItem.author}`,
              url: getContentShareUrl(currentItem.id),
            })
            if (result === 'copied') {
              setShareToast('링크 복사됨')
              setTimeout(() => setShareToast(null), 2000)
            }
          }}
        />
        {/* Save/Bookmark */}
        <ActionButton
          icon={
            <svg className="h-6 w-6" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
          label={isBookmarked ? '저장됨' : '저장'}
          isActive={isBookmarked}
          onClick={() => toggleBookmark(currentItem)}
        />
      </div>

      {/* Share toast */}
      {shareToast && (
        <div className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-gray-900 shadow-lg">
          {shareToast}
        </div>
      )}

      {/* Navigation hints */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 text-white/30 hidden sm:block"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      {currentIndex < items.length - 1 && (
        <button
          onClick={goNext}
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-white/30 hidden sm:block"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  isActive,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  isActive?: boolean
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={isActive ? 'text-red-400' : 'text-white'}>{icon}</div>
      <span className={clsx('text-[10px]', isActive ? 'text-red-400' : 'text-white/70')}>{label}</span>
    </button>
  )
}
