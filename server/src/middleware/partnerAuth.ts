import { type Request, type Response, type NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { getDb } from '../config/mongodb.js';
import { logger } from '../config/logger.js';
import type { FirmAccount } from '../types/settlement.js';

declare global {
  namespace Express {
    interface Request {
      firmAccount?: FirmAccount;
    }
  }
}

/**
 * API key 인증 미들웨어 (SHA-256)
 * Header: x-api-key: <raw key>
 */
export async function requirePartnerOrg(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing x-api-key header' });
    return;
  }

  const hash = createHash('sha256').update(apiKey).digest('hex');
  const db = getDb();
  const firm = await db.collection<FirmAccount>('firm_accounts').findOne({ api_key_hash: hash });

  if (!firm) {
    logger.warn({ hash: hash.slice(0, 8) }, 'Invalid API key');
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  req.firmAccount = firm;
  next();
}
