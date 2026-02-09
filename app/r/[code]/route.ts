/**
 * Referral Redirect Handler
 * GET /r/[code] - Track click and redirect to registration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getReferralLink, trackClick } from '@/lib/accounting/referral-service'

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code

    // Get referral link
    const linkResult = await getReferralLink(shortCode)

    if (!linkResult.success) {
      return NextResponse.redirect(new URL('/404', req.url))
    }

    // Track click
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0'
    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const referer = req.headers.get('referer') || undefined

    const trackResult = await trackClick(shortCode, {
      ipAddress,
      userAgent,
      referer
    })

    // Create redirect response
    const redirectUrl = new URL('/register', req.url)
    redirectUrl.searchParams.set('ref', shortCode)

    const response = NextResponse.redirect(redirectUrl)

    // Set attribution cookie (7-day expiry)
    const cookieValue = JSON.stringify({
      shortCode,
      linkId: trackResult.data.linkId,
      ipHash: trackResult.data.ipHash,
      userAgentHash: trackResult.data.userAgentHash,
      timestamp: Date.now()
    })

    response.cookies.set('qetta_ref', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('Error handling referral redirect:', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}
