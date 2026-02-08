import { Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { getDb } from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

export const quarantineRouter = Router();

// GET /api/qetta/v1/quarantine/evidence - list quarantined items for firm
quarantineRouter.get('/evidence', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  try {
    const db = getDb();
    const items = await db.collection('settlement_evidences').find({ firm_id: firmId, status: 'quarantined' }).toArray();
    res.json(items.map((it) => ({ id: it._id, filename: it.original_filename, quarantine_path: it.quarantine_path, quarantine_reason: it.quarantine_reason, created_at: it.created_at })));
  } catch (err) {
    // If DB unavailable, try to read quarantine folder
    const base = path.join(env.FILE_STORAGE_PATH, 'quarantine');
    try {
      const firmDirs = await fs.readdir(base).catch(() => []);
      const firmDir = firmDirs.find((d) => d === firmId) ? path.join(base, firmId) : null;
      if (!firmDir) return res.json([]);
      const files = await fs.readdir(firmDir);
      const items = files.map((f) => ({ filename: f, quarantine_path: path.join(firmDir, f) }));
      res.json(items);
    } catch (_e) {
      res.json([]);
    }
  }
});

// GET /api/qetta/v1/quarantine/evidence/:id/download - download quarantined file by evidence id
quarantineRouter.get('/evidence/:id/download', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const id = req.params.id;
  try {
    const db = getDb();
    const it = await db.collection('settlement_evidences').findOne({ _id: new ObjectId(id), firm_id: firmId, status: 'quarantined' });
    if (!it) return res.status(404).json({ error: 'Not found' });
    res.download(it.quarantine_path || it.storage_path);
  } catch (err) {
    // fall back to filesystem search
    const base = path.join(env.FILE_STORAGE_PATH, 'quarantine', firmId);
    try {
      const files = await fs.readdir(base);
      const match = files.find((f) => f.includes(id) || f.includes(req.params.id));
      if (!match) return res.status(404).json({ error: 'Not found' });
      res.download(path.join(base, match));
    } catch (_e) {
      res.status(404).json({ error: 'Not found' });
    }
  }
});
