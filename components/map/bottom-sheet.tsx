'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useMapContext, PlaceResult, SheetState } from './map-provider'

// ============================================
// Category Pills
// ============================================

const categories = [
  { id: 'restaurant', label: '맛집', icon: '🍽️' },
  { id: 'cafe', label: '카페', icon: '☕' },
  { id: 'convenience', label: '편의점', icon: '🏪' },
  { id: 'parking', label: '주차장', icon: '🅿️' },
  { id: 'gas', label: '주유소', icon: '⛽' },
  { id: 'pharmacy', label: '약국', icon: '💊' },
  { id: 'hospital', label: '병원', icon: '🏥' },
  { id: 'bank', label: '은행', icon: '🏦' },
]

function CategoryPills() {
  const { map, setSearchQuery, setSearchResults, setIsSearching, currentLocation } = useMapContext()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const handleCategoryClick = useCallback((categoryId: string, label: string) => {
    if (!map || !window.kakao) return

    setActiveCategory(categoryId)
    setSearchQuery(label)
    setIsSearching(true)

    const places = new window.kakao.maps.services.Places(map)

    const searchOptions: Record<string, unknown> = {
      size: 15,
    }

    if (currentLocation) {
      searchOptions.location = new window.kakao.maps.LatLng(
        currentLocation.lat,
        currentLocation.lng
      )
      searchOptions.radius = 5000
    }

    places.keywordSearch(label, (results, status) => {
      if (status === 'OK') {
        const mappedResults: PlaceResult[] = results.map((place) => ({
          id: place.id,
          name: place.place_name,
          category: place.category_name.split('>').pop()?.trim() || place.category_group_name,
          address: place.address_name,
          roadAddress: place.road_address_name || undefined,
          phone: place.phone || undefined,
          distance: place.distance ? `${Math.round(parseFloat(place.distance))}m` : undefined,
          position: {
            lat: parseFloat(place.y),
            lng: parseFloat(place.x),
          },
          placeUrl: place.place_url || undefined,
        }))
        setSearchResults(mappedResults)
      }
      setIsSearching(false)
    }, searchOptions)
  }, [map, currentLocation, setSearchQuery, setSearchResults, setIsSearching])

  return (
    <div className="map-category-pills">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`map-category-pill ${activeCategory === category.id ? 'active' : ''}`}
          onClick={() => handleCategoryClick(category.id, category.label)}
        >
          <span className="mr-1">{category.icon}</span>
          {category.label}
        </button>
      ))}
    </div>
  )
}

// ============================================
// Place Card
// ============================================

interface PlaceCardProps {
  place: PlaceResult
  onClick: () => void
}

function PlaceCard({ place, onClick }: PlaceCardProps) {
  return (
    <button className="map-place-card w-full text-left" onClick={onClick}>
      <div className="map-place-image flex items-center justify-center text-2xl">
        📍
      </div>
      <div className="map-place-info">
        <h3 className="map-place-name">{place.name}</h3>
        <p className="map-place-category">{place.category}</p>
        <div className="map-place-meta">
          {place.distance && <span>{place.distance}</span>}
          {place.distance && place.address && <span>·</span>}
          <span className="truncate">{place.roadAddress || place.address}</span>
        </div>
      </div>
    </button>
  )
}

// ============================================
// Place Detail
// ============================================

interface PlaceDetailProps {
  place: PlaceResult
  onClose: () => void
  onNavigate: () => void
}

