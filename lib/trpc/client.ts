'use client'

/**
 * tRPC Client Configuration
 *
 * React Query 기반 클라이언트
 *
 * @module lib/trpc/client
 */

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from './root'

export const trpc = createTRPCReact<AppRouter>()
