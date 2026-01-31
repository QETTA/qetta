'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DISPLAY_METRICS } from '@/constants/metrics'

/**
 * QettaDashboardMiniPreview - Hero section mini dashboard preview
 *
 * Shows a miniaturized 4-column dashboard preview with auto-rotating tabs.
 * Provides a visual preview of the full QETTA.BOX experience and CTA to /box.
 *
 * Animation System:
 * - Tab transition: opacity + translateX (0.3s ease-out)
 * - Content stagger: 0.05s delay per item
 * - Auto-rotation: 5s interval, pauses on hover
 */

type DashboardTab = 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'

const tabOrder: DashboardTab[] = ['DOCS', 'VERIFY', 'APPLY', 'MONITOR']

// Tab configuration
const tabConfig: Record<DashboardTab, {
  label: string
  icon: React.ReactNode
  highlight?: boolean
  color: string
  items: { title: string; status: string; time: string }[]
  aiSummary: string
}> = {
  DOCS: {
    label: '문서함',
    color: 'bg-blue-500',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
      </svg>
    ),
    items: [
      { title: 'TMS 일일보고서', status: '완료', time: '09:05' },
      { title: '환경부 제출양식', status: '작성중', time: '09:12' },
      { title: '해외입찰 제안서', status: '검토', time: '어제' },
    ],
    aiSummary: '오늘 6건의 문서 자동 생성 완료',
  },
  VERIFY: {
    label: '검증',
    color: 'bg-emerald-500',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    items: [
      { title: 'TMS-2026-01-001', status: '검증완료', time: '09:10' },
      { title: 'TMS-2026-01-002', status: '검증중', time: '09:15' },
      { title: 'ENV-2026-01-003', status: '대기', time: '10:00' },
    ],
    aiSummary: `${DISPLAY_METRICS.apiUptime.value} 정확도로 10건 검증 완료`,
  },
  APPLY: {
    label: '입찰',
    color: 'bg-amber-500',
    highlight: true,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    items: [
      { title: '🇰🇿 스마트팩토리 공급', status: '자격충족', time: 'D-7' },
      { title: '🇺🇳 Water Monitoring', status: '자격충족', time: 'D-14' },
      { title: '🇰🇷 TMS 구축사업', status: '검토중', time: 'D-3' },
    ],
    aiSummary: `${DISPLAY_METRICS.globalTenders.value} 입찰 중 3건 자동 매칭`,
  },
  MONITOR: {
    label: '모니터',
    color: 'bg-purple-500',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    items: [
      { title: '수처리 A동', status: '정상', time: '실시간' },
      { title: '방류구 B동', status: '주의', time: '실시간' },
      { title: '센서 C동', status: '정상', time: '실시간' },
    ],
    aiSummary: '24시간 무중단 감시 중',
  },
}

const statusColors: Record<string, string> = {
  완료: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  작성중: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  검토: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  검증완료: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  검증중: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  대기: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-400',
  자격충족: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  검토중: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  정상: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  주의: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
}

