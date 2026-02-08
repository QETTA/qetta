import { describe, it, expect } from 'vitest';
import { serveQuarantinePage } from './admin.js';

function makeReqRes() {
  const req: any = {};
  const res: any = {};
  res._status = 200;
  res.status = (code: number) => { res._status = code; return res; };
  res.send = (body: any) => { res._body = body; return res; };
  res.sendFile = (file: string) => { res._file = file; return res; };
  res.sendStatus = (code: number) => { res._status = code; return res; };
  return { req, res };
}

describe('admin UI', () => {
  it('serves quarantine UI page', async () => {
    const { req, res } = makeReqRes();
    await serveQuarantinePage(req, res);
    expect(res._file).toBeTruthy();
    expect(String(res._file)).toContain('quarantine.html');
  });
});
