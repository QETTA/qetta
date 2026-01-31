'use client'

import { Suspense } from 'react'
import {
  KakaoMap,
  SplashScreen,
  TabBar,
  SearchBar,
  BottomSheet,
  LocationButton,
  useMapContext,
} from '@/components/map'

// Get API key from environment
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

function MapView() {
  const { activeTab } = useMapContext()

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden">
      {/* Map Layer */}
      <div className="absolute inset-0">
        <KakaoMap apiKey={KAKAO_MAP_API_KEY} />
      </div>

      {/* Explore Tab Content */}
      {activeTab === 'explore' && (
        <>
          {/* Search Bar */}
          <SearchBar />

          {/* Location Button */}
          <LocationButton />

          {/* Bottom Sheet */}
          <BottomSheet />
        </>
      )}

      {/* Saved Tab Content */}
      {activeTab === 'saved' && (
        <SavedPlacesView />
      )}

      {/* Contribute Tab Content */}
      {activeTab === 'contribute' && (
        <ContributeView />
      )}

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <ProfileView />
      )}

      {/* Tab Bar */}
      <TabBar />

      {/* Splash Screen */}
      <SplashScreen />
    </main>
  )
}

// ============================================
// Saved Places View
// ============================================

function SavedPlacesView() {
  return (
    <div className="absolute inset-0 bg-[#F5F5F7] pt-[calc(env(safe-area-inset-top,47px)+12px)] pb-[83px]">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E5E5EA]">
          <h1 className="text-2xl font-bold text-[#1D1D1F]">저장됨</h1>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center h-[60%] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#E5E5EA] flex items-center justify-center mb-4">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path
                d="M25.5 4.5H10.5C8.843 4.5 7.5 5.843 7.5 7.5V31.5L18 25.5L28.5 31.5V7.5C28.5 5.843 27.157 4.5 25.5 4.5Z"
                stroke="#8E8E93"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-2">
            저장된 장소가 없습니다
          </h2>
          <p className="text-sm text-[#6E6E73]">
            마음에 드는 장소를 저장해두고<br />
            언제든지 쉽게 찾아보세요
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Contribute View
// ============================================

function ContributeView() {
  const contributionItems = [
    {
      icon: '📍',
      title: '새 장소 추가',
      description: '지도에 없는 장소를 추가해주세요',
    },
    {
      icon: '✏️',
      title: '장소 정보 수정',
      description: '잘못된 정보를 수정해주세요',
    },
    {
      icon: '📸',
      title: '사진 추가',
      description: '장소 사진을 공유해주세요',
    },
    {
      icon: '⭐',
      title: '리뷰 작성',
      description: '방문 경험을 공유해주세요',
    },
  ]

  return (
    <div className="absolute inset-0 bg-[#F5F5F7] pt-[calc(env(safe-area-inset-top,47px)+12px)] pb-[83px]">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E5E5EA]">
          <h1 className="text-2xl font-bold text-[#1D1D1F]">기여하기</h1>
          <p className="text-sm text-[#6E6E73] mt-1">
            지역 정보를 더 정확하게 만들어주세요
          </p>
        </div>

        {/* Contribution Options */}
        <div className="p-4 space-y-3">
          {contributionItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm active:bg-[#F5F5F7] transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="text-left">
                <h3 className="text-[15px] font-semibold text-[#1D1D1F]">
                  {item.title}
                </h3>
                <p className="text-[13px] text-[#6E6E73]">
                  {item.description}
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="ml-auto text-[#C7C7CC]"
              >
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-[#007AFF] to-[#5856D6] rounded-xl text-white">
          <h3 className="text-sm font-medium opacity-90">나의 기여도</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold">0</span>
            <span className="text-sm opacity-80">포인트</span>
          </div>
          <p className="text-xs opacity-70 mt-2">
            기여할수록 포인트가 쌓여요!
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Profile View
// ============================================

function ProfileView() {
  const menuItems = [
    { icon: '⚙️', label: '설정', href: '#' },
    { icon: '🔔', label: '알림', href: '#' },
    { icon: '📱', label: '앱 정보', href: '#' },
    { icon: '❓', label: '도움말', href: '#' },
  ]

  return (
    <div className="absolute inset-0 bg-[#F5F5F7] pt-[calc(env(safe-area-inset-top,47px)+12px)] pb-[83px]">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E5E5EA]">
          <h1 className="text-2xl font-bold text-[#1D1D1F]">프로필</h1>
        </div>

        {/* Profile Card */}
        <div className="m-4 p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FEE500] to-[#F5D800] flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1D1D1F]">
                게스트
              </h2>
              <p className="text-sm text-[#6E6E73]">
                로그인하고 더 많은 기능을 사용하세요
              </p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 bg-[#FEE500] rounded-xl text-[#1D1D1F] font-semibold text-[15px] active:opacity-90 transition-opacity">
            카카오로 로그인
          </button>
        </div>

        {/* Menu */}
        <div className="m-4 bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#F5F5F7] transition-colors border-b border-[#E5E5EA] last:border-b-0"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[15px] text-[#1D1D1F]">{item.label}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="ml-auto text-[#C7C7CC]"
              >
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Version */}
        <p className="text-center text-xs text-[#8E8E93] mt-6">
          QETTA Map v1.0.0
        </p>
      </div>
    </div>
  )
}

// ============================================
// Page Export
// ============================================

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[100dvh] bg-white flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FEE500] loading-dot" />
            <div className="w-2 h-2 rounded-full bg-[#FEE500] loading-dot" />
            <div className="w-2 h-2 rounded-full bg-[#FEE500] loading-dot" />
          </div>
        </div>
      }
    >
      <MapView />
    </Suspense>
  )
}
