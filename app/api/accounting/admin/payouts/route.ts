/**
 * Admin API: Payouts
 * GET /api/accounting/admin/payouts - List payouts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { listPayouts } from '@/lib/accounting/payout-service'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId') || undefined
    const status = searchParams.get('status') as any || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await listPayouts({
      partnerId,
      status,
      page,
      pageSize
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error listing payouts:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
