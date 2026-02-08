import { describe, it, expect, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

import { handleEvidenceUpload } from './evidence.js';
import * as virus from '../services/virusScanService.js';


function makeReq(fileBuffer: Buffer, filename = 'bad.docx') {
  return {
    file: { buffer: fileBuffer, originalname: filename, mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: fileBuffer.length },
    body: { project_id: 'projectX' },
    firmAccount: { firm_id: 'firm123' },
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => {
    res._status = code;
    return res;
  };
  res.json = (obj: any) => {
    res._json = obj;
    return res;
  };
  return res;
}

describe('evidence quarantine flow', () => {
  it('stores file in quarantine and returns 400 when scanner flags infected', async () => {
    process.env.CLAMAV_SCAN_ENABLED = 'true';
    process.env.CLAMAV_COMMAND = 'clamscan-infected';

    const tmpdir = path.join(process.cwd(), 'storage', 'quarantine', 'projectX');
    await fs.mkdir(tmpdir, { recursive: true });

    // craft a minimal buffer that looks like a zip (docx magic header)
    const req = makeReq(Buffer.from('PK\x03\x04malware'), 'bad.docx');
    const res = makeRes();

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
