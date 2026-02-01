import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="mx-auto max-w-md text-center">
        <p className="text-7xl font-bold text-zinc-700">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            홈으로 이동
          </Link>
          <Link
            href="/features"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            기능 살펴보기
          </Link>
        </div>
      </div>
    </div>
  )
}
