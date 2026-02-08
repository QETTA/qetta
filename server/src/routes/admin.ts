import { Router, type Request, type Response } from 'express';
const adminRouter = Router();

export async function serveQuarantinePage(req: Request, res: Response) {
  try {
    const filePath = new URL('../../static/quarantine.html', import.meta.url).pathname;
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).send('Unable to load admin UI');
  }
}

// GET /admin/quarantine - simple operator UI (static HTML)
adminRouter.get('/quarantine', serveQuarantinePage);

export { adminRouter };
