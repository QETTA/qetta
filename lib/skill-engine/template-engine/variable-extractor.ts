/**
 * QETTA Variable Extractor
 *
 * 공고문에서 변수를 자동 추출하는 엔진
 *
 * 핵심 기능:
 * 1. Mustache 스타일 변수 추출 ({{변수명}})
 * 2. 자연어 패턴 기반 변수 추출
 * 3. 공고문 섹션별 변수 매핑
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { RawAnnouncement } from '../skills/announcement'
import {
  type VariableCategory,
  type VariableType,
  type ExtractedVariable,
  type VariableExtractionResult,
  COMMON_VARIABLES,
} from './types'

// ============================================
// 변수 추출 패턴
// ============================================

interface VariablePattern {
  /** 패턴 ID */
  id: string
  /** 정규식 패턴 */
  regex: RegExp
  /** 추출할 변수 카테고리 */
  category: VariableCategory
  /** 변수 타입 */
  type: VariableType
  /** 기본 신뢰도 */
  baseConfidence: number
  /** 변수명 생성 함수 */
  nameGenerator: (match: RegExpMatchArray) => { id: string; name: string; nameEn: string }
}

const EXTRACTION_PATTERNS: VariablePattern[] = [
  // ============================================
  // 1. Mustache 스타일 변수 ({{변수}})
  // ============================================
  {
    id: 'mustache_variable',
    regex: /\{\{([^}]+)\}\}/g,
    category: 'custom',
    type: 'text',
    baseConfidence: 1.0,
    nameGenerator: (match) => {
      const varName = match[1].trim()
      const snakeCase = varName.replace(/\s+/g, '_').toLowerCase()
      return {
        id: snakeCase,
        name: varName,
        nameEn: snakeCase,
      }
    },
  },

  // ============================================
  // 2. 회사 정보 패턴
  // ============================================
  {
    id: 'company_name_pattern',
    regex: /(?:회사명|업체명|기업명)\s*[:：]?\s*([가-힣\w\s()]+?)(?:\n|$|,)/g,
    category: 'company',
    type: 'text',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'company_name',
      name: '회사명',
      nameEn: 'Company Name',
    }),
  },
  {
    id: 'business_number_pattern',
    regex: /(?:사업자\s*등록\s*번호|사업자번호)\s*[:：]?\s*(\d{3}-?\d{2}-?\d{5})/g,
    category: 'company',
    type: 'text',
    baseConfidence: 0.95,
    nameGenerator: () => ({
      id: 'business_number',
      name: '사업자등록번호',
      nameEn: 'Business Registration Number',
    }),
  },
  {
    id: 'ceo_name_pattern',
    regex: /(?:대표\s*(?:자\s*)?(?:성\s*)?명|대표자)\s*[:：]?\s*([가-힣]{2,5})/g,
    category: 'company',
    type: 'text',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'ceo_name',
      name: '대표자명',
      nameEn: 'CEO Name',
    }),
  },
  {
    id: 'employee_count_pattern',
    regex: /(?:상시\s*)?(?:근로자|종업원|직원)\s*(?:수|인원)\s*[:：]?\s*(\d+)\s*(?:명|인)?/g,
    category: 'company',
    type: 'number',
    baseConfidence: 0.85,
    nameGenerator: () => ({
      id: 'employee_count',
      name: '상시근로자 수',
      nameEn: 'Employee Count',
    }),
  },

  // ============================================
  // 3. 재무 정보 패턴
  // ============================================
  {
    id: 'annual_revenue_pattern',
    regex: /(?:연\s*)?매출(?:액)?\s*[:：]?\s*(\d+(?:,\d{3})*)\s*(억|만)\s*원?/g,
    category: 'financial',
    type: 'currency',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'annual_revenue',
      name: '연매출액',
      nameEn: 'Annual Revenue',
    }),
  },
  {
    id: 'capital_pattern',
    regex: /(?:자본금|납입\s*자본)\s*[:：]?\s*(\d+(?:,\d{3})*)\s*(억|만)\s*원?/g,
    category: 'financial',
    type: 'currency',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'capital',
      name: '자본금',
      nameEn: 'Capital',
    }),
  },
  {
    id: 'total_budget_pattern',
    regex: /(?:총\s*)?(?:사업비|예산)\s*[:：]?\s*(\d+(?:,\d{3})*)\s*(억|만)\s*원?/g,
    category: 'financial',
    type: 'currency',
    baseConfidence: 0.85,
    nameGenerator: () => ({
      id: 'total_budget',
      name: '총 사업비',
      nameEn: 'Total Budget',
    }),
  },
  {
    id: 'government_funding_pattern',
    regex: /(?:정부\s*)?(?:지원금|보조금|출연금)\s*[:：]?\s*(\d+(?:,\d{3})*)\s*(억|만)\s*원?/g,
    category: 'financial',
    type: 'currency',
    baseConfidence: 0.85,
    nameGenerator: () => ({
      id: 'government_funding',
      name: '정부지원금',
      nameEn: 'Government Funding',
    }),
  },
  {
    id: 'self_funding_pattern',
    regex: /(?:자부담|민간\s*부담|기업\s*부담)\s*[:：]?\s*(\d+(?:,\d{3})*)\s*(억|만)\s*원?/g,
    category: 'financial',
    type: 'currency',
    baseConfidence: 0.85,
    nameGenerator: () => ({
      id: 'self_funding',
      name: '자부담금',
      nameEn: 'Self Funding',
    }),
  },

  // ============================================
  // 4. 프로젝트 정보 패턴
  // ============================================
  {
    id: 'project_name_pattern',
    regex: /(?:사업명|과제명|프로젝트명)\s*[:：]?\s*([^\n]+)/g,
    category: 'project',
    type: 'text',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'project_name',
      name: '사업명',
      nameEn: 'Project Name',
    }),
  },
  {
    id: 'project_period_pattern',
    regex: /(?:사업\s*)?기간\s*[:：]?\s*(\d{4}[.\-/]\d{1,2}[.\-/]?\d{0,2})\s*[~\-]\s*(\d{4}[.\-/]\d{1,2}[.\-/]?\d{0,2})/g,
    category: 'project',
    type: 'text',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'project_period',
      name: '사업 기간',
      nameEn: 'Project Period',
    }),
  },

  // ============================================
  // 5. 기술 정보 패턴
  // ============================================
  {
    id: 'patent_count_pattern',
    regex: /(?:특허|지식재산)\s*(?:수|보유)\s*[:：]?\s*(\d+)\s*(?:건|개)?/g,
    category: 'technical',
    type: 'number',
    baseConfidence: 0.8,
    nameGenerator: () => ({
      id: 'patent_count',
      name: '보유 특허 수',
      nameEn: 'Patent Count',
    }),
  },
  {
    id: 'certification_pattern',
    regex: /(?:보유\s*)?(?:인증|자격)\s*[:：]?\s*([가-힣A-Za-z0-9,\s]+?)(?:\n|$)/g,
    category: 'technical',
    type: 'text',
    baseConfidence: 0.75,
    nameGenerator: () => ({
      id: 'certifications',
      name: '보유 인증',
      nameEn: 'Certifications',
    }),
  },

  // ============================================
  // 6. 연락처 정보 패턴
  // ============================================
  {
    id: 'contact_name_pattern',
    regex: /(?:담당자|연락처\s*담당)\s*[:：]?\s*([가-힣]{2,5})/g,
    category: 'contact',
    type: 'text',
    baseConfidence: 0.85,
    nameGenerator: () => ({
      id: 'contact_name',
      name: '담당자명',
      nameEn: 'Contact Name',
    }),
  },
  {
    id: 'phone_pattern',
    regex: /(?:전화|연락처|TEL)\s*[:：]?\s*(0\d{1,2}[-)\s]?\d{3,4}[-\s]?\d{4})/gi,
    category: 'contact',
    type: 'phone',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'contact_phone',
      name: '연락처',
      nameEn: 'Contact Phone',
    }),
  },
  {
    id: 'email_pattern',
    regex: /(?:이메일|E-?mail)\s*[:：]?\s*([\w.-]+@[\w.-]+\.\w+)/gi,
    category: 'contact',
    type: 'email',
    baseConfidence: 0.95,
    nameGenerator: () => ({
      id: 'contact_email',
      name: '이메일',
      nameEn: 'Contact Email',
    }),
  },

  // ============================================
  // 7. 날짜 패턴
  // ============================================
  {
    id: 'application_deadline_pattern',
    regex: /(?:신청|접수)\s*(?:마감|기한)\s*[:：]?\s*(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})/g,
    category: 'date',
    type: 'date',
    baseConfidence: 0.9,
    nameGenerator: () => ({
      id: 'application_deadline',
      name: '신청 마감일',
      nameEn: 'Application Deadline',
    }),
  },
]

