import { LoadingState } from '@/components/shared/LoadingState'

/**
 * Dashboard Loading State
 * Shown while dashboard pages are loading
 */
export default function DashboardLoading() {
  return <LoadingState message="Loading dashboard..." size="lg" />
}
