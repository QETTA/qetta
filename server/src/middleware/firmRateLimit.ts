import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { PlanType } from '../types/settlement.js';

const PLAN_LIMITS: Record<PlanType, { windowMs: number; max: number }> = {
  trial: { windowMs: 60_000, max: 30 },
  starter: { windowMs: 60_000, max: 60 },
  pro: { windowMs: 60_000, max: 120 },
  firm: { windowMs: 60_000, max: 300 },
};

export const firmRateLimit = rateLimit({
  windowMs: 60_000,
  max: (req: Request) => {
    const plan = req.firmAccount?.plan_type ?? 'trial';
    return PLAN_LIMITS[plan]?.max ?? 30;
  },
  keyGenerator: (req: Request) => req.firmAccount?.firm_id ?? req.ip ?? 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
