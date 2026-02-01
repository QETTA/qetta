/**
 * KidsMap - Filter State Store
 *
 * 필터 상태 관리 (카테고리, 연령, 거리, 가격, 편의시설)
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { FilterCategory, AgeGroup, PlaceCategory } from '@/lib/skill-engine/data-sources/kidsmap/types'

// ============================================
// Types
// ============================================

export interface FilterOptions {
  // Quick Filter (야외/실내/공공/식당)
  filterCategory: FilterCategory | null

  // Place Categories (구체적 카테고리)
  placeCategories: PlaceCategory[]

  // 연령대
  ageGroups: AgeGroup[]

  // 거리 (미터)
  maxDistance: number | null

  // 가격
  priceRange: {
    min: number | null
    max: number | null
  }

  // 편의시설
  amenities: {
    parking?: boolean
    nursingRoom?: boolean
    diaperChangingStation?: boolean
    strollerAccess?: boolean
    restaurant?: boolean
  }

  // 놀이방 있는 식당 전용 필터
  restaurant: {
    hasPlayroom?: boolean
    kidsMenuAvailable?: boolean
    reservationAvailable?: boolean
  }

  // 정렬
  sortBy: 'distance' | 'rating' | 'recent' | 'popular'

  // 영업 중만 보기
  openNow: boolean
}

export interface FilterState extends FilterOptions {
  // Actions
  setFilterCategory: (category: FilterCategory | null) => void
  setPlaceCategories: (categories: PlaceCategory[]) => void
  togglePlaceCategory: (category: PlaceCategory) => void
  setAgeGroups: (ages: AgeGroup[]) => void
  toggleAgeGroup: (age: AgeGroup) => void
  setMaxDistance: (distance: number | null) => void
  setPriceRange: (min: number | null, max: number | null) => void
  setAmenity: (key: keyof FilterOptions['amenities'], value: boolean) => void
  setRestaurantFilter: (key: keyof FilterOptions['restaurant'], value: boolean) => void
  setSortBy: (sortBy: FilterOptions['sortBy']) => void
  setOpenNow: (openNow: boolean) => void
  reset: () => void
  resetToQuickFilter: (category: FilterCategory) => void

  // Derived state
  isFiltered: () => boolean
  getActiveFilterCount: () => number
}

// ============================================
// Default Values
// ============================================

const DEFAULT_FILTERS: FilterOptions = {
  filterCategory: null,
  placeCategories: [],
  ageGroups: [],
  maxDistance: null,
  priceRange: { min: null, max: null },
  amenities: {},
  restaurant: {},
  sortBy: 'distance',
  openNow: false,
}

// ============================================
// Store
// ============================================

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...DEFAULT_FILTERS,

        // Quick Filter
        setFilterCategory: (category) => {
          const state = get()
          if (category === null) {
            set({ filterCategory: null })
          } else {
            state.resetToQuickFilter(category)
          }
        },

        // Place Categories
        setPlaceCategories: (categories) => set({ placeCategories: categories }),
        togglePlaceCategory: (category) =>
          set((state) => {
            const isSelected = state.placeCategories.includes(category)
            return {
              placeCategories: isSelected
                ? state.placeCategories.filter((c) => c !== category)
                : [...state.placeCategories, category],
            }
          }),

        // Age Groups
        setAgeGroups: (ages) => set({ ageGroups: ages }),
        toggleAgeGroup: (age) =>
          set((state) => {
            const isSelected = state.ageGroups.includes(age)
            return {
              ageGroups: isSelected
                ? state.ageGroups.filter((a) => a !== age)
                : [...state.ageGroups, age],
            }
          }),

        // Distance
        setMaxDistance: (distance) => set({ maxDistance: distance }),

        // Price
        setPriceRange: (min, max) => set({ priceRange: { min, max } }),

        // Amenities
        setAmenity: (key, value) =>
          set((state) => ({
            amenities: { ...state.amenities, [key]: value },
          })),

        // Restaurant filters
        setRestaurantFilter: (key, value) =>
          set((state) => ({
            restaurant: { ...state.restaurant, [key]: value },
          })),

        // Sort
        setSortBy: (sortBy) => set({ sortBy }),

        // Open now
        setOpenNow: (openNow) => set({ openNow }),

        // Reset
        reset: () => set(DEFAULT_FILTERS),

        // Reset to quick filter
        resetToQuickFilter: (category) => {
          const categoryMap: Record<FilterCategory, PlaceCategory[]> = {
            outdoor: ['amusement_park', 'zoo_aquarium', 'nature_park'],
            indoor: ['kids_cafe', 'museum'],
            public: ['public_facility'],
            restaurant: ['restaurant'],
          }

          set({
            ...DEFAULT_FILTERS,
            filterCategory: category,
            placeCategories: categoryMap[category] || [],
          })
        },

        // Derived state
        isFiltered: () => {
          const state = get()
          return (
            state.filterCategory !== null ||
            state.placeCategories.length > 0 ||
            state.ageGroups.length > 0 ||
            state.maxDistance !== null ||
            state.priceRange.min !== null ||
            state.priceRange.max !== null ||
            Object.keys(state.amenities).length > 0 ||
            Object.keys(state.restaurant).length > 0 ||
            state.openNow
          )
        },

        getActiveFilterCount: () => {
          const state = get()
          let count = 0

          if (state.filterCategory) count++
          if (state.placeCategories.length > 0) count++
          if (state.ageGroups.length > 0) count++
          if (state.maxDistance !== null) count++
          if (state.priceRange.min !== null || state.priceRange.max !== null)
            count++
          if (Object.values(state.amenities).some((v) => v)) count++
          if (Object.values(state.restaurant).some((v) => v)) count++
          if (state.openNow) count++

          return count
        },
      }),
      {
        name: 'kidsmap-filter-storage', // LocalStorage key
        partialize: (state) => ({
          // Persist all user filter preferences
          filterCategory: state.filterCategory,
          placeCategories: state.placeCategories,
          ageGroups: state.ageGroups,
          maxDistance: state.maxDistance,
          amenities: state.amenities,
          restaurant: state.restaurant,
          sortBy: state.sortBy,
          openNow: state.openNow,
        }),
      },
    ),
    { name: 'KidsMap-FilterStore' },
  ),
)

// ============================================
// Selectors
// ============================================

export const selectFilterCategory = (state: FilterState) => state.filterCategory
export const selectPlaceCategories = (state: FilterState) => state.placeCategories
export const selectAgeGroups = (state: FilterState) => state.ageGroups
export const selectMaxDistance = (state: FilterState) => state.maxDistance
export const selectPriceRange = (state: FilterState) => state.priceRange
export const selectAmenities = (state: FilterState) => state.amenities
export const selectRestaurantFilters = (state: FilterState) => state.restaurant
export const selectSortBy = (state: FilterState) => state.sortBy
export const selectOpenNow = (state: FilterState) => state.openNow
export const selectIsFiltered = (state: FilterState) => state.isFiltered()
export const selectActiveFilterCount = (state: FilterState) =>
  state.getActiveFilterCount()
