'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useBookmarkStore } from '@/stores/kidsmap/bookmark-store'
import { usePlaceStore } from '@/stores/kidsmap/place-store'

export default function MyPage() {
  const { data: session, status } = useSession()
  const bookmarkCount = useBookmarkStore((s) => s.bookmarks.length)
  const favoriteCount = usePlaceStore((s) => s.favorites.length)

  return (
    <div className="min-h-screen bg-white pb-16 dark:bg-gray-950">
      <header className="border-b border-gray-100 bg-white px-4 pb-6 pt-8 dark:border-gray-800 dark:bg-gray-950">
        {status === 'authenticated' && session?.user ? (
          <div className="flex items-center gap-4">
            {(session.user as { image?: string }).image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(session.user as { image?: string }).image!}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                {(session.user.name || session.user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {session.user.name || '사용자'}
              </h1>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl dark:bg-gray-800">
              👤
            </div>
            <h1 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">로그인이 필요합니다</h1>
            <p className="mt-1 text-sm text-gray-500">로그인하면 더 많은 기능을 이용할 수 있어요</p>
            <Link
              href="/auth/signin"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white"
            >
              로그인
            </Link>
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px border-b border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
        <Link href="/saved" className="bg-white px-4 py-4 text-center dark:bg-gray-950">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookmarkCount}</p>
          <p className="text-xs text-gray-500">저장한 콘텐츠</p>
        </Link>
        <div className="bg-white px-4 py-4 text-center dark:bg-gray-950">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{favoriteCount}</p>
          <p className="text-xs text-gray-500">즐겨찾기 장소</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="mx-auto max-w-2xl px-4 py-4">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          <MenuItem href="/saved" label="저장한 콘텐츠" icon="❤️" />
          <MenuItem href="/map" label="즐겨찾기 장소" icon="⭐" />
          <MenuItem href="/feed" label="피드 둘러보기" icon="📱" />
          <MenuItem href="#" label="알림 설정" icon="🔔" />
          <MenuItem href="#" label="앱 정보" icon="ℹ️" />
        </ul>
      </nav>
    </div>
  )
}

function MenuItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 py-3.5 text-sm text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1">{label}</span>
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </li>
  )
}