// ============================================
// Variable Extractor Class
// ============================================

export class VariableExtractor {
  private patterns: VariablePattern[] = EXTRACTION_PATTERNS

  /**
   * 공고문에서 변수 추출
   */
  extractFromAnnouncement(announcement: RawAnnouncement): VariableExtractionResult {
    const startTime = Date.now()
    const extractedVariables: ExtractedVariable[] = []
    const seenVariableIds = new Set<string>()

    // 1. 공고문 전체 텍스트 결합
    const fullText = this.combineAnnouncementText(announcement)

    // 2. 패턴 기반 변수 추출
    for (const pattern of this.patterns) {
      const matches = fullText.matchAll(pattern.regex)
      for (const match of matches) {
        const { id, name, nameEn } = pattern.nameGenerator(match)

        // 중복 방지
        if (seenVariableIds.has(id)) continue
        seenVariableIds.add(id)

        const variable: ExtractedVariable = {
          id,
          name,
          nameEn,
          category: pattern.category,
          type: pattern.type,
          required: this.isRequiredVariable(id, announcement),
          confidence: pattern.baseConfidence,
          position: this.findPosition(match, announcement),
          example: match[1]?.trim(),
        }

        // 기존 공통 변수에서 검증 규칙 가져오기
        const commonVar = this.findCommonVariable(id)
        if (commonVar) {
          variable.validation = commonVar.validation
          variable.description = commonVar.description
        }

        extractedVariables.push(variable)
      }
    }

    // 3. 섹션별 필수 변수 확인 및 추가
    const sectionVariables = this.extractFromSections(announcement)
    for (const variable of sectionVariables) {
      if (!seenVariableIds.has(variable.id)) {
        seenVariableIds.add(variable.id)
        extractedVariables.push(variable)
      }
    }

    // 4. 공통 필수 변수 추가 (누락된 경우)
    const essentialVariables = this.getEssentialVariables()
    for (const essential of essentialVariables) {
      if (!seenVariableIds.has(essential.id)) {
        extractedVariables.push({
          ...essential,
          confidence: 0.5, // 공고문에서 추출되지 않았으므로 낮은 신뢰도
        } as ExtractedVariable)
      }
    }

    // 5. 통계 계산
    const stats = this.calculateStats(extractedVariables)

    return {
      variables: extractedVariables.sort((a, b) => b.confidence - a.confidence),
      stats,
      processingTimeMs: Date.now() - startTime,
    }
  }

