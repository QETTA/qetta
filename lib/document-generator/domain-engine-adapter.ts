/**
 * Domain Engine → Document Generator Adapter
 *
 * 템플릿 엔진(TemplateEngine)의 DocumentTemplate 출력을
 * 문서 생성기(generateDocument)의 GenerateDocumentRequest 입력으로 변환합니다.
 *
 * 파이프라인:
 * 공고 → TemplateEngine.quickGenerateTemplate() → DocumentTemplate
 *   → adaptTemplateToDocumentRequest() → GenerateDocumentRequest
 *   → generateDocument() → GeneratedDocument (DOCX/PDF/XLSX)
 *
 * @module document-generator/domain-engine-adapter
 */

import type { DocumentTemplate, TemplateSection } from '@/lib/skill-engine/template-engine/types'
import type { GenerateDocumentRequest } from './types'
import type { EnginePresetType } from '@/types/inbox'
import { DOCUMENT_CONFIGS } from './types'

// ============================================
// Types
// ============================================

export interface AdaptedDocumentRequest extends GenerateDocumentRequest {
  /** 원본 템플릿 참조 */
  templateId: string
  /** 템플릿 섹션 데이터 (docx-generator가 활용) */
  templateSections: TemplateSectionData[]
}

export interface TemplateSectionData {
  title: string
  type: string
  order: number
  content: string
  variableValues: Record<string, string>
}

// ============================================
// Template → Document Request 변환
// ============================================

/**
 * DocumentTemplate → GenerateDocumentRequest 변환
 *
 * 템플릿의 도메인 + 유형 정보로 적절한 documentType을 결정하고,
 * 섹션 데이터를 metadata에 포함합니다.
 */
export function adaptTemplateToDocumentRequest(
  template: DocumentTemplate,
  variableValues: Record<string, string | number | boolean>,
  options?: {
    /** 명시적 documentType 지정 (자동 감지 대신) */
    documentType?: string
    /** 추가 메타데이터 */
    metadata?: Record<string, string>
  }
): AdaptedDocumentRequest {
  const domain = template.domain || 'MANUFACTURING'
  const documentType = options?.documentType || resolveDocumentType(template, domain)

  // 섹션 데이터 준비 (변수 값 바인딩)
  const templateSections = template.sections
    .sort((a, b) => a.order - b.order)
    .map((section) => buildSectionData(section, template, variableValues))

  return {
    enginePreset: domain,
    documentType,
    templateId: template.id,
    templateSections,
    data: {
      sections: templateSections,
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
        version: template.version,
      },
    },
    metadata: {
      companyName: String(variableValues['company_name'] || ''),
      reportDate: new Date().toISOString().split('T')[0],
      ...(options?.metadata || {}),
    },
  }
}

// ============================================
// Internal Helpers
// ============================================

/**
 * 템플릿 유형 → DOCUMENT_CONFIGS의 documentType 매핑
 */
function resolveDocumentType(template: DocumentTemplate, domain: EnginePresetType): string {
  const templateTypeMap: Record<string, Record<string, string>> = {
    application_form: {
      MANUFACTURING: 'settlement_report',
      ENVIRONMENT: 'daily_report',
      DIGITAL: 'performance_report',
      EXPORT: 'proposal_draft',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    },
    business_plan: {
      MANUFACTURING: 'settlement_report',
      ENVIRONMENT: 'daily_report',
      DIGITAL: 'performance_report',
      EXPORT: 'proposal_draft',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    },
    budget_plan: {
      MANUFACTURING: 'equipment_history',
      ENVIRONMENT: 'measurement_record',
      DIGITAL: 'settlement',
      EXPORT: 'compliance_checklist',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    },
    performance_report: {
      MANUFACTURING: 'quality_analysis',
      ENVIRONMENT: 'emission_analysis',
      DIGITAL: 'matching_analysis',
      EXPORT: 'tender_analysis',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    },
    settlement_report: {
      MANUFACTURING: 'settlement_report',
      ENVIRONMENT: 'monthly_report',
      DIGITAL: 'settlement',
      EXPORT: 'matching_report',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    },
    checklist: {
      MANUFACTURING: 'oee_report',
      ENVIRONMENT: 'measurement_record',
      DIGITAL: 'settlement',
      EXPORT: 'compliance_checklist',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    },
  }

  const mapping = templateTypeMap[template.type]
  if (mapping?.[domain]) {
    return mapping[domain]
  }

  // fallback: 해당 도메인의 첫 번째 문서 유형
  const domainConfigs = DOCUMENT_CONFIGS[domain]
  return Object.keys(domainConfigs)[0] || 'daily_report'
}

/**
 * 템플릿 섹션 + 변수 값 → TemplateSectionData
 */
function buildSectionData(
  section: TemplateSection,
  template: DocumentTemplate,
  variableValues: Record<string, string | number | boolean>
): TemplateSectionData {
  // 섹션에 속한 변수들의 값 추출
  const sectionVariableValues: Record<string, string> = {}
  for (const varId of section.variableIds) {
    const value = variableValues[varId]
    if (value !== undefined) {
      sectionVariableValues[varId] = String(value)
    }
  }

  // 변수 이름 → 값 매핑 (가이드라인 텍스트 생성용)
  const variableNameMap = new Map(
    template.variables.map((v) => [v.id, v.name])
  )

  // 섹션 콘텐츠 생성 (변수 값이 있는 필드를 텍스트로)
  const contentLines: string[] = []
  for (const [varId, value] of Object.entries(sectionVariableValues)) {
    const label = variableNameMap.get(varId) || varId
    contentLines.push(`${label}: ${value}`)
  }

  return {
    title: section.title,
    type: section.type,
    order: section.order,
    content: contentLines.join('\n') || section.description || '',
    variableValues: sectionVariableValues,
  }
}
