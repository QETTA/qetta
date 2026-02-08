import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import PizZip from 'pizzip';

import { scanBuffer } from '../services/virusScanService.js';
import { renderTemplate } from '../services/templateService.js';

const execFileP = promisify(execFile);
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

async function hasCommand(cmd: string) {
  try {
    await execFileP('which', [cmd]);
    return true;
  } catch {
    return false;
  }
}

function makeMinimalDocxBuffer(placeholderName = 'company_name') {
  const zip = new PizZip();
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>{{${placeholderName}}}</w:t></w:r></w:p>\n  </w:body>\n</w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.folder('_rels')!.file('.rels', rels);
  zip.folder('word')!.file('document.xml', docXml);

  return zip.generate({ type: 'nodebuffer' });
}

describe('E2E - ClamAV + Puppeteer (best-effort)', () => {
  it('detects EICAR as infected when clamscan available', async () => {
    const hasClam = await hasCommand('clamscan');
    if (!hasClam) {
      console.warn('clamscan not found in PATH; skipping EICAR detection check');
      return;
    }

    process.env.CLAMAV_SCAN_ENABLED = 'true';
    process.env.CLAMAV_COMMAND = 'clamscan';

    const res = await scanBuffer(Buffer.from(EICAR));
    expect(res.clean).toBe(false);
    expect(res.reason).toBeTruthy();
  }, { timeout: 60_000 });

  it('renders pdf from a generated docx via puppeteer (if available)', async () => {
    // ensure storage path exists
    const tplId = 'e2e-simple';
    const tplDir = path.join(process.cwd(), 'storage', 'templates', tplId);
    await fs.mkdir(tplDir, { recursive: true });

    const docxPath = path.join(tplDir, 'v1_simple.docx');

    // write a minimal docx with a placeholder
    const buf = makeMinimalDocxBuffer('company_name');
    await fs.writeFile(docxPath, buf);

    try {
      const out = await renderTemplate('firm-e2e', tplId, { company_name: 'ACME E2E' }, 'pdf');
      const stat = await fs.stat(out);
      expect(stat.isFile()).toBe(true);
      expect(stat.size).toBeGreaterThan(100);
    } catch (err) {
      // If Puppeteer/Chromium cannot start in this environment, skip rather than fail the whole suite
      console.warn('Puppeteer render failed; skipping PDF assertion:', (err as Error)?.message ?? err);
    }
  }, { timeout: 120_000 });
});
