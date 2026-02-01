'use server'

/**
 * Server Action: KidsMap Places
 *
 * 장소 검색 및 관리 Server Actions
 * Replaces: GET /api/kidsmap/places
 *
 * Features:
 * - 장소 검색 (위치 기반)
 * - 거리 필터링
 * - 연령대 필터링
 * - 카테고리 필터링
 *
 * @module lib/actions/kidsmap/places
 */

import { getPlaceBlockRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
import type {
  PlaceCategory,
  FilterCategory,
  AgeGroup,
  NormalizedPlace,
} from '@/lib/skill-engine/data-sources/kidsmap/types'

// ============================================
// Types
// ============================================

export interface PlaceWithDistance extends NormalizedPlace {
  distance?: number
  blockId?: string
  qualityGrade?: string
  completeness?: number
}

export interface SearchPlacesParams {
  query?: string
  lat?: number
  lng?: number
  radius?: number
  category?: FilterCategory
  placeCategories?: PlaceCategory[]
  ageGroups?: AgeGroup[]
  page?: number
  pageSize?: number
  openNow?: boolean
}

export interface SearchPlacesResult {
  success: boolean
  data?: {
    places: PlaceWithDistance[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }
  error?: string
}

// ============================================
// Server Action: Search Places
// ============================================

export async function searchPlaces(params: SearchPlacesParams): Promise<SearchPlacesResult> {
  try {
    const {
      query = '',
      lat,
      lng,
      radius = 5000,
      placeCategories = [],
      ageGroups = [],
      page = 1,
      pageSize = 20,
    } = params

    // Build filter
    const filter: Record<string, unknown> = {
      status: 'active' as const,
    }

    if (placeCategories.length > 0) {
      filter.categories = placeCategories
    }

    if (query) {
      filter.searchKeyword = query
    }

    // Get repository
    const repo = getPlaceBlockRepository()

    // Fetch with larger page size if we need client-side filtering
    const needsClientFilter = (lat !== undefined && lng !== undefined) || ageGroups.length > 0
    filter.page = needsClientFilter ? 1 : page
    filter.pageSize = needsClientFilter ? 500 : pageSize

    const result = await repo.search(filter)

    // Calculate distance if location provided
    let places: PlaceWithDistance[] = result.data.map((block) => ({
      ...block.data,
      blockId: block.id,
      qualityGrade: block.qualityGrade,
      completeness: block.completeness,
    }))

    if (lat !== undefined && lng !== undefined) {
      places = places.map((place) => {
        if (place.latitude && place.longitude) {
          const distance = calculateDistance(lat, lng, place.latitude, place.longitude)
          return { ...place, distance }
        }
        return place
      })

      // Filter by radius
      places = places.filter((place) => !place.distance || place.distance <= radius)
    }

    // Filter by age groups
    if (ageGroups.length > 0) {
      places = places.filter((place) => {
        const recommended = place.recommendedAges || []
        return ageGroups.some((age) => recommended.includes(age))
      })
    }

    // Client-side pagination after filtering
    const totalFiltered = places.length
    if (needsClientFilter) {
      const start = (page - 1) * pageSize
      places = places.slice(start, start + pageSize)
    }

    return {
      success: true,
      data: {
        places,
        total: needsClientFilter ? totalFiltered : result.total,
        page,
        pageSize,
        hasMore: needsClientFilter ? page * pageSize < totalFiltered : page * pageSize < result.total,
      },
    }
  } catch (error) {
    console.error('searchPlaces error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search places',
    }
  }
}

// ============================================
// Server Action: Get Place Detail
// ============================================

export interface GetPlaceDetailResult {
  success: boolean
  data?: PlaceWithDistance
  error?: string
}

export async function getPlaceDetail(placeId: string): Promise<GetPlaceDetailResult> {
  try {
    const repo = getPlaceBlockRepository()
    const block = await repo.get(placeId)

    if (!block) {
      return {
        success: false,
        error: 'Place not found',
      }
    }

    return {
      success: true,
      data: {
        ...block.data,
        blockId: block.id,
        qualityGrade: block.qualityGrade,
        completeness: block.completeness,
      },
    }
  } catch (error) {
    console.error('getPlaceDetail error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get place detail',
    }
  }
}

// ============================================
// Utilities
// ============================================

/**
 * Haversine distance calculation (meters)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000 // Convert to meters
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
