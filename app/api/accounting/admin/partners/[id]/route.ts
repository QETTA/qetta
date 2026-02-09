/**
 * Admin API: Single Partner Operations
 * GET /api/accounting/admin/partners/[id] - Get partner details
 * PATCH /api/accounting/admin/partners/[id] - Update partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getPartner, updatePartner } from '@/lib/accounting/partner-service'
import { updatePartnerSchema } from '@/lib/accounting/validation'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getPartner(params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error getting partner:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Validate input
    const validation = updatePartnerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const result = await updatePartner(
      params.id,
      validation.data,
      session.user.id,
      session.user.email!
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating partner:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
