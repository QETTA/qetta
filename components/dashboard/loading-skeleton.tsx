/**
 * Loading Skeletons for Dashboard Pages
 *
 * Suspense fallback components
 * KidsMap Shimmer 패턴 적용 버전은 shimmer-skeleton.tsx 참조
 *
 * @see ./shimmer-skeleton.tsx - Shimmer 애니메이션 버전
 */

// Shimmer 버전 re-export
export {
  SkeletonLoader,
  DocumentCardSkeleton,
  DocumentListSkeleton as ShimmerDocumentListSkeleton,
  EditorShimmerSkeleton,
  ProposalCardSkeleton,
  VerifyBadgeSkeleton,
  StatCardSkeleton,
  StatsGridSkeleton,
  DashboardShimmerSkeleton,
} from './shimmer-skeleton'

/**
 * @deprecated Use ShimmerDocumentListSkeleton instead
 */
export function DocumentListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`doc-skeleton-${i}`} className="rounded-lg bg-white/5 p-4">
          <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
          <div className="h-4 w-1/2 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

export function VerificationListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`verify-skeleton-${i}`} className="rounded-lg bg-white/5 p-4">
          <div className="h-5 w-2/3 bg-white/10 rounded mb-2" />
          <div className="h-4 w-1/3 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

export function ApplicationListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`app-skeleton-${i}`} className="rounded-lg bg-white/5 p-4">
          <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
          <div className="h-4 w-1/2 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  )
}

export function EquipmentListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`equip-skeleton-${i}`} className="rounded-lg bg-white/5 p-4 flex items-center gap-4">
          <div className="h-12 w-12 bg-white/10 rounded-full" />
          <div className="flex-1">
            <div className="h-5 w-1/2 bg-white/10 rounded mb-2" />
            <div className="h-4 w-1/3 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`stat-skeleton-${i}`} className="rounded-lg bg-white/5 p-6">
            <div className="h-8 w-20 bg-white/10 rounded mb-2" />
            <div className="h-4 w-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg bg-white/5 p-6">
        <div className="h-6 w-32 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`activity-skeleton-${i}`} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-white/10 rounded mb-1" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
