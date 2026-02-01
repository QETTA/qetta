/**
 * KidsMap AI Recommendations API
 *
 * POST /api/kidsmap/recommendations - AI 기반 장소 추천
 *
 * Request Body:
 * {
 *   userLocation: { lat, lng },
 *   childAge: AgeGroup,
 *   weather?: string,
 *   time?: string,  // ISO datetime
 *   recentVisits?: string[], // Place IDs
 *   preferences?: {
 *     categories?: PlaceCategory[],
 *     maxDistance?: number,
 *     priceRange?: { min, max }
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPlaceBlockRepository } from '@/lib/skill-engine/data-sources/kidsmap/blocks'
import type { AgeGroup, PlaceCategory } from '@/lib/skill-engine/data-sources/kidsmap/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface RecommendationRequest {
  userLocation: { lat: number; lng: number }
  childAge: AgeGroup
  weather?: string
  time?: string
  recentVisits?: string[]
  preferences?: {
    categories?: PlaceCategory[]
    maxDistance?: number
    priceRange?: { min: number | null; max: number | null }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()

    // Validate
    if (!body.userLocation || !body.childAge) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userLocation, childAge',
        },
        { status: 400 },
      )
    }

    // Get nearby places
    const repo = getPlaceBlockRepository()
    const nearbyPlaces = await repo.search({
      status: ['active'] as const,
      categories: body.preferences?.categories,
      page: 1,
      pageSize: 50,
      sortBy: 'qualityGrade',
    })

    // Filter by distance (rough filter)
    const maxDistance = body.preferences?.maxDistance || 10000 // 10km default
    const filtered = nearbyPlaces.data.filter((place) => {
      if (!place.data.latitude || !place.data.longitude) return false

      const distance = calculateDistance(
        body.userLocation.lat,
        body.userLocation.lng,
        place.data.latitude as number,
        place.data.longitude as number,
      )
      return distance <= maxDistance
    })

    // Build AI prompt
    const prompt = buildRecommendationPrompt(body, filtered as unknown as PlaceBlockWithData[])

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse AI response (expecting JSON array of place IDs)
    let recommendedPlaceIds: string[] = []
    try {
      const parsed = JSON.parse(responseText)
      recommendedPlaceIds = parsed.recommendations || []
    } catch {
      // Fallback: extract place IDs from text
      recommendedPlaceIds = filtered
        .slice(0, 5)
        .map((p) => p.id)
    }

    // Get recommended places
    const recommendations = filtered.filter((place) =>
      recommendedPlaceIds.includes(place.id),
    )

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendations.map((block) => ({
          ...block.data,
          blockId: block.id,
          qualityGrade: block.qualityGrade,
          completeness: block.completeness,
        })),
        reasoning: responseText,
      },
    })
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations',
      },
      { status: 500 },
    )
  }
}

// ============================================
// Utilities
// ============================================

interface PlaceBlockWithData {
  id: string
  data: {
    name?: string
    category?: string
    address?: string
    amenities?: Record<string, unknown>
    recommendedAges?: string[]
    [key: string]: unknown
  }
  qualityGrade: string
}

function buildRecommendationPrompt(
  request: RecommendationRequest,
  places: PlaceBlockWithData[],
): string {
  const ageDescription = {
    infant: '영아 (0-2세)',
    toddler: '유아 (3-5세)',
    child: '아동 (6-9세)',
    elementary: '초등학생 (10-12세)',
  }[request.childAge]

  const currentTime = request.time
    ? new Date(request.time)
    : new Date()
  const hour = currentTime.getHours()
  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6

  return `당신은 KidsMap AI 추천 엔진입니다. 부모를 위해 최적의 놀이 장소를 추천하세요.

## 사용자 정보
- 자녀 연령: ${ageDescription}
- 현재 위치: (${request.userLocation.lat}, ${request.userLocation.lng})
- 날씨: ${request.weather || '정보 없음'}
- 시간: ${currentTime.toLocaleString('ko-KR')} (${hour}시)
- 주말 여부: ${isWeekend ? '주말' : '평일'}

## 추천 기준
1. **연령 적합성**: ${ageDescription}에 적합한 장소
2. **시간대**: ${hour}시 기준 영업 중이거나 방문하기 좋은 시간
3. **날씨**: ${request.weather === '비' ? '실내 장소 우선' : request.weather === '맑음' ? '야외 장소 포함' : '날씨 무관'}
4. **혼잡도**: ${isWeekend ? '주말 혼잡도 고려' : '평일 한산한 시간대'}
5. **품질**: 높은 품질 등급 우선

## 가능한 장소 (${places.length}개)
${places
  .slice(0, 20)
  .map(
    (place, idx) => `
${idx + 1}. ID: ${place.id}
   이름: ${place.data.name}
   카테고리: ${place.data.category}
   주소: ${place.data.address || '정보 없음'}
   품질: ${place.qualityGrade}
   편의시설: ${JSON.stringify(place.data.amenities || {})}
   추천 연령: ${place.data.recommendedAges?.join(', ') || '정보 없음'}
`,
  )
  .join('\n')}

## 응답 형식 (JSON)
{
  "recommendations": ["place_id_1", "place_id_2", "place_id_3"],
  "reasoning": "추천 이유를 간단히 설명"
}

**중요**: 위 JSON 형식으로만 응답하세요. 설명 없이 JSON만 반환하세요.`
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
