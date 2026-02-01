'use client'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-medium text-red-400">오류가 발생했습니다</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          인증 처리 중 문제가 발생했습니다
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          {error.message || '일시적인 문제입니다. 다시 시도해 주세요.'}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            다시 시도
          </button>
          <a
            href="/login"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            로그인으로 이동
          </a>
        </div>
      </div>
    </div>
  )
}
