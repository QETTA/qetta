/**
 * Test Utilities and Factories
 * Shared helpers for Accounting module tests
 */

import { createHash } from 'crypto'
import type { Prisma } from '@prisma/client'

/**
 * Data factories using Prisma model types
 */
export const factories = {
  partner: (overrides: Partial<any> = {}) => ({
    id: `partner-${Math.random().toString(36).slice(2, 10)}`,
    orgId: overrides.orgId || `ORG${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    orgName: overrides.orgName || 'Test Partner',
    businessNumber: overrides.businessNumber || `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90000 + 10000)}`,
    contactEmail: overrides.contactEmail || `test${Math.floor(Math.random() * 1000)}@partner.com`,
    contactName: overrides.contactName || 'John Doe',
    status: overrides.status || 'ACTIVE',
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  }),

  cafe: (partnerId: string, overrides: Partial<any> = {}) => ({
    id: `cafe-${Math.random().toString(36).slice(2, 10)}`,
    partnerId,
    cafeName: overrides.cafeName || `Test Cafe ${Math.floor(Math.random() * 100)}`,
    commissionRate: overrides.commissionRate || 0.05, // Will be converted to Decimal by Prisma
    status: overrides.status || 'ACTIVE',
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  }),

  referralLink: (cafeId: string, overrides: Partial<any> = {}) => {
    const shortCode = overrides.shortCode || generateShortCode()
    return {
      id: `link-${Math.random().toString(36).slice(2, 10)}`,
      cafeId,
      shortCode,
      fullUrl: overrides.fullUrl || `https://qetta.com/r/${shortCode}`,
      utmSource: overrides.utmSource || null,
      utmMedium: overrides.utmMedium || null,
      utmCampaign: overrides.utmCampaign || null,
      clicks: overrides.clicks || 0,
      status: overrides.status || 'ACTIVE',
      expiresAt: overrides.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      createdAt: overrides.createdAt || new Date(),
      ...overrides
    }
  },

  conversion: (userId: string, linkId: string, overrides: Partial<any> = {}) => ({
    id: `conversion-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    linkId,
    ipHash: overrides.ipHash || createHash('sha256').update(`192.168.1.${Math.floor(Math.random() * 255)}`).digest('hex'),
    userAgentHash: overrides.userAgentHash || createHash('sha256').update('Mozilla/5.0').digest('hex'),
    attributedAt: overrides.attributedAt || new Date(),
    subscriptionId: overrides.subscriptionId || null,
    planType: overrides.planType || 'PREMIUM',
    amount: overrides.amount || 100.00, // Will be converted to Decimal
    commissionRate: overrides.commissionRate || 0.05,
    commissionAmount: overrides.commissionAmount || 5.00,
    createdAt: overrides.createdAt || new Date(),
    ...overrides
  }),

  payout: (partnerId: string, overrides: Partial<any> = {}) => ({
    id: `payout-${Math.random().toString(36).slice(2, 10)}`,
    partnerId,
    periodStart: overrides.periodStart || new Date('2026-02-01'),
    periodEnd: overrides.periodEnd || new Date('2026-02-28'),
    status: overrides.status || 'DRAFT',
    ledgerType: overrides.ledgerType || 'PAYOUT',
    version: overrides.version || 1,
    snapshotHash: overrides.snapshotHash || null,
    conversionIds: overrides.conversionIds || [],
    totalConversions: overrides.totalConversions || 0,
    totalRevenue: overrides.totalRevenue || 0,
    totalCommission: overrides.totalCommission || 0,
    approvedBy: overrides.approvedBy || null,
    approvedAt: overrides.approvedAt || null,
    paidAt: overrides.paidAt || null,
    paymentMethod: overrides.paymentMethod || null,
    paymentReference: overrides.paymentReference || null,
    referenceLedgerId: overrides.referenceLedgerId || null,
    adjustmentReason: overrides.adjustmentReason || null,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides
  }),

  apiKey: (partnerId: string, overrides: Partial<any> = {}) => {
    const rawKey = overrides.rawKey || `pk_test_${Math.random().toString(36).slice(2, 42)}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12)

    return {
      id: `key-${Math.random().toString(36).slice(2, 10)}`,
      partnerId,
      keyHash,
      keyPrefix,
      keyType: overrides.keyType || 'partner',
      permissions: overrides.permissions || ['read:cafes', 'read:links', 'write:posts'],
      rateLimit: overrides.rateLimit || 100,
      lastUsedAt: overrides.lastUsedAt || null,
      expiresAt: overrides.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: overrides.createdAt || new Date(),
      rawKey, // For testing only
      ...overrides
    }
  }
}

/**
 * Generate unique short code (ABCD1234 format)
 */
export function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create mock Prisma client for tests
 */
export function createMockPrisma() {
  return {
    referralPartner: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    referralCafe: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    referralLink: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    referralConversion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn()
    },
    payoutLedger: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    partnerApiKey: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    externalPost: {
      create: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn()
    },
    $transaction: vi.fn((callback: any) => {
      const client: any = {
        referralPartner: this.referralPartner,
        referralCafe: this.referralCafe,
        referralLink: this.referralLink,
        referralConversion: this.referralConversion,
        payoutLedger: this.payoutLedger,
        partnerApiKey: this.partnerApiKey,
        auditLog: this.auditLog,
        externalPost: this.externalPost,
        $queryRaw: vi.fn()
      }
      return callback(client)
    }),
    $queryRaw: vi.fn()
  }
}

/**
 * Create mock Redis client for tests
 */
export function createMockRedis() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    zadd: vi.fn(),
    zcard: vi.fn(),
    zrange: vi.fn(),
    zremrangebyscore: vi.fn(),
    keys: vi.fn(),
    publish: vi.fn(),
    subscribe: vi.fn(),
    on: vi.fn(),
    duplicate: vi.fn()
  }
}

/**
 * Mock API request for Next.js API routes
 */
export function mockApiRequest(
  method: string,
  body?: any,
  headers: Record<string, string> = {}
): Request {
  const url = 'http://localhost:3000/api/test'
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  return new Request(url, requestInit)
}

/**
 * Mock NextAuth session
 */
export function mockAdminSession(overrides: Partial<any> = {}) {
  return {
    user: {
      id: overrides.userId || `user-${Math.random().toString(36).slice(2, 10)}`,
      email: overrides.email || 'admin@qetta.com',
      role: overrides.role || 'ADMIN',
      name: overrides.name || 'Admin User',
      ...overrides.user
    },
    expires: overrides.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}

/**
 * Calculate expected snapshot hash
 */
export function calculateSnapshotHash(conversionIds: string[]): string {
  const sorted = [...conversionIds].sort()
  return createHash('sha256').update(sorted.join(',')).digest('hex')
}

/**
 * Wait for a condition to be true (for async testing)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

/**
 * Type-safe vi mock import
 */
export { vi } from 'vitest'
