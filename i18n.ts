/**
 * next-intl Configuration
 *
 * QETTA 국제화(i18n) 설정
 * - 기본 언어: 한국어 (ko)
 * - 지원 언어: 영어 (en)
 *
 * @see https://next-intl-docs.vercel.app/
 */

import { getRequestConfig } from 'next-intl/server'

// ============================================
// Locale Configuration
// ============================================

/**
 * 지원 언어 목록
 */
export const locales = ['ko', 'en'] as const

export type Locale = (typeof locales)[number]

/**
 * 기본 언어
 */
export const defaultLocale: Locale = 'ko'

/**
 * 언어 설정 메타데이터
 */
export const localeConfig = {
  ko: {
    name: '한국어',
    nativeName: '한국어',
    direction: 'ltr' as const,
    dateFormat: 'yyyy년 M월 d일',
    numberFormat: {
      currency: 'KRW',
      currencyDisplay: 'symbol',
    },
  },
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr' as const,
    dateFormat: 'MMMM d, yyyy',
    numberFormat: {
      currency: 'USD',
      currencyDisplay: 'symbol',
    },
  },
} satisfies Record<Locale, {
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  dateFormat: string
  numberFormat: {
    currency: string
    currencyDisplay: string
  }
}>

// ============================================
// Request Configuration
// ============================================

/**
 * next-intl 요청별 설정
 * 서버 컴포넌트에서 사용됨
 */
export default getRequestConfig(async ({ locale }) => {
  // 지원하지 않는 locale인 경우 기본값 사용
  const safeLocale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale

  return {
    locale: safeLocale,
    messages: (await import(`./messages/${safeLocale}.json`)).default,
    timeZone: safeLocale === 'ko' ? 'Asia/Seoul' : 'UTC',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: localeConfig[safeLocale].numberFormat.currency,
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 1,
        },
      },
    },
  }
})

// ============================================
// Utility Functions
// ============================================

/**
 * locale이 유효한지 확인
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

/**
 * URL에서 locale 추출
 */
export function getLocaleFromPathname(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1]
  return isValidLocale(segment) ? segment : undefined
}
