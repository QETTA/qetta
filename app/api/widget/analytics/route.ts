/**
 * Widget v2.0 Analytics API
 *
 * Track widget events and retrieve usage statistics
 * Events: WIDGET_OPENED, DOCUMENT_STARTED, DOCUMENT_COMPLETED, etc.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'
import { WidgetEventType } from '@prisma/client'

async function getPartnerFromApiKey(): Promise<{ id: string } | null> {
  const headersList = await headers()
  const apiKey = headersList.get('x-widget-api-key')

  if (!apiKey) return null

  return prisma.widgetPartner.findUnique({
    where: { apiKey, isActive: true },
    select: { id: true },
  })
}

// POST: Track an event
export async function POST(request: Request) {
  try {
    const partner = await getPartnerFromApiKey()

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventType, documentId, metadata } = body

    if (!eventType) {
      return NextResponse.json(
        { success: false, error: 'eventType is required' },
        { status: 400 }
      )
    }

    // Validate event type
    const validEventTypes: WidgetEventType[] = [
      'WIDGET_OPENED',
      'DOCUMENT_STARTED',
      'DOCUMENT_COMPLETED',
      'DOCUMENT_FAILED',
      'DOCUMENT_DOWNLOADED',
      'TIME_SAVED',
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      )
    }

    const event = await prisma.widgetAnalytics.create({
      data: {
        partnerId: partner.id,
        eventType: eventType as WidgetEventType,
        documentId: documentId || null,
        metadata: metadata || {},
      },
    })

    return NextResponse.json({
      success: true,
      eventId: event.id,
    })
  } catch (error) {
    console.error('[Widget Analytics Error]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    )
  }
}

// GET: Get usage statistics
export async function GET(request: Request) {
  try {
    const partner = await getPartnerFromApiKey()

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d

    // Calculate date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Aggregate statistics
    const [
      totalDocuments,
      completedDocuments,
      failedDocuments,
      totalTimeSaved,
      eventCounts,
    ] = await Promise.all([
      // Total documents in period
      prisma.widgetDocument.count({
        where: {
          partnerId: partner.id,
          createdAt: { gte: startDate },
        },
      }),
      // Completed documents
      prisma.widgetDocument.count({
        where: {
          partnerId: partner.id,
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      }),
      // Failed documents
      prisma.widgetDocument.count({
        where: {
          partnerId: partner.id,
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
      }),
      // Total time saved
      prisma.widgetDocument.aggregate({
        where: {
          partnerId: partner.id,
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        _sum: { timeSavedMinutes: true },
      }),
      // Event counts by type
      prisma.widgetAnalytics.groupBy({
        by: ['eventType'],
        where: {
          partnerId: partner.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ])

    // Convert event counts to object
    const events = eventCounts.reduce(
      (acc: Record<string, number>, { eventType, _count }: { eventType: string; _count: number }) => {
        acc[eventType] = _count
        return acc
      },
      {} as Record<string, number>
    )

    const timeSavedMinutes = totalTimeSaved._sum.timeSavedMinutes || 0
    const timeSavedHours = Math.round(timeSavedMinutes / 60)

    return NextResponse.json({
      success: true,
      period,
      stats: {
        documents: {
          total: totalDocuments,
          completed: completedDocuments,
          failed: failedDocuments,
          successRate: totalDocuments > 0
            ? Math.round((completedDocuments / totalDocuments) * 100)
            : 0,
        },
        timeSaved: {
          minutes: timeSavedMinutes,
          hours: timeSavedHours,
          // 93.8% time reduction benchmark
          percentageReduction: 93.8,
        },
        events,
      },
    })
  } catch (error) {
    console.error('[Widget Analytics Error]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
