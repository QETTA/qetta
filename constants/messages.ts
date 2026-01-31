/**
 * Error Messages (Korean)
 * 사용자에게 표시되는 에러 메시지
 */
export const ERROR_MESSAGES = {
  // General
  GENERIC: '예상치 못한 오류가 발생했습니다.',
  DASHBOARD: '대시보드 로딩 중 문제가 발생했습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청하신 내용을 찾을 수 없습니다.',
  RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  SERVICE_UNAVAILABLE: '서비스가 일시적으로 불가합니다. 잠시 후 다시 시도해 주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해 주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다. 다시 시도해 주세요.',

  // Authentication
  AUTH: {
    INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
    EMAIL_NOT_VERIFIED: '이메일 인증이 필요합니다. 받은편지함을 확인해 주세요.',
    EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
    INVALID_TOKEN: '유효하지 않거나 만료된 토큰입니다.',
    PASSWORD_TOO_WEAK: '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.',
    SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.',
    OAUTH_ERROR: '소셜 로그인에 실패했습니다. 다시 시도해 주세요.',
  },

  // Payment
  PAYMENT: {
    FAILED: '결제에 실패했습니다. 결제 정보를 확인해 주세요.',
    CANCELLED: '결제가 취소되었습니다.',
    CARD_DECLINED: '카드가 거부되었습니다. 다른 결제 수단을 이용해 주세요.',
    INSUFFICIENT_FUNDS: '잔액이 부족합니다.',
    INVALID_CARD: '유효하지 않은 카드 정보입니다.',
    SUBSCRIPTION_NOT_FOUND: '구독 정보를 찾을 수 없습니다.',
    ALREADY_SUBSCRIBED: '이미 구독 중인 플랜입니다.',
    BILLING_ERROR: '결제 처리 중 오류가 발생했습니다.',
    WEBHOOK_ERROR: '결제 확인에 실패했습니다. 고객센터에 문의해 주세요.',
  },

  // Document
  DOCUMENT: {
    GENERATION_FAILED: '문서 생성에 실패했습니다. 다시 시도해 주세요.',
    DOWNLOAD_FAILED: '문서 다운로드에 실패했습니다.',
    NOT_FOUND: '문서를 찾을 수 없습니다.',
    INVALID_FORMAT: '지원하지 않는 파일 형식입니다.',
    TOO_LARGE: '파일 크기가 너무 큽니다. (최대 10MB)',
    QUOTA_EXCEEDED: '이번 달 문서 생성 한도를 초과했습니다. 플랜을 업그레이드해 주세요.',
    AI_ERROR: 'AI 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
  },

  // Form Validation
  FORM: {
    REQUIRED: '필수 입력 항목입니다.',
    INVALID_EMAIL: '올바른 이메일 형식이 아닙니다.',
    INVALID_PHONE: '올바른 전화번호 형식이 아닙니다.',
    INVALID_URL: '올바른 URL 형식이 아닙니다.',
    TOO_SHORT: '입력값이 너무 짧습니다.',
    TOO_LONG: '입력값이 너무 깁니다.',
    INVALID_FORMAT: '올바른 형식이 아닙니다.',
    PASSWORDS_MISMATCH: '비밀번호가 일치하지 않습니다.',
  },

  // Company Block
  BLOCK: {
    NOT_FOUND: '회사 블록을 찾을 수 없습니다.',
    SAVE_FAILED: '저장에 실패했습니다. 다시 시도해 주세요.',
    DELETE_FAILED: '삭제에 실패했습니다.',
    COMPRESS_FAILED: '압축 처리에 실패했습니다.',
  },
} as const

/**
 * Success Messages (Korean)
 * 성공 시 표시되는 메시지
 */
export const SUCCESS_MESSAGES = {
  // Authentication
  AUTH: {
    LOGIN: '로그인되었습니다.',
    LOGOUT: '로그아웃되었습니다.',
    SIGNUP: '회원가입이 완료되었습니다. 이메일을 확인해 주세요.',
    EMAIL_VERIFIED: '이메일 인증이 완료되었습니다.',
    PASSWORD_RESET_SENT: '비밀번호 재설정 이메일을 발송했습니다.',
    PASSWORD_CHANGED: '비밀번호가 변경되었습니다.',
  },

  // Payment
  PAYMENT: {
    SUCCESS: '결제가 완료되었습니다.',
    SUBSCRIPTION_CREATED: '구독이 시작되었습니다.',
    SUBSCRIPTION_CANCELLED: '구독이 취소되었습니다. 현재 기간까지 이용 가능합니다.',
    PLAN_CHANGED: '플랜이 변경되었습니다.',
  },

  // Document
  DOCUMENT: {
    CREATED: '문서가 생성되었습니다.',
    SAVED: '저장되었습니다.',
    DELETED: '삭제되었습니다.',
    DOWNLOADED: '다운로드가 시작되었습니다.',
  },

  // General
  SAVED: '저장되었습니다.',
  DELETED: '삭제되었습니다.',
  UPDATED: '업데이트되었습니다.',
  COPIED: '클립보드에 복사되었습니다.',
} as const

/**
 * CTA Labels (Korean)
 * 버튼 및 링크 텍스트
 */
export const CTA_LABELS = {
  // Navigation
  PARTNER: '파트너 되기',
  FREE_TRIAL: '무료로 시작하기',
  RETRY: '다시 시도',
  HOME: '홈으로',
  BACK: '뒤로 가기',
  CANCEL: '취소',
  CONFIRM: '확인',
  SAVE: '저장',
  DELETE: '삭제',
  EDIT: '수정',
  CLOSE: '닫기',

  // Auth
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
  SIGNUP: '회원가입',
  RESET_PASSWORD: '비밀번호 재설정',

  // Document
  GENERATE: '문서 생성',
  DOWNLOAD: '다운로드',
  PREVIEW: '미리보기',

  // Payment
  SUBSCRIBE: '구독하기',
  UPGRADE: '업그레이드',
  CHANGE_PLAN: '플랜 변경',
} as const

/**
 * API Error Code to Korean Message Mapping
 * API 에러 코드별 한국어 메시지
 */
export const API_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: '입력값이 올바르지 않습니다.',
  NOT_FOUND: ERROR_MESSAGES.NOT_FOUND,
  UNAUTHORIZED: ERROR_MESSAGES.UNAUTHORIZED,
  FORBIDDEN: ERROR_MESSAGES.FORBIDDEN,
  INTERNAL_ERROR: ERROR_MESSAGES.GENERIC,
  SERVICE_UNAVAILABLE: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
  RATE_LIMITED: ERROR_MESSAGES.RATE_LIMITED,
} as const

/**
 * Get localized error message
 * API 에러 코드를 한국어 메시지로 변환
 */
export function getErrorMessage(code: string, fallback?: string): string {
  return API_ERROR_MESSAGES[code] || fallback || ERROR_MESSAGES.GENERIC
}