export function QettaDashboardMiniPreview() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('DOCS')
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedTab, setDisplayedTab] = useState<DashboardTab>('DOCS')

  // Smooth tab transition with fade effect
  const switchTab = useCallback((newTab: DashboardTab) => {
    if (newTab === displayedTab) return

    setIsTransitioning(true)
    setActiveTab(newTab)

    // After fade-out, update displayed content and fade-in
    setTimeout(() => {
      setDisplayedTab(newTab)
      setIsTransitioning(false)
    }, 150)
  }, [displayedTab])

  // Auto-rotate tabs every 5 seconds
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const currentIndex = tabOrder.indexOf(activeTab)
      const nextIndex = (currentIndex + 1) % tabOrder.length
      switchTab(tabOrder[nextIndex])
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, activeTab, switchTab])

  const currentTab = tabConfig[displayedTab]

  return (
    <div
      className="rounded-xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden bg-white dark:bg-zinc-950 ring-1 ring-black/5 dark:ring-white/5 transition-all hover:shadow-3xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex h-[400px] sm:h-[450px] lg:h-[520px]">
        {/* Mini Sidebar */}
        <aside className="w-12 sm:w-14 bg-zinc-950 flex flex-col flex-shrink-0" aria-label="대시보드 사이드바">
          {/* Logo */}
          <div className="h-10 sm:h-12 flex items-center justify-center border-b border-zinc-900/50">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-xs sm:text-sm">Q</span>
            </div>
          </div>

          {/* Tab Icons */}
          <nav className="flex-1 py-2 px-1 sm:px-1.5" aria-label="기능 탭 네비게이션">
            <ul className="space-y-1">
              {tabOrder.map((tab) => {
                const config = tabConfig[tab]
                const isActive = activeTab === tab

                return (
                  <li key={tab}>
                    <button
                      onClick={() => switchTab(tab)}
                      className={`relative w-full flex items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 focus:ring-offset-zinc-950 ${
                        isActive
                          ? 'bg-zinc-800/70 text-white scale-110'
                          : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                      }`}
                      title={config.label}
                      aria-label={`${config.label} 탭${isActive ? ' (현재 선택됨)' : ''}`}
                      aria-pressed={isActive}
                    >
                      <span aria-hidden="true">{config.icon}</span>
                      {config.highlight && !isActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Online indicator */}
          <div className="h-8 sm:h-10 flex items-center justify-center border-t border-zinc-900/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></div>
            <span className="sr-only">시스템 온라인 상태</span>
          </div>
        </aside>

        {/* Center List Panel */}
        <div className="w-28 sm:w-36 lg:w-44 bg-gray-50 dark:bg-white/5 border-r border-gray-100 dark:border-white/10 flex flex-col">
          {/* Panel Header */}
          <div className="h-10 sm:h-12 px-2 sm:px-3 flex items-center border-b border-gray-100 dark:border-white/10">
            <span className={`w-2 h-2 rounded-full ${currentTab.color} mr-2 transition-colors duration-300`}></span>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-800 dark:text-white truncate">{currentTab.label}</span>
          </div>

          {/* Items List with staggered animation */}
          <div
            className={`flex-1 overflow-hidden p-1.5 sm:p-2 transition-all duration-300 ${
              isTransitioning ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="space-y-1.5 sm:space-y-2">
              {currentTab.items.map((item, idx) => (
                <div
                  key={`${displayedTab}-${idx}`}
                  className={`p-1.5 sm:p-2 rounded-lg border transition-all duration-300 cursor-pointer ${
                    idx === 0
                      ? 'bg-white dark:bg-white/10 border-zinc-200 dark:border-white/20 shadow-sm'
                      : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20'
                  }`}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  <div className="text-[9px] sm:text-[10px] font-medium text-gray-800 dark:text-white truncate mb-1">
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[7px] sm:text-[8px] px-1 py-0.5 rounded ${statusColors[item.status] || 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-400'}`}>
                      {item.status}
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-gray-400 dark:text-zinc-400">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content Header */}
          <div className="h-10 sm:h-12 px-3 sm:px-4 flex items-center justify-between border-b border-gray-100 dark:border-white/10 bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-semibold text-gray-800 dark:text-white truncate">
                {currentTab.items[0]?.title || 'QETTA.BOX'}
              </span>
              <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded ${statusColors[currentTab.items[0]?.status] || ''}`}>
                {currentTab.items[0]?.status}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-400 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Mock Content Area with transition */}
          <div
            className={`flex-1 p-3 sm:p-4 bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-950/80 overflow-hidden transition-all duration-300 ${
              isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
            }`}
          >
            {/* Mini preview based on tab - 탭별 실제 콘텐츠 표시 */}
            <div className="h-full flex flex-col">
              {/* Tab-specific header */}
              <div className="mb-3">
                <h4 className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-white/90">
                  {tabConfig[activeTab].label}
                </h4>
                <p className="text-[8px] sm:text-[9px] text-gray-500 dark:text-white/50 mt-0.5">
                  {tabConfig[activeTab].aiSummary}
                </p>
              </div>

              {/* Items list - 탭별 데이터 렌더링 */}
              <div className="flex-1 border border-gray-100 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-white/5">
                {/* Table header */}
                <div className="h-6 sm:h-7 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 flex items-center px-2 sm:px-3">
                  <div className="flex-1 text-[8px] sm:text-[9px] font-medium text-gray-500 dark:text-white/50">항목</div>
                  <div className="w-12 sm:w-14 text-[8px] sm:text-[9px] font-medium text-gray-500 dark:text-white/50 text-center">상태</div>
                  <div className="w-10 sm:w-12 text-[8px] sm:text-[9px] font-medium text-gray-500 dark:text-white/50 text-right hidden sm:block">시간</div>
                </div>
                {/* Table rows - 실제 items 데이터 */}
                {tabConfig[activeTab].items.map((item) => (
                  <div key={item.title} className="h-7 sm:h-8 border-b border-gray-50 dark:border-white/5 flex items-center px-2 sm:px-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-1 text-[9px] sm:text-[10px] text-gray-700 dark:text-white/80 truncate pr-2">
                      {item.title}
                    </div>
                    <div className="w-12 sm:w-14 flex justify-center">
                      <span className={`text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                        item.status === '완료' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        item.status === '검증됨' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        item.status === '매칭' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-white' :
                        item.status === '정상' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="w-10 sm:w-12 text-[8px] sm:text-[9px] text-gray-400 dark:text-white/40 text-right hidden sm:block">
                      {item.time}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status bar */}
              <div className="h-6 sm:h-7 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <span className="text-[8px] sm:text-[9px] text-gray-400 dark:text-zinc-400">실시간</span>
                </div>
                <div className="flex gap-1">
                  {tabOrder.map((tab) => (
                    <div
                      key={tab}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        activeTab === tab ? tabConfig[tab].color : 'bg-gray-200 dark:bg-white/20'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Panel - Hidden on mobile, visible on xl */}
        <div className="hidden xl:flex w-48 bg-gradient-to-b from-zinc-50 to-white dark:from-white/5 dark:to-zinc-950 border-l border-gray-100 dark:border-white/10 flex-col">
          {/* Agent Header */}
          <div className="h-12 px-3 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-gray-700 dark:text-white">AI Agent</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>

          {/* Agent Content with transition */}
          <div
            className={`flex-1 p-3 overflow-hidden transition-all duration-300 ${
              isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="mb-3">
              <div className="text-[9px] text-gray-500 dark:text-zinc-400 mb-1">분석 요약</div>
              <div className="text-[10px] text-gray-800 dark:text-white leading-relaxed">
                {currentTab.aiSummary}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] text-gray-500 dark:text-zinc-400">추천 작업</div>
              <div className="p-2 bg-white dark:bg-white/10 rounded-lg border border-gray-100 dark:border-white/10">
                <div className="text-[9px] text-gray-700 dark:text-zinc-400">다음 문서 검증 예약</div>
              </div>
              <div className="p-2 bg-white dark:bg-white/10 rounded-lg border border-gray-100 dark:border-white/10">
                <div className="text-[9px] text-gray-700 dark:text-zinc-400">입찰 마감 알림 설정</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="h-12 sm:h-14 bg-gradient-to-r from-zinc-900 to-zinc-800 flex items-center justify-center px-4 gap-3">
        <span className="text-white/80 text-xs sm:text-sm">
          QETTA.BOX 대시보드 미리보기
        </span>
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-zinc-900 text-xs sm:text-sm font-semibold rounded-full hover:bg-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
          aria-label="QETTA.BOX 대시보드 체험하기"
        >
          체험하기
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}
