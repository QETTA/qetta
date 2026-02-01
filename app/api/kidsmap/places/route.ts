/**
 * KidsMap Places API
 *
 * GET /api/kidsmap/places - 장소 검색
 *
 * Query Parameters:
 * - q: 검색어
 * - lat, lng: 중심 좌표
 * - radius: 반경 (m)
 * - category: 카테고리 (outdoor/indoor/public/restaurant)
 * - placeCategories: 구체적 카테고리 (comma-separated)
 * - ageGroups: 연령대 (comma-separated)
 * - page, pageSize: 페이지네이션
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSimplePlaceRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
import { rateLimit, createRateLimitResponse } from '@/lib/api/rate-limiter'
import type {
  PlaceCategory,
  FilterCategory,
  AgeGroup,
} from '@/lib/skill-engine/data-sources/kidsmap/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'kidsmap-places')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }
    const { searchParams } = request.nextUrl

    // Query parameters
    const query = searchParams.get('q') || ''
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 5000
    const filterCategory = searchParams.get('category') as FilterCategory | null
    const placeCategoriesParam = searchParams.get('placeCategories')
    const ageGroupsParam = searchParams.get('ageGroups')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const openNow = searchParams.get('openNow') === 'true'

    // Parse arrays
    const placeCategories = placeCategoriesParam
      ? (placeCategoriesParam.split(',') as PlaceCategory[])
      : []
    const ageGroups = ageGroupsParam ? (ageGroupsParam.split(',') as AgeGroup[]) : []

    // Build filter for SimplePlaceRepository
    const filter: {
      categories?: PlaceCategory[]
      keyword?: string
      location?: { latitude: number; longitude: number; radiusKm: number }
      page?: number
      pageSize?: number
    } = {}

    if (placeCategories.length > 0) {
      filter.categories = placeCategories
    }

    if (query) {
      filter.keyword = query
    }

    // Get repository — uses existing `places` table
    const repo = getSimplePlaceRepository()

    const needsClientFilter = (lat && lng) || ageGroups.length > 0
    filter.page = needsClientFilter ? 1 : page
    filter.pageSize = needsClientFilter ? 500 : pageSize

    // Add location filter if provided (for DB-side filtering)
    if (lat && lng) {
      filter.location = {
        latitude: lat,
        longitude: lng,
        radiusKm: radius / 1000, // Convert meters to km
      }
    }

    const result = await repo.search(filter)

    // Calculate distance if location provided
    type PlaceWithDistance = (typeof result.data)[number] & { distance?: number }
    let places: PlaceWithDistance[] = result.data

    if (lat && lng) {
      places = places.map((place) => {
        if (place.data.latitude && place.data.longitude) {
          const distance = calculateDistance(
            lat,
            lng,
            place.data.latitude as number,
            place.data.longitude as number
          )
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
        const recommended = place.data.recommendedAges || []
        return ageGroups.some((age) => recommended.includes(age))
      })
    }

    // Client-side pagination after filtering
    const totalFiltered = places.length
    if (needsClientFilter) {
      const start = (page - 1) * pageSize
      places = places.slice(start, start + pageSize)
    }

    return NextResponse.json({
      success: true,
      data: {
        places: places.map((block) => ({
          ...block.data,
          blockId: block.id,
          qualityGrade: block.qualityGrade,
          completeness: block.completeness,
          distance: block.distance,
        })),
        total: needsClientFilter ? totalFiltered : result.total,
        page,
        pageSize,
        hasMore: needsClientFilter
          ? page * pageSize < totalFiltered
          : page * pageSize < result.total,
      },
    })
  } catch (error) {
    console.error('Places API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search places',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

// ============================================
// Utilities
// ============================================

/**
 * Haversine distance calculation (km)
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
