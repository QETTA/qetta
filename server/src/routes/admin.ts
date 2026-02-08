import { Router, type Request, type Response } from 'express';
import { logger } from '../config/logger.js';
const adminRouter = Router();

export async function serveQuarantinePage(req: Request, res: Response) {
  try {
    const filePath = new URL('../../static/quarantine.html', import.meta.url).pathname;
    res.sendFile(filePath);
  } catch (err) {
    logger.error({ err }, 'Failed to serve quarantine UI');
    res.status(500).send('Unable to load admin UI');
  }
}

// GET /admin/quarantine - simple operator UI (static HTML)
adminRouter.get('/quarantine', serveQuarantinePage);

export { adminRouter };
