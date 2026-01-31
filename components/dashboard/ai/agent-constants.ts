/**
 * AI Agent Constants
 *
 * Mock data and types for the AI Agent panel.
 *
 * @module components/dashboard/ai/agent-constants
 */

import type { AGILayer } from '@/types/inbox'
import { QETTA_METRICS } from '@/lib/super-model'

// =============================================================================
// Types
// =============================================================================

export interface CustomerInfo {
  name: string
  badge: string
  badgeColor: string
  role: string
  company: string
}

export interface PreviousConversation {
  title: string
  time: string
  preview: string
}

export interface AIAnalysisData {
  customer: CustomerInfo
  analysis: string
  layer: AGILayer
  confidence: number
  suggestedAction: string
  suggestedReply: string
  enginePreset?: string
  previousConversations: PreviousConversation[]
}

// =============================================================================
// Mock Data (Super-Model based + Domain Engine Context)
// =============================================================================

export const AI_ANALYSIS_DATA: Record<string, AIAnalysisData> = {
  'doc-1': {
    customer: {
      name: '(주)에이치에스씨엠티',
      badge: 'ENVIRONMENT',
      badgeColor: 'emerald',
      role: '환경부 제출',
      company: '수도권대기환경청',
    },
    analysis: `TMS Engine이 일일보고서 생성을 처리 중입니다. NOx, SOx, PM 농도 데이터가 CleanSYS 규격에 맞게 자동 포맷팅됩니다. 기존 8시간 작업을 ${QETTA_METRICS.GENERATION_SPEED}초만에 완료합니다.`,
    layer: 1,
    confidence: 0.98,
    enginePreset: 'ENVIRONMENT',
    suggestedAction: `문서 생성 완료 시 SHA-256 해시체인이 자동 생성됩니다. 용어 매핑 정확도 ${QETTA_METRICS.ACCURACY}%`,
    suggestedReply: `📄 TMS 일일보고서 생성 완료 예정

포함 항목:
- NOx 농도 측정값 (24시간)
- SOx 농도 측정값 (24시간)
- PM 농도 측정값 (24시간)
- CleanSYS 연동 데이터

예상 완료: ${QETTA_METRICS.GENERATION_SPEED}초
무결성 검증: SHA-256 해시체인 자동 생성`,
    previousConversations: [
      {
        title: 'TMS 월간 보고서 생성',
        time: '1주일 전',
        preview: '환경부 CleanSYS 연동 월간 보고서 자동 생성 완료...',
      },
      {
        title: 'NOx 측정 오류 해결',
        time: '2주 전',
        preview: '센서 캘리브레이션 후 정상화. 데이터 역추적 완료...',
      },
    ],
  },
  'apply-1': {
    customer: {
      name: 'goszakup.gov.kz',
      badge: 'Global',
      badgeColor: 'amber',
      role: '카자흐스탄 정부조달',
      company: '환경부',
    },
    analysis: `Global Tender Engine이 ${QETTA_METRICS.GLOBAL_TENDER_DB} DB에서 이 입찰을 발굴했습니다. QETTA의 AIFC LAB 실증 이력과 94% 적합도. 수처리 분야 경험과 TMS 시스템이 핵심 요구사항과 일치합니다.`,
    layer: 3,
    confidence: 0.94,
    enginePreset: 'EXPORT',
    suggestedAction:
      '입찰 마감(2026-02-15)까지 D-26. 6개 언어 자동 번역 지원.',
    suggestedReply: `📋 입찰 준비 체크리스트 (Qetta.APPLY):

1. ✅ 회사 소개서 (ru/kk) - 자동 생성 가능
2. ✅ 기술 제안서 초안 - 자동 생성 가능
3. ⏳ 재무제표 번역 - 6개 언어 지원
4. ⚠️ 현지 파트너 - AIFC 네트워크 활용

"문서 자동 생성" 클릭 시 Qetta.DOCS가 제안서를 ${QETTA_METRICS.GENERATION_SPEED}초 내 생성합니다.`,
    previousConversations: [
      {
        title: '🇰🇿 Astana 수처리 입찰',
        time: '3개월 전',
        preview: '카자흐스탄 Astana 수처리 시설 현대화 프로젝트...',
      },
    ],
  },
  'verify-1': {
    customer: {
      name: '수도권대기환경청',
      badge: '정부기관',
      badgeColor: 'emerald',
      role: '검증 요청',
      company: '환경부',
    },
    analysis: `해시체인(SHA-256) 기반 무결성 검증이 자동 완료되었습니다. 센서 데이터 역추적으로 원천 데이터까지 확인. API 가용성 ${QETTA_METRICS.API_UPTIME}%`,
    layer: 1,
    confidence: 0.99,
    enginePreset: 'ENVIRONMENT',
    suggestedAction: '검증 완료. 인증서 발급 후 환경부 제출 가능.',
    suggestedReply: `✅ 검증 완료 보고서 (Qetta.VERIFY)

문서: TMS_20260122_HSCMT.pdf
검증 결과: 모든 항목 통과
- 해시체인 무결성: ✅ SHA-256 무결성 검증 확인
- 센서 역추적: ✅ 원천 데이터 확인
- 캘리브레이션: ✅ 유효

QR 스캔으로 문서 위변조 즉시 검증 가능.`,
    previousConversations: [
      {
        title: 'QR 검증 요청 #VRF-2025-892',
        time: '1개월 전',
        preview: 'TMS_20251220 문서 무결성 검증 완료...',
      },
    ],
  },
  'monitor-1': {
    customer: {
      name: '설비 #A-003',
      badge: '주의',
      badgeColor: 'amber',
      role: 'NOx 임계치',
      company: '슬러지 펌프',
    },
    analysis: `StoFo Engine(Layer 2)이 진동 패턴을 분석했습니다. 임계값 90% 도달. 이력 데이터 기반 RUL(잔여수명) 14일 예측. 예방 정비 권장.`,
    layer: 2,
    confidence: 0.87,
    enginePreset: 'ENVIRONMENT',
    suggestedAction:
      'StoFo Engine 분석 결과, 베어링 마모 패턴 감지. 예방 정비로 다운타임 방지 가능.',
    suggestedReply: `⚠️ 예방 정비 권장 (Qetta.MONITOR)

장비: 설비 #A-003 (슬러지 펌프)
현재 NOx: 임계값 90%
예상 RUL: 14일

권장 조치:
1. 베어링 점검 (우선순위: 높음)
2. 윤활유 교체
3. 캘리브레이션 확인

DOCS 연동: 정비 보고서 자동 생성 가능`,
    previousConversations: [
      {
        title: '설비 #A-003 정기 점검',
        time: '30일 전',
        preview: '정기 점검 완료. 모든 수치 정상 범위...',
      },
    ],
  },
}

// =============================================================================
// Layer Color Styles
// =============================================================================

export const LAYER_COLORS: Record<
  AGILayer,
  { active: string; text: string }
> = {
  1: { active: 'bg-emerald-500', text: 'text-emerald-400' },
  2: { active: 'bg-amber-500', text: 'text-amber-400' },
  3: { active: 'bg-zinc-500', text: 'text-zinc-400' },
}
