'use client'

import { Link } from '@/components/ui/link'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

/**
 * AuthLayout - Linear-style Authentication Page Layout
 *
 * Design System:
 * - Clean dark background (zinc-950)
 * - Titanium silver/deep gray color scheme
 * - Minimal, no gradient orbs
 * - Text-only logo
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Header with navigation */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-8">
        {/* Back to Home */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {/* Logo - Text only, no icon box */}
        <Link href="/" className="text-white font-semibold text-xl tracking-tight">
          QETTA
        </Link>

        {/* Skip to Dashboard */}
        <Link
          href="/monitor"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group"
        >
          <span className="hidden sm:inline">Skip</span>
          <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-zinc-500">
        <p>© 2026 QETTA Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
