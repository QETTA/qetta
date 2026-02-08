import { Router, type Request, type Response } from 'express';
import * as ruleService from '../services/settlementRuleService.js';

export const rulesRouter = Router();

// GET /api/qetta/v1/rules/:ministry — 부처별 기본 룰셋 조회 (P1)
rulesRouter.get('/:ministry', async (req: Request, res: Response) => {
  const ministry = req.params.ministry as string;
  const rules = await ruleService.getRuleset(ministry);
  res.json(rules);
});

// PUT /api/qetta/v1/rules/firm/:firmId — 법인 커스텀 룰 저장 (P1)
rulesRouter.put('/firm/:firmId', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const paramFirmId = req.params.firmId as string;

  // 다른 법인의 룰 수정 차단
  if (paramFirmId !== firmId) {
    res.status(403).json({ error: 'Cannot modify other firm rules' });
    return;
  }

  await ruleService.upsertFirmRule(firmId, req.body);
  res.json({ status: 'saved' });
});
