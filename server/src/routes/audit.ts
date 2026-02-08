import { Router, type Request, type Response } from 'express';
import * as auditService from '../services/auditTrailService.js';

export const auditRouter = Router();

// GET /api/qetta/v1/audit/:projectId — 감사 추적 로그 조회
auditRouter.get('/:projectId', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const trail = await auditService.getTrail(projectId);
  res.json(trail);
});

// GET /api/qetta/v1/audit/:projectId/export — 감사 로그 내보내기 (P1)
auditRouter.get('/:projectId/export', async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const format = (req.query.format as 'json' | 'csv') || 'json';
  const exported = await auditService.exportTrail(projectId, format);

  res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=audit-${projectId}.${format}`,
  );
  res.send(exported);
});
