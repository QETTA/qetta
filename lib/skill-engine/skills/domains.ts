/**
 * QETTA Domain Engine Categories
 *
 * 🧠 산업별 도메인 카테고리 재설계
 *
 * 타겟 고객: 제조/설비 중소기업 (B2B2B)
 *
 * 기존 문제:
 * - "부처별" 분류 (TMS=환경부, 스팩=중기부) → 너무 협소
 * - 융자/보증 영역 누락
 * - 소상공인24, 중기청 템플릿 누락
 *
 * 새로운 접근:
 * - "산업 + 지원유형" 복합 분류
 * - 제조업 중심으로 확장
 * - 융자/보증까지 포괄
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

// ============================================
// 도메인 엔진 카테고리 (산업별)
// ============================================

export type IndustryDomain =
  // 1차 산업군 (Core Industries)
  | 'MANUFACTURING'   // 제조/스마트공장
  | 'ENVIRONMENT'     // 환경/에너지/탄소중립
  | 'DIGITAL'         // 디지털/AI/SW

  // 2차 산업군 (Support Industries)
  | 'FINANCE'         // 융자/보증 (기보/신보/소진공)
  | 'STARTUP'         // 창업지원 (예비/초기/도약)
  | 'EXPORT'          // 수출/글로벌

  // 3차 산업군 (Specialized) - v2.1: 향후 확장 예정
  | 'BIO_HEALTH'      // 바이오/헬스케어

// ============================================
// 지원 유형 (Cross-cutting)
// ============================================

export type SupportType =
  | 'RND'             // R&D 지원
  | 'COMMERCIALIZE'   // 사업화 지원
  | 'LOAN'            // 융자
  | 'GUARANTEE'       // 보증
  | 'VOUCHER'         // 바우처
  | 'CONSULTING'      // 컨설팅
  | 'CERTIFICATION'   // 인증 지원
  | 'EXPORT'          // 수출 지원
  | 'HR'              // 인력 지원
  | 'FACILITY'        // 시설/장비

// ============================================
// 도메인 엔진 상세 정의
// ============================================

export interface EnginePresetV2 {
  id: IndustryDomain
  name: string
  nameKo: string
  description: string

  // 산업 키워드 (매칭용)
  industryKeywords: string[]

  // 관련 부처/기관
  agencies: {
    ministry: string
    organizations: string[]
  }[]

  // 지원 프로그램 유형
  supportTypes: SupportType[]

  // 핵심 템플릿
  coreTemplates: {
    id: string
    name: string
    source: string // 출처 (소상공인24, 중기청, etc.)
    url?: string
  }[]

  // 필수 서류 DB
  requiredDocuments: string[]

  // 산업 용어집 경로
  terminologyPath: string

  // UI 스타일
  styles: {
    color: string
    icon: string
    gradient: string
  }
}

// ============================================
// 1. MANUFACTURING - 제조/스마트공장
// ============================================

export const MANUFACTURING_DOMAIN: EnginePresetV2 = {
  id: 'MANUFACTURING',
  name: 'Manufacturing & Smart Factory',
  nameKo: '제조/스마트공장',
  description: '제조업 스마트화, MES/PLC 연동, 품질관리, 정부 정산 보고서',

  industryKeywords: [
    '제조업', '스마트공장', 'MES', 'PLC', 'OPC-UA', '4M1E', 'OEE',
    '품질관리', 'ISO', '설비', '생산', '공정', '자동화', '로봇',
    '금형', '사출', '용접', '조립', 'CNC', 'CAD/CAM',
  ],

  agencies: [
    {
      ministry: '중소벤처기업부',
      organizations: ['중소기업기술정보진흥원', '스마트제조혁신센터', '중소기업진흥공단'],
    },
    {
      ministry: '산업통상자원부',
      organizations: ['한국생산기술연구원', '한국로봇산업진흥원'],
    },
  ],

  supportTypes: ['RND', 'COMMERCIALIZE', 'CONSULTING', 'FACILITY', 'HR'],

  coreTemplates: [
    {
      id: 'smart-factory-report',
      name: '스마트공장 구축 정산 보고서',
      source: '중기부',
      url: 'https://www.smart-factory.kr',
    },
    {
      id: 'mes-integration',
      name: 'MES 연동 결과 보고서',
      source: '스마트제조혁신센터',
    },
    {
      id: 'quality-report',
      name: '품질개선 실적 보고서',
      source: '한국생산기술연구원',
    },
    {
      id: 'oee-analysis',
      name: 'OEE 분석 리포트',
      source: 'QETTA',
    },
  ],

  requiredDocuments: [
    '사업자등록증',
    '공장등록증',
    '제조업 등록증',
    'ISO 인증서',
    '설비 목록',
    'MES 시스템 구성도',
    '생산 실적 데이터',
  ],

  terminologyPath: 'generators/domain-engines/manufacturing/terminology.json',

  styles: {
    color: 'blue',
    icon: '⚙️',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
}

// ============================================
// 2. ENVIRONMENT - 환경/에너지/탄소중립
// ============================================

export const ENVIRONMENT_DOMAIN: EnginePresetV2 = {
  id: 'ENVIRONMENT',
  name: 'Environment & Energy',
  nameKo: '환경/에너지/탄소중립',
  description: 'TMS, 배출량 보고, 탄소중립, ESG, 환경 인허가',

  industryKeywords: [
    'ENVIRONMENT', 'CleanSYS', 'NOx', 'SOx', 'PM', '배출량', '대기오염',
    '탄소중립', 'ESG', '온실가스', '에너지효율', '재생에너지',
    '환경영향평가', '폐수', '폐기물', '소음진동',
  ],

  agencies: [
    {
      ministry: '환경부',
      organizations: ['한국환경공단', '환경산업기술원', '국립환경과학원'],
    },
    {
      ministry: '산업통상자원부',
      organizations: ['한국에너지공단', '에너지경제연구원'],
    },
  ],

  supportTypes: ['RND', 'CONSULTING', 'CERTIFICATION', 'FACILITY'],

  coreTemplates: [
    {
      id: 'tms-daily',
      name: '일일 배출량 보고서',
      source: '환경부',
    },
    {
      id: 'tms-monthly',
      name: '월간 환경관리 보고서',
      source: '환경부',
    },
    {
      id: 'carbon-neutral',
      name: '탄소중립 이행계획서',
      source: '환경부',
    },
    {
      id: 'esg-report',
      name: 'ESG 경영 보고서',
      source: 'QETTA',
    },
    {
      id: 'energy-audit',
      name: '에너지 진단 보고서',
      source: '한국에너지공단',
    },
  ],

  requiredDocuments: [
    '배출시설 설치허가증',
    '방지시설 설치 현황',
    'TMS 연동 확인서',
    '환경부 사업자 등록',
    '측정기록부',
    '온실가스 배출량 명세서',
  ],

  terminologyPath: 'generators/domain-engines/environment/terminology.json',

  styles: {
    color: 'emerald',
    icon: '🌱',
    gradient: 'from-emerald-500/20 to-green-500/20',
  },
}

// ============================================
// 3. DIGITAL - 디지털/AI/SW
// ============================================

export const DIGITAL_DOMAIN: EnginePresetV2 = {
  id: 'DIGITAL',
  name: 'Digital & AI',
  nameKo: '디지털/AI/SW',
  description: 'AI 바우처, 데이터 바우처, 클라우드 전환, 디지털 전환',

  industryKeywords: [
    'AI', '인공지능', '머신러닝', '딥러닝', '데이터', '빅데이터',
    '클라우드', 'SaaS', 'API', '디지털전환', 'DX',
    '소프트웨어', 'IT', 'ICT', '플랫폼',
  ],

  agencies: [
    {
      ministry: '과학기술정보통신부',
      organizations: ['NIPA', 'NIA', 'KISA', 'IITP'],
    },
    {
      ministry: '중소벤처기업부',
      organizations: ['중소기업기술정보진흥원'],
    },
  ],

  supportTypes: ['RND', 'VOUCHER', 'CONSULTING', 'HR'],

  coreTemplates: [
    {
      id: 'ai-voucher-report',
      name: 'AI 바우처 실적 보고서',
      source: 'NIPA',
      url: 'https://www.nipa.kr',
    },
    {
      id: 'data-voucher-report',
      name: '데이터 바우처 실적 보고서',
      source: 'NIA',
    },
    {
      id: 'cloud-migration',
      name: '클라우드 전환 결과 보고서',
      source: 'NIPA',
    },
    {
      id: 'dx-diagnosis',
      name: '디지털 전환 진단 보고서',
      source: 'QETTA',
    },
  ],

  requiredDocuments: [
    'AI 공급기업 등록증',
    '수요기업 사업자등록증',
    '바우처 사용 계획서',
    'AI 솔루션 명세서',
    'API 연동 문서',
  ],

  terminologyPath: 'generators/domain-engines/digital/terminology.json',

  styles: {
    color: 'violet',
    icon: '🤖',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
}

// ============================================
// 4. FINANCE - 융자/보증 (핵심!)
// ============================================

export const FINANCE_DOMAIN: EnginePresetV2 = {
  id: 'FINANCE',
  name: 'Finance & Guarantee',
  nameKo: '융자/보증',
  description: '기보, 신보, 소진공, 중진공 융자 및 보증 지원',

  industryKeywords: [
    '융자', '보증', '기술보증', '신용보증', '정책자금',
    '시설자금', '운전자금', '창업자금', '기보', '신보',
    '소상공인', '중소기업', '신용등급', '담보',
  ],

  agencies: [
    {
      ministry: '중소벤처기업부',
      organizations: ['소상공인시장진흥공단', '중소기업진흥공단'],
    },
    {
      ministry: '금융위원회',
      organizations: ['기술보증기금', '신용보증기금', '신용보증재단'],
    },
  ],

  supportTypes: ['LOAN', 'GUARANTEE'],

  coreTemplates: [
    {
      id: 'kibo-application',
      name: '기술보증 신청서',
      source: '기술보증기금',
      url: 'https://www.kibo.or.kr',
    },
    {
      id: 'kodit-application',
      name: '신용보증 신청서',
      source: '신용보증기금',
      url: 'https://www.kodit.co.kr',
    },
    {
      id: 'semas-loan',
      name: '소상공인 정책자금 신청서',
      source: '소상공인시장진흥공단',
      url: 'https://www.semas.or.kr',
    },
    {
      id: 'kosme-loan',
      name: '중소기업 정책자금 신청서',
      source: '중소기업진흥공단',
      url: 'https://www.kosmes.or.kr',
    },
    {
      id: 'sme24-loan',
      name: '소상공인24 자금신청',
      source: '소상공인24',
      url: 'https://www.sbiz24.kr',
    },
  ],

  requiredDocuments: [
    '사업자등록증',
    '재무제표 (최근 3년)',
    '부가세 신고서',
    '4대보험 가입내역',
    '신용조회 동의서',
    '담보물 등기부등본 (있는 경우)',
    '사업계획서',
    '자금 사용 계획서',
  ],

  terminologyPath: 'generators/domain-engines/finance/terminology.json',

  styles: {
    color: 'amber',
    icon: '💰',
    gradient: 'from-amber-500/20 to-yellow-500/20',
  },
}

// ============================================
// 5. STARTUP - 창업지원
// ============================================

export const STARTUP_DOMAIN: EnginePresetV2 = {
  id: 'STARTUP',
  name: 'Startup Support',
  nameKo: '창업지원',
  description: '예비창업, 초기창업, 도약 패키지, TIPS, 액셀러레이팅',

  industryKeywords: [
    '창업', '스타트업', '예비창업', '초기창업', '창업도약',
    'TIPS', '액셀러레이터', 'VC', '투자', '벤처',
    '기술창업', '청년창업', '재창업',
  ],

  agencies: [
    {
      ministry: '중소벤처기업부',
      organizations: ['창업진흥원', 'K-Startup'],
    },
  ],

  supportTypes: ['COMMERCIALIZE', 'RND', 'CONSULTING', 'HR'],

  coreTemplates: [
    {
      id: 'pre-startup-plan',
      name: '예비창업 사업계획서',
      source: '창업진흥원',
      url: 'https://www.k-startup.go.kr',
    },
    {
      id: 'early-startup-plan',
      name: '초기창업 사업계획서',
      source: '창업진흥원',
    },
    {
      id: 'growth-startup-plan',
      name: '창업도약 사업계획서',
      source: '창업진흥원',
    },
    {
      id: 'tips-plan',
      name: 'TIPS 사업계획서',
      source: 'TIPS 운영사',
      url: 'https://www.jointips.or.kr',
    },
    {
      id: 'ir-deck',
      name: 'IR 피칭 자료',
      source: 'QETTA',
    },
  ],

  requiredDocuments: [
    '사업자등록증 (또는 미등록)',
    '대표자 신분증',
    '주민등록등본',
    '경력증명서',
    '학위증명서',
    '창업 아이템 증빙 (특허, 시제품 등)',
  ],

  terminologyPath: 'generators/domain-engines/startup/terminology.json',

  styles: {
    color: 'rose',
    icon: '🚀',
    gradient: 'from-rose-500/20 to-pink-500/20',
  },
}

// ============================================
// 6. EXPORT - 수출/글로벌
// ============================================

export const EXPORT_DOMAIN: EnginePresetV2 = {
  id: 'EXPORT',
  name: 'Export & Global',
  nameKo: '수출/글로벌',
  description: '해외 입찰, 수출 바우처, 해외 인증, 무역 보험',

  industryKeywords: [
    '수출', '해외', '글로벌', '입찰', 'SAM.gov', 'UNGM',
    'FTA', '관세', '무역', '물류', '해외인증', 'CE', 'FDA',
    '바이어', '박람회', '통관',
  ],

  agencies: [
    {
      ministry: '산업통상자원부',
      organizations: ['KOTRA', '한국무역협회'],
    },
    {
      ministry: '중소벤처기업부',
      organizations: ['중소기업수출지원센터'],
    },
  ],

  supportTypes: ['EXPORT', 'CONSULTING', 'CERTIFICATION'],

  coreTemplates: [
    {
      id: 'export-voucher',
      name: '수출 바우처 사업계획서',
      source: 'KOTRA',
      url: 'https://www.exportvoucher.com',
    },
    {
      id: 'global-tender-proposal',
      name: '해외 입찰 제안서',
      source: 'QETTA',
    },
    {
      id: 'sam-gov-proposal',
      name: 'SAM.gov 제안서',
      source: 'QETTA',
    },
    {
      id: 'ungm-proposal',
      name: 'UNGM 제안서',
      source: 'QETTA',
    },
    {
      id: 'overseas-cert',
      name: '해외 인증 지원 신청서',
      source: '중소기업수출지원센터',
    },
  ],

  requiredDocuments: [
    '수출 실적 증빙',
    '영문 회사소개서',
    '영문 제품 카탈로그',
    'SAM.gov 등록 증빙 (UEI)',
    '해외 레퍼런스',
    '인증서 (CE, FDA 등)',
  ],

  terminologyPath: 'generators/domain-engines/export/terminology.json',

  styles: {
    color: 'sky',
    icon: '🌐',
    gradient: 'from-sky-500/20 to-blue-500/20',
  },
}

// ============================================
// All Domain Engines
// ============================================

export const ENGINE_PRESETS_V2: Record<IndustryDomain, EnginePresetV2> = {
  MANUFACTURING: MANUFACTURING_DOMAIN,
  ENVIRONMENT: ENVIRONMENT_DOMAIN,
  DIGITAL: DIGITAL_DOMAIN,
  FINANCE: FINANCE_DOMAIN,
  STARTUP: STARTUP_DOMAIN,
  EXPORT: EXPORT_DOMAIN,
  // v2.1: 향후 확장 예정 (현재 미구현)
  BIO_HEALTH: {} as EnginePresetV2,
}

// Core 도메인 (완전 구현)
export const CORE_DOMAINS: IndustryDomain[] = [
  'MANUFACTURING',
  'ENVIRONMENT',
  'DIGITAL',
  'FINANCE',
  'STARTUP',
  'EXPORT',
]

// ============================================
// Domain Matching Function
// ============================================

export function matchDomainByKeywords(text: string): {
  domain: IndustryDomain
  score: number
  matchedKeywords: string[]
}[] {
  const results: Array<{
    domain: IndustryDomain
    score: number
    matchedKeywords: string[]
  }> = []

  const normalizedText = text.toLowerCase()

  for (const domainId of CORE_DOMAINS) {
    const domain = ENGINE_PRESETS_V2[domainId]
    const matchedKeywords = domain.industryKeywords.filter((keyword) =>
      normalizedText.includes(keyword.toLowerCase())
    )

    if (matchedKeywords.length > 0) {
      results.push({
        domain: domainId,
        score: matchedKeywords.length / domain.industryKeywords.length,
        matchedKeywords,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

// ============================================
// Get Templates by Domain
// ============================================

export function getTemplatesByDomain(domainId: IndustryDomain): EnginePresetV2['coreTemplates'] {
  const domain = ENGINE_PRESETS_V2[domainId]
  return domain?.coreTemplates || []
}

// ============================================
// Legacy Mapping (기존 4개 엔진 → 새 구조)
// ============================================

export const LEGACY_DOMAIN_MAPPING: Record<string, IndustryDomain> = {
  TMS: 'ENVIRONMENT',
  SMART_FACTORY: 'MANUFACTURING',
  AI_VOUCHER: 'DIGITAL',
  GLOBAL_TENDER: 'EXPORT',
}

export function migrateLegacyDomain(legacyDomain: string): IndustryDomain {
  return LEGACY_DOMAIN_MAPPING[legacyDomain] || 'MANUFACTURING'
}
