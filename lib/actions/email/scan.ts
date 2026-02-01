'use server'

/**
 * Server Action: Scan Email
 *
 * 이메일 스캔 및 공고 추출
 * Replaces: POST /api/email/scan
 *
 * Features:
 * - Gmail/Outlook OAuth 연동
 * - 정부사업 공고 자동 추출
 * - 키워드 기반 필터링
 *
 * Note: Gmail/Outlook API 연동 필요
 */

import { logger } from '@/lib/api/logger'

interface ScanEmailParams {
  provider: 'gmail' | 'outlook'
  keywords?: string[]
  dateRange?: {
    from: string
    to: string
  }
}

export async function scanEmail(params: ScanEmailParams) {
  try {
    const { provider, keywords = [], dateRange: _dateRange } = params

    if (!provider) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'provider is required (gmail or outlook)',
        },
      }
    }

    logger.debug(`[Email Scan] Provider: ${provider}, Keywords: ${keywords.join(', ')}`)

    // OAuth 토큰이 아직 연동되지 않은 상태에서는 명확하게 안내
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `이메일 스캔 기능은 ${provider === 'gmail' ? 'Gmail' : 'Outlook'} OAuth 연동 후 사용 가능합니다. 설정 > 이메일 연동에서 계정을 연결해 주세요.`,
      },
    }
  } catch (error) {
    logger.error('[Email Scan Error]', error)

    return {
      success: false,
      error: {
        code: 'SCAN_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
