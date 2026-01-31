/**
 * Client-side Logger
 *
 * 프로덕션 환경에서 console 출력 억제
 * 개발 환경에서만 로그 출력
 *
 * @example
 * import { clientLogger } from '@/lib/logger/client'
 * clientLogger.error('[Component] Error:', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

// 프로덕션에서는 error만, 개발에서는 debug
const DEFAULT_LEVEL: LogLevel =
  typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? 'error' : 'debug'

function createClientLogger(level: LogLevel = DEFAULT_LEVEL) {
  const currentLevel = LOG_LEVELS[level]

  return {
    debug: (...args: unknown[]) => {
      if (currentLevel <= LOG_LEVELS.debug) {
        console.log(...args)
      }
    },
    info: (...args: unknown[]) => {
      if (currentLevel <= LOG_LEVELS.info) {
        console.info(...args)
      }
    },
    warn: (...args: unknown[]) => {
      if (currentLevel <= LOG_LEVELS.warn) {
        console.warn(...args)
      }
    },
    error: (...args: unknown[]) => {
      if (currentLevel <= LOG_LEVELS.error) {
        console.error(...args)
      }
    },
  }
}

export const clientLogger = createClientLogger()
