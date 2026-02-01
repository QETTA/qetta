/**
 * tRPC Module Exports
 *
 * @module lib/trpc
 */

// Server
export { appRouter, type AppRouter } from './root'
export { createTRPCContext, type TRPCContext } from './trpc'

// Client
export { trpc } from './client'
export { TRPCProvider } from './provider'
