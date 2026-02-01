'use client'

/**
 * KidsMap - MAP-FIRST Page
 *
 * Main map interface for finding kids play places
 * Features:
 * - Full screen Kakao Map
 * - Quick filters (야외/실내/공공/식당)
 * - Place markers with clustering
 * - Bottom sheet for place details
 * - AI recommendations
 * - User location tracking
 *
 * Architecture:
 * - Zustand stores for state (mapStore, filterStore, placeStore)
 * - Kakao Map SDK via useKakaoMap hook
 * - Server API routes for data
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useKakaoMap } from '@/hooks/use-kakao-map'
import { useMapStore } from '@/stores/kidsmap/map-store'
import { useFilterStore } from '@/stores/kidsmap/filter-store'
import { usePlaceStore } from '@/stores/kidsmap/place-store'
import { useKakaoMapContext } from '@/contexts/kakao-map-context'
import { PlaceDetailSheet, QuickFilter } from '@/components/kidsmap'
import type { PlaceWithDistance } from '@/stores/kidsmap/place-store'

// ============================================
// Main Component
// ============================================

export default function KidsMapPage() {
  const { isLoaded, isLoading, error: sdkError } = useKakaoMapContext()
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  // Stores
  const { center, zoom, userLocation, requestUserLocation } = useMapStore()
  const { filterCategory, ageGroups, maxDistance, openNow } = useFilterStore()
  const { searchResult, selectedPlace, selectPlace } = usePlaceStore()

  // Map hook
  const { mapRef, map, isReady, addMarker, clearMarkers, panTo } = useKakaoMap({
    center,
    level: zoom,
  })

  // ============================================
  // Search Places
  // ============================================

  const searchPlaces = useCallback(async () => {
    if (!center) return

    setIsSearching(true)
    setSearchError(null)

    try {
      const params = new URLSearchParams({
        lat: String(center.lat),
        lng: String(center.lng),
        radius: String(maxDistance || 5000),
        page: '1',
        pageSize: '50',
      })

      if (filterCategory) {
        params.set('category', filterCategory)
      }

      if (ageGroups.length > 0) {
        params.set('ageGroups', ageGroups.join(','))
      }

      if (openNow) {
        params.set('openNow', 'true')
      }

      const response = await fetch(`/api/kidsmap/places?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        usePlaceStore.setState({
          searchResult: {
            places: data.data.places,
            totalCount: data.data.total,
            hasMore: data.data.hasMore,
            searchedAt: new Date().toISOString(),
          },
        })
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }, [center, filterCategory, ageGroups, maxDistance, openNow])

  // ============================================
  // Toast Helper
  // ============================================

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  // ============================================
  // Effects - Initial Load
  // ============================================

  useEffect(() => {
    // Request user location on mount
    if (!userLocation) {
      requestUserLocation()
    }
  }, [userLocation, requestUserLocation])

  useEffect(() => {
    // Search when map is ready and center is set
    if (isReady && center) {
      searchPlaces()
    }
  }, [isReady, center, filterCategory, ageGroups, maxDistance, openNow])

  // ============================================
  // Effects - Render Markers
  // ============================================

  useEffect(() => {
    if (!isReady || !searchResult) return

    // Clear existing markers
    clearMarkers()

    // Add new markers
    searchResult.places.forEach((place: PlaceWithDistance) => {
      if (place.latitude && place.longitude) {
        addMarker({
          id: place.id,
          position: { lat: place.latitude, lng: place.longitude },
          placeId: place.id,
          placeName: place.name,
          category: place.category || '',
          isSelected: false,
          lat: place.latitude,
          lng: place.longitude,
          title: place.name,
          onClick: (placeId: string) => {
            const selectedPlace = searchResult.places.find((p: PlaceWithDistance) => p.id === placeId)
            if (selectedPlace) {
              selectPlace(selectedPlace)
            }
          },
        })
      }
    })
  }, [isReady, searchResult, addMarker, clearMarkers, selectPlace])

  // ============================================
  // Effects - Pan to Selected Place
  // ============================================

  useEffect(() => {
    if (selectedPlace && selectedPlace.latitude && selectedPlace.longitude) {
      panTo(
        {
          lat: selectedPlace.latitude,
          lng: selectedPlace.longitude,
        },
        3, // Zoom in when selecting
      )
    }
  }, [selectedPlace, panTo])

  // ============================================
  // Render - Loading States
  // ============================================

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-white mx-auto" />
          <p className="text-zinc-400">Loading Kakao Maps SDK...</p>
        </div>
      </div>
    )
  }

  if (sdkError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="max-w-md text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h1 className="mb-2 text-xl font-semibold text-white">Map Loading Failed</h1>
          <p className="text-zinc-400">{sdkError.message}</p>
          <p className="mt-4 text-sm text-zinc-500">
            Check NEXT_PUBLIC_KAKAO_MAP_KEY environment variable
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Initializing map...</p>
      </div>
    )
  }

  // ============================================
  // Render - Main UI
  // ============================================

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Kakao Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Back Navigation */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 bg-white dark:bg-zinc-900 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Go back to home"
      >
        <svg className="h-5 w-5 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Live Status Region */}
      <div aria-live="polite" className="sr-only">
        {isSearching && 'Searching places...'}
        {searchResult && !isSearching && `${searchResult.totalCount} places found`}
        {searchError && `Error: ${searchError}`}
      </div>

      {/* Search Status Overlay */}
      {isSearching && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-800 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
            <span className="text-sm text-zinc-300">Searching places...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {searchError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-800 shadow-lg">
          <p className="text-sm text-white">{searchError}</p>
        </div>
      )}

      {/* Results Count */}
      {searchResult && !isSearching && (
        <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-zinc-800 shadow-lg">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-white">{searchResult.totalCount}</span> places
            found
          </p>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-zinc-700 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-white whitespace-nowrap">{toast}</p>
        </div>
      )}

      {/* User Location Button */}
      <button
        onClick={requestUserLocation}
        className="absolute bottom-24 right-4 bg-white hover:bg-zinc-100 p-3 rounded-full shadow-lg border border-zinc-200 transition-colors"
        aria-label="Show my location"
      >
        <svg
          className="h-6 w-6 text-zinc-900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Quick Filters */}
      <div className="absolute top-16 left-4 right-4 max-w-2xl">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <QuickFilter />
        </div>
      </div>

      {/* Bottom Sheet for Place Details */}
      <PlaceDetailSheet />
    </div>
  )
}
