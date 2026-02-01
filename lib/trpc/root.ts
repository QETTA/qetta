/**
 * tRPC Root Router
 *
 * 모든 tRPC 라우터의 루트
 *
 * @module lib/trpc/root
 */

import { router } from './trpc'
import { kidsmapRouter } from './routers/kidsmap'

export const appRouter = router({
  kidsmap: kidsmapRouter,
})

export type AppRouter = typeof appRouter
