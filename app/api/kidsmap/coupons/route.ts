/**
 * KidsMap Coupons API
 *
 * POST /api/kidsmap/coupons
 * Returns AI-generated coupon recommendations for a place (with DB caching)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCouponsWithCache } from '@/lib/kidsmap/ai-coupon'
import { rateLimit, createRateLimitResponse } from '@/lib/api/rate-limiter'

const VALID_CATEGORIES = [
  'amusement_park', 'zoo_aquarium', 'kids_cafe', 'museum',
  'nature_park', 'restaurant', 'public_facility', 'other',
]

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'kidsmap-coupons')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { placeName, category } = body

    if (!placeName || !category) {
      return NextResponse.json(
        { error: 'placeName and category are required' },
        { status: 400 }
      )
    }

    // Input sanitization (SEC-4: prevent prompt injection)
    const sanitizedName = String(placeName).replace(/[<>{}[\]]/g, '').slice(0, 100)
    const sanitizedCategory = VALID_CATEGORIES.includes(category) ? category : 'other'

    const result = await getCouponsWithCache(sanitizedName, sanitizedCategory)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[KidsMap] Coupon API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate coupons' },
      { status: 500 }
    )
  }
}