  /**
   * 텍스트에서 직접 변수 추출
   */
  extractFromText(text: string): ExtractedVariable[] {
    const extractedVariables: ExtractedVariable[] = []
    const seenVariableIds = new Set<string>()

    for (const pattern of this.patterns) {
      const matches = text.matchAll(pattern.regex)
      for (const match of matches) {
        const { id, name, nameEn } = pattern.nameGenerator(match)

        if (seenVariableIds.has(id)) continue
        seenVariableIds.add(id)

        extractedVariables.push({
          id,
          name,
          nameEn,
          category: pattern.category,
          type: pattern.type,
          required: false,
          confidence: pattern.baseConfidence,
          example: match[1]?.trim(),
        })
      }
    }

    return extractedVariables
  }

  /**
   * Mustache 변수만 추출 ({{변수}})
   */
  extractMustacheVariables(text: string): ExtractedVariable[] {
    const variables: ExtractedVariable[] = []
    const regex = /\{\{([^}]+)\}\}/g
    const seenIds = new Set<string>()

    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const varName = match[1].trim()
      const id = varName.replace(/\s+/g, '_').toLowerCase()

      if (seenIds.has(id)) continue
      seenIds.add(id)

      // 카테고리와 타입 추론
      const { category, type } = this.inferVariableType(varName)

