/**
 * QETTA Block Engine - Company Block Database Layer
 *
 * Prisma CRUD operations for CompanyBlock and CompanyFact.
 * Separates persistence from business logic (company-block.ts).
 *
 * @see lib/block-engine/company-block.ts (business logic)
 * @see prisma/schema.prisma (model definitions)
 */

import { prisma } from '@/lib/db/prisma'
import type { Prisma, IndustryBlock, CompanyFactType, FactSource } from '@prisma/client'
import type { CompanyProfile } from '@/lib/skill-engine/types'
import type {
  CompanyBlock as CompanyBlockType,
  CompanyFact as CompanyFactType_Internal,
  CompressionStats,
  FactSource as FactSourceInternal,
  CompanyFactType as CompanyFactTypeInternal,
} from './types'

// Helper to safely convert CompanyProfile to/from Prisma JSON
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
function toJsonValue(profile: CompanyProfile): JsonValue {
  return profile as unknown as JsonValue
}
function fromJsonValue(json: Prisma.JsonValue): CompanyProfile {
  return json as unknown as CompanyProfile
}

// ================== Type Mappings ==================

/**
 * Map Prisma enum to internal type (snake_case → lowercase)
 */
function mapPrismaFactType(prismaType: CompanyFactType): CompanyFactTypeInternal {
  const mapping: Record<CompanyFactType, CompanyFactTypeInternal> = {
    PROFILE: 'profile',
    CERTIFICATION: 'certification',
    APPLICATION: 'application',
    PREFERENCE: 'preference',
    REJECTION_PATTERN: 'rejection_pattern',
    SUCCESS_PATTERN: 'success_pattern',
    CAPABILITY: 'capability',
  }
  return mapping[prismaType]
}

/**
 * Map internal type to Prisma enum
 */
function mapInternalFactType(internalType: CompanyFactTypeInternal): CompanyFactType {
  const mapping: Record<CompanyFactTypeInternal, CompanyFactType> = {
    profile: 'PROFILE',
    certification: 'CERTIFICATION',
    application: 'APPLICATION',
    preference: 'PREFERENCE',
    rejection_pattern: 'REJECTION_PATTERN',
    success_pattern: 'SUCCESS_PATTERN',
    capability: 'CAPABILITY',
  }
  return mapping[internalType]
}

/**
 * Map Prisma FactSource to internal
 */
function mapPrismaFactSource(prismaSource: FactSource): FactSourceInternal {
  const mapping: Record<FactSource, FactSourceInternal> = {
    USER_INPUT: 'user_input',
    DOCUMENT_PARSED: 'document_parsed',
    EMAIL_DETECTED: 'email_detected',
    AI_INFERRED: 'ai_inferred',
  }
  return mapping[prismaSource]
}

/**
 * Map internal FactSource to Prisma
 */
function mapInternalFactSource(internalSource: FactSourceInternal): FactSource {
  const mapping: Record<FactSourceInternal, FactSource> = {
    user_input: 'USER_INPUT',
    document_parsed: 'DOCUMENT_PARSED',
    email_detected: 'EMAIL_DETECTED',
    ai_inferred: 'AI_INFERRED',
  }
  return mapping[internalSource]
}

// ================== Result Types ==================

export interface CompanyBlockDB {
  id: string
  userId: string
  companyName: string
  businessNumber: string | null
  industryBlock: IndustryBlock
  profile: CompanyProfile
  originalTokens: number
  compressedTokens: number
  compressionRatio: number
  lastCompressedAt: Date | null
  createdAt: Date
  updatedAt: Date
  facts: CompanyFactDB[]
}

export interface CompanyFactDB {
  id: string
  companyBlockId: string
  type: CompanyFactType
  content: string
  confidence: number
  source: FactSource
  relatedId: string | null
  expiresAt: Date | null
  createdAt: Date
}

// ================== Converters ==================

/**
 * Convert Prisma result to internal CompanyBlock type
 */
