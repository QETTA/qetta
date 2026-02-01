/**
 * KidsMap tRPC Router
 *
 * 키즈맵 관련 tRPC 프로시저
 * End-to-end type-safe API
 *
 * @module lib/trpc/routers/kidsmap
 */

import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { getPlaceBlockRepository, getContentBlockRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
import type {
  PlaceCategory,
  FilterCategory,
  AgeGroup,
  ContentSource,
} from '@/lib/skill-engine/data-sources/kidsmap/types'

// ============================================
// Input Schemas
// ============================================

const searchPlacesInput = z.object({
  query: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().default(5000),
  category: z.string().optional() as z.ZodType<FilterCategory | undefined>,
  placeCategories: z.array(z.string()).optional() as z.ZodType<PlaceCategory[] | undefined>,
  ageGroups: z.array(z.string()).optional() as z.ZodType<AgeGroup[] | undefined>,
  page: z.number().default(1),
  pageSize: z.number().default(20),
  openNow: z.boolean().optional(),
})

const fetchFeedInput = z.object({
  source: z.string().optional() as z.ZodType<ContentSource | undefined>,
  sort: z.enum(['recent', 'popular', 'trending']).default('recent'),
  keyword: z.string().optional(),
  placeId: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
})

// ============================================
// Router
// ============================================

export const kidsmapRouter = router({
  /**
   * 장소 검색
   */
  searchPlaces: publicProcedure
    .input(searchPlacesInput)
    .query(async ({ input }) => {
      const {
        query = '',
        lat,
        lng,
        radius,
        placeCategories = [],
        ageGroups = [],
        page,
        pageSize,
      } = input

      const filter: Record<string, unknown> = {
        status: 'active' as const,
      }

      if (placeCategories.length > 0) {
        filter.categories = placeCategories
      }

      if (query) {
        filter.searchKeyword = query
      }

      const repo = getPlaceBlockRepository()

      const needsClientFilter = (lat !== undefined && lng !== undefined) || ageGroups.length > 0
      filter.page = needsClientFilter ? 1 : page
      filter.pageSize = needsClientFilter ? 500 : pageSize

      const result = await repo.search(filter)

      let places = result.data.map((block) => ({
        ...block.data,
        blockId: block.id,
        qualityGrade: block.qualityGrade,
        completeness: block.completeness,
        distance: undefined as number | undefined,
      }))

      // Distance calculation
      if (lat !== undefined && lng !== undefined) {
        places = places.map((place) => {
          if (place.latitude && place.longitude) {
            const distance = calculateDistance(lat, lng, place.latitude, place.longitude)
            return { ...place, distance }
          }
          return place
        })

        places = places.filter((place) => !place.distance || place.distance <= radius)
      }

      // Age filter
      if (ageGroups.length > 0) {
        places = places.filter((place) => {
          const recommended = place.recommendedAges || []
          return ageGroups.some((age) => recommended.includes(age))
        })
      }

      const totalFiltered = places.length
      if (needsClientFilter) {
        const start = (page - 1) * pageSize
        places = places.slice(start, start + pageSize)
      }

      return {
        places,
        total: needsClientFilter ? totalFiltered : result.total,
        page,
        pageSize,
        hasMore: needsClientFilter ? page * pageSize < totalFiltered : page * pageSize < result.total,
      }
    }),

  /**
   * 피드 조회
   */
  getFeed: publicProcedure
    .input(fetchFeedInput)
    .query(async ({ input }) => {
      const { source, sort, keyword, placeId, page, pageSize } = input

      const repo = getContentBlockRepository()

      const filter: Record<string, unknown> = {
        status: 'active' as const,
        page,
        pageSize,
      }

      if (source) filter.source = source
      if (keyword) filter.searchKeyword = keyword
      if (placeId) filter.relatedPlaceId = placeId

      switch (sort) {
        case 'popular':
          filter.orderBy = 'viewCount'
          filter.orderDir = 'desc'
          break
        case 'trending':
          filter.orderBy = 'trendingScore'
          filter.orderDir = 'desc'
          break
        default:
          filter.orderBy = 'publishedAt'
          filter.orderDir = 'desc'
      }

      const result = await repo.search(filter)

      const items = result.data.map((block) => ({
        id: block.id,
        source: block.data.source,
        title: block.data.title,
        description: block.data.description,
        thumbnailUrl: block.data.thumbnailUrl,
        sourceUrl: block.data.sourceUrl,
        author: block.data.author,
        authorThumbnail: block.data.authorThumbnail,
        viewCount: block.data.viewCount,
        likeCount: block.data.likeCount,
        duration: block.data.duration,
        publishedAt: block.data.publishedAt,
        tags: block.data.tags,
        relatedPlaceId: block.data.relatedPlaceId,
        relatedPlaceName: block.data.relatedPlaceName,
      }))

      return {
        items,
        total: result.total,
        page,
        pageSize,
        hasMore: page * pageSize < result.total,
      }
    }),

  /**
   * 장소 상세 조회
   */
  getPlace: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const repo = getPlaceBlockRepository()
      const block = await repo.get(input.id)

      if (!block) {
        return null
      }

      return {
        ...block.data,
        blockId: block.id,
        qualityGrade: block.qualityGrade,
        completeness: block.completeness,
      }
    }),

  /**
   * 콘텐츠 상세 조회
   */
  getContent: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const repo = getContentBlockRepository()
      const block = await repo.get(input.id)

      if (!block) {
        return null
      }

      return {
        id: block.id,
        ...block.data,
      }
    }),
})

// ============================================
// Utilities
// ============================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
