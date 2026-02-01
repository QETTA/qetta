/**
 * KidsMap - Place State Store
 *
 * 장소 데이터 관리 (검색 결과, 선택된 장소, 즐겨찾기, 최근 방문)
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { NormalizedPlace } from '@/lib/skill-engine/data-sources/kidsmap/types'

// ============================================
// Types
// ============================================

export interface PlaceWithDistance extends NormalizedPlace {
  distance?: number // 사용자 위치로부터 거리 (m)
  isFavorite?: boolean
  visitCount?: number
  lastVisitedAt?: string
}

export interface SearchResult {
  places: PlaceWithDistance[]
  totalCount: number
  hasMore: boolean
  query?: string
  searchedAt: string
}

export interface PlaceState {
  // 검색 결과
  searchResult: SearchResult | null
  isSearching: boolean
  searchError: string | null

  // 선택된 장소 (바텀시트 표시)
  selectedPlace: PlaceWithDistance | null

  // 즐겨찾기
  favorites: string[] // Place IDs
  favoritePlaces: PlaceWithDistance[] // Cached place data

  // 최근 방문
  recentVisits: Array<{
    placeId: string
    placeName: string
    visitedAt: string
  }>

  // AI 추천
  recommendations: PlaceWithDistance[]
  isLoadingRecommendations: boolean

  // Actions - 검색
  setSearchResult: (result: SearchResult) => void
  clearSearchResult: () => void
  setSearching: (isSearching: boolean) => void
  setSearchError: (error: string | null) => void

  // Actions - 장소 선택
  selectPlace: (place: PlaceWithDistance | null) => void
  closeBottomSheet: () => void

  // Actions - 즐겨찾기
  toggleFavorite: (placeId: string, place?: PlaceWithDistance) => void
  addFavorite: (placeId: string, place: PlaceWithDistance) => void
  removeFavorite: (placeId: string) => void
  isFavorite: (placeId: string) => boolean

  // Actions - 최근 방문
  addRecentVisit: (placeId: string, placeName: string) => void
  clearRecentVisits: () => void

  // Actions - AI 추천
  setRecommendations: (places: PlaceWithDistance[]) => void
  setLoadingRecommendations: (isLoading: boolean) => void

  // Actions - 상태
  reset: () => void
}

// ============================================
// Default Values
// ============================================

const DEFAULT_STATE = {
  searchResult: null,
  isSearching: false,
  searchError: null,
  selectedPlace: null,
  favorites: [],
  favoritePlaces: [],
  recentVisits: [],
  recommendations: [],
  isLoadingRecommendations: false,
}

// ============================================
// Store
// ============================================

export const usePlaceStore = create<PlaceState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...DEFAULT_STATE,

        // 검색
        setSearchResult: (result) => set({ searchResult: result }),
        clearSearchResult: () => set({ searchResult: null }),
        setSearching: (isSearching) => set({ isSearching }),
        setSearchError: (error) => set({ searchError: error }),

        // 장소 선택
        selectPlace: (place) => {
          set({ selectedPlace: place })

          // 최근 방문 기록 추가
          if (place) {
            get().addRecentVisit(place.id, place.name)
          }
        },
        closeBottomSheet: () => set({ selectedPlace: null }),

        // 즐겨찾기
        toggleFavorite: (placeId, place) => {
          const state = get()
          const isFav = state.favorites.includes(placeId)

          if (isFav) {
            state.removeFavorite(placeId)
          } else if (place) {
            state.addFavorite(placeId, place)
          }
        },

        addFavorite: (placeId, place) =>
          set((state) => ({
            favorites: [...state.favorites, placeId],
            favoritePlaces: [...state.favoritePlaces, place],
          })),

        removeFavorite: (placeId) =>
          set((state) => ({
            favorites: state.favorites.filter((id) => id !== placeId),
            favoritePlaces: state.favoritePlaces.filter((p) => p.id !== placeId),
          })),

        isFavorite: (placeId) => get().favorites.includes(placeId),

        // 최근 방문
        addRecentVisit: (placeId, placeName) =>
          set((state) => {
            const newVisit = {
              placeId,
              placeName,
              visitedAt: new Date().toISOString(),
            }

            // 중복 제거 & 최신순 정렬
            const filtered = state.recentVisits.filter(
              (v) => v.placeId !== placeId,
            )
            const updated = [newVisit, ...filtered].slice(0, 20) // 최대 20개

            return { recentVisits: updated }
          }),

        clearRecentVisits: () => set({ recentVisits: [] }),

        // AI 추천
        setRecommendations: (places) => set({ recommendations: places }),
        setLoadingRecommendations: (isLoading) =>
          set({ isLoadingRecommendations: isLoading }),

        // Reset
        reset: () => set(DEFAULT_STATE),
      }),
      {
        name: 'kidsmap-place-storage',
        partialize: (state) => ({
          // Persist favorites and recent visits
          favorites: state.favorites,
          favoritePlaces: state.favoritePlaces,
          recentVisits: state.recentVisits,
        }),
      },
    ),
    { name: 'KidsMap-PlaceStore' },
  ),
)

// ============================================
// Selectors
// ============================================

export const selectSearchResult = (state: PlaceState) => state.searchResult
export const selectIsSearching = (state: PlaceState) => state.isSearching
export const selectSearchError = (state: PlaceState) => state.searchError
export const selectSelectedPlace = (state: PlaceState) => state.selectedPlace
export const selectFavorites = (state: PlaceState) => state.favorites
export const selectFavoritePlaces = (state: PlaceState) => state.favoritePlaces
export const selectRecentVisits = (state: PlaceState) => state.recentVisits
export const selectRecommendations = (state: PlaceState) => state.recommendations
export const selectIsLoadingRecommendations = (state: PlaceState) =>
  state.isLoadingRecommendations
export const selectIsFavorite = (placeId: string) => (state: PlaceState) =>
  state.isFavorite(placeId)
