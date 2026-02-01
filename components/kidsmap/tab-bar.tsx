'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const TABS = [
  { href: '/map', label: '지도', icon: '🗺️' },
  { href: '/feed', label: '피드', icon: '📱' },
  { href: '/saved', label: '저장', icon: '❤️' },
  { href: '/mypage', label: '마이', icon: '👤' },
] as const

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95"
      aria-label="메인 네비게이션"
      role="navigation"
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {TABS.map((tab) => {
          const isActive = pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400',
              )}
            >
              <span className="text-xl" aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
