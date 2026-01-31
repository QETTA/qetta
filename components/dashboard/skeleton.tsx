export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-zinc-950">
      <div className="w-64 bg-zinc-900 border-r border-white/10 animate-pulse" />
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
      </div>
    </div>
  )
}
