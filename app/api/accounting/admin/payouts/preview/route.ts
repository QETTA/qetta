/**
 * Admin API: Payout Preview
 * POST /api/accounting/admin/payouts/preview - Calculate payout with snapshot
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { calculatePayout } from '@/lib/accounting/payout-service'
import { previewPayoutSchema } from '@/lib/accounting/validation'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate input
    const validation = previewPayoutSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const result = await calculatePayout(
      validation.data,
      session.user.id,
      session.user.email!
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error calculating payout:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
