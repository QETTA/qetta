'use client'

export default function KidsMapError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 px-6">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-medium text-red-500">오류 발생</p>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white">
          지도를 불러올 수 없습니다
        </h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {error.message || '일시적인 문제입니다. 다시 시도해 주세요.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  )
}
