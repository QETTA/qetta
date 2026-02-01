'use client'

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
}) {
  if (pullDistance <= 0 && !isRefreshing) return null

  const progress = Math.min(pullDistance / threshold, 1)
  const ready = progress >= 1

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
      style={{ height: pullDistance > 0 ? pullDistance : isRefreshing ? 48 : 0 }}
    >
      <div
        className={`flex items-center gap-2 text-xs font-medium ${ready || isRefreshing ? 'text-blue-500' : 'text-gray-400'}`}
      >
        {isRefreshing ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            새로고침 중...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4 transition-transform"
              style={{ transform: `rotate(${ready ? 180 : progress * 180}deg)` }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {ready ? '놓으면 새로고침' : '당겨서 새로고침'}
          </>
        )}
      </div>
    </div>
  )
}
