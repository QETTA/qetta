/**
 * Documents Mock Data
 *
 * 개발/데모용 Mock 문서 데이터 생성기
 *
 * @module lib/documents/mock-data
 */

import type { DocumentInfo } from '@/types/documents'

// =============================================================================
// Date Helpers
// =============================================================================

function formatDate(daysAgo: number, referenceDate = new Date()): string {
  const d = new Date(referenceDate)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

// =============================================================================
// Mock Document Definitions
// =============================================================================

/**
 * TMS (환경부) 도메인 문서
 */
function getTMSDocuments(formatDateFn: (days: number) => string): DocumentInfo[] {
  return [
    {
      id: 'doc-tms-001',
      title: 'TMS 일일보고서 생성 요청',
      type: 'request',
      status: 'processing',
      domain: 'ENVIRONMENT',
      summary: '2026-01-24 측정 데이터 기반 환경부 제출용 TMS 일일보고서',
      metadata: {
        priority: 'high',
        assignee: '김민수',
        createdAt: formatDateFn(0),
      },
    },
    {
      id: 'doc-tms-002',
      title: 'CleanSYS 월간 배출량 보고서',
      type: 'report',
      status: 'completed',
      domain: 'ENVIRONMENT',
      summary: '2025년 12월 NOx, SOx, PM 배출량 종합 보고서',
      metadata: {
        priority: 'medium',
        createdAt: formatDateFn(5),
        fileSize: '2.4MB',
        hash: 'sha256:a1b2c3d4e5f6...',
      },
    },
    {
      id: 'doc-tms-003',
      title: '환경부 측정기록부',
      type: 'certificate',
      status: 'pending',
      domain: 'ENVIRONMENT',
      summary: '분기별 측정기록부 자동 생성 대기 중',
      metadata: {
        priority: 'medium',
        deadline: formatDateFn(-7),
      },
    },
  ]
}

/**
 * 스마트팩토리 도메인 문서
 */
function getSmartFactoryDocuments(formatDateFn: (days: number) => string): DocumentInfo[] {
  return [
    {
      id: 'doc-sf-001',
      title: '스마트공장 정산 보고서',
      type: 'report',
      status: 'pending',
      domain: 'MANUFACTURING',
      summary: '중기부 제출용 MES 기반 정산 보고서',
      metadata: {
        priority: 'high',
        deadline: formatDateFn(-3),
      },
    },
    {
      id: 'doc-sf-002',
      title: 'OEE 분석 리포트',
      type: 'report',
      status: 'completed',
      domain: 'MANUFACTURING',
      summary: '2026년 1월 설비종합효율 분석 보고서 (OEE 87.3%)',
      metadata: {
        priority: 'medium',
        createdAt: formatDateFn(2),
        fileSize: '1.8MB',
      },
    },
    {
      id: 'doc-sf-003',
      title: '4M1E 변경점 기록',
      type: 'checklist',
      status: 'processing',
      domain: 'MANUFACTURING',
      summary: 'Man/Machine/Material/Method/Environment 변경 이력 추적',
      metadata: {
        assignee: '박지원',
        createdAt: formatDateFn(1),
      },
    },
  ]
}

/**
 * AI 바우처 도메인 문서
 */
function getAIVoucherDocuments(formatDateFn: (days: number) => string): DocumentInfo[] {
  return [
    {
      id: 'doc-ai-001',
      title: 'AI 바우처 실적 보고서',
      type: 'report',
      status: 'completed',
      domain: 'DIGITAL',
      summary: 'NIPA 제출용 공급기업 실적 보고서',
      metadata: {
        priority: 'high',
        createdAt: formatDateFn(3),
        fileSize: '3.2MB',
        hash: 'sha256:f1e2d3c4b5a6...',
      },
    },
    {
      id: 'doc-ai-002',
      title: '수요기업 매칭 분석',
      type: 'report',
      status: 'pending',
      domain: 'DIGITAL',
      summary: '도메인 엔진 적합성 분석 및 매칭 추천 리포트',
      metadata: {
        priority: 'medium',
      },
    },
    {
      id: 'doc-ai-003',
      title: '바우처 정산 명세서',
      type: 'certificate',
      status: 'warning',
      domain: 'DIGITAL',
      summary: '바우처 사용 내역 정산 - 첨부 서류 미비',
      metadata: {
        priority: 'critical',
        deadline: formatDateFn(-1),
      },
    },
  ]
}

/**
 * 해외 입찰 도메인 문서
 */
function getGlobalTenderDocuments(formatDateFn: (days: number) => string): DocumentInfo[] {
  return [
    {
      id: 'doc-gt-001',
      title: '해외 입찰 제안서 초안',
      type: 'proposal',
      status: 'warning',
      domain: 'EXPORT',
      summary: 'SAM.gov 환경 모니터링 장비 조달 제안서',
      metadata: {
        deadline: formatDateFn(-2),
        priority: 'critical',
      },
    },
    {
      id: 'doc-gt-002',
      title: 'UNGM 입찰 문서 패키지',
      type: 'proposal',
      status: 'processing',
      domain: 'EXPORT',
      summary: 'UN 산하 기관 환경 센서 조달 입찰 서류',
      metadata: {
        priority: 'high',
        assignee: '이준호',
        createdAt: formatDateFn(1),
      },
    },
    {
      id: 'doc-gt-003',
      title: 'Goszakup 제안서 (카자흐스탄)',
      type: 'proposal',
      status: 'pending',
      domain: 'EXPORT',
      summary: 'AIFC 연계 카자흐스탄 정부 조달 제안서',
      metadata: {
        priority: 'medium',
        deadline: formatDateFn(-10),
      },
    },
  ]
}

// =============================================================================
// Main Generator
// =============================================================================

/**
 * Mock 문서 데이터 생성
 *
 * 6개 도메인 엔진별 샘플 문서를 반환합니다.
 * 실제 구현 시 DB 연동으로 대체됩니다.
 */
export function generateMockDocuments(): DocumentInfo[] {
  const now = new Date()
  const createDateFormatter = (days: number) => formatDate(days, now)

  return [
    ...getTMSDocuments(createDateFormatter),
    ...getSmartFactoryDocuments(createDateFormatter),
    ...getAIVoucherDocuments(createDateFormatter),
    ...getGlobalTenderDocuments(createDateFormatter),
  ]
}
