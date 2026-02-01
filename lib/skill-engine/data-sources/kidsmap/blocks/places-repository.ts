/**
 * KidsMap Places Repository
 *
 * 기존 Supabase `places` 테이블을 사용하는 간단한 저장소
 * (kidsmap_place_blocks 테이블 대신)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { PlaceBlockFilter, PaginatedResponse } from './types'
import type { NormalizedPlace, PlaceCategory, AgeGroup } from '../types'

// ============================================
// Types
// ============================================

export interface PlaceRecord {
  id: string
  name: string
  category: string
  description?: string
  address?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  age_2_4?: number // 1-5 rating
  age_5_7?: number
  age_8_10?: number
  stroller_friendly?: boolean
  nursing_room?: boolean
  parking_easy?: boolean
  parking_free?: boolean
  restaurant_nearby?: boolean
  indoor_outdoor?: 'indoor' | 'outdoor' | 'both'
  best_season?: string[]
  rainy_day_ok?: boolean
  admission_fee?: string
  operating_hours?: Record<string, unknown>
  website_url?: string
  phone?: string
  image_url?: string
  popularity_score?: number
  source?: string
  verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface SimplePlaceBlock {
  id: string
  data: NormalizedPlace
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  completeness: number
  distance?: number
}

// ============================================
// Supabase Client
// ============================================

let _supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_supabaseClient) return _supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  _supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _supabaseClient
}

// ============================================
// Category Mapping
// ============================================

const DB_TO_APP_CATEGORY: Record<string, PlaceCategory> = {
  theme_park: 'amusement_park',
  amusement_park: 'amusement_park',
  zoo: 'zoo_aquarium',
  aquarium: 'zoo_aquarium',
  zoo_aquarium: 'zoo_aquarium',
  experience: 'museum',
  museum: 'museum',
  nature: 'nature_park',
  nature_park: 'nature_park',
  park: 'nature_park',
  kids_cafe: 'kids_cafe',
  indoor_playground: 'kids_cafe',
  restaurant: 'restaurant',
  public_facility: 'public_facility',
  library: 'public_facility',
  sports: 'public_facility',
  other: 'other',
}

// ============================================
// Repository
// ============================================

export class SimplePlaceRepository {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = getSupabaseClient()
  }

  /**
   * ID로 장소 조회
   */
  async findById(id: string): Promise<SimplePlaceBlock | null> {
    const { data, error } = await this.supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapToPlaceBlock(data)
  }

  /**
   * 장소 검색
   */
  async search(filter: PlaceBlockFilter): Promise<PaginatedResponse<SimplePlaceBlock>> {
    const page = filter.page || 1
    const pageSize = filter.pageSize || 20
    const offset = (page - 1) * pageSize

    let query = this.supabase
      .from('places')
      .select('*', { count: 'exact' })

    // Category filter
    if (filter.categories?.length) {
      // Map app categories to DB categories
      const dbCategories: string[] = []
      for (const cat of filter.categories) {
        Object.entries(DB_TO_APP_CATEGORY).forEach(([dbCat, appCat]) => {
          if (appCat === cat) dbCategories.push(dbCat)
        })
      }
      if (dbCategories.length > 0) {
        query = query.in('category', dbCategories)
      }
    }

    // Keyword search
    if (filter.keyword) {
      query = query.ilike('name', `%${filter.keyword}%`)
    }

    // Location-based search
    if (filter.location) {
      const { latitude, longitude, radiusKm } = filter.location
      const latDelta = radiusKm / 111
      const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))

      query = query
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta)
    }

    // Sorting
    const sortBy = filter.sortBy || 'popularity_score'
    const sortOrder = filter.sortOrder || 'desc'
    query = query.order(sortBy === 'updatedAt' ? 'updated_at' : 'popularity_score', {
      ascending: sortOrder === 'asc',
    })

    // Pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: (data || []).map(this.mapToPlaceBlock),
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }

  /**
   * 추천 장소 조회 (popularity 기준)
   */
  async getRecommended(limit: number = 10): Promise<SimplePlaceBlock[]> {
    const { data, error } = await this.supabase
      .from('places')
      .select('*')
      .order('popularity_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(this.mapToPlaceBlock)
  }

  /**
   * DB 레코드를 PlaceBlock으로 변환
   */
  private mapToPlaceBlock(record: PlaceRecord): SimplePlaceBlock {
    // Parse operating hours from JSON
    const operatingHours = record.operating_hours ? {
      weekday: (record.operating_hours as Record<string, string>).weekday,
      saturday: (record.operating_hours as Record<string, string>).saturday,
      sunday: (record.operating_hours as Record<string, string>).sunday,
      closedDays: (record.operating_hours as Record<string, string>).closedDays,
    } : undefined

    // Parse admission fee from string
    const admissionFee = record.admission_fee ? {
      isFree: record.admission_fee.toLowerCase().includes('무료') || record.admission_fee.toLowerCase().includes('free'),
      description: record.admission_fee,
    } : undefined

    const normalizedPlace: NormalizedPlace = {
      id: record.id,
      name: record.name,
      category: DB_TO_APP_CATEGORY[record.category] || 'other',
      address: record.address || '',
      latitude: record.latitude,
      longitude: record.longitude,
      description: record.description,
      tel: record.phone,
      homepage: record.website_url,
      imageUrl: record.image_url,
      operatingHours,
      admissionFee,
      source: 'TOUR_API', // Default source for existing data
      sourceUrl: record.website_url || `https://kidsmap.qetta.app/places/${record.id}`,
      fetchedAt: record.created_at || new Date().toISOString(),
      rawData: record,
      recommendedAges: this.calculateRecommendedAges(record),
      amenities: {
        nursingRoom: record.nursing_room,
        diaperChangingStation: record.nursing_room, // Often co-located
        strollerAccess: record.stroller_friendly,
        parking: record.parking_easy || record.parking_free,
        outdoor: record.indoor_outdoor === 'outdoor' || record.indoor_outdoor === 'both',
        indoor: record.indoor_outdoor === 'indoor' || record.indoor_outdoor === 'both',
      },
    }

    // Calculate completeness
    const completeness = this.calculateCompleteness(normalizedPlace)
    const qualityGrade = this.calculateQualityGrade(completeness, !!record.image_url)

    return {
      id: record.id,
      data: normalizedPlace,
      qualityGrade,
      completeness,
    }
  }

  /**
   * 연령대 추천 계산
   */
  private calculateRecommendedAges(record: PlaceRecord): AgeGroup[] {
    const ages: AgeGroup[] = []
    const threshold = 3 // Rating >= 3 means recommended

    // age_2_4 -> infant + toddler
    if ((record.age_2_4 ?? 0) >= threshold) {
      ages.push('infant', 'toddler')
    }

    // age_5_7 -> child
    if ((record.age_5_7 ?? 0) >= threshold) {
      ages.push('child')
    }

    // age_8_10 -> elementary
    if ((record.age_8_10 ?? 0) >= threshold) {
      ages.push('elementary')
    }

    return [...new Set(ages)]
  }

  /**
   * 완성도 계산
   */
  private calculateCompleteness(place: NormalizedPlace): number {
    const fields = [
      { key: 'name', weight: 15 },
      { key: 'address', weight: 15 },
      { key: 'latitude', weight: 10 },
      { key: 'longitude', weight: 10 },
      { key: 'description', weight: 10 },
      { key: 'tel', weight: 5 },
      { key: 'homepage', weight: 5 },
      { key: 'imageUrl', weight: 10 },
      { key: 'operatingHours', weight: 10 },
      { key: 'admissionFee', weight: 5 },
      { key: 'recommendedAges', weight: 5 },
    ]

    let score = 0
    for (const field of fields) {
      const value = place[field.key as keyof NormalizedPlace]
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) continue
        score += field.weight
      }
    }

    return Math.min(100, score)
  }

  /**
   * 품질 등급 계산
   */
  private calculateQualityGrade(completeness: number, hasImage: boolean): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (completeness >= 90 && hasImage) return 'A'
    if (completeness >= 70 && hasImage) return 'B'
    if (completeness >= 50) return 'C'
    if (completeness >= 30) return 'D'
    return 'F'
  }
}

// ============================================
// Singleton
// ============================================

let _repo: SimplePlaceRepository | null = null

export function getSimplePlaceRepository(): SimplePlaceRepository {
  if (!_repo) _repo = new SimplePlaceRepository()
  return _repo
}
