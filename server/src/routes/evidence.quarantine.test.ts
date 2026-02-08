import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import type { Request, Response } from 'express';

import { handleEvidenceUpload } from './evidence.js';


function makeReq(fileBuffer: Buffer, filename = 'bad.docx') {
  return {
    file: { buffer: fileBuffer, originalname: filename, mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: fileBuffer.length },
    body: { project_id: 'projectX' },
    firmAccount: { firm_id: 'firm123' },
  } as unknown as Request;
}

type MockRes = {
  _status?: number;
  _json?: unknown;
  status: (code: number) => MockRes;
  json: (obj: unknown) => MockRes;
};

function makeRes() {
  const res: MockRes = {
    status(code: number) { this._status = code; return this; },
    json(obj: unknown) { this._json = obj; return this; },
  };
  return res as unknown as Response;
}  

describe('evidence quarantine flow', () => {
  it('stores file in quarantine and returns 400 when scanner flags infected', async () => {
    process.env.CLAMAV_SCAN_ENABLED = 'true';
    process.env.CLAMAV_COMMAND = 'clamscan-infected';

    const tmpdir = path.join(process.cwd(), 'storage', 'quarantine', 'projectX');
    await fs.mkdir(tmpdir, { recursive: true });

    // craft a minimal buffer that looks like a zip (docx magic header)
    const req = makeReq(Buffer.from('PK\x03\x04malware'), 'bad.docx') as unknown as Request;
    const res = makeRes() as unknown as Response; 

    // force scanner to report infected via env override
    process.env.QETTA_TEST_FORCE_SCAN = 'infected';

    await handleEvidenceUpload(req, res);

    // reset override
    delete process.env.QETTA_TEST_FORCE_SCAN;

    expect(res._status).toBe(400);
    expect(res._json && res._json.error && res._json.error.includes('quarantine')).toBeTruthy();

    const files = await fs.readdir(tmpdir);
    expect(files.length).toBeGreaterThan(0);
  });
});
