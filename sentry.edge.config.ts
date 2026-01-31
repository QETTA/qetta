/**
 * Sentry Edge Configuration
 *
 * Edge 런타임 (미들웨어, Edge API Routes)에서 실행되는 에러 트래킹
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 트레이스 샘플링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,

  // 디버그 모드
  debug: process.env.NODE_ENV === 'development',

  // 환경 설정
  environment: process.env.NODE_ENV || 'development',

  // 에러 필터링
  beforeSend(event) {
    // 개발 환경 무시
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    return event
  },

  // 추가 컨텍스트
  initialScope: {
    tags: {
      service: 'qetta-saas',
      runtime: 'edge',
    },
  },
})
