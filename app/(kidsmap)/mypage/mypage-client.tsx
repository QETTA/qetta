'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useBookmarkStore } from '@/stores/kidsmap/bookmark-store'
import { usePlaceStore } from '@/stores/kidsmap/place-store'

export function MyPageClient() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  // Hooks must be called unconditionally at the top level
  const bookmarkCount = useBookmarkStore((s) => s.bookmarks.length)
  const favoriteCount = usePlaceStore((s) => s.favorites.length)
  const recentVisits = usePlaceStore((s) => s.recentVisits)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-16 dark:bg-gray-950">
      <header className="border-b border-gray-100 bg-white px-4 pt-8 pb-6 dark:border-gray-800 dark:bg-gray-950">
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
                {(session.user as { name?: string }).name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {(session.user as { name?: string }).name || 'User'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(session.user as { email?: string }).email}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">마이페이지</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              로그인하고 더 많은 기능을 이용하세요
            </p>
            <Link
              href="/auth/signin"
              className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              로그인하기
            </Link>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">북마크</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{bookmarkCount}</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">즐겨찾기</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{favoriteCount}</p>
        </div>
      </div>

      {/* Recent Activity */}
      {recentVisits.length > 0 && (
        <div className="mt-6 px-4">
          <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">최근 방문한 장소</h2>
          <div className="space-y-2">
            {recentVisits.slice(0, 5).map((visit) => (
              <Link
                key={visit.placeId}
                href={`/map?place=${visit.placeId}`}
                className="block rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <p className="font-medium text-gray-900 dark:text-white">{visit.placeName}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(visit.visitedAt).toLocaleDateString('ko-KR')}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="mt-6 px-4">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">설정</h2>
        <div className="space-y-2">
          <Link
            href="/settings"
            className="block rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <p className="font-medium text-gray-900 dark:text-white">앱 설정</p>
          </Link>
          {status === 'authenticated' && (
            <Link
              href="/auth/signout"
              className="block rounded-lg border border-red-200 bg-white p-3 text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-gray-900 dark:hover:bg-red-950/30"
            >
              <p className="font-medium">로그아웃</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
