'use client'

/**
 * TabBar - Bottom Navigation
 *
 * 2026 모바일 UX 표준 적용:
 * - Safe Area 지원 (iPhone notch/home indicator)
 * - 44px 최소 터치 타겟
 * - Haptic Feedback
 * - 접근성 강화
 *
 * @module components/kidsmap/tab-bar
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { haptic } from '@/lib/kidsmap/haptic'

const TABS = [
  { href: '/map', label: '지도', icon: '🗺️' },
  { href: '/feed', label: '피드', icon: '📱' },
  { href: '/saved', label: '저장', icon: '❤️' },
  { href: '/mypage', label: '마이', icon: '👤' },
] as const

export function TabBar() {
  const pathname = usePathname()

  const handleTabClick = () => {
    haptic.selection()
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95"
      aria-label="메인 네비게이션"
      role="navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {TABS.map((tab) => {
          const isActive = pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={handleTabClick}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                // 44px 최소 터치 타겟 보장
                'flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] px-3 py-2 text-xs font-medium transition-colors rounded-lg',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                'active:scale-95 transition-transform',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
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
