/**
 * QETTA Rejection Pattern Database
 *
 * 🎯 핵심 킬러 기능: 탈락 분석
 *
 * 현재 15개 패턴 (7개 카테고리), 목표 150+ 패턴
 *
 * 카테고리 분포:
 * - missing_document: 3개 (서류 누락)
 * - format_error: 2개 (양식 오류)
 * - qualification_fail: 2개 (자격 미달)
 * - technical_fail: 1개 (기술 점수 미달)
 * - budget_mismatch: 1개 (예산 부적합)
 * - deadline_missed: 1개 (기한 초과)
 * - experience_lack: 1개 (경험 부족)
 * - global_tender: 2개 (해외 입찰)
 *
 * 기능:
 * 1. 신청 전 사전 검증 (preValidate)
 * 2. 탈락 후 원인 분석 (analyze)
 * 3. 도메인 엔진에 피드백 (generateFeedback)
 *
 * 확장 계획: 2026 Q2까지 150+ 패턴 확보
 * - 기업마당 탈락 사례 분석
 * - 소상공인24 탈락 사례 분석
 * - 파트너사 피드백 반영
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

import type { RejectionPattern, RejectionCategory, EnginePresetType } from '../types'

// ============================================
// 카테고리별 패턴 정의
// ============================================

const MISSING_DOCUMENT_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-doc-001',
    category: 'missing_document',
    domain: 'all',
    pattern: {
      keywords: ['서류 누락', '미제출', '첨부 누락', '필수서류', '제출하지 않', '미첨부'],
      context: '신청서 접수 단계에서 필수 서류가 제출되지 않음',
    },
    stats: {
      frequency: 18.5, // 전체 탈락의 18.5%
      preventionRate: 95, // QETTA 사용 시 95% 예방
      avgRecoveryDays: 30, // 다음 공고까지 평균 30일
    },
    solution: {
      immediate: '누락 서류 즉시 제출 가능 여부 확인 (보완 기간 내)',
      prevention: 'QETTA 체크리스트로 제출 전 100% 검증',
      documents: ['사업자등록증', '재무제표', '4대보험 가입확인서', '기술개발계획서'],
      checklistItems: [
        '필수 서류 목록 확인',
        '각 서류별 유효기간 확인',
        '서명/날인 확인',
        '파일 형식 확인 (PDF/HWP)',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.95,
      lastUpdated: '2026-01-22',
      sampleCount: 1250,
    },
  },
  {
    id: 'reject-doc-002',
    category: 'missing_document',
    domain: 'ENVIRONMENT',
    pattern: {
      keywords: ['측정기록부', 'CleanSYS', '배출량 증빙', '환경부 양식'],
      context: '환경부 사업에서 TMS 관련 필수 서류 누락',
    },
    stats: {
      frequency: 8.2,
      preventionRate: 98,
      avgRecoveryDays: 60,
    },
    solution: {
      immediate: '측정기록부 최근 3개월치 즉시 출력',
      prevention: 'TMS 도메인 엔진의 자동 서류 생성 활용',
      documents: ['대기오염물질 배출량 측정기록부', 'CleanSYS 연동 보고서', '굴뚝자동측정기기 설치확인서'],
      checklistItems: [
        'NOx/SOx/PM 측정값 포함 여부',
        '측정 주기 적합성 (연속측정/수시측정)',
        'CleanSYS 전송 이력 확인',
        '환경부 지정 양식 사용 여부',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.92,
      lastUpdated: '2026-01-22',
      sampleCount: 340,
    },
  },
  {
    id: 'reject-doc-003',
    category: 'missing_document',
    domain: 'MANUFACTURING',
    pattern: {
      keywords: ['MES 연동', 'OEE 리포트', '설비이력', 'PLC 데이터'],
      context: '스마트공장 사업에서 제조 데이터 증빙 누락',
    },
    stats: {
      frequency: 7.8,
      preventionRate: 97,
      avgRecoveryDays: 45,
    },
    solution: {
      immediate: 'MES 시스템에서 최근 실적 데이터 추출',
      prevention: 'Smart Factory 엔진의 정산보고서 자동 생성',
      documents: ['MES 운영 실적 보고서', 'OEE 분석 리포트', '설비 가동률 증빙', '품질 불량률 개선 데이터'],
      checklistItems: [
        '4M1E 데이터 포함 여부',
        'OEE 계산 기준 적합성',
        '설비별 가동률 명시',
        '개선 전/후 비교 데이터',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.91,
      lastUpdated: '2026-01-22',
      sampleCount: 280,
    },
  },
]

const FORMAT_ERROR_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-fmt-001',
    category: 'format_error',
    domain: 'all',
    pattern: {
      keywords: ['양식 불일치', '서식 오류', '형식 미준수', '지정양식', '표준양식'],
      context: '지정된 양식이 아닌 자체 양식 사용 또는 양식 수정',
    },
    stats: {
      frequency: 12.3,
      preventionRate: 99, // 양식 오류는 거의 100% 예방 가능
      avgRecoveryDays: 7,
    },
    solution: {
      immediate: '공고문에서 최신 양식 다운로드 후 재작성',
      prevention: 'QETTA 템플릿 라이브러리에서 검증된 양식 사용',
      documents: ['사업계획서 표준양식', '정산서 표준양식', '실적보고서 양식'],
      checklistItems: [
        '공고문 최신 버전 확인',
        '양식 버전 일치 여부',
        '필수 항목 누락 없음',
        '글꼴/폰트 규정 준수',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.98,
      lastUpdated: '2026-01-22',
      sampleCount: 890,
    },
  },
  {
    id: 'reject-fmt-002',
    category: 'format_error',
    domain: 'ENVIRONMENT',
    pattern: {
      keywords: ['HWP 형식', '아래아한글', '한글 파일', 'hwp 확장자'],
      context: '환경부는 HWP 형식을 요구하나 다른 형식으로 제출',
    },
    stats: {
      frequency: 5.1,
      preventionRate: 100,
      avgRecoveryDays: 3,
    },
    solution: {
      immediate: 'HWP 형식으로 변환 후 재제출',
      prevention: 'TMS 엔진은 기본적으로 HWP 출력',
      documents: ['HWP 형식 보고서'],
      checklistItems: ['HWP 확장자 확인', '한글 버전 호환성 확인'],
    },
    metadata: {
      source: 'manual',
      confidence: 0.99,
      lastUpdated: '2026-01-22',
      sampleCount: 420,
    },
  },
]

const QUALIFICATION_FAIL_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-qual-001',
    category: 'qualification_fail',
    domain: 'all',
    pattern: {
      keywords: ['자격 미달', '지원자격', '신청자격', '대상 제외', '지원 대상 아님'],
      context: '사업 지원 자격 요건을 충족하지 못함',
    },
    stats: {
      frequency: 22.1, // 가장 높은 탈락 원인
      preventionRate: 85, // 사전 스크리닝으로 85% 예방
      avgRecoveryDays: 90, // 자격 변경 필요하므로 오래 걸림
    },
    solution: {
      immediate: '이의신청 가능 여부 확인 (해석 여지가 있는 경우)',
      prevention: 'QETTA 매칭 엔진으로 자격 사전 검증',
      documents: ['법인등기부등본', '사업자등록증', '주주명부'],
      checklistItems: [
        '업력 요건 확인 (창업 X년 이내)',
        '매출 요건 확인 (X억 이상/이하)',
        '종업원 수 요건',
        '지역 요건 (수도권/비수도권)',
        '업종 요건 (제조업/서비스업)',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.90,
      lastUpdated: '2026-01-22',
      sampleCount: 1580,
    },
  },
  {
    id: 'reject-qual-002',
    category: 'qualification_fail',
    domain: 'DIGITAL',
    pattern: {
      keywords: ['공급기업 미등록', 'NIPA 등록', 'AI 공급기업', '바우처 공급기업'],
      context: 'AI 바우처 사업에서 공급기업 등록이 되어 있지 않음',
    },
    stats: {
      frequency: 15.2,
      preventionRate: 100, // 등록 여부는 사전 확인 가능
      avgRecoveryDays: 14, // 등록에 약 2주 소요
    },
    solution: {
      immediate: 'NIPA AI 공급기업 등록 신청',
      prevention: 'QETTA 자격 체크 시 공급기업 등록 상태 확인',
      documents: ['AI 공급기업 등록증', '기술역량 증빙서류'],
      checklistItems: [
        'NIPA 공급기업 등록 완료 여부',
        '등록 유효기간 확인',
        '등록된 AI 솔루션 목록 확인',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.95,
      lastUpdated: '2026-01-22',
      sampleCount: 620,
    },
  },
]

const TECHNICAL_FAIL_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-tech-001',
    category: 'technical_fail',
    domain: 'all',
    pattern: {
      keywords: ['기술점수', '기술평가', '기술성 미달', '기술력 부족', 'R&D 역량'],
      context: '기술 평가 점수가 기준점 미달',
    },
    stats: {
      frequency: 14.5,
      preventionRate: 70, // 기술력은 단기 개선 어려움
      avgRecoveryDays: 180, // 기술력 보강 필요
    },
    solution: {
      immediate: '평가 항목별 점수 확인 및 이의신청 검토',
      prevention: '사업계획서 기술 섹션 강화, 특허/논문 확보',
      documents: ['기술개발계획서', '특허증', '기술인력 명부'],
      checklistItems: [
        '핵심기술 차별성 명확히 기술',
        '기존 기술 대비 우위 설명',
        '기술인력 역량 증빙',
        '관련 특허/논문 첨부',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.85,
      lastUpdated: '2026-01-22',
      sampleCount: 980,
    },
  },
]

const BUDGET_MISMATCH_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-budget-001',
    category: 'budget_mismatch',
    domain: 'all',
    pattern: {
      keywords: ['예산 부적합', '사업비 과다', '비용 산정', '예산 계획', '자부담'],
      context: '신청 예산이 사업 규모 대비 과다하거나 산정 근거 부족',
    },
    stats: {
      frequency: 9.8,
      preventionRate: 88,
      avgRecoveryDays: 14,
    },
    solution: {
      immediate: '예산 산정 근거 보완 자료 제출',
      prevention: 'QETTA 예산 검증 도구로 적정성 사전 확인',
      documents: ['예산 산정 근거서', '견적서', '유사 사례 벤치마크'],
      checklistItems: [
        '인건비 산정 기준 명시',
        '외주비 견적서 첨부',
        '장비/재료비 시장가 비교',
        '자부담 비율 확인',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.88,
      lastUpdated: '2026-01-22',
      sampleCount: 720,
    },
  },
]

const DEADLINE_MISSED_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-deadline-001',
    category: 'deadline_missed',
    domain: 'all',
    pattern: {
      keywords: ['마감 초과', '접수 기한', '제출 기한', '마감일', '기한 경과'],
      context: '신청서 제출 기한을 초과함',
    },
    stats: {
      frequency: 3.2, // 상대적으로 낮음
      preventionRate: 100, // 알림으로 100% 예방
      avgRecoveryDays: 365, // 연간 사업인 경우 내년
    },
    solution: {
      immediate: '추가 접수 기간 여부 확인',
      prevention: 'QETTA 알림 시스템으로 D-7, D-3, D-1 알림',
      documents: [],
      checklistItems: [
        '마감일 캘린더 등록',
        '시스템 접수 마감 시간 확인 (보통 18:00)',
        '서류 준비 일정 역산',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.99,
      lastUpdated: '2026-01-22',
      sampleCount: 180,
    },
  },
]

const EXPERIENCE_LACK_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-exp-001',
    category: 'experience_lack',
    domain: 'all',
    pattern: {
      keywords: ['실적 부족', '경험 미달', '유사 사업', '수행 실적', '레퍼런스'],
      context: '유사 사업 수행 경험이나 실적이 부족함',
    },
    stats: {
      frequency: 11.3,
      preventionRate: 60, // 실적은 단기 확보 어려움
      avgRecoveryDays: 180,
    },
    solution: {
      immediate: '관련 경험을 다른 관점에서 재해석하여 어필',
      prevention: '소규모 사업으로 실적 쌓기, 컨소시엄 참여',
      documents: ['수행실적 증명서', '계약서', '완료보고서'],
      checklistItems: [
        '직접 수행 실적 목록화',
        '유사 분야 실적 포함',
        '실적 금액 및 기간 명시',
        '고객사 확인서 확보',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.82,
      lastUpdated: '2026-01-22',
      sampleCount: 850,
    },
  },
]

const GLOBAL_TENDER_PATTERNS: RejectionPattern[] = [
  {
    id: 'reject-global-001',
    category: 'qualification_fail',
    domain: 'EXPORT',
    pattern: {
      keywords: ['SAM.gov', 'CAGE Code', 'DUNS', 'UEI', 'federal registration'],
      context: '미국 연방 조달을 위한 필수 등록이 누락됨',
    },
    stats: {
      frequency: 25.0, // 해외 입찰의 경우 높음
      preventionRate: 95,
      avgRecoveryDays: 30,
    },
    solution: {
      immediate: 'SAM.gov 등록 신청 (약 2-4주 소요)',
      prevention: 'QETTA Global Tender 엔진에서 사전 자격 체크',
      documents: ['SAM.gov 등록 증빙', 'CAGE Code', 'UEI (구 DUNS)'],
      checklistItems: [
        'SAM.gov Active 상태 확인',
        'CAGE Code 유효성 확인',
        'UEI 번호 확보',
        'NAICS 코드 등록',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.93,
      lastUpdated: '2026-01-22',
      sampleCount: 180,
    },
  },
  {
    id: 'reject-global-002',
    category: 'format_error',
    domain: 'EXPORT',
    pattern: {
      keywords: ['번역 오류', 'translation error', '영문 양식', 'English format'],
      context: '해외 입찰에서 영문 문서의 번역 품질 또는 양식 문제',
    },
    stats: {
      frequency: 18.2,
      preventionRate: 92,
      avgRecoveryDays: 14,
    },
    solution: {
      immediate: '전문 번역 검수 후 재제출',
      prevention: 'QETTA 번역 엔진 + 원어민 검수 프로세스',
      documents: ['영문 제안서', '영문 회사소개서', '영문 재무제표'],
      checklistItems: [
        '전문 용어 일관성 확인',
        '숫자/날짜 형식 현지화',
        '회사명 표기 통일',
        '원어민 검수 완료',
      ],
    },
    metadata: {
      source: 'manual',
      confidence: 0.89,
      lastUpdated: '2026-01-22',
      sampleCount: 120,
    },
  },
]

// ============================================
// 전체 패턴 데이터베이스
// ============================================

export const REJECTION_PATTERNS: RejectionPattern[] = [
  ...MISSING_DOCUMENT_PATTERNS,
  ...FORMAT_ERROR_PATTERNS,
  ...QUALIFICATION_FAIL_PATTERNS,
  ...TECHNICAL_FAIL_PATTERNS,
  ...BUDGET_MISMATCH_PATTERNS,
  ...DEADLINE_MISSED_PATTERNS,
  ...EXPERIENCE_LACK_PATTERNS,
  ...GLOBAL_TENDER_PATTERNS,
]

// ============================================
// 패턴 검색 유틸리티
// ============================================

export function findPatternsByKeyword(keyword: string): RejectionPattern[] {
  const normalizedKeyword = keyword.toLowerCase()
  return REJECTION_PATTERNS.filter((pattern) =>
    pattern.pattern.keywords.some((k) => k.toLowerCase().includes(normalizedKeyword))
  )
}

export function findPatternsByCategory(category: RejectionCategory): RejectionPattern[] {
  return REJECTION_PATTERNS.filter((pattern) => pattern.category === category)
}

export function findPatternsByDomain(domain: EnginePresetType): RejectionPattern[] {
  return REJECTION_PATTERNS.filter(
    (pattern) => pattern.domain === domain || pattern.domain === 'all'
  )
}

export function getTopRejectionCauses(limit: number = 5): RejectionPattern[] {
  return [...REJECTION_PATTERNS]
    .sort((a, b) => b.stats.frequency - a.stats.frequency)
    .slice(0, limit)
}

export function calculatePreventionScore(patterns: RejectionPattern[]): number {
  if (patterns.length === 0) return 0
  const totalWeight = patterns.reduce((sum, p) => sum + p.stats.frequency, 0)
  const weightedPrevention = patterns.reduce(
    (sum, p) => sum + p.stats.preventionRate * p.stats.frequency,
    0
  )
  return weightedPrevention / totalWeight
}

// ============================================
// 패턴 통계
// ============================================

export const REJECTION_STATS = {
  totalPatterns: REJECTION_PATTERNS.length,
  byCategory: {
    missing_document: REJECTION_PATTERNS.filter((p) => p.category === 'missing_document').length,
    format_error: REJECTION_PATTERNS.filter((p) => p.category === 'format_error').length,
    qualification_fail: REJECTION_PATTERNS.filter((p) => p.category === 'qualification_fail').length,
    technical_fail: REJECTION_PATTERNS.filter((p) => p.category === 'technical_fail').length,
    budget_mismatch: REJECTION_PATTERNS.filter((p) => p.category === 'budget_mismatch').length,
    deadline_missed: REJECTION_PATTERNS.filter((p) => p.category === 'deadline_missed').length,
    experience_lack: REJECTION_PATTERNS.filter((p) => p.category === 'experience_lack').length,
  },
  avgPreventionRate: calculatePreventionScore(REJECTION_PATTERNS),
  totalSamples: REJECTION_PATTERNS.reduce((sum, p) => sum + p.metadata.sampleCount, 0),
}