export function toInternalCompanyBlock(db: CompanyBlockDB): CompanyBlockType {
  return {
    companyId: db.id,
    profile: db.profile,
    facts: db.facts.map(toInternalCompanyFact),
    compression: {
      originalTokens: db.originalTokens,
      compressedTokens: db.compressedTokens,
      ratio: db.compressionRatio,
    },
    updatedAt: db.updatedAt.toISOString(),
  }
}

/**
 * Convert Prisma result to internal CompanyFact type
 */
export function toInternalCompanyFact(db: CompanyFactDB): CompanyFactType_Internal {
  return {
    id: db.id,
    type: mapPrismaFactType(db.type),
    content: db.content,
    confidence: db.confidence,
    source: mapPrismaFactSource(db.source),
    createdAt: db.createdAt.toISOString(),
    expiresAt: db.expiresAt?.toISOString(),
    relatedId: db.relatedId ?? undefined,
  }
}

// ================== CRUD Operations ==================

/**
 * Create a new CompanyBlock
 */
export async function createCompanyBlock(data: {
  userId: string
  companyName: string
  businessNumber?: string
  industryBlock?: IndustryBlock
  profile: CompanyProfile
  compression?: CompressionStats
}): Promise<CompanyBlockDB> {
  const result = await prisma.companyBlock.create({
    data: {
      userId: data.userId,
      companyName: data.companyName,
      businessNumber: data.businessNumber,
      industryBlock: data.industryBlock ?? 'GENERAL',
      profile: toJsonValue(data.profile) as Prisma.InputJsonValue,
      originalTokens: data.compression?.originalTokens ?? 0,
      compressedTokens: data.compression?.compressedTokens ?? 0,
      compressionRatio: data.compression?.ratio ?? 0,
      lastCompressedAt: data.compression ? new Date() : null,
    },
    include: {
      facts: true,
    },
  })

  return {
    ...result,
    profile: fromJsonValue(result.profile),
    facts: result.facts,
  }
}

/**
 * Get CompanyBlock by ID
 */
export async function getCompanyBlockById(id: string): Promise<CompanyBlockDB | null> {
  const result = await prisma.companyBlock.findUnique({
    where: { id },
    include: { facts: { orderBy: { createdAt: 'desc' } } },
  })

  if (!result) return null

  return {
    ...result,
    profile: fromJsonValue(result.profile),
    facts: result.facts,
  }
}

/**
 * Get CompanyBlock by userId (first one or null)
 */
