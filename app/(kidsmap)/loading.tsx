export default function KidsMapLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-700 dark:border-t-blue-400" />
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">지도를 불러오는 중...</p>
      </div>
    </div>
  )
}
