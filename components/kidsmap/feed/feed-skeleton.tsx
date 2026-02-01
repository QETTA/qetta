export function FeedGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="mt-3 flex gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function FeedShortsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[9/16] rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  )
}

export function ContentDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800" />
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-3">
        <div className="h-6 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-20 w-full rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  )
}
