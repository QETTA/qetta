import { Router, type Request, type Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongodb.js';
import { createProjectDto, runQaDto, approvePackageDto } from '../dto/settlement.dto.js';
import * as qaService from '../services/settlementQaService.js';
import * as auditService from '../services/auditTrailService.js';
import type { SettlementProject } from '../types/settlement.js';

export const settlementRouter = Router();

// POST /api/qetta/v1/settlement/projects — 정산 프로젝트 생성
settlementRouter.post('/projects', async (req: Request, res: Response) => {
  const dto = createProjectDto.parse(req.body);
  const firmId = req.firmAccount!.firm_id;

  const project: Omit<SettlementProject, '_id'> = {
    firm_id: firmId,
    title: dto.title,
    ministry_code: dto.ministry_code,
    status: 'draft',
    evidence_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const result = await getDb().collection('settlement_projects').insertOne(project);

  await auditService.logAction({
    project_id: result.insertedId.toString(),
    firm_id: firmId,
    actor_id: firmId,
    action: 'project.created',
    detail: { title: dto.title, ministry_code: dto.ministry_code },
  });

  res.status(201).json({ id: result.insertedId, ...project });
});

// GET /api/qetta/v1/settlement/projects/:id — 프로젝트 상세 조회
settlementRouter.get('/projects/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const project = await getDb()
    .collection<SettlementProject>('settlement_projects')
    .findOne({
      _id: new ObjectId(id),
      firm_id: req.firmAccount!.firm_id,
    });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json(project);
});

// POST /api/qetta/v1/settlement/projects/:id/run-qa — QA 엔진 실행
settlementRouter.post('/projects/:id/run-qa', async (req: Request, res: Response) => {
  runQaDto.parse(req.body);
  const id = req.params.id as string;
  const result = await qaService.runQualityCheck(id);

  await auditService.logAction({
    project_id: id,
    firm_id: req.firmAccount!.firm_id,
    actor_id: req.firmAccount!.firm_id,
    action: 'qa.executed',
    detail: { passed: result.passed },
  });

  res.json(result);
});

// GET /api/qetta/v1/settlement/projects/:id/report — 검수 결과 리포트
settlementRouter.get('/projects/:id/report', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const report = await qaService.getQaReport(id);
  if (!report) {
    res.status(404).json({ error: 'QA report not found. Run QA first.' });
    return;
  }
  res.json(report);
});

// POST /api/qetta/v1/settlement/projects/:id/generate — 패키지 4종 생성
settlementRouter.post('/projects/:id/generate', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const packageId = await qaService.generatePackage(id);

  await auditService.logAction({
    project_id: id,
    firm_id: req.firmAccount!.firm_id,
    actor_id: req.firmAccount!.firm_id,
    action: 'package.generated',
  });

  res.status(201).json({ package_id: packageId });
});

// POST /api/qetta/v1/settlement/projects/:id/approve — 패키지 승인 (1건 과금 확정)
settlementRouter.post('/projects/:id/approve', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const dto = approvePackageDto.parse(req.body);

  await auditService.logAction({
    project_id: id,
    firm_id: req.firmAccount!.firm_id,
    actor_id: dto.approved_by,
    action: 'package.approved',
    detail: { notes: dto.notes },
  });

  // TODO: 과금 확정 로직
  res.json({ status: 'approved' });
});
