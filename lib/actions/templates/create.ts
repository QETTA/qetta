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

import { revalidatePath } from 'next/cache'
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

    // TODO: Implement template creation logic
    // 1. Validate template structure
    // 2. Store in database or file system
    // 3. Associate with domain engine
    // 4. Generate template ID

    // Placeholder implementation
    const templateId = `template-${Date.now()}`

    logger.debug(`[Template Create] ${name} for ${enginePreset}/${documentType}`)

    // Revalidate docs page (new template available)
    revalidatePath('/docs')

    return {
      success: true,
      data: {
        id: templateId,
        name,
        enginePreset,
        documentType,
        createdAt: new Date().toISOString(),
      },
      message: `템플릿 "${name}" 생성 완료`,
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
