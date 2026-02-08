import { Router, type Request, type Response } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { getDb } from '../config/mongodb.js';
import { registerFirmDto } from '../dto/firm.dto.js';
import type { FirmAccount, PlanType } from '../types/settlement.js';

export const firmRouter = Router();

const PLAN_INCLUDED_PACKAGES: Record<PlanType, number> = {
  trial: 3,
  starter: 10,
  pro: 80,
  firm: 999999,
};

// POST /api/qetta/v1/firm/register — 회계법인 등록 (파일럿 신청)
firmRouter.post('/register', async (req: Request, res: Response) => {
  const dto = registerFirmDto.parse(req.body);

  const rawApiKey = `qetta_${randomUUID().replace(/-/g, '')}`;
  const apiKeyHash = createHash('sha256').update(rawApiKey).digest('hex');
  const firmId = randomUUID();

  const account: Omit<FirmAccount, '_id'> = {
    firm_id: firmId,
    firm_name: dto.firm_name,
    plan_type: dto.plan_type,
    contact_email: dto.contact_email,
    contact_name: dto.contact_name,
    api_key_hash: apiKeyHash,
    included_packages: PLAN_INCLUDED_PACKAGES[dto.plan_type],
    used_packages: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  await getDb().collection('firm_accounts').insertOne(account);

  // API key는 생성 시 1회만 반환 (이후 조회 불가)
  res.status(201).json({
    firm_id: firmId,
    firm_name: dto.firm_name,
    plan_type: dto.plan_type,
    api_key: rawApiKey,
    message: 'API key는 이 응답에서만 확인 가능합니다. 안전하게 보관하세요.',
  });
});

// GET /api/qetta/v1/firm/:id/usage — 사용량/과금 현황 조회 (P1)
firmRouter.get('/:id/usage', async (req: Request, res: Response) => {
  const firm = req.firmAccount!;

  res.json({
    firm_id: firm.firm_id,
    plan_type: firm.plan_type,
    included_packages: firm.included_packages,
    used_packages: firm.used_packages,
    remaining_packages: firm.included_packages - firm.used_packages,
  });
});
