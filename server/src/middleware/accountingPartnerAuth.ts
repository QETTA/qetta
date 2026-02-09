/**
 * Accounting Partner API Authentication Middleware
 * Uses Prisma to verify x-api-key for accounting partners
 */

import { type NextFunction, type Request, type Response } from 'express'
import { createHash } from 'node:crypto'
import { logger } from '../config/logger.js'

// Import Prisma client
// Note: Adjust path based on your project structure
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Extend Express Request type with partner
declare module 'express-serve-static-core' {
  interface Request {
    partner?: {
      id: string
      orgId: string
      orgName: string
      contactEmail: string
      permissions: string[]
      rateLimit: number
    }
  }
}

/**
 * Require accounting partner authentication via x-api-key header
 * Verifies key against Prisma PartnerApiKey table
 */
export async function requireAccountingPartner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined

  if (!apiKey) {
    res.status(401).json({ error: 'Missing x-api-key header' })
    return
  }

  try {
    // Hash API key
    const keyHash = createHash('sha256').update(apiKey).digest('hex')

    // Look up in Prisma
    const apiKeyRecord = await prisma.partnerApiKey.findUnique({
      where: { keyHash },
      include: {
        partner: {
          select: {
            id: true,
            orgId: true,
            orgName: true,
            contactEmail: true,
            status: true,
          },
        },
      },
    })

    if (!apiKeyRecord) {
      logger.warn({ keyPrefix: keyHash.slice(0, 8) }, 'Invalid API key')
      res.status(401).json({ error: 'Invalid API key' })
      return
    }

    // Check key type
    if (apiKeyRecord.keyType !== 'partner') {
      logger.warn(
        { keyType: apiKeyRecord.keyType, keyPrefix: keyHash.slice(0, 8) },
        'Wrong key type for accounting partner API'
      )
      res.status(401).json({ error: 'Invalid API key type' })
      return
    }

    // Check expiration
    if (apiKeyRecord.expiresAt < new Date()) {
      logger.warn(
        { expiresAt: apiKeyRecord.expiresAt, keyPrefix: keyHash.slice(0, 8) },
        'Expired API key'
      )
      res.status(401).json({ error: 'API key expired' })
      return
    }

    // Check partner status
    if (apiKeyRecord.partner.status !== 'ACTIVE') {
      logger.warn(
        { status: apiKeyRecord.partner.status, partnerId: apiKeyRecord.partner.id },
        'Inactive partner'
      )
      res.status(403).json({ error: 'Partner account is inactive' })
      return
    }

    // Update last used timestamp (fire and forget)
    prisma.partnerApiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => {
        logger.error({ error: err }, 'Failed to update lastUsedAt')
      })

    // Attach partner info to request
    req.partner = {
      id: apiKeyRecord.partner.id,
      orgId: apiKeyRecord.partner.orgId,
      orgName: apiKeyRecord.partner.orgName,
      contactEmail: apiKeyRecord.partner.contactEmail,
      permissions: apiKeyRecord.permissions,
      rateLimit: apiKeyRecord.rateLimit,
    }

    next()
  } catch (error) {
    logger.error({ error }, 'Partner auth error')
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Check if partner has specific permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.partner) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    if (!req.partner.permissions.includes(permission)) {
      logger.warn(
        {
          partnerId: req.partner.id,
          requiredPermission: permission,
          actualPermissions: req.partner.permissions,
        },
        'Insufficient permissions'
      )
      res.status(403).json({ error: `Missing permission: ${permission}` })
      return
    }

    next()
  }
}
