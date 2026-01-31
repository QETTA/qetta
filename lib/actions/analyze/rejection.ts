'use server'

/**
 * Server Action: Analyze Rejection
 *
 * 탈락 사유 심층 분석 (Extended Thinking)
 * Replaces: POST /api/analyze-rejection
 *
 * Features:
 * - Claude Opus 4.5 Extended Thinking (최대 10분 사고)
 * - 탈락 원인 구조화 분석
 * - 개선 방안 제시
 * - 재도전 전략 수립
 *
 * @see lib/skill-engine/rejection-analyzer
 */

import { revalidatePath } from 'next/cache'
import type { EnginePresetType } from '@/types/inbox'
import { rejectionAnalyzer } from '@/lib/skill-engine'
import { logger } from '@/lib/api/logger'

interface AnalyzeRejectionParams {
  rejectionText: string
  domain?: EnginePresetType | 'general'
  companyHistory?: {
    previousApplications?: number
    previousRejections?: number
    lastApplicationDate?: string
  }
}

export async function analyzeRejection(params: AnalyzeRejectionParams) {
  try {
    const { rejectionText, domain = 'general', companyHistory } = params

    if (!rejectionText || rejectionText.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'rejectionText is required',
        },
      }
    }

    // Extended Thinking 분석 실행
    const result = await rejectionAnalyzer.analyze(
      rejectionText,
      domain,
      companyHistory as Parameters<typeof rejectionAnalyzer.analyze>[2]
    )

    // Revalidate apply page (rejection analysis affects strategy)
    revalidatePath('/apply')

    return {
      success: true,
      data: result,
      message: '탈락 사유 분석 완료',
    }
  } catch (error) {
    logger.error('[Rejection Analysis Error]', error)

    return {
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
