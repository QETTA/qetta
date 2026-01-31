/**
 * Editor Skeleton Component
 *
 * Skeleton UI displayed while QettaDocEditor is loading
 * Linear-style dark theme applied
 */
export function EditorSkeleton() {
  return (
    <div className="flex-1 bg-zinc-950 flex flex-col animate-pulse">
      {/* Toolbar skeleton */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-zinc-700 rounded" />
          <div className="h-5 w-48 bg-zinc-700 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-zinc-700 rounded" />
          <div className="h-8 w-8 bg-zinc-700 rounded" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Icon placeholder */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 ring-1 ring-white/10" />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <div className="h-6 w-40 bg-zinc-700 rounded mx-auto" />
            <div className="h-4 w-64 bg-zinc-800 rounded mx-auto" />
          </div>

          {/* Domain selection button grid */}
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-zinc-800/50 rounded-lg ring-1 ring-white/5" />
            ))}
          </div>

          {/* Select box */}
          <div className="h-11 bg-zinc-800/50 rounded-lg ring-1 ring-white/10" />

          {/* Generate button */}
          <div className="h-12 bg-zinc-700/30 rounded-lg" />
        </div>
      </div>

      {/* Bottom status bar skeleton */}
      <div className="h-7 px-3 flex items-center justify-between bg-zinc-900 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-4 w-20 bg-zinc-700 rounded" />
          <div className="h-4 w-16 bg-zinc-700 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-24 bg-zinc-700 rounded" />
        </div>
      </div>
    </div>
  )
}

export default EditorSkeleton
