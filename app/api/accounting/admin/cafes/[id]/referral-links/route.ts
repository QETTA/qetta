/**
 * Admin API: Referral Links
 * POST /api/accounting/admin/cafes/[id]/referral-links - Create referral link for cafe
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createReferralLink } from '@/lib/accounting/referral-service'
import { createReferralLinkSchema } from '@/lib/accounting/validation'

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

    // Validate input and inject cafeId
    const validation = createReferralLinkSchema.safeParse({
      ...body,
      cafeId: params.id
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const result = await createReferralLink(
      validation.data,
      session.user.id,
      session.user.email!
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating referral link:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
