'use server'

/**
 * Server Action: Create Template
 *
 * 문서 템플릿 생성
 * Replaces: POST /api/templates
 *
 * Features:
 * - BLOCK 기반 템플릿 생성
 * - 도메인 엔진별 구조화
 * - 재사용 가능한 템플릿 관리
 */

import { logger } from '@/lib/api/logger'
import type { EnginePresetType } from '@/types/inbox'

interface CreateTemplateParams {
  name: string
  enginePreset: EnginePresetType
  documentType: string
  structure: Record<string, unknown>
  metadata?: {
    description?: string
    tags?: string[]
  }
}

export async function createTemplate(params: CreateTemplateParams) {
  try {
    const { name, enginePreset, documentType, structure, metadata: _metadata } = params

    if (!name || !enginePreset || !documentType || !structure) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'name, enginePreset, documentType, and structure are required',
        },
      }
    }

    logger.debug(`[Template Create] ${name} for ${enginePreset}/${documentType}`)

    // DB 연동 전까지는 명확한 에러 반환
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message:
          '템플릿 저장 기능은 데이터베이스 연동 후 사용 가능합니다. 현재는 기본 제공 템플릿만 사용할 수 있습니다.',
      },
    }
  } catch (error) {
    logger.error('[Template Creation Error]', error)

    return {
      success: false,
      error: {
        code: 'CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
