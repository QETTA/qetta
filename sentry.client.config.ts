/**
 * Sentry Client Configuration
 *
 * 브라우저에서 실행되는 클라이언트 사이드 에러 트래킹
 */

import * as Sentry from '@sentry/nextjs'

// Sentry DSN이 설정된 경우에만 초기화
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 프로덕션에서만 전체 샘플링, 개발 환경에서는 샘플링 감소
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,

    // 에러 샘플링 (프로덕션: 100%, 개발: 0%)
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

    // 디버그 모드 (개발 환경에서만)
    debug: process.env.NODE_ENV === 'development',

    // 환경 설정
    environment: process.env.NODE_ENV || 'development',

    // 브라우저 전용 통합
    integrations: [
      Sentry.replayIntegration({
        // 개인정보 마스킹
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // 에러 필터링
    beforeSend(event, hint) {
      // 개발 환경에서는 로컬 에러 무시
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // 특정 에러 필터링 (예: 네트워크 타임아웃)
      const error = hint.originalException as Error | undefined
      if (error?.message?.includes('ChunkLoadError')) {
        // 청크 로드 실패는 사용자 새로고침으로 해결
        return null
      }

      return event
    },

    // 민감한 데이터 필터링
    beforeSendTransaction(event) {
      // 인증 관련 트랜잭션에서 토큰 제거
      if (event.transaction?.includes('/api/auth')) {
        delete event.contexts?.trace
      }
      return event
    },
  })
} else {
  console.log('[Sentry] DSN not configured - error tracking disabled')
}