      variables.push({
        id,
        name: varName,
        nameEn: id,
        category,
        type,
        required: true, // Mustache 변수는 기본적으로 필수
        confidence: 1.0,
      })
    }

    return variables
  }

  /**
   * 변수 ID로 공통 변수 찾기
   */
  private findCommonVariable(id: string) {
    for (const category of Object.keys(COMMON_VARIABLES)) {
      const variables = COMMON_VARIABLES[category as VariableCategory]
      const found = variables.find((v) => v.id === id)
      if (found) return found
    }
    return null
  }

  /**
   * 필수 변수 여부 판단
   */
  private isRequiredVariable(id: string, announcement: RawAnnouncement): boolean {
    // 제출 서류에 명시된 경우 필수
    const docNames = announcement.requiredDocuments?.map((d) => d.name.toLowerCase()) || []
    if (docNames.some((name) => name.includes(id))) return true

    // 평가 기준에 포함된 경우 필수
    const evalCriteria = announcement.evaluationCriteria?.map((c) => c.category.toLowerCase()) || []
    if (evalCriteria.some((cat) => cat.includes(id))) return true

    // 공통 변수 중 required인 경우
    const commonVar = this.findCommonVariable(id)
    if (commonVar?.required) return true

    return false
  }

  /**
   * 변수 위치 찾기
   */
  private findPosition(
    match: RegExpMatchArray,
    announcement: RawAnnouncement
  ): { section: string; line?: number } | undefined {
    const matchedText = match[0]

    // 각 섹션에서 검색
    if (announcement.eligibilityText?.includes(matchedText)) {
      return { section: '지원대상' }
    }
    if (announcement.supportText?.includes(matchedText)) {
      return { section: '지원내용' }
    }

    return undefined
  }

  /**
   * 공고문 텍스트 결합
   */
  private combineAnnouncementText(announcement: RawAnnouncement): string {
    const parts: string[] = [
      announcement.title,
      announcement.programName,
      announcement.eligibilityText || '',
      announcement.supportText || '',
    ]

    // 제출 서류명
    if (announcement.requiredDocuments) {
      parts.push(announcement.requiredDocuments.map((d) => d.name).join(' '))
    }

    // 평가 기준
    if (announcement.evaluationCriteria) {
      parts.push(
        announcement.evaluationCriteria
          .map((c) => `${c.category} ${c.subcriteria?.join(' ') || ''}`)
          .join(' ')
      )
    }

    return parts.join('\n')
  }

  /**
   * 섹션별 변수 추출
   */
  private extractFromSections(announcement: RawAnnouncement): ExtractedVariable[] {
    const variables: ExtractedVariable[] = []

    // 지원 자격 섹션
    if (announcement.eligibilityParsed) {
      const parsed = announcement.eligibilityParsed

      if (parsed.companyAge) {
        variables.push({
          id: 'company_age',
          name: '업력 (년)',
          nameEn: 'Company Age',
          category: 'company',
          type: 'number',
          required: true,
          confidence: 0.9,
          description: parsed.companyAge.note,
          validation: {
            min: parsed.companyAge.min,
            max: parsed.companyAge.max,
          },
        })
      }

      if (parsed.revenue) {
        variables.push({
          id: 'revenue_requirement',
          name: `매출액 요건 (${parsed.revenue.unit})`,
          nameEn: 'Revenue Requirement',
          category: 'financial',
          type: 'currency',
          required: true,
          confidence: 0.9,
          description: parsed.revenue.note,
          validation: {
            min: parsed.revenue.min,
            max: parsed.revenue.max,
          },
        })
      }

      if (parsed.regions && parsed.regions.length > 0) {
        variables.push({
          id: 'region',
          name: '지역',
          nameEn: 'Region',
          category: 'company',
          type: 'select',
          required: true,
          confidence: 0.95,
          options: parsed.regions,
        })
      }

      if (parsed.industries && parsed.industries.length > 0) {
        variables.push({
          id: 'industry',
          name: '업종',
          nameEn: 'Industry',
          category: 'company',
          type: 'select',
          required: true,
          confidence: 0.9,
          options: parsed.industries,
        })
      }
    }

    // 지원 내용 섹션
    if (announcement.supportParsed) {
      const parsed = announcement.supportParsed

      if (parsed.matchingRatio !== undefined) {
        variables.push({
          id: 'matching_ratio',
          name: '자부담 비율 (%)',
          nameEn: 'Matching Ratio',
          category: 'financial',
          type: 'percent',
          required: true,
          confidence: 0.95,
          defaultValue: String(parsed.matchingRatio),
        })
      }

      if (parsed.supportPeriod) {
        variables.push({
          id: 'support_period',
          name: '지원 기간 (개월)',
          nameEn: 'Support Period',
          category: 'project',
          type: 'number',
          required: true,
          confidence: 0.9,
          defaultValue: String(parsed.supportPeriod),
        })
      }
    }

    return variables
  }

  /**
   * 필수 기본 변수 목록
   */
  private getEssentialVariables(): ExtractedVariable[] {
    const essential: ExtractedVariable[] = []

    // 회사 정보 필수
    for (const v of COMMON_VARIABLES.company) {
      if (v.required) {
        essential.push({ ...v, confidence: 0.5 } as ExtractedVariable)
      }
    }

    // 연락처 필수
    for (const v of COMMON_VARIABLES.contact) {
      if (v.required) {
        essential.push({ ...v, confidence: 0.5 } as ExtractedVariable)
      }
    }

    return essential
  }

  /**
   * 변수명에서 카테고리와 타입 추론
   */
  private inferVariableType(varName: string): {
    category: VariableCategory
    type: VariableType
  } {
    const lower = varName.toLowerCase()

    // 카테고리 추론
    let category: VariableCategory = 'custom'
    if (lower.includes('회사') || lower.includes('기업') || lower.includes('업체')) {
      category = 'company'
    } else if (lower.includes('매출') || lower.includes('자본') || lower.includes('예산') || lower.includes('금액')) {
      category = 'financial'
    } else if (lower.includes('사업') || lower.includes('프로젝트') || lower.includes('과제')) {
      category = 'project'
    } else if (lower.includes('특허') || lower.includes('기술') || lower.includes('인증')) {
      category = 'technical'
    } else if (lower.includes('담당') || lower.includes('연락') || lower.includes('이메일') || lower.includes('전화')) {
      category = 'contact'
    } else if (lower.includes('일') || lower.includes('기간') || lower.includes('마감')) {
      category = 'date'
    }

    // 타입 추론
    let type: VariableType = 'text'
    if (lower.includes('금액') || lower.includes('원') || lower.includes('매출') || lower.includes('자본')) {
      type = 'currency'
    } else if (lower.includes('수') || lower.includes('건') || lower.includes('개') || lower.includes('명')) {
      type = 'number'
    } else if (lower.includes('일') || lower.includes('date') || lower.includes('기간')) {
      type = 'date'
    } else if (lower.includes('이메일') || lower.includes('email')) {
      type = 'email'
    } else if (lower.includes('전화') || lower.includes('연락처') || lower.includes('phone')) {
      type = 'phone'
    } else if (lower.includes('율') || lower.includes('비율') || lower.includes('%')) {
      type = 'percent'
    }

    return { category, type }
  }

  /**
   * 통계 계산
   */
  private calculateStats(variables: ExtractedVariable[]): VariableExtractionResult['stats'] {
    const byCategory: Record<VariableCategory, number> = {
      company: 0,
      project: 0,
      financial: 0,
      technical: 0,
      contact: 0,
      date: 0,
      custom: 0,
    }

    const byType: Record<VariableType, number> = {
      text: 0,
      number: 0,
      currency: 0,
      date: 0,
      phone: 0,
      email: 0,
      percent: 0,
      multiline: 0,
      select: 0,
      file: 0,
    }

    for (const v of variables) {
      byCategory[v.category]++
      byType[v.type]++
    }

    return {
      totalFound: variables.length,
      byCategory,
      byType,
    }
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const variableExtractor = new VariableExtractor()
