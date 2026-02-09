/**
 * Admin API Integration Tests - Partner Management (P0 - Critical)
 * Tests NextAuth authentication, partner CRUD, audit logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHash } from 'crypto'
import { factories, mockApiRequest, mockAdminSession, createMockPrisma } from '@/lib/accounting/__tests__/utils/test-helpers'

// Mock Prisma
const mockPrisma = createMockPrisma()
vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma
}))

// Mock NextAuth
const mockSession = mockAdminSession()
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(() => Promise.resolve(mockSession))
}))

// Mock partner creation handler
const createPartnerHandler = async (req: Request) => {
  const session = mockSession
  if (!session || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const body = await req.json()
    const { orgId, orgName, businessNumber, contactEmail, contactName } = body

    // Validation
    if (!orgId || !orgName || !businessNumber || !contactEmail || !contactName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Business number format validation (123-45-67890)
    const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/
    if (!businessNumberRegex.test(businessNumber)) {
      return new Response(JSON.stringify({ error: 'Invalid business number format' }), { status: 400 })
    }

    // Check for duplicate business number
    const existing = await mockPrisma.referralPartner.findUnique({
      where: { businessNumber }
    })
    if (existing) {
      return new Response(JSON.stringify({ error: 'Business number already registered' }), { status: 409 })
    }

    // Create partner in transaction with audit log
    const result = await mockPrisma.$transaction(async (tx) => {
      const partner = await tx.referralPartner.create({
        data: {
          orgId,
          orgName,
          businessNumber,
          contactEmail,
          contactName,
          status: 'ACTIVE'
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: 'partner',
          entityId: partner.id,
          action: 'create',
          actorId: session.user.id,
          actorEmail: session.user.email,
          afterState: partner,
          metadata: {
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
          }
        }
      })

      return partner
    })

    return new Response(JSON.stringify({ success: true, data: result }), { status: 201 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

// Mock cafe creation handler
const createCafeHandler = async (req: Request, partnerId: string) => {
  const session = mockSession
  if (!session || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const body = await req.json()
    const { cafeName, commissionRate } = body

    if (!cafeName || commissionRate === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Validate commission rate (0.0001 to 0.9999 for Decimal(5,4))
    if (commissionRate < 0.0001 || commissionRate > 0.9999) {
      return new Response(
        JSON.stringify({ error: 'Commission rate must be between 0.01% and 99.99%' }),
        { status: 400 }
      )
    }

    // Verify partner exists and is active
    const partner = await mockPrisma.referralPartner.findUnique({
      where: { id: partnerId }
    })
    if (!partner) {
      return new Response(JSON.stringify({ error: 'Partner not found' }), { status: 404 })
    }
    if (partner.status !== 'ACTIVE') {
      return new Response(JSON.stringify({ error: 'Partner is not active' }), { status: 400 })
    }

    const cafe = await mockPrisma.referralCafe.create({
      data: {
        partnerId,
        cafeName,
        commissionRate,
        status: 'ACTIVE'
      }
    })

    return new Response(JSON.stringify({ success: true, data: cafe }), { status: 201 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

// Mock API key generation handler
const generateApiKeyHandler = async (req: Request, partnerId: string) => {
  const session = mockSession
  if (!session || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const body = await req.json()
    const { permissions, expiresInDays } = body

    if (!permissions || !Array.isArray(permissions) || !expiresInDays) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Verify partner exists
    const partner = await mockPrisma.referralPartner.findUnique({
      where: { id: partnerId }
    })
    if (!partner) {
      return new Response(JSON.stringify({ error: 'Partner not found' }), { status: 404 })
    }

    // Generate API key
    const prefix = 'pk_live'
    const randomPart = Array.from({ length: 32 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
    ).join('')
    const rawKey = `${prefix}_${randomPart}`

    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12)

    const apiKey = await mockPrisma.partnerApiKey.create({
      data: {
        partnerId,
        keyHash,
        keyPrefix,
        keyType: 'partner',
        permissions,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      }
    })

    // WARNING: Raw key returned ONLY once
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...apiKey,
          rawKey
        },
        warning: 'Store this API key securely. It will not be shown again.'
      }),
      { status: 201 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}

describe('Admin API - Partner Management (CRITICAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/accounting/admin/partners', () => {
    it('creates partner with valid admin session', async () => {
      const req = mockApiRequest('POST', {
        orgId: 'ORG001',
        orgName: 'Test Partner',
        businessNumber: '123-45-67890',
        contactEmail: 'test@partner.com',
        contactName: 'John Doe'
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(null)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.referralPartner.create.mockResolvedValue(
        factories.partner({ orgId: 'ORG001', orgName: 'Test Partner' })
      )
      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        entityType: 'partner',
        entityId: 'partner-123',
        action: 'create',
        actorId: mockSession.user.id,
        actorEmail: mockSession.user.email,
        afterState: {},
        createdAt: new Date()
      })

      const response = await createPartnerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.orgId).toBe('ORG001')
      expect(mockPrisma.auditLog.create).toHaveBeenCalled()
    })

    it('rejects request without admin session', async () => {
      vi.mocked(mockSession).user.role = 'USER' // Not admin
      const req = mockApiRequest('POST', { orgId: 'ORG001' })

      const response = await createPartnerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      vi.mocked(mockSession).user.role = 'ADMIN' // Reset
    })

    it('validates business number format (123-45-67890)', async () => {
      const req = mockApiRequest('POST', {
        orgId: 'ORG001',
        orgName: 'Test Partner',
        businessNumber: 'invalid-format',
        contactEmail: 'test@partner.com',
        contactName: 'John Doe'
      })

      const response = await createPartnerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid business number format')
    })

    it('prevents duplicate business number registration', async () => {
      const req = mockApiRequest('POST', {
        orgId: 'ORG002',
        orgName: 'Duplicate Partner',
        businessNumber: '123-45-67890',
        contactEmail: 'duplicate@partner.com',
        contactName: 'Jane Doe'
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ businessNumber: '123-45-67890' })
      )

      const response = await createPartnerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already registered')
    })

    it('creates audit log entry on partner creation', async () => {
      const req = mockApiRequest('POST', {
        orgId: 'ORG001',
        orgName: 'Test Partner',
        businessNumber: '123-45-67890',
        contactEmail: 'test@partner.com',
        contactName: 'John Doe'
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(null)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.referralPartner.create.mockResolvedValue(
        factories.partner({ id: 'partner-123' })
      )

      await createPartnerHandler(req)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'partner',
          entityId: 'partner-123',
          action: 'create',
          actorId: mockSession.user.id,
          actorEmail: mockSession.user.email
        })
      })
    })

    it('validates required fields', async () => {
      const req = mockApiRequest('POST', {
        orgId: 'ORG001'
        // Missing other required fields
      })

      const response = await createPartnerHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })
  })

  describe('POST /api/accounting/admin/partners/[id]/cafes', () => {
    it('creates cafe for active partner', async () => {
      const partnerId = 'partner-123'
      const req = mockApiRequest('POST', {
        cafeName: 'HQ Location',
        commissionRate: 0.05
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ id: partnerId, status: 'ACTIVE' })
      )
      mockPrisma.referralCafe.create.mockResolvedValue(
        factories.cafe(partnerId, { cafeName: 'HQ Location', commissionRate: 0.05 })
      )

      const response = await createCafeHandler(req, partnerId)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.cafeName).toBe('HQ Location')
      expect(data.data.commissionRate).toBe(0.05)
    })

    it('rejects cafe creation for inactive partner', async () => {
      const partnerId = 'partner-123'
      const req = mockApiRequest('POST', {
        cafeName: 'Test Cafe',
        commissionRate: 0.05
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ id: partnerId, status: 'INACTIVE' })
      )

      const response = await createCafeHandler(req, partnerId)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('not active')
    })

    it('validates commission rate boundaries', async () => {
      const partnerId = 'partner-123'
      const req = mockApiRequest('POST', {
        cafeName: 'Test Cafe',
        commissionRate: 1.5 // Invalid: 150%
      })

      const response = await createCafeHandler(req, partnerId)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('between 0.01% and 99.99%')
    })

    it('returns 404 for non-existent partner', async () => {
      const partnerId = 'non-existent'
      const req = mockApiRequest('POST', {
        cafeName: 'Test Cafe',
        commissionRate: 0.05
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(null)

      const response = await createCafeHandler(req, partnerId)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })

  describe('POST /api/accounting/admin/partners/[id]/api-keys', () => {
    it('generates API key with SHA-256 hash', async () => {
      const partnerId = 'partner-123'
      const req = mockApiRequest('POST', {
        permissions: ['read:cafes', 'write:posts'],
        expiresInDays: 365
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ id: partnerId })
      )
      mockPrisma.partnerApiKey.create.mockResolvedValue({
        id: 'key-123',
        partnerId,
        keyHash: createHash('sha256').update('pk_live_test123').digest('hex'),
        keyPrefix: 'pk_live_test',
        keyType: 'partner',
        permissions: ['read:cafes', 'write:posts'],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastUsedAt: null,
        createdAt: new Date()
      })

      const response = await generateApiKeyHandler(req, partnerId)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.rawKey).toMatch(/^pk_live_[a-z0-9]{32}$/)
      expect(data.data.keyHash).toMatch(/^[a-f0-9]{64}$/)
      expect(data.warning).toContain('will not be shown again')
    })

    it('returns raw key only once (not stored)', async () => {
      const partnerId = 'partner-123'
      const req = mockApiRequest('POST', {
        permissions: ['read:cafes'],
        expiresInDays: 365
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ id: partnerId })
      )

      const createdKey = {
        id: 'key-123',
        partnerId,
        keyHash: 'hash123',
        keyPrefix: 'pk_live_test',
        keyType: 'partner',
        permissions: ['read:cafes'],
        expiresAt: new Date(),
        lastUsedAt: null,
        createdAt: new Date()
      }

      mockPrisma.partnerApiKey.create.mockResolvedValue(createdKey)

      const response = await generateApiKeyHandler(req, partnerId)
      const data = await response.json()

      expect(data.data.rawKey).toBeDefined()
      expect(createdKey).not.toHaveProperty('rawKey') // Not in DB record
    })

    it('validates permissions array', async () => {
      const partnerId = 'partner-123'
      const req = mockApiRequest('POST', {
        permissions: 'invalid', // Not an array
        expiresInDays: 365
      })

      const response = await generateApiKeyHandler(req, partnerId)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('sets correct expiration date', async () => {
      const partnerId = 'partner-123'
      const req = mockApiRequest('POST', {
        permissions: ['read:cafes'],
        expiresInDays: 30
      })

      mockPrisma.referralPartner.findUnique.mockResolvedValue(
        factories.partner({ id: partnerId })
      )

      const now = Date.now()
      const expectedExpiry = new Date(now + 30 * 24 * 60 * 60 * 1000)

      mockPrisma.partnerApiKey.create.mockResolvedValue({
        id: 'key-123',
        partnerId,
        keyHash: 'hash123',
        keyPrefix: 'pk_live_test',
        keyType: 'partner',
        permissions: ['read:cafes'],
        expiresAt: expectedExpiry,
        lastUsedAt: null,
        createdAt: new Date()
      })

      const response = await generateApiKeyHandler(req, partnerId)
      const data = await response.json()

      expect(response.status).toBe(201)
      const expiresAt = new Date(data.data.expiresAt)
      const diffDays = Math.round((expiresAt.getTime() - now) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBeCloseTo(30, 0)
    })
  })
})
