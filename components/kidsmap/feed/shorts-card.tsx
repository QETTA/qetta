import Image from 'next/image'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'

const SOURCE_COLORS: Record<ContentSource, string> = {
  YOUTUBE: 'bg-red-500',
  NAVER_BLOG: 'bg-green-500',
  NAVER_CLIP: 'bg-emerald-400',
}

const SOURCE_LABELS: Record<ContentSource, string> = {
  YOUTUBE: 'YT',
  NAVER_BLOG: '블로그',
  NAVER_CLIP: '클립',
}

export interface ShortsCardProps {
  id: string
  source: ContentSource
  title: string
  thumbnailUrl?: string
  author: string
  viewCount?: number
  duration?: number
  relatedPlaceName?: string
}

function formatViews(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return `${count}`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ShortsCard({
  source,
  title,
  thumbnailUrl,
  author,
  viewCount,
  duration,
  relatedPlaceName,
}: ShortsCardProps) {
  return (
    <div className="group relative">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            fill
            alt={title}
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <svg className="ml-0.5 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Source badge */}
        <div className={`absolute top-2 left-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${SOURCE_COLORS[source]}`}>
          {SOURCE_LABELS[source]}
        </div>

        {/* Duration badge */}
        {duration && (
          <div className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {formatDuration(duration)}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">{title}</p>
          <p className="mt-1 text-[10px] text-white/70">
            {author} {viewCount ? `· ${formatViews(viewCount)}회` : ''}
          </p>
          {relatedPlaceName && (
            <p className="mt-1 text-[10px] text-white/80">📍 {relatedPlaceName}</p>
          )}
        </div>
      </div>
    </div>
  )
}
