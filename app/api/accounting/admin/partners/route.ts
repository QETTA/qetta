/**
 * Admin API: Partner Management
 * POST /api/accounting/admin/partners - Create new partner
 * GET /api/accounting/admin/partners - List partners
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createPartner, listPartners } from '@/lib/accounting/partner-service'
import { createPartnerSchema } from '@/lib/accounting/validation'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate input
    const validation = createPartnerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Create partner
    const result = await createPartner(
      validation.data,
      session.user.id,
      session.user.email!
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating partner:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await listPartners({
      status: status || undefined,
      page,
      pageSize
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error listing partners:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
