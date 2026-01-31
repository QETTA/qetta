/**
 * Prisma Client Singleton (Prisma 7+ with Database Adapter)
 *
 * Next.js 개발 환경에서 Hot Reload 시 PrismaClient 인스턴스가
 * 여러 개 생성되는 것을 방지하기 위한 싱글톤 패턴
 *
 * Prisma 7+ requires using database adapters instead of direct URL in schema.
 * @see https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
 * @see https://pris.ly/d/prisma7-client-config
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create connection pool (singleton)
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

// Create Prisma adapter
const adapter = new PrismaPg(pool)

// Create Prisma Client with adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

export default prisma
