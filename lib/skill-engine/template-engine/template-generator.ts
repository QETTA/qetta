/**
 * QETTA Template Generator
 *
 * 공고문에서 추출한 정보로 재사용 가능한 템플릿 생성
 *
 * 핵심 기능:
 * 1. 공고문 분석 → 템플릿 구조 생성
 * 2. 도메인별 섹션 자동 추가
 * 3. 변수 자동 매핑
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { EnginePresetType } from '@/types/inbox'
import type { RawAnnouncement } from '../skills/announcement'
import {
  type DocumentTemplate,
  type TemplateSection,
  type TemplateVariable,
  type TemplateType,
  type TemplateGenerationRequest,
  type TemplateGenerationResult,
  type TemplateFillData,
  type TemplateFillResult,
  type ValidationError,
  COMMON_VARIABLES,
} from './types'
import { variableExtractor } from './variable-extractor'
import { getDomainConfig, getDomainVariables, getDomainSections } from './domain-customization'

// ============================================
// 기본 섹션 정의
// ============================================

const BASE_SECTIONS: Record<TemplateType, TemplateSection[]> = {
  application_form: [
    {
      id: 'applicant_info',
      type: 'applicant_info',
      title: '신청자 정보',
      titleEn: 'Applicant Information',
      order: 1,
      required: true,
      variableIds: ['company_name', 'business_number', 'ceo_name', 'company_address'],
      guidelines: ['사업자등록증과 일치하는 정보 기재'],
    },
    {
      id: 'contact_info',
      type: 'custom',
      title: '담당자 정보',
      titleEn: 'Contact Information',
      order: 2,
      required: true,
      variableIds: ['contact_name', 'contact_phone', 'contact_email'],
      guidelines: ['실제 연락 가능한 담당자 정보 기재'],
    },
  ],
  business_plan: [
    {
      id: 'company_overview',
      type: 'company_overview',
      title: '기업 개요',
      titleEn: 'Company Overview',
      order: 1,
      required: true,
      variableIds: ['company_name', 'established_date', 'employee_count', 'annual_revenue', 'industry_code'],
      maxLength: 2000,
      guidelines: ['회사 연혁, 주요 사업 분야, 경쟁력 등 기재'],
    },
    {
      id: 'project_plan',
      type: 'project_plan',
      title: '사업 계획',
      titleEn: 'Project Plan',
      order: 2,
      required: true,
      variableIds: ['project_name', 'project_summary', 'project_period', 'project_goal'],
      maxLength: 5000,
      guidelines: [
        '사업 목표 및 필요성',
        '추진 전략 및 방법론',
        '기대 효과 (정량적/정성적)',
      ],
    },
    {
      id: 'budget_plan',
      type: 'budget_plan',
      title: '예산 계획',
      titleEn: 'Budget Plan',
      order: 3,
      required: true,
      variableIds: ['total_budget', 'government_funding', 'self_funding'],
      guidelines: [
        '항목별 예산 산출 근거 제시',
        '자부담금 조달 계획',
      ],
    },
    {
      id: 'expected_outcome',
      type: 'expected_outcome',
      title: '기대 성과',
      titleEn: 'Expected Outcome',
      order: 4,
      required: true,
      variableIds: [],
      maxLength: 2000,
      guidelines: [
        '매출 증대, 고용 창출 등 정량적 성과',
        '기술 고도화, 시장 확대 등 정성적 성과',
      ],
    },
    {
      id: 'team_info',
      type: 'team_info',
      title: '추진 체계',
      titleEn: 'Team Structure',
      order: 5,
      required: false,
      variableIds: [],
      guidelines: ['핵심 인력 현황', '역할 분담 계획'],
    },
    {
      id: 'implementation_plan',
      type: 'implementation_plan',
      title: '추진 일정',
      titleEn: 'Implementation Schedule',
      order: 6,
      required: true,
      variableIds: ['project_period'],
      guidelines: ['월별/분기별 세부 일정', '마일스톤 제시'],
    },
  ],
  budget_plan: [
    {
      id: 'budget_summary',
      type: 'budget_plan',
      title: '예산 총괄',
      titleEn: 'Budget Summary',
      order: 1,
      required: true,
      variableIds: ['total_budget', 'government_funding', 'self_funding'],
    },
    {
      id: 'budget_detail',
      type: 'custom',
      title: '세부 예산',
      titleEn: 'Budget Details',
      order: 2,
      required: true,
      variableIds: [],
      guidelines: ['항목별 단가 및 수량 명시', '산출 근거 첨부'],
    },
  ],
  performance_report: [
    {
      id: 'performance_summary',
      type: 'custom',
      title: '실적 요약',
      titleEn: 'Performance Summary',
      order: 1,
      required: true,
      variableIds: ['project_name', 'project_period'],
    },
    {
      id: 'achievement',
      type: 'custom',
      title: '주요 성과',
      titleEn: 'Key Achievements',
      order: 2,
      required: true,
      variableIds: [],
      maxLength: 5000,
    },
    {
      id: 'financial_report',
      type: 'budget_plan',
      title: '예산 집행 현황',
      titleEn: 'Budget Execution',
      order: 3,
      required: true,
      variableIds: ['total_budget'],
    },
  ],
  settlement_report: [
    {
      id: 'settlement_summary',
      type: 'budget_plan',
      title: '정산 총괄',
      titleEn: 'Settlement Summary',
      order: 1,
      required: true,
      variableIds: ['total_budget', 'government_funding', 'self_funding'],
    },
    {
      id: 'expenditure_detail',
      type: 'custom',
      title: '지출 내역',
      titleEn: 'Expenditure Details',
      order: 2,
      required: true,
      variableIds: [],
      guidelines: ['증빙 서류 첨부', 'SHA-256 해시 검증'],
    },
  ],
  checklist: [
    {
      id: 'document_checklist',
      type: 'custom',
      title: '제출 서류 체크리스트',
      titleEn: 'Document Checklist',
      order: 1,
      required: true,
      variableIds: [],
    },
    {
      id: 'eligibility_checklist',
      type: 'custom',
      title: '자격 요건 체크리스트',
      titleEn: 'Eligibility Checklist',
      order: 2,
      required: true,
      variableIds: [],
    },
  ],
}

// ============================================
// Template Generator Class
// ============================================

export class TemplateGenerator {
  /**
   * 공고문에서 템플릿 생성
   */
  async generateFromAnnouncement(
    request: TemplateGenerationRequest
  ): Promise<TemplateGenerationResult> {
    const startTime = Date.now()

    try {
      const { announcement, domain, templateType, additionalRequirements } = request

      // 유효성 검사
      if (!announcement) {
        return {
          success: false,
          error: {
            code: 'INVALID_ANNOUNCEMENT',
            message: 'Announcement is required',
          },
        }
      }

      if (!templateType) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Template type is required',
          },
        }
      }

      // 1. 변수 추출
    const extractionResult = variableExtractor.extractFromAnnouncement(announcement)

    // 2. 기본 섹션 가져오기
    const baseSections = [...(BASE_SECTIONS[templateType] || [])]

    // 3. 도메인별 섹션 추가
    const domainSections = getDomainSections(domain)
    const allSections = this.mergeSections(baseSections, domainSections)

    // 4. 기본 변수 가져오기
    const baseVariables = this.getBaseVariables()

    // 5. 도메인별 변수 추가
    const domainVariables = getDomainVariables(domain)

    // 6. 추출된 변수와 병합
    const allVariables = this.mergeVariables([
      ...baseVariables,
      ...domainVariables,
      ...extractionResult.variables,
    ])

    // 7. 섹션에 변수 매핑
    const mappedSections = this.mapVariablesToSections(allSections, allVariables)

    // 8. 공고문 요구사항 반영
    const sectionsWithRequirements = this.applyAnnouncementRequirements(
      mappedSections,
      announcement
    )

    // 9. 추가 요구사항 반영
    if (additionalRequirements && additionalRequirements.length > 0) {
      // 추가 요구사항을 커스텀 섹션으로 추가
      const customSection: TemplateSection = {
        id: 'additional_requirements',
        type: 'custom',
        title: '추가 요구사항',
        titleEn: 'Additional Requirements',
        order: sectionsWithRequirements.length + 1,
        required: true,
        variableIds: [],
        guidelines: additionalRequirements,
      }
      sectionsWithRequirements.push(customSection)
    }

    // 10. 템플릿 ID 생성
    const templateId = this.generateTemplateId(announcement, templateType)

    // 11. 템플릿 생성
    const template: DocumentTemplate = {
      id: templateId,
      name: this.generateTemplateName(announcement, templateType),
      nameEn: this.generateTemplateNameEn(announcement, templateType),
      type: templateType,
      domain,
      version: '1.0.0',
      sections: sectionsWithRequirements,
      variables: allVariables,
      outputFormats: this.getOutputFormats(templateType),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceInfo: {
        announcementId: announcement.id,
        announcementTitle: announcement.title,
        announcementUrl: announcement.sourceUrl,
        extractedAt: new Date().toISOString(),
      },
      metadata: {
        usageCount: 0,
        tags: this.generateTags(announcement, domain),
      },
    }

    // 12. 분석 결과 생성
    const analysis = {
      extractedRequirements: this.countRequirements(announcement),
      autoMappedVariables: extractionResult.variables.filter((v) => v.confidence >= 0.8).length,
      manualReviewNeeded: extractionResult.variables.filter((v) => v.confidence < 0.8).length,
      confidence: this.calculateOverallConfidence(extractionResult.variables),
    }

    // 13. 경고 메시지 생성
    const warnings = this.generateWarnings(announcement, extractionResult.variables)

    // 14. 추천 사항 생성
    const recommendations = this.generateRecommendations(announcement, domain, templateType)

      return {
        success: true,
        template,
        extractedVariables: extractionResult.variables,
        stats: {
          ...analysis,
          processingTime: Date.now() - startTime,
        },
        warnings,
        generatedAt: new Date().toISOString(),
        recommendations,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TEMPLATE_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: { originalError: String(error) },
        },
      }
    }
  }

  /**
   * 템플릿에 데이터 채우기 검증
   */
  validateFillData(template: DocumentTemplate, data: TemplateFillData): TemplateFillResult {
    const missingRequired: string[] = []
    const validationErrors: ValidationError[] = []
    const warnings: string[] = []

    let filledCount = 0
    let totalRequired = 0

    // 각 변수 검증
    for (const variable of template.variables) {
      const value = data.values[variable.id]

      // 필수 변수 체크
      if (variable.required) {
        totalRequired++
        if (value === undefined || value === null || value === '') {
          missingRequired.push(variable.id)
        } else {
          filledCount++
        }
      }

      // 값이 있으면 유효성 검증
      if (value !== undefined && value !== null && value !== '') {
        const errors = this.validateVariableValue(variable, value)
        validationErrors.push(...errors)

        if (!variable.required) {
          filledCount++
        }
      }
    }

    // 완성도 계산
    const completeness = totalRequired > 0 ? (filledCount / totalRequired) * 100 : 100

    // 경고 생성
    if (completeness < 50) {
      warnings.push('필수 항목의 50% 미만만 작성되었습니다')
    }

    if (validationErrors.length > 0) {
      warnings.push(`${validationErrors.length}개의 입력값 오류가 있습니다`)
    }

    return {
      success: missingRequired.length === 0 && validationErrors.length === 0,
      missingRequired,
      validationErrors,
      warnings,
      completeness: Math.round(completeness),
    }
  }

  /**
   * 템플릿 데이터로 Mustache 텍스트 치환
   */
  fillTemplate(templateText: string, data: Record<string, string | number | boolean>): string {
    let result = templateText

    // Mustache 변수 치환 ({{변수}})
    const regex = /\{\{([^}]+)\}\}/g
    result = result.replace(regex, (match, varName) => {
      const key = varName.trim().replace(/\s+/g, '_').toLowerCase()
      const value = data[key]
      return value !== undefined ? String(value) : match
    })

    return result
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * 기본 변수 가져오기
   */
  private getBaseVariables(): TemplateVariable[] {
    const variables: TemplateVariable[] = []

    for (const category of Object.keys(COMMON_VARIABLES)) {
      const categoryVars = COMMON_VARIABLES[category as keyof typeof COMMON_VARIABLES]
      variables.push(...categoryVars)
    }

    return variables
  }

  /**
   * 섹션 병합 (중복 제거, 순서 정렬)
   */
  private mergeSections(
    baseSections: TemplateSection[],
    domainSections: TemplateSection[]
  ): TemplateSection[] {
    const merged = [...baseSections]
    const existingIds = new Set(baseSections.map((s) => s.id))

    for (const section of domainSections) {
      if (!existingIds.has(section.id)) {
        merged.push(section)
      }
    }

    // 순서대로 정렬
    return merged.sort((a, b) => a.order - b.order)
  }

  /**
   * 변수 병합 (중복 제거)
   */
  private mergeVariables(variables: TemplateVariable[]): TemplateVariable[] {
    const seen = new Map<string, TemplateVariable>()

    for (const v of variables) {
      if (!seen.has(v.id)) {
        seen.set(v.id, v)
      } else {
        // 기존 변수와 병합 (더 상세한 정보 유지)
        const existing = seen.get(v.id)!
        seen.set(v.id, {
          ...existing,
          description: v.description || existing.description,
          validation: v.validation || existing.validation,
          example: v.example || existing.example,
        })
      }
    }

    return Array.from(seen.values())
  }

  /**
   * 섹션에 변수 매핑
   */
  private mapVariablesToSections(
    sections: TemplateSection[],
    variables: TemplateVariable[]
  ): TemplateSection[] {
    const variableMap = new Map(variables.map((v) => [v.id, v]))

    return sections.map((section) => {
      // 기존 variableIds가 유효한지 확인
      const validVariableIds = section.variableIds.filter((id) => variableMap.has(id))
      return {
        ...section,
        variableIds: validVariableIds,
      }
    })
  }

  /**
   * 공고문 요구사항 반영
   */
  private applyAnnouncementRequirements(
    sections: TemplateSection[],
    announcement: RawAnnouncement
  ): TemplateSection[] {
    return sections.map((section) => {
      // 공고문에서 해당 섹션 관련 요구사항 찾기
      let originalRequirement: string | undefined

      if (section.type === 'company_overview' && announcement.eligibilityText) {
        originalRequirement = announcement.eligibilityText
      } else if (section.type === 'budget_plan' && announcement.supportText) {
        originalRequirement = announcement.supportText
      }

      // 제출 서류에서 가이드라인 추가
      const relatedDocs = announcement.requiredDocuments?.filter(
        (doc) =>
          doc.name.includes('사업계획') ||
          doc.name.includes('신청서') ||
          doc.name.includes('예산')
      )

      const additionalGuidelines = relatedDocs?.map(
        (doc) => `${doc.name} ${doc.format ? `(${doc.format})` : ''} ${doc.notes || ''}`
      )

      return {
        ...section,
        originalRequirement,
        guidelines: [
          ...(section.guidelines || []),
          ...(additionalGuidelines || []),
        ],
      }
    })
  }

  /**
   * 변수값 유효성 검증
   */
  private validateVariableValue(
    variable: TemplateVariable,
    value: string | number | boolean
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const validation = variable.validation

    if (!validation) return errors

    const strValue = String(value)

    // 길이 검증
    if (validation.minLength !== undefined && strValue.length < validation.minLength) {
      errors.push({
        variableId: variable.id,
        message: `최소 ${validation.minLength}자 이상이어야 합니다`,
        value: strValue,
      })
    }

    if (validation.maxLength !== undefined && strValue.length > validation.maxLength) {
      errors.push({
        variableId: variable.id,
        message: `최대 ${validation.maxLength}자까지 입력 가능합니다`,
        value: strValue,
      })
    }

    // 숫자 범위 검증
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push({
          variableId: variable.id,
          message: `${validation.min} 이상이어야 합니다`,
          value: strValue,
        })
      }

      if (validation.max !== undefined && value > validation.max) {
        errors.push({
          variableId: variable.id,
          message: `${validation.max} 이하여야 합니다`,
          value: strValue,
        })
      }
    }

    // 패턴 검증
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(strValue)) {
        errors.push({
          variableId: variable.id,
          message: validation.errorMessage || '올바른 형식이 아닙니다',
          value: strValue,
        })
      }
    }

    return errors
  }

  /**
   * 템플릿 ID 생성
   */
  private generateTemplateId(announcement: RawAnnouncement, type: TemplateType): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const hash = this.simpleHash(`${announcement.id}-${type}-${Date.now()}`).toString(16).slice(0, 8)
    return `tmpl-${type}-${date}-${hash}`
  }

  /**
   * 템플릿 이름 생성 (한글)
   */
  private generateTemplateName(announcement: RawAnnouncement, type: TemplateType): string {
    const typeNames: Record<TemplateType, string> = {
      application_form: '신청서',
      business_plan: '사업계획서',
      budget_plan: '예산서',
      performance_report: '실적보고서',
      settlement_report: '정산보고서',
      checklist: '체크리스트',
    }

    const programName = announcement.programName.slice(0, 30)
    return `${programName} ${typeNames[type]}`
  }

  /**
   * 템플릿 이름 생성 (영문)
   */
  private generateTemplateNameEn(announcement: RawAnnouncement, type: TemplateType): string {
    const typeNames: Record<TemplateType, string> = {
      application_form: 'Application Form',
      business_plan: 'Business Plan',
      budget_plan: 'Budget Plan',
      performance_report: 'Performance Report',
      settlement_report: 'Settlement Report',
      checklist: 'Checklist',
    }

    return `${announcement.programName.slice(0, 30)} ${typeNames[type]}`
  }

  /**
   * 출력 형식 결정
   */
  private getOutputFormats(type: TemplateType): ('DOCX' | 'PDF' | 'XLSX')[] {
    switch (type) {
      case 'application_form':
      case 'business_plan':
        return ['DOCX', 'PDF']
      case 'budget_plan':
      case 'settlement_report':
        return ['XLSX', 'PDF']
      case 'performance_report':
        return ['DOCX', 'PDF', 'XLSX']
      case 'checklist':
        return ['DOCX', 'PDF']
      default:
        return ['DOCX', 'PDF']
    }
  }

  /**
   * 태그 생성
   */
  private generateTags(announcement: RawAnnouncement, domain: EnginePresetType): string[] {
    const tags: string[] = [domain]

    // 출처 추가
    if (announcement.source) {
      tags.push(announcement.source)
    }

    // 연도 추가
    if (announcement.year) {
      tags.push(String(announcement.year))
    }

    // 지원 내용에서 키워드 추출
    if (announcement.supportParsed?.supportItems) {
      tags.push(...announcement.supportParsed.supportItems.slice(0, 3))
    }

    return [...new Set(tags)]
  }

  /**
   * 요구사항 수 계산
   */
  private countRequirements(announcement: RawAnnouncement): number {
    let count = 0

    if (announcement.requiredDocuments) count += announcement.requiredDocuments.length
    if (announcement.evaluationCriteria) count += announcement.evaluationCriteria.length
    if (announcement.eligibilityParsed) count += Object.keys(announcement.eligibilityParsed).length
    if (announcement.supportParsed) count += Object.keys(announcement.supportParsed).length

    return count
  }

  /**
   * 전체 신뢰도 계산
   */
  private calculateOverallConfidence(variables: { confidence: number }[]): number {
    if (variables.length === 0) return 0

    const sum = variables.reduce((acc, v) => acc + v.confidence, 0)
    return Math.round((sum / variables.length) * 100) / 100
  }

  /**
   * 경고 메시지 생성
   */
  private generateWarnings(
    announcement: RawAnnouncement,
    variables: { id: string; confidence: number }[]
  ): string[] {
    const warnings: string[] = []

    // 마감일 경고
    if (announcement.schedule.applicationEnd) {
      const deadline = new Date(announcement.schedule.applicationEnd)
      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      if (daysLeft <= 7 && daysLeft > 0) {
        warnings.push(`⚠️ 신청 마감일까지 ${daysLeft}일 남았습니다`)
      } else if (daysLeft <= 0) {
        warnings.push('⚠️ 신청 마감일이 지났습니다')
      }
    }

    // 낮은 신뢰도 변수 경고
    const lowConfidenceVars = variables.filter((v) => v.confidence < 0.7)
    if (lowConfidenceVars.length > 0) {
      warnings.push(
        `⚠️ ${lowConfidenceVars.length}개 변수의 추출 신뢰도가 낮습니다. 수동 확인이 필요합니다.`
      )
    }

    // 필수 서류 경고
    if (announcement.requiredDocuments) {
      const criticalDocs = announcement.requiredDocuments.filter(
        (d) => d.required && d.format === '지정양식'
      )
      if (criticalDocs.length > 0) {
        warnings.push(
          `⚠️ ${criticalDocs.length}개의 지정양식 서류가 필요합니다. 첨부파일을 확인하세요.`
        )
      }
    }

    return warnings
  }

  /**
   * 추천 사항 생성
   */
  private generateRecommendations(
    announcement: RawAnnouncement,
    domain: EnginePresetType,
    type: TemplateType
  ): string[] {
    const recommendations: string[] = []

    // 도메인별 추천
    const domainConfig = getDomainConfig(domain)
    if (domainConfig.additionalSections.length > 0) {
      recommendations.push(
        `💡 ${domain} 도메인에 맞춘 ${domainConfig.additionalSections.length}개의 추가 섹션이 포함되었습니다`
      )
    }

    // 평가 기준 기반 추천
    if (announcement.evaluationCriteria) {
      const topCriteria = announcement.evaluationCriteria
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 2)

      if (topCriteria.length > 0) {
        recommendations.push(
          `💡 평가 배점이 높은 항목: ${topCriteria.map((c) => c.category).join(', ')}`
        )
      }
    }

    // 제출 서류 추천
    if (type === 'business_plan' && announcement.requiredDocuments) {
      const attachments = announcement.attachments?.filter((a) => a.type === 'template')
      if (attachments && attachments.length > 0) {
        recommendations.push('💡 공고문에 첨부된 양식 파일을 참고하세요')
      }
    }

    return recommendations
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const templateGenerator = new TemplateGenerator()
