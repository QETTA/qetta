/**
 * Admin API: Partner API Keys
 * POST /api/accounting/admin/partners/[id]/api-keys - Generate API key for partner
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { generateApiKey } from '@/lib/accounting/partner-service'
import { createApiKeySchema } from '@/lib/accounting/validation'

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

    // Validate input and inject partnerId
    const validation = createApiKeySchema.safeParse({
      ...body,
      partnerId: params.id
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const result = await generateApiKey(
      validation.data,
      session.user.id,
      session.user.email!
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error generating API key:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
