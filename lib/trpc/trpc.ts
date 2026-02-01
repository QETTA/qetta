/**
 * tRPC Server Configuration
 *
 * End-to-end type-safe API layer
 * 2026 타입 안전 API 표준
 *
 * @module lib/trpc/trpc
 */

import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ============================================
// Context
// ============================================

export interface TRPCContext {
  session: Awaited<ReturnType<typeof getServerSession>> | null
}

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await getServerSession(authOptions)
  return { session }
}

// ============================================
// tRPC Instance
// ============================================

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    }
  },
})

// ============================================
// Procedures
// ============================================

/** 기본 라우터 생성 */
export const router = t.router

/** 공개 프로시저 - 인증 불필요 */
export const publicProcedure = t.procedure

/** 보호된 프로시저 - 인증 필요 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

// ============================================
// Middleware
// ============================================

/** 로깅 미들웨어 */
export const loggedProcedure = t.procedure.use(async ({ path, type, next }) => {
  const start = Date.now()
  const result = await next()
  const duration = Date.now() - start
  console.log(`[tRPC] ${type} ${path} - ${duration}ms`)
  return result
})

export { t }
