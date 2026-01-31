/**
 * Widget v2.0 Auth API
 *
 * API key verification and partner configuration lookup
 * Used by embedded widget to authenticate and get partner settings
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const headersList = await headers()
    const apiKey = headersList.get('x-widget-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      )
    }

    const partner = await prisma.widgetPartner.findUnique({
      where: { apiKey },
      select: {
        id: true,
        name: true,
        slug: true,
        brandColor: true,
        logoUrl: true,
        allowedDomains: true,
        plan: true,
        monthlyQuota: true,
        currentUsage: true,
        isActive: true,
      },
    })

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    if (!partner.isActive) {
      return NextResponse.json(
        { success: false, error: 'Partner account is inactive' },
        { status: 403 }
      )
    }

    // Check quota
    const remainingQuota = partner.monthlyQuota - partner.currentUsage
    const quotaExceeded = remainingQuota <= 0

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        brandColor: partner.brandColor,
        logoUrl: partner.logoUrl,
        plan: partner.plan,
      },
      quota: {
        monthly: partner.monthlyQuota,
        used: partner.currentUsage,
        remaining: remainingQuota,
        exceeded: quotaExceeded,
      },
    })
  } catch (error) {
    console.error('[Widget Auth Error]', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
