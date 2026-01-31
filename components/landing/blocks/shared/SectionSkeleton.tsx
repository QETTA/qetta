import { memo } from 'react'

/**
 * SectionSkeleton - 마케팅 섹션 로딩을 위한 스켈레톤 UI
 *
 * Suspense fallback으로 사용되어 마케팅 섹션 로딩 중
 * 사용자에게 시각적 피드백을 제공합니다.
 *
 * Memoized - 정적 컴포넌트로 리렌더 시 참조 안정성 유지
 */
export const SectionSkeleton = memo(function SectionSkeleton() {
  return (
    <section className="relative bg-zinc-950 px-6 py-32 lg:px-8 animate-pulse">
      <div className="mx-auto max-w-7xl">
        {/* 섹션 헤더 */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto h-8 w-64 rounded bg-zinc-800/50" />
          <div className="mx-auto mt-4 h-4 w-96 max-w-full rounded bg-zinc-800/30" />
        </div>

        {/* 콘텐츠 그리드 */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-zinc-900/30 p-6 ring-1 ring-white/5"
            >
              <div className="h-12 w-12 rounded-lg bg-zinc-800/50" />
              <div className="mt-4 h-5 w-32 rounded bg-zinc-800/40" />
              <div className="mt-2 space-y-2">
                <div className="h-3 w-full rounded bg-zinc-800/30" />
                <div className="h-3 w-5/6 rounded bg-zinc-800/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})
