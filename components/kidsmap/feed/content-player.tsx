'use client'

import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0
    ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// YouTube embed player
export function YouTubeEmbed({
  videoId,
  className,
  autoplay = false,
}: {
  videoId: string
  className?: string
  autoplay?: boolean
}) {
  return (
    <div className={clsx('aspect-video w-full overflow-hidden rounded-2xl bg-black', className)}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
        title="YouTube video player"
      />
    </div>
  )
}

// Naver Clip embed (외부 링크 방식)
export function NaverClipEmbed({
  sourceUrl,
  thumbnailUrl,
  className,
}: {
  sourceUrl: string
  thumbnailUrl?: string
  className?: string
}) {
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-black',
        className,
      )}
    >
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
          <svg className="ml-1 h-8 w-8 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <span className="absolute bottom-3 left-3 rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-semibold text-white">
        네이버 클립에서 보기
      </span>
    </a>
  )
}

// Universal content player that picks the right embed
export function ContentPlayer({
  source,
  sourceUrl,
  thumbnailUrl,
  className,
}: {
  source: ContentSource
  sourceUrl: string
  thumbnailUrl?: string
  className?: string
}) {
  if (source === 'YOUTUBE') {
    const videoId = extractYouTubeId(sourceUrl)
    if (videoId) {
      return <YouTubeEmbed videoId={videoId} className={className} />
    }
  }

  if (source === 'NAVER_CLIP') {
    return <NaverClipEmbed sourceUrl={sourceUrl} thumbnailUrl={thumbnailUrl} className={className} />
  }

  // Blog or fallback: link out
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'flex aspect-video w-full items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800',
        className,
      )}
    >
      <span className="text-sm text-gray-500">원본에서 보기 →</span>
    </a>
  )
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}
