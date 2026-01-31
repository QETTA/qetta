'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

// ============================================
// Types
// ============================================

export interface MapLocation {
  lat: number
  lng: number
}

export interface PlaceResult {
  id: string
  name: string
  category: string
  address: string
  roadAddress?: string
  phone?: string
  distance?: string
  position: MapLocation
  placeUrl?: string
  rating?: number
  reviewCount?: number
  imageUrl?: string
}

export interface RouteInfo {
  origin: MapLocation
  destination: MapLocation
  destinationName: string
  distance: number  // meters
  duration: number  // seconds
  polyline?: MapLocation[]
}

export type SheetState = 'hidden' | 'collapsed' | 'expanded'
export type Tab = 'explore' | 'saved' | 'contribute' | 'profile'

interface MapContextType {
  // Map state
  map: kakao.maps.Map | null
  setMap: (map: kakao.maps.Map | null) => void
  isMapLoaded: boolean
  setIsMapLoaded: (loaded: boolean) => void

  // Location
  currentLocation: MapLocation | null
  setCurrentLocation: (location: MapLocation | null) => void
  isTracking: boolean
  setIsTracking: (tracking: boolean) => void
  requestLocation: () => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: PlaceResult[]
  setSearchResults: (results: PlaceResult[]) => void
  isSearching: boolean
  setIsSearching: (searching: boolean) => void
  selectedPlace: PlaceResult | null
  setSelectedPlace: (place: PlaceResult | null) => void

  // Route
  activeRoute: RouteInfo | null
  setActiveRoute: (route: RouteInfo | null) => void
  isNavigating: boolean
  setIsNavigating: (navigating: boolean) => void

  // UI State
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  sheetState: SheetState
  setSheetState: (state: SheetState) => void
  isSplashVisible: boolean
  setIsSplashVisible: (visible: boolean) => void
}

// ============================================
// Context
// ============================================

const MapContext = createContext<MapContextType | null>(null)

export function useMapContext() {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider')
  }
  return context
}

// ============================================
// Provider
// ============================================

interface MapProviderProps {
  children: ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  // Map state
  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Location
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)

  // Route
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('explore')
  const [sheetState, setSheetState] = useState<SheetState>('collapsed')
  const [isSplashVisible, setIsSplashVisible] = useState(true)

  // Request user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(location)

        // Center map on current location
        if (map && window.kakao) {
          const moveLatLng = new window.kakao.maps.LatLng(location.lat, location.lng)
          map.setCenter(moveLatLng)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        // Default to Seoul City Hall if location fails
        setCurrentLocation({ lat: 37.5666805, lng: 126.9784147 })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [map])

  // Watch location when tracking
  useEffect(() => {
    if (!isTracking || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(location)

        // Keep map centered when tracking
        if (map && window.kakao) {
          const moveLatLng = new window.kakao.maps.LatLng(location.lat, location.lng)
          map.panTo(moveLatLng)
        }
      },
      (error) => {
        console.error('Location watch error:', error)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [isTracking, map])

  const value: MapContextType = {
    map,
    setMap,
    isMapLoaded,
    setIsMapLoaded,
    currentLocation,
    setCurrentLocation,
    isTracking,
    setIsTracking,
    requestLocation,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    selectedPlace,
    setSelectedPlace,
    activeRoute,
    setActiveRoute,
    isNavigating,
    setIsNavigating,
    activeTab,
    setActiveTab,
    sheetState,
    setSheetState,
    isSplashVisible,
    setIsSplashVisible,
  }

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  )
}
