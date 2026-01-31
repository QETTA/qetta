import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/api/logger'

// 이메일 검증 헬퍼
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// POST: 웨이트리스트 등록
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, company, industry } = body

    // 이메일 검증
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: '유효한 이메일을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 중복 확인
    const existing = await prisma.betaWaitlist.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      )
    }

    // 등록
    const entry = await prisma.betaWaitlist.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        company: company || null,
        industry: industry || null,
        source: 'landing',
      },
    })

    return NextResponse.json({
      success: true,
      id: entry.id,
      message: '베타 프로그램 신청이 완료되었습니다.',
    })
  } catch (error) {
    logger.error('[Waitlist] Registration error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}

// GET: 관리자용 조회 (Admin 인증 필수)
export async function GET(req: Request) {
  try {
    // Admin 인증 확인
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      logger.warn(`[Waitlist] Forbidden access attempt by user: ${session.user.email}`)
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [entries, total] = await Promise.all([
      prisma.betaWaitlist.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.betaWaitlist.count(),
    ])

    return NextResponse.json({
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('[Waitlist] Fetch error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
