'use client'

/**
 * PlaceDetailSheet - Bottom Sheet for Place Details
 *
 * Google Maps-style bottom sheet that slides up when a place marker is clicked
 * Features:
 * - Drag-to-close gesture
 * - Kids-specific amenities display
 * - Restaurant metadata (if applicable)
 * - Action buttons (favorite, directions, share)
 * - Responsive height with snap points
 *
 * @module kidsmap/place-detail-sheet
 */

import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { usePlaceStore } from '@/stores/kidsmap/place-store'
import { shareContent, getPlaceShareUrl } from '@/lib/kidsmap/share-utils'
import { cn } from '@/lib/utils'
import { PlaceContentsTab } from './place-contents-tab'
import type { PlaceWithDistance } from '@/stores/kidsmap/place-store'

// ============================================
// Main Component
// ============================================

export function PlaceDetailSheet() {
  const { selectedPlace, selectPlace, toggleFavorite, isFavorite } = usePlaceStore()
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const isOpen = !!selectedPlace
  const isFav = selectedPlace ? isFavorite(selectedPlace.id) : false

  // Reset drag state when opening
  useEffect(() => {
    if (isOpen) {
      setDragY(0)
    }
  }, [isOpen])

  // Touch handlers for drag gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return
      const currentY = e.touches[0].clientY
      const deltaY = currentY - dragStartY.current
      if (deltaY > 0) {
        setDragY(deltaY)
      }
    },
    [isDragging],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    if (dragY > 100) {
      selectPlace(null)
    }
    setDragY(0)
  }, [dragY, selectPlace])

  const handleClose = useCallback(() => {
    selectPlace(null)
  }, [selectPlace])

  const handleToggleFavorite = useCallback(() => {
    if (selectedPlace) {
      toggleFavorite(selectedPlace.id, selectedPlace)
    }
  }, [selectedPlace, toggleFavorite])

  const handleDirections = useCallback(() => {
    if (!selectedPlace?.latitude || !selectedPlace?.longitude) return
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(selectedPlace.name)},${selectedPlace.latitude},${selectedPlace.longitude}`
    window.open(url, '_blank')
  }, [selectedPlace])

  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const handleShare = useCallback(async () => {
    if (!selectedPlace) return

    const result = await shareContent({
      title: selectedPlace.name,
      text: `${selectedPlace.name} - ${selectedPlace.address || 'KidsMap'}`,
      url: getPlaceShareUrl(selectedPlace.id),
    })

    if (result === 'copied') {
      setShareStatus('링크 복사됨!')
      setTimeout(() => setShareStatus(null), 2000)
    }
  }, [selectedPlace])

  if (!selectedPlace) return null

  const opacity = Math.max(0.3, 1 - dragY / 300)
  const scale = Math.max(0.98, 1 - dragY / 2000)

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Bottom Sheet Container */}
        <div className="fixed inset-0 flex items-end justify-center pointer-events-none">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <Dialog.Panel
              ref={panelRef}
              className={cn(
                'w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl',
                'flex flex-col max-h-[85vh] pointer-events-auto',
                isDragging ? 'duration-0' : 'duration-300',
              )}
              style={{
                transform: `translateY(${dragY}px) scale(${scale})`,
                opacity,
              }}
            >
              {/* Drag Handle */}
              <div
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                      {selectedPlace.name}
                    </Dialog.Title>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {getCategoryLabel(selectedPlace.category)}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="닫기"
                  >
                    <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {/* Distance & Address */}
                <div className="mb-4">
                  {selectedPlace.distance && (
                    <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{(selectedPlace.distance / 1000).toFixed(1)}km 거리</span>
                    </div>
                  )}
                  {selectedPlace.address && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedPlace.address}</p>
                  )}
                </div>

                {/* Description */}
                {selectedPlace.description && (
                  <div className="mb-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedPlace.description}</p>
                  </div>
                )}

                {/* Recommended Ages */}
                {selectedPlace.recommendedAges && selectedPlace.recommendedAges.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                      추천 연령
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlace.recommendedAges.map((age) => (
                        <span
                          key={age}
                          className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded"
                        >
                          {getAgeLabel(age)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {selectedPlace.amenities && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                      편의시설
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPlace.amenities.parking && (
                        <AmenityBadge icon="🅿️" label="주차장" />
                      )}
                      {selectedPlace.amenities.nursingRoom && (
                        <AmenityBadge icon="🍼" label="수유실" />
                      )}
                      {selectedPlace.amenities.diaperChangingStation && (
                        <AmenityBadge icon="👶" label="기저귀 교환대" />
                      )}
                      {selectedPlace.amenities.strollerAccess && (
                        <AmenityBadge icon="🚼" label="유모차 접근 가능" />
                      )}
                      {selectedPlace.amenities.indoor && <AmenityBadge icon="🏠" label="실내" />}
                      {selectedPlace.amenities.outdoor && <AmenityBadge icon="🌳" label="야외" />}
                    </div>
                  </div>
                )}

                {/* Restaurant Metadata (if applicable) */}
                {selectedPlace.restaurantMetadata?.hasPlayroom && (
                  <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                      🎮 놀이방 있는 식당
                    </h3>
                    <div className="space-y-1 text-sm">
                      {selectedPlace.restaurantMetadata.playroomSize && (
                        <p className="text-zinc-700 dark:text-zinc-300">
                          놀이방 크기: {selectedPlace.restaurantMetadata.playroomSize}평
                        </p>
                      )}
                      {selectedPlace.restaurantMetadata.kidsMenuAvailable && (
                        <p className="text-zinc-700 dark:text-zinc-300">✓ 키즈 메뉴 제공</p>
                      )}
                      {selectedPlace.restaurantMetadata.babyChairCount && (
                        <p className="text-zinc-700 dark:text-zinc-300">
                          유아용 의자: {selectedPlace.restaurantMetadata.babyChairCount}개
                        </p>
                      )}
                      {selectedPlace.restaurantMetadata.reservation?.available && (
                        <p className="text-zinc-700 dark:text-zinc-300">✓ 예약 가능</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Related Contents */}
                <div className="mb-4">
                  <PlaceContentsTab
                    placeId={selectedPlace.id}
                    placeName={selectedPlace.name}
                  />
                </div>

                {/* Contact Info */}
                {selectedPlace.tel && (
                  <div className="mb-4">
                    <a
                      href={`tel:${selectedPlace.tel}`}
                      className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {selectedPlace.tel}
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleToggleFavorite}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-colors',
                      isFav
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                    )}
                  >
                    <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-xs font-medium">{isFav ? '저장됨' : '저장'}</span>
                  </button>

                  <button
                    onClick={handleDirections}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-zinc-600 hover:bg-zinc-700 text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-xs font-medium">길찾기</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors relative"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-xs font-medium">{shareStatus || '공유'}</span>
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

// ============================================
// Helper Components
// ============================================

function AmenityBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

// ============================================
// Helper Functions
// ============================================

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    kids_cafe: '키즈카페',
    amusement_park: '놀이공원',
    zoo_aquarium: '동물원·수족관',
    museum: '박물관',
    nature_park: '자연공원',
    playground: '놀이터',
    water_park: '워터파크',
    farm_experience: '농장체험',
    indoor_playground: '실내놀이터',
    library: '도서관',
    culture_center: '문화센터',
    childcare_center: '어린이집',
    toy_library: '장난감 도서관',
    public_pool: '공공수영장',
    gym: '체육관',
    restaurant: '식당',
    public_facility: '공공시설',
    other: '기타',
  }
  return labels[category] || category
}

function getAgeLabel(age: string): string {
  const labels: Record<string, string> = {
    infant: '영아 (0~2세)',
    toddler: '유아 (3~5세)',
    child: '아동 (6~9세)',
    elementary: '초등 (10~12세)',
  }
  return labels[age] || age
}
