'use server'

/**
 * Server Action: Execute Skill
 *
 * QETTA 도메인 엔진 스킬 실행
 * Replaces: POST /api/skill-engine
 *
 * Features:
 * - 탈락 사유 분석 (Extended Thinking)
 * - 신청서 사전 검증
 * - 매칭 프로그램 찾기
 * - 사업계획서 생성
 *
 * @see lib/skill-engine for core logic
 */

import { revalidatePath } from 'next/cache'
import type { EnginePresetType } from '@/types/inbox'
import { logger } from '@/lib/api/logger'

// Skill Engine Core
import { rejectionAnalyzer } from '@/lib/skill-engine'

// Gov Support Skills
import {
  findMatchingPrograms,
  preValidateApplication,
  PRE_STARTUP_PACKAGE,
  GOV_SUPPORT_PROGRAMS,
  generatePreStartupPlan,
  type GovSupportProgram,
  type BusinessPlanContext,
  type ProgramCategory,
} from '@/lib/skill-engine/skills/gov-support'

type SkillAction =
  | 'analyze-rejection'
  | 'pre-validate'
  | 'find-programs'
  | 'generate-plan'

interface ExecuteSkillParams {
  action: SkillAction
  domain?: EnginePresetType | 'general'
  data: Record<string, unknown>
}

export async function executeSkill(params: ExecuteSkillParams) {
  try {
    const { action, domain = 'general', data } = params

    if (!action) {
      return {
        success: false,
        error: 'action is required',
      }
    }

    switch (action) {
      // ----------------------------------------
      // 1. 탈락 사유 분석 (Extended Thinking)
      // ----------------------------------------
      case 'analyze-rejection': {
        const { rejectionText, companyHistory } = data as {
          rejectionText: string
          companyHistory?: unknown[]
        }

        if (!rejectionText) {
          return {
            success: false,
            error: 'rejectionText is required',
          }
        }

        const result = await rejectionAnalyzer.analyze(
          rejectionText,
          domain as EnginePresetType | 'general',
          companyHistory as Parameters<typeof rejectionAnalyzer.analyze>[2]
        )

        // Revalidate apply page (rejection analysis may affect matching)
        revalidatePath('/apply')

        return {
          success: true,
          action: 'analyze-rejection',
          result,
        }
      }

      // ----------------------------------------
      // 2. 신청서 사전 검증
      // ----------------------------------------
      case 'pre-validate': {
        const { context, programId } = data as {
          context: BusinessPlanContext
          programId?: string
        }

        if (!context) {
          return {
            success: false,
            error: 'context is required',
          }
        }

        // 프로그램 찾기
        let program: GovSupportProgram = PRE_STARTUP_PACKAGE
        if (programId) {
          const found = GOV_SUPPORT_PROGRAMS.find((p) => p.id === programId)
          if (found) program = found
        }

        const result = preValidateApplication(context, program)

        return {
          success: true,
          action: 'pre-validate',
          program: {
            id: program.id,
            name: program.name,
            category: program.category,
          },
          result,
        }
      }

      // ----------------------------------------
      // 3. 매칭 프로그램 찾기
      // ----------------------------------------
      case 'find-programs': {
        const { company, preferredCategories } = data as {
          company: {
            age: number
            employees: number
            revenue: number
            region: string
            certifications: string[]
          }
          preferredCategories?: ProgramCategory[]
        }

        if (!company) {
          return {
            success: false,
            error: 'company data is required',
          }
        }

        const result = findMatchingPrograms(company, preferredCategories)

        return {
          success: true,
          action: 'find-programs',
          result,
        }
      }

      // ----------------------------------------
      // 4. 사업계획서 생성
      // ----------------------------------------
      case 'generate-plan': {
        const { context } = data as {
          context: BusinessPlanContext
        }

        if (!context) {
          return {
            success: false,
            error: 'context is required',
          }
        }

        const result = generatePreStartupPlan(context)

        // Revalidate docs page (new plan generated)
        revalidatePath('/docs')

        return {
          success: true,
          action: 'generate-plan',
          result,
        }
      }

      default:
        return {
          success: false,
          error: `Unsupported action: ${action}`,
        }
    }
  } catch (error) {
    logger.error('[Skill Execution Error]', error)

    return {
      success: false,
      error: {
        code: 'SKILL_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
