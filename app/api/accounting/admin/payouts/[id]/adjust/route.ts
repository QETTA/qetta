/**
 * Admin API: Payout Adjustment
 * POST /api/accounting/admin/payouts/[id]/adjust - Create adjustment ledger
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createPayoutAdjustment } from '@/lib/accounting/payout-service'
import { adjustPayoutSchema } from '@/lib/accounting/validation'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate input and inject payoutId
    const validation = adjustPayoutSchema.safeParse({
      ...body,
      originalPayoutId: params.id
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const result = await createPayoutAdjustment(
      validation.data,
      session.user.id,
      session.user.email!
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating adjustment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
