/**
 * AI Coupon System — Claude-powered coupon recommendations with DB caching
 *
 * Ported from QETTA/kidsmap repo.
 * Uses Claude API to generate coupon recommendations based on Korean payment ecosystem.
 * Caches results in Supabase coupon_cache table (24h TTL).
 */

import Anthropic from '@anthropic-ai/sdk'
import { createKidsMapSupabaseClient } from './supabase-client'

const isAnthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY)

const client = isAnthropicConfigured
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export interface Coupon {
  provider: string
  discount: string
  title: string
  description: string
  url: string
  reliability: 'general_knowledge' | 'verified'
  note: string
}

export interface CouponResponse {
  coupons: Coupon[]
  cached: boolean
  fetchedAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  theme_park: '테마파크',
  zoo: '동물원',
  cafe: '실내놀이터',
  museum: '박물관',
  nature: '자연공원',
}

function getMockCoupons(placeName: string): Coupon[] {
  return [
    {
      provider: '네이버페이',
      discount: '최대 15%',
      title: `${placeName} 네이버페이 할인`,
      description: '네이버페이 결제 시 적용 가능한 할인 혜택',
      url: 'https://pay.naver.com',
      reliability: 'general_knowledge',
      note: '실제 할인율은 프로모션에 따라 달라질 수 있습니다.',
    },
    {
      provider: '카카오페이',
      discount: '최대 10%',
      title: `${placeName} 카카오페이 할인`,
      description: '카카오페이 결제 시 적용 가능한 할인 혜택',
      url: 'https://pay.kakao.com',
      reliability: 'general_knowledge',
      note: '실제 할인율은 프로모션에 따라 달라질 수 있습니다.',
    },
    {
      provider: '통신사 멤버십',
      discount: '5~10%',
      title: 'SKT/KT/LG U+ 멤버십 할인',
      description: '통신사 멤버십 포인트로 할인 가능',
      url: 'https://www.tworld.co.kr',
      reliability: 'general_knowledge',
      note: '멤버십 등급에 따라 할인율이 다릅니다.',
    },
  ]
}

async function generateCoupons(
  placeName: string,
  category: string
): Promise<{ coupons: Coupon[] }> {
  if (!client) {
    return { coupons: getMockCoupons(placeName) }
  }

  const categoryLabel = CATEGORY_LABELS[category] || category

  const prompt = `당신은 한국 여행지 할인 정보 전문가입니다.

[장소]: ${placeName}
[카테고리]: ${categoryLabel}

다음 한국 간편결제 우선순위로 **일반적으로 알려진** 할인 정보를 추천해주세요:
1. 네이버페이 (시장 점유율 51.5%) - 보통 15-20% 할인
2. 카카오페이 (점유율 25.1%) - 보통 10-15% 할인
3. 통신사 멤버십 (SKT/KT/LG U+) - 보통 5-10% 할인
4. 카드사 제휴 (신한/현대/삼성) - 보통 10% 할인

⚠️ 중요: 각 쿠폰에 "실제 확인 필요" 문구 포함

JSON 형식으로만 응답하세요 (설명 없이):
{
  "coupons": [
    {
      "provider": "네이버페이",
      "discount": "15%",
      "title": "네이버페이 일반 할인",
      "description": "네이버페이 결제 시 적용 가능한 일반 할인",
      "url": "https://pay.naver.com",
      "reliability": "general_knowledge",
      "note": "실제 할인율은 시즌/프로모션에 따라 달라질 수 있습니다. 공식 사이트에서 확인해주세요."
    }
  ]
}

3-5개의 쿠폰을 추천해주세요.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const result = message.content.find((c) => c.type === 'text')
  if (!result || result.type !== 'text') {
    throw new Error('Invalid AI response format')
  }

  let jsonText = result.text.trim()
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '')
  }

  return JSON.parse(jsonText)
}

/**
 * Get coupons with Supabase database caching (24h TTL)
 */
export async function getCouponsWithCache(
  placeName: string,
  category: string
): Promise<CouponResponse> {
  if (!client) {
    const result = await generateCoupons(placeName, category)
    return { coupons: result.coupons, cached: false, fetchedAt: new Date().toISOString() }
  }

  const supabase = await createKidsMapSupabaseClient()

  // Check cache
  try {
    const { data: cached } = await supabase
      .from('coupon_cache')
      .select('*')
      .eq('place_name', placeName)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return {
        coupons: cached.coupons as Coupon[],
        cached: true,
        fetchedAt: cached.fetched_at,
      }
    }
  } catch {
    // Cache miss or Supabase unavailable
  }

  // Generate with AI
  const result = await generateCoupons(placeName, category)

  // Save to cache
  const now = new Date()
  try {
    await supabase.from('coupon_cache').insert({
      place_name: placeName,
      coupons: result.coupons,
      search_query: `${placeName} ${category}`,
      fetched_at: now.toISOString(),
      expires_at: new Date(now.getTime() + CACHE_TTL).toISOString(),
      is_valid: true,
    })
  } catch {
    // Supabase unavailable, skip caching
  }

  return { coupons: result.coupons, cached: false, fetchedAt: now.toISOString() }
}