export async function getCompanyBlockByUserId(userId: string): Promise<CompanyBlockDB | null> {
  const result = await prisma.companyBlock.findFirst({
    where: { userId },
    include: { facts: { orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  })

  if (!result) return null

  return {
    ...result,
    profile: fromJsonValue(result.profile),
    facts: result.facts,
  }
}

/**
 * Get all CompanyBlocks for a user
 */
export async function getCompanyBlocksByUserId(userId: string): Promise<CompanyBlockDB[]> {
  const results = await prisma.companyBlock.findMany({
    where: { userId },
    include: { facts: { orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  })

  return results.map(result => ({
    ...result,
    profile: fromJsonValue(result.profile),
    facts: result.facts,
  }))
}

/**
 * Update CompanyBlock
 */
export async function updateCompanyBlock(
  id: string,
  data: {
    companyName?: string
    businessNumber?: string | null
    industryBlock?: IndustryBlock
    profile?: CompanyProfile
    compression?: CompressionStats
  }
): Promise<CompanyBlockDB> {
  const updateData: Prisma.CompanyBlockUpdateInput = {}

  if (data.companyName !== undefined) updateData.companyName = data.companyName
  if (data.businessNumber !== undefined) updateData.businessNumber = data.businessNumber
  if (data.industryBlock !== undefined) updateData.industryBlock = data.industryBlock
  if (data.profile !== undefined) updateData.profile = toJsonValue(data.profile) as Prisma.InputJsonValue
  if (data.compression) {
    updateData.originalTokens = data.compression.originalTokens
    updateData.compressedTokens = data.compression.compressedTokens
    updateData.compressionRatio = data.compression.ratio
    updateData.lastCompressedAt = new Date()
  }

  const result = await prisma.companyBlock.update({
    where: { id },
    data: updateData,
    include: { facts: { orderBy: { createdAt: 'desc' } } },
  })

  return {
    ...result,
    profile: fromJsonValue(result.profile),
    facts: result.facts,
  }
}

/**
 * Delete CompanyBlock (cascades to facts)
 */
export async function deleteCompanyBlock(id: string): Promise<boolean> {
  try {
    await prisma.companyBlock.delete({
      where: { id },
    })
    return true
  } catch {
    return false
  }
}

// ================== Fact Operations ==================

/**
 * Add a fact to CompanyBlock
 */
export async function addCompanyFact(data: {
  companyBlockId: string
  type: CompanyFactTypeInternal
  content: string
  confidence?: number
  source?: FactSourceInternal
  relatedId?: string
  expiresAt?: Date
}): Promise<CompanyFactDB> {
  return prisma.companyFact.create({
    data: {
      companyBlockId: data.companyBlockId,
      type: mapInternalFactType(data.type),
      content: data.content,
      confidence: data.confidence ?? 1.0,
      source: data.source ? mapInternalFactSource(data.source) : 'USER_INPUT',
      relatedId: data.relatedId,
      expiresAt: data.expiresAt,
    },
  })
}

/**
 * Get facts for a CompanyBlock with optional type filter
 */
export async function getCompanyFacts(
  companyBlockId: string,
  typeFilter?: CompanyFactTypeInternal[]
): Promise<CompanyFactDB[]> {
  const where: Prisma.CompanyFactWhereInput = {
    companyBlockId,
  }

  if (typeFilter && typeFilter.length > 0) {
    where.type = {
      in: typeFilter.map(mapInternalFactType),
    }
  }

  return prisma.companyFact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Update a fact
 */
export async function updateCompanyFact(
  factId: string,
  data: {
    content?: string
    confidence?: number
    expiresAt?: Date | null
  }
): Promise<CompanyFactDB> {
  return prisma.companyFact.update({
    where: { id: factId },
    data,
  })
}

/**
 * Delete a fact
 */
export async function deleteCompanyFact(factId: string): Promise<boolean> {
  try {
    await prisma.companyFact.delete({
      where: { id: factId },
    })
    return true
  } catch {
    return false
  }
}

/**
 * Delete expired facts for a CompanyBlock
 */
export async function cleanupExpiredFacts(companyBlockId: string): Promise<number> {
  const result = await prisma.companyFact.deleteMany({
    where: {
      companyBlockId,
      expiresAt: {
        lte: new Date(),
      },
    },
  })
  return result.count
}

/**
 * Bulk create facts (for initial profile extraction)
 */
export async function bulkCreateFacts(
  companyBlockId: string,
  facts: Array<{
    type: CompanyFactTypeInternal
    content: string
    confidence?: number
    source?: FactSourceInternal
    relatedId?: string
    expiresAt?: Date
  }>
): Promise<number> {
  const result = await prisma.companyFact.createMany({
    data: facts.map(fact => ({
      companyBlockId,
      type: mapInternalFactType(fact.type),
      content: fact.content,
      confidence: fact.confidence ?? 1.0,
      source: fact.source ? mapInternalFactSource(fact.source) : 'USER_INPUT',
      relatedId: fact.relatedId,
      expiresAt: fact.expiresAt,
    })),
  })
  return result.count
}

// ================== Query Utilities ==================

/**
 * Check if user owns the CompanyBlock
 */
export async function isCompanyBlockOwner(companyBlockId: string, userId: string): Promise<boolean> {
  const block = await prisma.companyBlock.findUnique({
    where: { id: companyBlockId },
    select: { userId: true },
  })
  return block?.userId === userId
}

/**
 * Get CompanyBlock count for a user
 */
export async function getCompanyBlockCount(userId: string): Promise<number> {
  return prisma.companyBlock.count({
    where: { userId },
  })
}