function PlaceDetail({ place, onClose, onNavigate }: PlaceDetailProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1D1D1F]">{place.name}</h2>
          <p className="text-sm text-[#6E6E73] mt-1">{place.category}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-[#8E8E93]"
          aria-label="닫기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="space-y-3">
        {/* Address */}
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#8E8E93] flex-shrink-0 mt-0.5">
            <path
              d="M10 2.5C6.55 2.5 3.75 5.3 3.75 8.75C3.75 13.125 10 17.5 10 17.5C10 17.5 16.25 13.125 16.25 8.75C16.25 5.3 13.45 2.5 10 2.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="10" cy="8.75" r="2.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div>
            <p className="text-[15px] text-[#1D1D1F]">{place.roadAddress || place.address}</p>
            {place.roadAddress && (
              <p className="text-[13px] text-[#8E8E93] mt-0.5">(지번) {place.address}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        {place.phone && (
          <a href={`tel:${place.phone}`} className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#8E8E93]">
              <path
                d="M18.308 14.925v2.334a1.556 1.556 0 0 1-1.696 1.556 15.393 15.393 0 0 1-6.714-2.389 15.17 15.17 0 0 1-4.667-4.667 15.393 15.393 0 0 1-2.388-6.746 1.556 1.556 0 0 1 1.547-1.697h2.333a1.556 1.556 0 0 1 1.556 1.337c.098.747.28 1.48.544 2.185a1.556 1.556 0 0 1-.35 1.642l-.987.988a12.443 12.443 0 0 0 4.666 4.667l.988-.988a1.556 1.556 0 0 1 1.642-.35c.704.264 1.438.446 2.185.544a1.556 1.556 0 0 1 1.341 1.584Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="text-[15px] text-[#007AFF]">{place.phone}</span>
          </a>
        )}

        {/* Distance */}
        {place.distance && (
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#8E8E93]">
              <path
                d="M10 3.333v13.334M3.333 10h13.334"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[15px] text-[#6E6E73]">현재 위치에서 {place.distance}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="map-route-actions pt-2">
        <button
          onClick={() => {
            if (place.placeUrl) {
              window.open(place.placeUrl, '_blank')
            }
          }}
          className="map-route-btn map-route-btn-secondary"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 17.5c4.142 0 7.5-3.358 7.5-7.5S14.142 2.5 10 2.5 2.5 5.858 2.5 10s3.358 7.5 7.5 7.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 6.667v6.666M6.667 10h6.666"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          상세정보
        </button>
        <button onClick={onNavigate} className="map-route-btn map-route-btn-primary">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="m17.5 2.5-7.083 15-2.917-5.833L1.667 8.75l15.833-6.25Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          길찾기
        </button>
      </div>
    </div>
  )
}

// ============================================
// Bottom Sheet
// ============================================

export function BottomSheet() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

  const {
    sheetState,
    setSheetState,
    searchResults,
    isSearching,
    selectedPlace,
    setSelectedPlace,
    map,
    currentLocation,
    setActiveRoute,
  } = useMapContext()

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    currentYRef.current = e.touches[0].clientY
  }, [])

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY
  }, [])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    const diff = currentYRef.current - startYRef.current
    const threshold = 50

    if (diff > threshold) {
      // Swiped down
      if (sheetState === 'expanded') {
        setSheetState('collapsed')
      } else if (sheetState === 'collapsed') {
        setSheetState('hidden')
      }
    } else if (diff < -threshold) {
      // Swiped up
      if (sheetState === 'hidden') {
        setSheetState('collapsed')
      } else if (sheetState === 'collapsed') {
        setSheetState('expanded')
      }
    }
  }, [sheetState, setSheetState])

  // Handle place click
  const handlePlaceClick = useCallback((place: PlaceResult) => {
    setSelectedPlace(place)
    setSheetState('expanded')

    // Center map on place
    if (map && window.kakao) {
      const position = new window.kakao.maps.LatLng(place.position.lat, place.position.lng)
      map.panTo(position)
    }
  }, [map, setSelectedPlace, setSheetState])

  // Handle navigate
  const handleNavigate = useCallback(() => {
    if (!selectedPlace || !currentLocation) return

    setActiveRoute({
      origin: currentLocation,
      destination: selectedPlace.position,
      destinationName: selectedPlace.name,
      distance: 0,
      duration: 0,
    })

    // Open Kakao Map navigation in new tab
    const kakaoNavUrl = `https://map.kakao.com/link/to/${encodeURIComponent(selectedPlace.name)},${selectedPlace.position.lat},${selectedPlace.position.lng}`
    window.open(kakaoNavUrl, '_blank')
  }, [selectedPlace, currentLocation, setActiveRoute])

  // Close place detail
  const handleClosePlaceDetail = useCallback(() => {
    setSelectedPlace(null)
    setSheetState('collapsed')
  }, [setSelectedPlace, setSheetState])

  // Reset sheet when search results change
  useEffect(() => {
    if (searchResults.length > 0) {
      setSheetState('collapsed')
      setSelectedPlace(null)
    }
  }, [searchResults, setSheetState, setSelectedPlace])

  return (
    <div
      ref={sheetRef}
      className={`map-bottom-sheet ${sheetState}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Handle */}
      <div className="map-sheet-handle" />

      {/* Content */}
      <div className="map-sheet-content">
        {selectedPlace ? (
          <PlaceDetail
            place={selectedPlace}
            onClose={handleClosePlaceDetail}
            onNavigate={handleNavigate}
          />
        ) : (
          <>
            {/* Category Pills */}
            {searchResults.length === 0 && !isSearching && (
              <CategoryPills />
            )}

            {/* Loading */}
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#007AFF] loading-dot" />
                  <div className="w-2 h-2 rounded-full bg-[#007AFF] loading-dot" />
                  <div className="w-2 h-2 rounded-full bg-[#007AFF] loading-dot" />
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && !isSearching && (
              <div className="space-y-2">
                <p className="text-sm text-[#6E6E73] px-4 py-2">
                  검색결과 {searchResults.length}개
                </p>
                <div className="space-y-1">
                  {searchResults.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onClick={() => handlePlaceClick(place)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 px-4">
                <p className="text-[#6E6E73] text-sm">
                  주변 장소를 검색하거나<br />
                  카테고리를 선택해주세요
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
