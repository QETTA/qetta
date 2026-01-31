/**
 * Shimmer Skeleton Loaders
 *
 * CSS 기반 Shimmer 애니메이션 (framer-motion 대체)
 * 정적인 animate-pulse 대신 움직이는 그라데이션으로 로딩 상태 시각화
 *
 * @module dashboard/shimmer-skeleton
 */

import { clsx } from 'clsx'

interface SkeletonLoaderProps {
  width?: string | number
  height?: string | number
  borderRadius?: number
  className?: string
}

/**
 * 기본 Shimmer 스켈레톤
 * CSS @keyframes shimmer로 움직이는 그라데이션 효과
 */
export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
}: SkeletonLoaderProps) {
  return (
    <div
      className={clsx('relative overflow-hidden bg-zinc-800', className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
    >
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  )
}

/**
 * 문서 카드 스켈레톤
 * QETTA 문서 목록 카드 로딩 상태
 */
export function DocumentCardSkeleton() {
  return (
    <div className="rounded-lg bg-zinc-900 p-4 ring-1 ring-white/10">
      <div className="flex items-start gap-4">
        {/* 아이콘 자리 */}
        <SkeletonLoader width={48} height={48} borderRadius={12} />

        <div className="flex-1 space-y-2">
          {/* 제목 */}
          <SkeletonLoader width="70%" height={20} />
          {/* 부제목 */}
          <SkeletonLoader width="50%" height={16} />
          {/* 메타 정보 */}
          <div className="flex gap-2 pt-2">
            <SkeletonLoader width={60} height={24} borderRadius={4} />
            <SkeletonLoader width={80} height={24} borderRadius={4} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 문서 목록 스켈레톤
 */
export function DocumentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={`doc-skeleton-${i}`} />
      ))}
    </div>
  )
}

/**
 * 에디터 스켈레톤
 * 문서 에디터 로딩 상태 (Shimmer 적용)
 */
export function EditorShimmerSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* 툴바 */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={`toolbar-${i}`} width={32} height={32} borderRadius={6} />
        ))}
      </div>

      {/* 본문 라인들 */}
      <div className="space-y-3 pt-4">
        <SkeletonLoader width="90%" height={24} />
        <SkeletonLoader width="100%" height={16} />
        <SkeletonLoader width="95%" height={16} />
        <SkeletonLoader width="85%" height={16} />
        <SkeletonLoader width="60%" height={16} />
      </div>

      {/* 테이블 placeholder */}
      <div className="mt-6 space-y-2">
        <SkeletonLoader width="100%" height={40} />
        <SkeletonLoader width="100%" height={32} />
        <SkeletonLoader width="100%" height={32} />
        <SkeletonLoader width="100%" height={32} />
      </div>
    </div>
  )
}

/**
 * 제안서 생성 카드 스켈레톤
 * 문서 생성 대기 상태
 */
export function ProposalCardSkeleton() {
  return (
    <div className="rounded-xl bg-zinc-900/50 p-6 ring-1 ring-white/10">
      <div className="flex items-center gap-4">
        {/* 아이콘 */}
        <SkeletonLoader width={56} height={56} borderRadius={12} />

        <div className="flex-1 space-y-2">
          {/* 제목 */}
          <SkeletonLoader width="60%" height={24} />
          {/* 설명 */}
          <SkeletonLoader width="80%" height={16} />
          <SkeletonLoader width="40%" height={16} />
        </div>

        {/* 액션 버튼 */}
        <SkeletonLoader width={100} height={40} borderRadius={8} />
      </div>
    </div>
  )
}

/**
 * 검증 배지 스켈레톤
 */
export function VerifyBadgeSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const heights = { sm: 24, md: 32, lg: 40 }
  const widths = { sm: 100, md: 140, lg: 180 }

  return (
    <SkeletonLoader
      width={widths[size]}
      height={heights[size]}
      borderRadius={8}
    />
  )
}

/**
 * 통계 카드 스켈레톤
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg bg-zinc-900/50 p-4 ring-1 ring-white/10">
      <div className="space-y-3">
        <SkeletonLoader width={40} height={40} borderRadius={8} />
        <SkeletonLoader width="50%" height={32} />
        <SkeletonLoader width="70%" height={14} />
      </div>
    </div>
  )
}

/**
 * 통계 그리드 스켈레톤
 */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={`stat-${i}`} />
      ))}
    </div>
  )
}

/**
 * 대시보드 전체 스켈레톤
 */
export function DashboardShimmerSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <StatsGridSkeleton />

      {/* 최근 문서 */}
      <div className="rounded-xl bg-zinc-900/30 p-6">
        <SkeletonLoader width={150} height={24} className="mb-4" />
        <DocumentListSkeleton count={3} />
      </div>

      {/* 활동 피드 */}
      <div className="rounded-xl bg-zinc-900/30 p-6">
        <SkeletonLoader width={120} height={24} className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`activity-${i}`} className="flex items-center gap-3">
              <SkeletonLoader width={40} height={40} borderRadius={20} />
              <div className="flex-1 space-y-1">
                <SkeletonLoader width="60%" height={16} />
                <SkeletonLoader width="40%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SkeletonLoader
