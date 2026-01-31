import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  industry: z.string().min(1, 'Industry is required'),
  source: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Upsert to handle duplicate signups gracefully
    await prisma.betaWaitlist.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        company: data.company,
        industry: data.industry,
        source: data.source ?? 'beta-landing',
      },
      create: {
        email: data.email,
        name: data.name,
        company: data.company,
        industry: data.industry,
        source: data.source ?? 'beta-landing',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('Beta signup error:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}
