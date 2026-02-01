/**
 * KidsMap 데이터 블록 저장소
 *
 * Supabase를 통한 블록 CRUD 및 검색 기능
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import type {
  PlaceBlock,
  ContentBlock,
  CrawlJob,
  CrawlSchedule,
  BlockStats,
  PlaceBlockFilter,
  ContentBlockFilter,
  PaginatedResponse,
  BlockStatus,
  QualityGrade,
} from './types'
import type { NormalizedPlace, NormalizedContent, PlaceCategory } from '../types'

// ============================================
// Supabase 클라이언트
// ============================================

let _supabaseClient: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_supabaseClient) return _supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
// 유틸리티 함수
// ============================================

/**
 * 장소 중복 체크 해시 생성
 */
export function generatePlaceDedupeHash(place: NormalizedPlace): string {
  const normalized = [
    place.name.toLowerCase().trim(),
    place.address?.toLowerCase().trim() || '',
    place.latitude?.toFixed(6) || '',
    place.longitude?.toFixed(6) || '',
  ].join('|')

  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 64)
}

/**
 * 콘텐츠 중복 체크 해시 생성
 */
export function generateContentDedupeHash(content: NormalizedContent): string {
  const normalized = [content.source, content.sourceUrl].join('|')
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 64)
}

/**
 * 데이터 완성도 계산 (0-100)
 */
export function calculateCompleteness(place: NormalizedPlace): number {
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
      score += field.weight
    }
  }

  return Math.min(100, score)
}

/**
 * 품질 등급 계산
 */
export function calculateQualityGrade(completeness: number, hasImage: boolean): QualityGrade {
  if (completeness >= 90 && hasImage) return 'A'
  if (completeness >= 70 && hasImage) return 'B'
  if (completeness >= 50) return 'C'
  if (completeness >= 30) return 'D'
  return 'F'
}

/**
 * 검색 키워드 추출
 */
export function extractSearchKeywords(place: NormalizedPlace): string[] {
  const keywords: Set<string> = new Set()

  // 이름 토큰화
  if (place.name) {
    place.name.split(/\s+/).forEach((word) => {
      if (word.length >= 2) keywords.add(word)
    })
  }

  // 주소에서 지역명 추출
  if (place.address) {
    const regions = place.address.match(/([가-힣]+[시도군구])/g)
    regions?.forEach((r) => keywords.add(r))
  }

  // 카테고리 관련 키워드
  const categoryKeywords: Record<string, string[]> = {
    amusement_park: ['놀이공원', '테마파크', '어트랙션'],
    zoo_aquarium: ['동물원', '수족관', '아쿠아리움'],
    kids_cafe: ['키즈카페', '실내놀이터', '키즈존'],
    museum: ['박물관', '체험관', '전시관'],
    nature_park: ['공원', '자연', '산책'],
  }

  if (categoryKeywords[place.category]) {
    categoryKeywords[place.category].forEach((k) => keywords.add(k))
  }

  return Array.from(keywords)
}

/**
 * 지역 코드 추출 (시도)
 */
export function extractRegionCode(place: NormalizedPlace): string {
  if (place.areaCode) return place.areaCode

  // 주소에서 시도 추출
  const match = place.address?.match(/^([가-힣]+[시도])/)
  if (match) {
    const regionMap: Record<string, string> = {
      서울시: '1',
      서울특별시: '1',
      인천시: '2',
      인천광역시: '2',
      대전시: '3',
      대전광역시: '3',
      대구시: '4',
      대구광역시: '4',
      광주시: '5',
      광주광역시: '5',
      부산시: '6',
      부산광역시: '6',
      울산시: '7',
      울산광역시: '7',
      세종시: '8',
      세종특별자치시: '8',
      경기도: '31',
      강원도: '32',
      충북: '33',
      충청북도: '33',
      충남: '34',
      충청남도: '34',
      경북: '35',
      경상북도: '35',
      경남: '36',
      경상남도: '36',
      전북: '37',
      전라북도: '37',
      전남: '38',
      전라남도: '38',
      제주도: '39',
      제주특별자치도: '39',
    }
    return regionMap[match[1]] || '99'
  }

  return '99' // 기타
}

