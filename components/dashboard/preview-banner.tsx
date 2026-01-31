'use client'

import { useEffect, useState } from 'react'

/**
 * Preview Mode Banner
 *
 * 둘러보기 모드에서 상단에 표시되는 배너
 * - 사용자에게 제한된 기능임을 알림
 * - 로그인 유도 CTA 제공
 * - 쿠키 기반으로 표시 여부 결정 (클라이언트에서 확인)
 */
export function PreviewBanner() {
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    // 쿠키 확인 (httpOnly가 아닌 경우에만 클라이언트에서 확인 가능)
    // middleware에서 설정한 쿠키는 httpOnly이므로, 서버에서 prop으로 전달받거나
    // URL 기반으로 초기 상태 추론
    const checkPreviewMode = () => {
      // 쿠키가 httpOnly이므로 document.cookie로 접근 불가
      // 대신 현재 경로가 dashboard 경로이고 로그인하지 않은 상태인지 추론
      // 또는 서버 컴포넌트에서 prop으로 전달받음
      // 여기서는 간단히 쿠키 존재 여부를 서버에서 확인하고 prop으로 받는 방식 권장
      // 임시로 localStorage 사용
      const previewFlag = sessionStorage.getItem('qetta_preview_entered')
      if (previewFlag === 'true') {
        setIsPreviewMode(true)
      }
    }

    // URL에 preview 파라미터가 있었는지 확인 (첫 진입 시)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('preview') === 'true') {
      sessionStorage.setItem('qetta_preview_entered', 'true')
      setIsPreviewMode(true)
    } else {
      checkPreviewMode()
    }
  }, [])

  if (!isPreviewMode) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-zinc-600 to-fuchsia-600 text-white py-2.5 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">둘러보기 모드</span>
          </span>
          <span className="hidden sm:inline text-white/80 text-sm">
            일부 기능이 제한됩니다 (문서 생성, AI 패널 등)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-white/70 text-sm">
            30분 후 자동 만료
          </span>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-zinc-600 font-medium text-sm hover:bg-white/90 transition-colors shadow-sm"
          >
            정식 이용하기
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * Preview Mode Sidebar Badge
 *
 * 사이드바에 표시되는 Preview 모드 배지
 */
export function PreviewModeBadge() {
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    const previewFlag = sessionStorage.getItem('qetta_preview_entered')
    setIsPreviewMode(previewFlag === 'true')
  }, [])

  if (!isPreviewMode) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium ring-1 ring-amber-500/20">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      PREVIEW
    </span>
  )
}
