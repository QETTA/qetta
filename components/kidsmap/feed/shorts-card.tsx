'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ContentSource } from '@/lib/skill-engine/data-sources/kidsmap/types'

export interface ShortsCardProps {
  id: string
  source: ContentSource
  title: string
  thumbnailUrl?: string
  author: string
  viewCount?: number
  relatedPlaceName?: string
}

function formatViews(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return `${count}`
}

export function ShortsCard({
  id,
  title,
  thumbnailUrl,
  author,
  viewCount,
  relatedPlaceName,
}: ShortsCardProps) {
  return (
    <Link href={`/feed/${id}`} className="group relative block">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            fill
            alt={title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-2 text-xs font-semibold leading-tight text-white">{title}</p>
          <p className="mt-1 text-[10px] text-white/70">
            {author} {viewCount ? `· ${formatViews(viewCount)}회` : ''}
          </p>
          {relatedPlaceName && (
            <p className="mt-1 text-[10px] text-white/80">📍 {relatedPlaceName}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
