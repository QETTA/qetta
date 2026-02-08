import { describe, it, expect, vi } from 'vitest';
import { renderTemplate } from './templateService.js';
import fs from 'fs/promises';
import path from 'path';

// Mock puppeteer to avoid launching real browser
vi.mock('puppeteer', async () => {
  return {
    launch: async () => ({
      newPage: async () => ({
        setContent: async () => {},
        pdf: async () => Buffer.from('%PDF-1.4'),
      }),
      close: async () => {},
    }),
  };
});

// Mock docxtemplater and pizzip and mammoth to avoid needing real docx files
vi.mock('docxtemplater', async () => {
  return {
    default: class {
      constructor() {}
      render() {}
      getZip() {
        return { generate: () => Buffer.from('DOCX-BYTES') };
      }
    },
  };
});

vi.mock('pizzip', async () => {
  return {
    default: class {
      constructor() {}
      file() {}
      generate() {
        return Buffer.from('DOCX-BYTES');
      }
    },
  };
});

vi.mock('mammoth', async () => ({ convertToHtml: async () => ({ value: '<html><body>Hello ACME</body></html>' }) }));

describe('PDF conversion (renderTemplate)', () => {
  it('renders docx and then pdf when format=pdf', async () => {
    const tplId = 'testtpl';
    const tplDir = path.join(process.cwd(), 'storage', 'templates', tplId);
    await fs.mkdir(tplDir, { recursive: true });
    // Create a fake docx file to satisfy storage-based fallback
    await fs.writeFile(path.join(tplDir, 'v1_test.docx'), Buffer.from('DOCX-BYTES'));

    const out = await renderTemplate('firm123', tplId, { company_name: 'ACME' }, 'pdf');
    expect(out.endsWith('.pdf')).toBeTruthy();
  });
});
