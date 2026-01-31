/**
 * Widget v2.0 Document Detail API
 *
 * Get single document details by ID
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

async function getPartnerFromApiKey(): Promise<{ id: string } | null> {
  const headersList = await headers()
  const apiKey = headersList.get('x-widget-api-key')

  if (!apiKey) return null

  return prisma.widgetPartner.findUnique({
    where: { apiKey, isActive: true },
    select: { id: true },
  })
}

// GET: Get document by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partner = await getPartnerFromApiKey()

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const { id } = await params

    const document = await prisma.widgetDocument.findUnique({
      where: { id },
      select: {
        id: true,
        partnerId: true,
        documentType: true,
        title: true,
        status: true,
        inputData: true,
        outputUrl: true,
        outputFormat: true,
        pageCount: true,
        processingTimeMs: true,
        timeSavedMinutes: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    // Verify document belongs to partner
    if (document.partnerId !== partner.id) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    // Track download event if completed
    if (document.status === 'COMPLETED') {
      await prisma.widgetAnalytics.create({
        data: {
          partnerId: partner.id,
          eventType: 'DOCUMENT_DOWNLOADED',
          documentId: document.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentType: document.documentType,
        title: document.title,
        status: document.status,
        inputData: document.inputData,
        outputUrl: document.outputUrl,
        outputFormat: document.outputFormat,
        pageCount: document.pageCount,
        processingTimeMs: document.processingTimeMs,
        timeSavedMinutes: document.timeSavedMinutes,
        errorMessage: document.errorMessage,
        createdAt: document.createdAt,
        completedAt: document.completedAt,
      },
    })
  } catch (error) {
    console.error('[Widget Document Detail Error]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}
