import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { getDb } from '../config/mongodb.js';
import { ObjectId } from 'mongodb';
import { logger } from '../config/logger.js';
import * as auditService from '../services/auditTrailService.js';

export const quarantineRouter = Router();

// GET /api/qetta/v1/quarantine/evidence - list quarantined items for firm
quarantineRouter.get('/evidence', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  try {
    const db = getDb();
    const items = await db.collection('settlement_evidences').find({ firm_id: firmId, status: 'quarantined' }).toArray();
    res.json(items.map((it) => ({ id: it._id, filename: it.original_filename, quarantine_path: it.quarantine_path, quarantine_reason: it.quarantine_reason, created_at: it.created_at })));
  } catch (err) {
    logger.warn({ err }, 'DB read failed; falling back to filesystem for quarantine list');
    // If DB unavailable, try to read quarantine folder
    const base = path.join(env.FILE_STORAGE_PATH, 'quarantine');
    try {
      const firmDirs = await fs.readdir(base).catch(() => [] as string[]);
      const firmDir = firmDirs.find((d) => d === firmId) ? path.join(base, firmId) : null;
      if (!firmDir) return res.json([]);
      const files = await fs.readdir(firmDir);
      const items = files.map((f: string) => ({ filename: f, quarantine_path: path.join(firmDir, f) }));
      res.json(items);
    } catch {
      res.json([]);
    }
  }
});

// GET /api/qetta/v1/quarantine/evidence/:id/download - download quarantined file by evidence id
quarantineRouter.get('/evidence/:id/download', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const idRaw = req.params.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  try {
    const db = getDb();
    let it;
    try {
      it = await db.collection('settlement_evidences').findOne({ _id: new ObjectId(String(id)), firm_id: firmId, status: 'quarantined' });
    } catch {
      it = null;
    }
    if (!it) return res.status(404).json({ error: 'Not found' });
    res.download(it.quarantine_path || it.storage_path);
  } catch (err) {
    logger.warn({ err }, 'DB lookup failed; falling back to filesystem for download');
    // fall back to filesystem search
    const base = path.join(env.FILE_STORAGE_PATH, 'quarantine', firmId);
    try {
      const files = await fs.readdir(base).catch(() => [] as string[]);
      const match = files.find((f: string) => f.includes(String(id)) || f.includes(String(id)));
      if (!match) return res.status(404).json({ error: 'Not found' });
      res.download(path.join(base, match));
    } catch {
      res.status(404).json({ error: 'Not found' });
    }
  }
});

// POST /api/qetta/v1/quarantine/evidence/:id/restore - restore quarantined file back to evidence storage
quarantineRouter.post('/evidence/:id/restore', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const idRaw = req.params.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  try {
    const db = getDb();
    let it;
    try {
      it = await db.collection('settlement_evidences').findOne({ _id: new ObjectId(String(id)), firm_id: firmId, status: 'quarantined' });
    } catch {
      it = null;
    }
    let qpath = it?.quarantine_path;
    const projId = it?.project_id?.toString() || req.body.project_id;
    if (!qpath) {
      // fallback: search quarantine folder for matching filename containing id
      const base = path.join(env.FILE_STORAGE_PATH, 'quarantine', String(firmId));
      const files = await fs.readdir(base).catch(() => [] as string[]);
      const match = files.find((f: string) => f.includes(id) || f.includes(String(id)));
      if (!match) return res.status(404).json({ error: 'Not found' });
      qpath = path.join(base, match);
    }

    const destDir = path.join(env.FILE_STORAGE_PATH, 'evidence', String(projId || 'unassigned'));
    await fs.mkdir(destDir, { recursive: true });
    const destName = path.basename(qpath).replace(/^quarantine_/, '');
    const destPath = path.join(destDir, destName);
    await fs.rename(qpath, destPath);

    // update DB if possible
    try {
      if (it) {
        await db.collection('settlement_evidences').updateOne({ _id: it._id }, { $set: { storage_path: destPath, status: 'uploaded' }, $unset: { quarantine_path: '', quarantine_reason: '' } });
      }
      await auditService.logAction({ project_id: projId || '', firm_id: firmId, actor_id: firmId, action: 'evidence.restored', detail: { from: qpath, to: destPath } });
    } catch (err) {
      logger.warn({ err }, 'Failed to update DB or audit after restore');
    }

    res.json({ restored: true, path: destPath });
  } catch (err) {
    logger.error({ err }, 'restore failed');
    res.status(500).json({ error: 'restore_failed' });
  }
});

// POST /api/qetta/v1/quarantine/evidence/:id/destroy - permanently delete quarantined file
quarantineRouter.post('/evidence/:id/destroy', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const idRaw = req.params.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  try {
    const db = getDb();
    const it = await db.collection('settlement_evidences').findOne({ _id: new ObjectId(String(id)), firm_id: firmId, status: 'quarantined' });
    let qpath = it?.quarantine_path;
    if (!qpath) {
      const base = path.join(env.FILE_STORAGE_PATH, 'quarantine', String(firmId));
      const files = await fs.readdir(base).catch(() => [] as string[]);
      const match = files.find((f: string) => f.includes(String(id)) || f.includes(String(id)));
      if (!match) return res.status(404).json({ error: 'Not found' });
      qpath = path.join(base, match);
    }

    await fs.unlink(qpath).catch(() => {});

    try {
      if (it) {
        await db.collection('settlement_evidences').updateOne({ _id: it._id }, { $set: { status: 'rejected' }, $unset: { quarantine_path: '', quarantine_reason: '' } });
      }
      await auditService.logAction({ project_id: it?.project_id?.toString() || '', firm_id: firmId, actor_id: firmId, action: 'evidence.destroyed', detail: { path: qpath } });
    } catch (err) {
      logger.warn({ err }, 'Failed to update DB or audit after destroy');
    }

    res.json({ destroyed: true });
  } catch (err) {
    logger.error({ err }, 'destroy failed');
    res.status(500).json({ error: 'destroy_failed' });
  }
});