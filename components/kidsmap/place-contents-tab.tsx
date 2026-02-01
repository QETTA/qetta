'use client'

import { useEffect, useState } from 'react'
import { ContentCard } from '@/components/kidsmap/feed/content-card'
import type { FeedItem } from '@/stores/kidsmap/feed-store'

interface PlaceContentsTabProps {
  placeId: string
  placeName: string
}

export function PlaceContentsTab({ placeId, placeName }: PlaceContentsTabProps) {
  const [contents, setContents] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContents() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/kidsmap/feed?placeId=${placeId}&pageSize=10`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        if (json.success) {
          setContents(json.data.items)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContents()
  }, [placeId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    )
  }

  if (error) {
    return <p className="py-4 text-center text-xs text-gray-400">{error}</p>
  }

  if (contents.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-gray-400">관련 콘텐츠가 없습니다</p>
        <p className="mt-1 text-xs text-gray-300">
          &quot;{placeName}&quot; 관련 영상이 곧 추가됩니다
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
        Related Contents ({contents.length})
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {contents.map((item) => (
          <ContentCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}
