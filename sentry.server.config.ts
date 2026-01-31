/**
 * Sentry Server Configuration
 *
 * Node.js 런타임에서 실행되는 서버 사이드 에러 트래킹
 */

import * as Sentry from '@sentry/nextjs'

// Sentry DSN이 설정된 경우에만 초기화
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // 트레이스 샘플링 (프로덕션: 10%, 개발: 0%)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,

    // 디버그 모드
    debug: process.env.NODE_ENV === 'development',

    // 환경 설정
    environment: process.env.NODE_ENV || 'development',

    // 서버 전용 통합
    integrations: [
      Sentry.prismaIntegration(),
    ],

    // 에러 필터링
    beforeSend(event, hint) {
      // 개발 환경 무시
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      const error = hint.originalException as Error | undefined

      // 알려진 비즈니스 에러는 무시 (사용자 오류)
      if (error?.name === 'PaymentError' || error?.name === 'ValidationError') {
        // 에러 레벨만 낮춤 (로그용)
        event.level = 'warning'
      }

      // 401/403 인증 에러는 warning 레벨
      if (event.extra?.statusCode === 401 || event.extra?.statusCode === 403) {
        event.level = 'warning'
      }

      return event
    },

    // 민감한 데이터 스크러빙
    beforeSendTransaction(event) {
      // 결제 관련 데이터 마스킹
      if (event.transaction?.includes('/api/payments')) {
        if (event.contexts?.data) {
          delete event.contexts.data
        }
      }
      return event
    },

    // 추가 컨텍스트
    initialScope: {
      tags: {
        service: 'qetta-saas',
      },
    },
  })
} else {
  console.log('[Sentry] DSN not configured - error tracking disabled')
}
