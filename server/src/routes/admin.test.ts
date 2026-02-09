import { describe, expect, it } from 'vitest';
import { serveQuarantinePage } from './admin.js';

import type { Request } from 'express';

type MockRes = {
  _status?: number;
  _body?: unknown;
  _file?: string;
  status: (code: number) => MockRes;
  send: (body: unknown) => MockRes;
  sendFile: (file: string) => MockRes;
  sendStatus: (code: number) => MockRes;
};

function makeReqRes() {
  const req: Partial<Request> = {};
  const res: MockRes = {
    _status: 200,
    status(code: number) { this._status = code; return this; },
    send(body: unknown) { this._body = body; return this; },
    sendFile(file: string) { this._file = file; return this; },
    sendStatus(code: number) { this._status = code; return this; },
  };
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
