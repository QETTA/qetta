import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongodb.js';
import { env } from '../config/env.js';
import { validateFile } from '../middleware/fileValidation.js';
import * as piiService from '../services/piiMaskingService.js';
import * as auditService from '../services/auditTrailService.js';
import type { SettlementEvidence } from '../types/settlement.js';

export const evidenceRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_EVIDENCE_SIZE_MB * 1024 * 1024 },
});

// POST /api/qetta/v1/evidence/upload — 증빙 문서 업로드 + PII 마스킹
evidenceRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  if (!validateFile(file)) {
    res.status(400).json({ error: 'Invalid file type. Allowed: pdf, xlsx, docx, hwp, csv, jpg, png' });
    return;
  }

  const firmId = req.firmAccount!.firm_id;
  const projectId = req.body.project_id as string;

  if (!projectId) {
    res.status(400).json({ error: 'project_id is required' });
    return;
  }

  // PII 탐지 (텍스트 기반 - PDF/docx 파싱은 추후 구현)
  const textContent = file.buffer.toString('utf-8');
  const { detections } = piiService.maskText(textContent);

  const evidence: Omit<SettlementEvidence, '_id'> = {
    project_id: new ObjectId(projectId),
    firm_id: firmId,
    original_filename: file.originalname,
    file_type: file.mimetype,
    file_size: file.size,
    storage_path: '', // TODO: 파일 저장 경로
    status: detections.length > 0 ? 'pii_masked' : 'uploaded',
    pii_detected: detections.length > 0,
    pii_fields: detections.map((d) => d.type),
    created_at: new Date(),
  };

  const result = await getDb().collection('settlement_evidences').insertOne(evidence);

  if (detections.length > 0) {
    await piiService.logPiiProcessing(result.insertedId.toString(), firmId, detections);
  }

  await auditService.logAction({
    project_id: projectId,
    firm_id: firmId,
    actor_id: firmId,
    action: 'evidence.uploaded',
    detail: {
      filename: file.originalname,
      pii_detected: detections.length > 0,
      pii_count: detections.length,
    },
  });

  res.status(201).json({
    id: result.insertedId,
    status: evidence.status,
    pii_detected: evidence.pii_detected,
    pii_fields: evidence.pii_fields,
  });
});

// GET /api/qetta/v1/evidence/:id/status — 증빙 검수 상태 조회
evidenceRouter.get('/:id/status', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const evidence = await getDb()
    .collection<SettlementEvidence>('settlement_evidences')
    .findOne({
      _id: new ObjectId(id),
      firm_id: req.firmAccount!.firm_id,
    });

  if (!evidence) {
    res.status(404).json({ error: 'Evidence not found' });
    return;
  }

  res.json({ id: evidence._id, status: evidence.status, pii_detected: evidence.pii_detected });
});