// ============================================
// 장소 블록 저장소
// ============================================

export class PlaceBlockRepository {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = getSupabaseClient()
  }

  /**
   * 장소 블록 생성
   */
  async create(place: NormalizedPlace): Promise<PlaceBlock> {
    const dedupeHash = generatePlaceDedupeHash(place)
    const completeness = calculateCompleteness(place)
    const qualityGrade = calculateQualityGrade(completeness, !!place.imageUrl)
    const searchKeywords = extractSearchKeywords(place)
    const regionCode = extractRegionCode(place)

    const { data, error } = await this.supabase
      .from('kidsmap_place_blocks')
      .insert({
        data: place,
        dedupe_hash: dedupeHash,
        completeness,
        quality_grade: qualityGrade,
        search_keywords: searchKeywords,
        region_code: regionCode,
        name: place.name,
        category: place.category,
        source: place.source,
        source_id: place.id,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        metadata: {
          source: place.source,
          sourceId: place.id,
          version: 1,
          verified: false,
        },
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // 중복 키 에러
        throw new Error(`중복된 장소입니다: ${place.name}`)
      }
      throw error
    }

    return this.mapToPlaceBlock(data)
  }

  /**
   * 장소 블록 업데이트
   */
  async update(id: string, place: Partial<NormalizedPlace>): Promise<PlaceBlock> {
    const existing = await this.findById(id)
    if (!existing) throw new Error('장소를 찾을 수 없습니다.')

    const updatedData = { ...existing.data, ...place }
    const completeness = calculateCompleteness(updatedData)
    const qualityGrade = calculateQualityGrade(completeness, !!updatedData.imageUrl)

    const { data, error } = await this.supabase
      .from('kidsmap_place_blocks')
      .update({
        data: updatedData,
        completeness,
        quality_grade: qualityGrade,
        search_keywords: extractSearchKeywords(updatedData),
        name: updatedData.name,
        latitude: updatedData.latitude,
        longitude: updatedData.longitude,
        address: updatedData.address,
        last_crawled_at: new Date().toISOString(),
        crawl_count: existing.crawlCount + 1,
        metadata: {
          ...existing.metadata,
          version: (existing.metadata.version || 0) + 1,
        },
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.mapToPlaceBlock(data)
  }

  /**
   * ID로 장소 블록 조회
   */
  async findById(id: string): Promise<PlaceBlock | null> {
    const { data, error } = await this.supabase
      .from('kidsmap_place_blocks')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapToPlaceBlock(data)
  }

  /**
   * 중복 해시로 장소 블록 조회
   */
  async findByDedupeHash(hash: string): Promise<PlaceBlock | null> {
    const { data, error } = await this.supabase
      .from('kidsmap_place_blocks')
      .select()
      .eq('dedupe_hash', hash)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapToPlaceBlock(data)
  }

  /**
   * 장소 블록 검색
   */
  async search(filter: PlaceBlockFilter): Promise<PaginatedResponse<PlaceBlock>> {
    const page = filter.page || 1
    const pageSize = filter.pageSize || 20
    const offset = (page - 1) * pageSize

    let query = this.supabase
      .from('kidsmap_place_blocks')
      .select('*', { count: 'exact' })

    // 필터 적용
    if (filter.status?.length) {
      query = query.in('status', filter.status)
    } else {
      query = query.eq('status', 'active')
    }

    if (filter.categories?.length) {
      query = query.in('category', filter.categories)
    }

    if (filter.regionCodes?.length) {
      query = query.in('region_code', filter.regionCodes)
    }

    if (filter.qualityGrades?.length) {
      query = query.in('quality_grade', filter.qualityGrades)
    }

    if (filter.freshness?.length) {
      query = query.in('freshness', filter.freshness)
    }

    if (filter.keyword) {
      query = query.textSearch('name', filter.keyword, { type: 'websearch' })
    }

    if (filter.completenessRange) {
      query = query
        .gte('completeness', filter.completenessRange.min)
        .lte('completeness', filter.completenessRange.max)
    }

    if (filter.crawledAtRange) {
      query = query
        .gte('last_crawled_at', filter.crawledAtRange.from)
        .lte('last_crawled_at', filter.crawledAtRange.to)
    }

    // 위치 기반 검색 (간단한 범위 검색)
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

    // 정렬
    const sortBy = filter.sortBy || 'updatedAt'
    const sortOrder = filter.sortOrder || 'desc'
    const sortColumn =
      sortBy === 'createdAt'
        ? 'created_at'
        : sortBy === 'updatedAt'
          ? 'updated_at'
          : sortBy === 'qualityGrade'
            ? 'quality_grade'
            : sortBy

    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // 페이지네이션
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
   * 블록 상태 변경
   */
  async updateStatus(id: string, status: BlockStatus): Promise<void> {
    const { error } = await this.supabase
      .from('kidsmap_place_blocks')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * 벌크 생성 (upsert)
   */
  async bulkUpsert(
    places: NormalizedPlace[],
    options: { skipDuplicates?: boolean } = {}
  ): Promise<{ created: number; updated: number; skipped: number }> {
    let created = 0
    let updated = 0
    let skipped = 0

    for (const place of places) {
      const hash = generatePlaceDedupeHash(place)
      const existing = await this.findByDedupeHash(hash)

      if (existing) {
        if (options.skipDuplicates) {
          skipped++
        } else {
          await this.update(existing.id, place)
          updated++
        }
      } else {
        await this.create(place)
        created++
      }
    }

    return { created, updated, skipped }
  }

  /**
   * DB 레코드를 PlaceBlock 타입으로 변환
   */
  private mapToPlaceBlock(record: Record<string, unknown>): PlaceBlock {
    return {
      id: record.id as string,
      data: record.data as NormalizedPlace,
      status: record.status as BlockStatus,
      qualityGrade: record.quality_grade as QualityGrade,
      freshness: record.freshness as PlaceBlock['freshness'],
      completeness: record.completeness as number,
      dedupeHash: record.dedupe_hash as string,
      relatedContentIds: (record.related_content_ids as string[]) || [],
      searchKeywords: (record.search_keywords as string[]) || [],
      regionCode: record.region_code as string,
      metadata: record.metadata as PlaceBlock['metadata'],
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string,
      lastCrawledAt: record.last_crawled_at as string,
      crawlCount: record.crawl_count as number,
    }
  }
}

// ============================================
// 콘텐츠 블록 저장소
// ============================================

export class ContentBlockRepository {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = getSupabaseClient()
  }

  /**
   * 콘텐츠 블록 생성
   */
  async create(content: NormalizedContent, relatedPlaceId?: string): Promise<ContentBlock> {
    const dedupeHash = generateContentDedupeHash(content)

    const { data, error } = await this.supabase
      .from('kidsmap_content_blocks')
      .insert({
        data: content,
        dedupe_hash: dedupeHash,
        related_place_id: relatedPlaceId,
        title: content.title,
        source: content.source,
        source_id: content.id,
        content_type: content.type,
        author: content.author,
        published_at: content.publishedAt,
        view_count: content.viewCount || 0,
        like_count: content.likeCount || 0,
        metadata: {
          source: content.source,
          sourceId: content.id,
          version: 1,
        },
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error(`중복된 콘텐츠입니다: ${content.title}`)
      }
      throw error
    }

    return this.mapToContentBlock(data)
  }

  /**
   * ID로 콘텐츠 블록 조회
   */
  async findById(id: string): Promise<ContentBlock | null> {
    const { data, error } = await this.supabase
      .from('kidsmap_content_blocks')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return this.mapToContentBlock(data)
  }

  /**
   * 콘텐츠 블록 검색
   */
  async search(filter: ContentBlockFilter): Promise<PaginatedResponse<ContentBlock>> {
    const page = filter.page || 1
    const pageSize = filter.pageSize || 20
    const offset = (page - 1) * pageSize

    let query = this.supabase
      .from('kidsmap_content_blocks')
      .select('*', { count: 'exact' })

    if (filter.status?.length) {
      query = query.in('status', filter.status)
    } else {
      query = query.eq('status', 'active')
    }

    if (filter.sources?.length) {
      query = query.in('source', filter.sources)
    }

    if (filter.relatedPlaceId) {
      query = query.eq('related_place_id', filter.relatedPlaceId)
    }

    if (filter.qualityGrades?.length) {
      query = query.in('quality_grade', filter.qualityGrades)
    }

    if (filter.keyword) {
      query = query.textSearch('title', filter.keyword, { type: 'websearch' })
    }

    // 정렬
    const sortBy = filter.sortBy || 'publishedAt'
    const sortOrder = filter.sortOrder || 'desc'
    const sortColumn =
      sortBy === 'createdAt'
        ? 'created_at'
        : sortBy === 'publishedAt'
          ? 'published_at'
          : sortBy === 'viewCount'
            ? 'view_count'
            : sortBy === 'likeCount'
              ? 'like_count'
              : sortBy

    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: (data || []).map(this.mapToContentBlock),
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }

  /**
   * 장소별 콘텐츠 조회
   */
  async findByPlaceId(placeId: string): Promise<ContentBlock[]> {
    const { data, error } = await this.supabase
      .from('kidsmap_content_blocks')
      .select()
      .eq('related_place_id', placeId)
      .eq('status', 'active')
      .order('published_at', { ascending: false })

    if (error) throw error
    return (data || []).map(this.mapToContentBlock)
  }

  /**
   * DB 레코드를 ContentBlock 타입으로 변환
   */
  private mapToContentBlock(record: Record<string, unknown>): ContentBlock {
    return {
      id: record.id as string,
      data: record.data as NormalizedContent,
      status: record.status as BlockStatus,
      qualityGrade: record.quality_grade as QualityGrade,
      freshness: record.freshness as ContentBlock['freshness'],
      relatedPlaceId: record.related_place_id as string | undefined,
      dedupeHash: record.dedupe_hash as string,
      analysis: record.analysis as ContentBlock['analysis'],
      metadata: record.metadata as ContentBlock['metadata'],
      createdAt: record.created_at as string,
      updatedAt: record.updated_at as string,
      lastCrawledAt: record.last_crawled_at as string,
    }
  }
}

// ============================================
// 통계 저장소
// ============================================

export class BlockStatsRepository {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = getSupabaseClient()
  }

  /**
   * 통계 조회
   */
  async getStats(): Promise<BlockStats> {
    const { data, error } = await this.supabase
      .from('kidsmap_block_stats')
      .select()
      .eq('id', 'global')
      .single()

    if (error) throw error

    return {
      totalPlaces: data.total_places,
      totalContents: data.total_contents,
      placesByStatus: data.places_by_status || {},
      placesByCategory: data.places_by_category || {},
      placesByRegion: data.places_by_region || {},
      contentsBySource: data.contents_by_source || {},
      qualityDistribution: data.quality_distribution || {},
      freshnessDistribution: data.freshness_distribution || {},
      averageCompleteness: data.average_completeness || 0,
      lastUpdated: data.last_updated,
    }
  }

  /**
   * 통계 갱신
   */
  async refreshStats(): Promise<void> {
    const { error } = await this.supabase.rpc('refresh_kidsmap_stats')
    if (error) throw error
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let _placeRepo: PlaceBlockRepository | null = null
let _contentRepo: ContentBlockRepository | null = null
let _statsRepo: BlockStatsRepository | null = null

export function getPlaceBlockRepository(): PlaceBlockRepository {
  if (!_placeRepo) _placeRepo = new PlaceBlockRepository()
  return _placeRepo
}

export function getContentBlockRepository(): ContentBlockRepository {
  if (!_contentRepo) _contentRepo = new ContentBlockRepository()
  return _contentRepo
}

export function getBlockStatsRepository(): BlockStatsRepository {
  if (!_statsRepo) _statsRepo = new BlockStatsRepository()
  return _statsRepo
}
