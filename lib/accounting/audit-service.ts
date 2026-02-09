/**
 * Comprehensive Audit Logging Service
 * 
 * Critical for P0 compliance - tracks all financial operations
 * Immutable append-only trail for forensic investigation
 * 
 * @see Plan: Part B: Security Hardening - B2. Comprehensive Audit Logging
 */

import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/telemetry/logger'

export interface AuditLogParams {
  entityType: 'payout' | 'partner' | 'api_key' | 'referral' | 'cafe'
  entityId: string
  action: 'create' | 'update' | 'delete' | 'approve' | 'adjust' | 'generate_key' | 'revoke_key'
  actorId: string
  actorEmail: string
  beforeState?: Record<string, any>
  afterState: Record<string, any>
  metadata?: {
    ipAddress?: string
    userAgent?: string
    reason?: string
    requestId?: string
    [key: string]: any
  }
}

/**
 * Log an audit entry for financial/security-critical operations
 * 
 * @param params - Audit log parameters
 * @returns Created audit log entry
 * 
 * @example
 * await logAudit({
 *   entityType: 'payout',
 *   entityId: payoutId,
 *   action: 'approve',
 *   actorId: session.user.id,
 *   actorEmail: session.user.email,
 *   beforeState: { status: 'DRAFT' },
 *   afterState: { status: 'APPROVED', approvedAt: new Date() },
 *   metadata: { 
 *     ipAddress: req.ip, 
 *     reason: 'Monthly settlement Q1 2026' 
 *   }
 * })
 */
export async function logAudit(params: AuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        beforeState: params.beforeState || null,
        afterState: params.afterState,
        metadata: params.metadata || null
      }
    })

    // Also log to structured logger for Datadog/Grafana
    logger.info({
      auditLogId: auditLog.id,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorEmail: params.actorEmail
    }, 'Audit log created')

    return auditLog
  } catch (error) {
    // Critical: audit logging failure should not block operations
    // But it MUST be logged for investigation
    logger.error({
      error,
      params
    }, 'CRITICAL: Audit log creation failed')
    
    // Don't throw - fail gracefully
    return null
  }
}

/**
 * Query audit logs for an entity
 * 
 * @param entityType - Type of entity
 * @param entityId - ID of entity
 * @param options - Query options
 * @returns Audit log entries
 */
export async function getAuditLogs(
  entityType: string,
  entityId: string,
  options?: {
    limit?: number
    offset?: number
    action?: string
    actorId?: string
    fromDate?: Date
    toDate?: Date
  }
) {
  const where: any = {
    entityType,
    entityId
  }

  if (options?.action) {
    where.action = options.action
  }

  if (options?.actorId) {
    where.actorId = options.actorId
  }

  if (options?.fromDate || options?.toDate) {
    where.createdAt = {}
    if (options.fromDate) where.createdAt.gte = options.fromDate
    if (options.toDate) where.createdAt.lte = options.toDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0
    }),
    prisma.auditLog.count({ where })
  ])

  return {
    logs,
    total,
    hasMore: (options?.offset || 0) + logs.length < total
  }
}

/**
 * Get audit logs for an actor (admin user)
 * 
 * @param actorId - Actor user ID
 * @param options - Query options
 */
export async function getAuditLogsByActor(
  actorId: string,
  options?: {
    limit?: number
    offset?: number
    entityType?: string
    fromDate?: Date
    toDate?: Date
  }
) {
  const where: any = {
    actorId
  }

  if (options?.entityType) {
    where.entityType = options.entityType
  }

  if (options?.fromDate || options?.toDate) {
    where.createdAt = {}
    if (options.fromDate) where.createdAt.gte = options.fromDate
    if (options.toDate) where.createdAt.lte = options.toDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0
    }),
    prisma.auditLog.count({ where })
  ])

  return {
    logs,
    total,
    hasMore: (options?.offset || 0) + logs.length < total
  }
}

/**
 * Audit log middleware for Express routes
 * Automatically logs request/response for auditable endpoints
 * 
 * @example
 * router.post('/payouts/approve', auditMiddleware('payout', 'approve'), async (req, res) => {
 *   // req.auditContext will be populated
 * })
 */
export function auditMiddleware(entityType: string, action: string) {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res)

    // Capture response for after-state
    res.json = function(body: any) {
      // Store audit context for use in route handler
      req.auditContext = {
        entityType,
        action,
        responseBody: body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
      return originalJson(body)
    }

    next()
  }
}

/**
 * Helper: Create audit log from Express request context
 * 
 * @example
 * await auditFromRequest(req, {
 *   entityType: 'payout',
 *   entityId: payoutId,
 *   action: 'approve',
 *   beforeState: { status: 'DRAFT' },
 *   afterState: { status: 'APPROVED' }
 * })
 */
export async function auditFromRequest(
  req: any,
  params: Omit<AuditLogParams, 'actorId' | 'actorEmail' | 'metadata'>
) {
  const session = req.session || req.user

  if (!session?.user) {
    logger.warn('Audit log requested without session - skipping')
    return null
  }

  return logAudit({
    ...params,
    actorId: session.user.id,
    actorEmail: session.user.email,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.id || req.headers['x-request-id']
    }
  })
}

/**
 * Generate audit report for compliance
 * 
 * @param options - Report options
 * @returns Audit report data
 */
export async function generateAuditReport(options: {
  entityType?: string
  fromDate: Date
  toDate: Date
  actorId?: string
}) {
  const where: any = {
    createdAt: {
      gte: options.fromDate,
      lte: options.toDate
    }
  }

  if (options.entityType) where.entityType = options.entityType
  if (options.actorId) where.actorId = options.actorId

  const [logs, summary] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    }),
    prisma.auditLog.groupBy({
      by: ['entityType', 'action'],
      where,
      _count: true
    })
  ])

  return {
    period: {
      from: options.fromDate,
      to: options.toDate
    },
    totalLogs: logs.length,
    summary: summary.map(s => ({
      entityType: s.entityType,
      action: s.action,
      count: s._count
    })),
    logs
  }
}
