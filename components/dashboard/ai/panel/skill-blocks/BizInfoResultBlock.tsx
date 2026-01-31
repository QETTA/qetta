/**
 * BizInfoResultBlock - 기업마당 공고 검색 결과
 *
 * @theme Catalyst Dark
 */

'use client'

import { clsx } from 'clsx'
import type { BizInfoSearchResultData } from './types'

export function BizInfoResultBlock({
  result,
  keyword,
}: {
  result: BizInfoSearchResultData
  keyword?: string
}) {
  const statusStyles = {
    open: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    upcoming: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
    closed: 'bg-zinc-500/10 text-zinc-500 ring-1 ring-zinc-500/20',
    unknown: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  }

  const statusLabels = {
    open: 'Open',
    upcoming: 'Upcoming',
    closed: 'Closed',
    unknown: 'Unknown',
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return dateStr
  }

  return (
    <div className="mt-3 rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔎</span>
          <span className="font-medium text-white">
            BizInfo Announcement Search
            {keyword && (
              <span className="ml-2 text-sm text-zinc-400">&ldquo;{keyword}&rdquo;</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {result.fromCache && (
            <span className="rounded bg-zinc-700/50 px-1.5 py-0.5">Cached</span>
          )}
          <span>Total {result.totalCount.toLocaleString()} results</span>
        </div>
      </div>

      {/* Announcement List */}
      {result.announcements.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-500">
          No results found.
        </div>
      ) : (
        <div className="space-y-2">
          {result.announcements.map((announcement) => (
            <a
              key={announcement.id}
              href={announcement.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md bg-zinc-900/50 p-3 ring-1 ring-white/5 transition-all hover:bg-zinc-900 hover:ring-white/10"
            >
              {/* Announcement Title */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="line-clamp-2 flex-1 text-sm font-medium text-white">
                  {announcement.title}
                </h4>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    statusStyles[announcement.status]
                  )}
                >
                  {statusLabels[announcement.status]}
                </span>
              </div>

              {/* Agency + Field */}
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="rounded bg-zinc-500/10 px-1.5 py-0.5 text-xs text-zinc-400 ring-1 ring-zinc-500/20">
                  {announcement.agency}
                </span>
                {announcement.field && (
                  <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-zinc-400">
                    {announcement.field}
                  </span>
                )}
                {announcement.region && (
                  <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-zinc-400">
                    {announcement.region}
                  </span>
                )}
              </div>

              {/* Application Period */}
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <span>Application period:</span>
                <span className="text-zinc-400">
                  {formatDate(announcement.applicationPeriod.start)} ~{' '}
                  {formatDate(announcement.applicationPeriod.end)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {result.totalPages > 1 && (
        <div className="mt-3 border-t border-white/10 pt-3 text-center text-xs text-zinc-500">
          Page {result.currentPage} / {result.totalPages}
        </div>
      )}

      {/* Search Timestamp */}
      <div className="mt-2 text-right text-xs text-zinc-600">
        Searched: {new Date(result.searchedAt).toLocaleString('en-US')}
      </div>
    </div>
  )
}
