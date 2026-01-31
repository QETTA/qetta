/**
 * Document data for QETTA dashboard
 * Static data for document detail views
 */

export interface DocumentReply {
  from: string
  email: string
  date: string
  content: string
}

export interface DocumentDetail {
  id: string
  title: string
  from: string
  email: string
  date: string
  content: string
  replies?: DocumentReply[]
}

export const DOCUMENT_DETAILS: Record<string, DocumentDetail> = {
  'doc-1': {
    id: 'doc-1',
    title: 'TMS 일일보고서 생성 요청',
    from: '김민수',
    email: 'minsu.kim@hscmt.co.kr',
    date: '2026년 1월 22일, 오전 8:03',
    content: `안녕하세요 QETTA 지원팀,

저희 팀이 2026-01-22 측정 데이터 기반으로 환경부 제출용 TMS 일일보고서를 생성하려고 합니다.

감사합니다,
김민수
기술이사, (주)에이치에스씨엠티`,
    replies: [
      {
        from: 'QETTA AI',
        email: 'ai@qetta.io',
        date: '2026년 1월 22일, 오후 12:56',
        content: `안녕하세요 김민수님,

문의해 주셔서 감사합니다. TMS 일일보고서 생성을 시작합니다.

감사합니다,
QETTA AI 어시스턴트`,
      },
    ],
  },
  'apply-1': {
    id: 'apply-1',
    title: '🇰🇿 카자흐스탄 수처리 입찰',
    from: 'goszakup.gov.kz',
    email: 'tender@goszakup.gov.kz',
    date: '2026년 1월 22일, 오전 10:30',
    content: `[AI 자동 수집 공고]

공고번호: KZ-2026-4521
플랫폼: goszakup.gov.kz (카자흐스탄 정부조달)

📋 프로젝트 개요
- 프로젝트명: Almaty 지역 산업폐수 처리시설 현대화
- 발주처: 카자흐스탄 환경부
- 예산: $2,500,000 USD
- 입찰 마감: 2026년 2월 15일`,
    replies: [
      {
        from: 'QETTA APPLY AI',
        email: 'apply@qetta.io',
        date: '2026년 1월 22일, 오전 11:00',
        content: `📊 AI 입찰 분석 완료

적합도 점수: 94%
"문서 자동 생성" 버튼을 클릭하면 Qetta.DOCS가 입찰 서류를 자동 생성합니다.`,
      },
    ],
  },
  'verify-1': {
    id: 'verify-1',
    title: 'QR 검증 요청 #VRF-2026-001',
    from: '환경부 검증팀',
    email: 'verify@me.go.kr',
    date: '2026년 1월 22일, 오후 2:15',
    content: `[검증 요청]

문서명: TMS_20260122_HSCMT.pdf
해시값: SHA-256: a7f2c9d8e1b4...
요청자: 환경부 수도권대기환경청`,
    replies: [
      {
        from: 'QETTA VERIFY',
        email: 'verify@qetta.io',
        date: '2026년 1월 22일, 오후 2:16',
        content: `✅ 자동 검증 완료

문서 무결성: ✅ 통과
해시 일치: ✅ 100% 일치
센서 데이터: ✅ 역추적 완료`,
      },
    ],
  },
}

export function getDocumentDetail(id: string): DocumentDetail | null {
  return DOCUMENT_DETAILS[id] || null
}
