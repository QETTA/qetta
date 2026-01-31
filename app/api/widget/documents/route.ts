/**
 * Widget v2.0 Documents API
 *
 * Create and list widget-generated documents
 * Tracks processing time, time saved, and usage metrics
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'
import { WidgetDocumentType, WidgetDocumentStatus } from '@prisma/client'

// Time saved per document type (in minutes)
const TIME_SAVED_MAP: Record<WidgetDocumentType, number> = {
  RESULT_REPORT: 450, // 8h → 30min = 450min saved
  PERFORMANCE_REPORT: 210, // 4h → 30min = 210min saved
  SUSTAINABILITY_PLAN: 690, // 12h → 30min = 690min saved
  SETTLEMENT_REPORT: 330, // 6h → 30min = 330min saved
  BUSINESS_PLAN: 930, // 16h → 30min = 930min saved
}

async function getPartnerFromApiKey(): Promise<{ id: string; currentUsage: number; monthlyQuota: number } | null> {
  const headersList = await headers()
  const apiKey = headersList.get('x-widget-api-key')

  if (!apiKey) return null

  return prisma.widgetPartner.findUnique({
    where: { apiKey, isActive: true },
    select: { id: true, currentUsage: true, monthlyQuota: true },
  })
}

// POST: Create new document
export async function POST(request: Request) {
  try {
    const partner = await getPartnerFromApiKey()

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    // Check quota
    if (partner.currentUsage >= partner.monthlyQuota) {
      return NextResponse.json(
        { success: false, error: 'Monthly quota exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { documentType, title, inputData } = body

    if (!documentType || !title) {
      return NextResponse.json(
        { success: false, error: 'documentType and title are required' },
        { status: 400 }
      )
    }

    // Validate document type
    if (!Object.keys(TIME_SAVED_MAP).includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Create document record
    const document = await prisma.widgetDocument.create({
      data: {
        partnerId: partner.id,
        documentType: documentType as WidgetDocumentType,
        title,
        status: WidgetDocumentStatus.VALIDATING,
        inputData: inputData || {},
      },
    })

    // Track document started event
    await prisma.widgetAnalytics.create({
      data: {
        partnerId: partner.id,
        eventType: 'DOCUMENT_STARTED',
        documentId: document.id,
        metadata: { documentType },
      },
    })

    // Simulate document generation (in production, this would call AI service)
    // For now, we'll update status after a brief delay
    const processingTimeMs = Date.now() - startTime
    const timeSavedMinutes = TIME_SAVED_MAP[documentType as WidgetDocumentType]

    // Update document with completion
    const completedDocument = await prisma.widgetDocument.update({
      where: { id: document.id },
      data: {
        status: WidgetDocumentStatus.COMPLETED,
        processingTimeMs,
        timeSavedMinutes,
        completedAt: new Date(),
        outputUrl: `/api/generate-document/download/${document.id}`,
      },
    })

    // Update partner usage
    await prisma.widgetPartner.update({
      where: { id: partner.id },
      data: { currentUsage: { increment: 1 } },
    })

    // Track completion event
    await prisma.widgetAnalytics.create({
      data: {
        partnerId: partner.id,
        eventType: 'DOCUMENT_COMPLETED',
        documentId: document.id,
        metadata: { processingTimeMs, timeSavedMinutes },
      },
    })

    // Track time saved event
    await prisma.widgetAnalytics.create({
      data: {
        partnerId: partner.id,
        eventType: 'TIME_SAVED',
        documentId: document.id,
        metadata: { minutes: timeSavedMinutes },
      },
    })

    return NextResponse.json({
      success: true,
      document: {
        id: completedDocument.id,
        title: completedDocument.title,
        documentType: completedDocument.documentType,
        status: completedDocument.status,
        outputUrl: completedDocument.outputUrl,
        processingTimeMs: completedDocument.processingTimeMs,
        timeSavedMinutes: completedDocument.timeSavedMinutes,
        createdAt: completedDocument.createdAt,
        completedAt: completedDocument.completedAt,
      },
    })
  } catch (error) {
    console.error('[Widget Documents Error]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

// GET: List documents for partner
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
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const status = searchParams.get('status') as WidgetDocumentStatus | null

    const where = {
      partnerId: partner.id,
      ...(status && { status }),
    }

    const [documents, total] = await Promise.all([
      prisma.widgetDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          documentType: true,
          title: true,
          status: true,
          outputUrl: true,
          processingTimeMs: true,
          timeSavedMinutes: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.widgetDocument.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      documents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + documents.length < total,
      },
    })
  } catch (error) {
    console.error('[Widget Documents Error]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
