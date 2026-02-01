/**
 * KidsMap Coupons API
 *
 * POST /api/kidsmap/coupons
 * Returns AI-generated coupon recommendations for a place (with DB caching)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCouponsWithCache } from '@/lib/kidsmap/ai-coupon'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { placeName, category } = body

    if (!placeName || !category) {
      return NextResponse.json(
        { error: 'placeName and category are required' },
        { status: 400 }
      )
    }

    const result = await getCouponsWithCache(placeName, category)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[KidsMap] Coupon API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
