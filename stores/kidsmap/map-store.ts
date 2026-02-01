/**
 * KidsMap - Map State Store
 *
 * 지도 상태 관리 (중심 좌표, 줌 레벨, 마커, 바운더리)
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================
// Types
// ============================================

export interface MapCenter {
  lat: number
  lng: number
}

export interface MapBounds {
  sw: MapCenter // South-West corner
  ne: MapCenter // North-East corner
}

export interface PlaceMarker {
  id: string
  position: MapCenter
  placeId: string
  placeName: string
  category: string
  isSelected: boolean
  // Convenience accessors (used by useKakaoMap and map page)
  lat: number
  lng: number
  title: string
  onClick?: (id: string) => void
}

export interface MapState {
  // 지도 상태
  center: MapCenter
  zoom: number
  bounds: MapBounds | null
  isLoading: boolean

  // 마커
  markers: PlaceMarker[]
  selectedMarkerId: string | null

  // 사용자 위치
  userLocation: MapCenter | null
  isLocating: boolean

  // Actions - 지도 이동
  setCenter: (center: MapCenter) => void
  setZoom: (zoom: number) => void
  setBounds: (bounds: MapBounds) => void
  panTo: (center: MapCenter, zoom?: number) => void

  // Actions - 마커
  setMarkers: (markers: PlaceMarker[]) => void
  addMarker: (marker: PlaceMarker) => void
  removeMarker: (markerId: string) => void
  selectMarker: (markerId: string | null) => void

  // Actions - 사용자 위치
  setUserLocation: (location: MapCenter) => void
  requestUserLocation: () => Promise<void>

  // Actions - 상태
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

// ============================================
// Default Values
// ============================================

// 서울 강남역 중심 (기본값)
const DEFAULT_CENTER: MapCenter = {
  lat: 37.497942,
  lng: 127.027621,
}

const DEFAULT_ZOOM = 14

// ============================================
// Store
// ============================================

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      // Initial state
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      bounds: null,
      isLoading: false,
      markers: [],
      selectedMarkerId: null,
      userLocation: null,
      isLocating: false,

      // 지도 이동
      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      setBounds: (bounds) => set({ bounds }),
      panTo: (center, zoom) =>
        set({
          center,
          zoom: zoom !== undefined ? zoom : get().zoom,
        }),

      // 마커 관리
      setMarkers: (markers) => set({ markers }),
      addMarker: (marker) =>
        set((state) => ({
          markers: [...state.markers, marker],
        })),
      removeMarker: (markerId) =>
        set((state) => ({
          markers: state.markers.filter((m) => m.id !== markerId),
        })),
      selectMarker: (markerId) =>
        set((state) => ({
          selectedMarkerId: markerId,
          markers: state.markers.map((marker) => ({
            ...marker,
            isSelected: marker.id === markerId,
          })),
        })),

      // 사용자 위치
      setUserLocation: (location) => set({ userLocation: location }),
      requestUserLocation: async () => {
        set({ isLocating: true })

        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'))
                return
              }
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              })
            },
          )

          const userLocation: MapCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          set({
            userLocation,
            center: userLocation,
            zoom: 15,
            isLocating: false,
          })
        } catch (error) {
          console.error('Failed to get user location:', error)
          set({ isLocating: false })
        }
      },

      // 상태 관리
      setLoading: (isLoading) => set({ isLoading }),
      reset: () =>
        set({
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          bounds: null,
          isLoading: false,
          markers: [],
          selectedMarkerId: null,
          userLocation: null,
          isLocating: false,
        }),
    }),
    { name: 'KidsMap-MapStore' },
  ),
)

// ============================================
// Selectors
// ============================================

export const selectMapCenter = (state: MapState) => state.center
export const selectMapZoom = (state: MapState) => state.zoom
export const selectMapBounds = (state: MapState) => state.bounds
export const selectMarkers = (state: MapState) => state.markers
export const selectSelectedMarker = (state: MapState) =>
  state.markers.find((m) => m.id === state.selectedMarkerId)
export const selectUserLocation = (state: MapState) => state.userLocation
export const selectIsMapLoading = (state: MapState) => state.isLoading
