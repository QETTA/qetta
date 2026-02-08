import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// mammoth/puppeteer are dynamically imported where needed to avoid loading in tests

import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongodb.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { TemplateVersion } from '../types/template.js';

export async function detectPlaceholders(buffer: Buffer): Promise<string[]> {
  // A simple heuristic: search for handlebars-style {{var}} tokens in the docx xml
  try {
    const zip = new PizZip(buffer);
    const docXml = zip.files['word/document.xml'];
    if (!docXml) return [];
    const text = docXml.asText();
    const re = /{{\s*([\w.]+)\s*}}/g;
    const set = new Set<string>();
    let m;
    while ((m = re.exec(text)) !== null) {
      set.add(m[1]);
    }
    return Array.from(set);
  } catch (err) {
    logger.warn({ err }, 'Failed to parse docx for placeholders, falling back to raw text search');
    const raw = buffer.toString('utf-8');
    const re = /{{\s*([\w.]+)\s*}}/g;
    const set = new Set<string>();
    let m;
    while ((m = re.exec(raw)) !== null) {
      set.add(m[1]);
    }
    return Array.from(set);
  }
}

export async function importTemplate(firmId: string, file: Express.Multer.File, name: string, description?: string) {
  const db = getDb();
  const templates = db.collection('templates');

  const now = new Date();
  const doc = {
    firm_id: firmId,
    name,
    description: description || undefined,
    current_version: 1,
    versions: [] as TemplateVersion[],
    placeholders: [] as string[],
    created_at: now,
    updated_at: now,
  };

  const insertResult = await templates.insertOne(doc);
  const id = insertResult.insertedId.toString();

  // store file on disk
  const baseDir = path.join(env.FILE_STORAGE_PATH, 'templates', id);
  await fs.mkdir(baseDir, { recursive: true });
  const filename = `v1_${Date.now()}_${file.originalname}`;
  const filePath = path.join(baseDir, filename);
  await fs.writeFile(filePath, file.buffer);

  // detect placeholders
  const placeholders = await detectPlaceholders(file.buffer);

  const version = {
    version: 1,
    file_path: filePath,
    file_type: file.mimetype,
    created_at: new Date(),
  };

  await templates.updateOne({ _id: insertResult.insertedId }, { $set: { versions: [version], placeholders, current_version: 1 } });

  logger.info({ templateId: id, placeholders: placeholders.length }, 'Template imported');

  return { id, placeholders };
}

export async function listTemplates(firmId: string) {
  const db = getDb();
  const templates = db.collection('templates');
  return templates.find({ firm_id: firmId }).toArray();
}

export async function getTemplate(firmId: string, id: string) {
  // First try DB access; if DB not connected or id invalid, fall back to storage directory
  try {
    const db = getDb();
    const templates = db.collection('templates');
    return templates.findOne({ _id: new ObjectId(id), firm_id: firmId });
  } catch {
    const baseDir = path.join(env.FILE_STORAGE_PATH, 'templates', id);
    const files = await fs.readdir(baseDir);
    const versions = files
      .filter((f) => f.endsWith('.docx'))
      .map((f, idx) => ({ version: idx + 1, file_path: path.join(baseDir, f), file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', created_at: new Date() } as TemplateVersion));
    if (versions.length === 0) return null;
    return {
      _id: id,
      firm_id: firmId,
      name: id,
      current_version: versions[versions.length - 1].version,
      versions,
      placeholders: [],
      created_at: new Date(),
      updated_at: new Date(),
    } as unknown as { _id: string; firm_id: string; name: string; current_version: number; versions: TemplateVersion[]; placeholders: string[]; created_at: Date; updated_at: Date };
  }
}

export async function renderTemplate(
  firmId: string,
  id: string,
  data: Record<string, unknown> = {},
  format: 'docx' | 'pdf' = 'docx',
) {
  const tpl = await getTemplate(firmId, id);
  if (!tpl) throw new Error('Template not found');
  const version = tpl.versions.find((v: TemplateVersion) => v.version === tpl.current_version);
  if (!version) throw new Error('Template version not found');

  const content = await fs.readFile(version.file_path);

  // Use docxtemplater to render DOCX templates
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  const buf = doc.getZip().generate({ type: 'nodebuffer' });

  const outDir = path.join(env.FILE_STORAGE_PATH, 'templates', id, 'renders');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `render_${Date.now()}.docx`);
  await fs.writeFile(outPath, buf);

  if (format === 'pdf') {
    // Convert DOCX buffer to HTML then PDF
    try {
      // dynamic import — types may not exist in test environments
      // @ts-expect-error - dynamic import may not have types in test env
      const mammoth = await import('mammoth');
      const mammothResult = await mammoth.convertToHtml({ buffer: buf });
      const html = mammothResult.value;

      // @ts-expect-error - dynamic import may not have types in test env
      const puppeteer = await import('puppeteer');
      // Compose reliable Puppeteer args for CI/containers and allow overriding via env
      const extraArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'];
      const envArgs = process.env.CI_PUPPETEER_ARGS ? process.env.CI_PUPPETEER_ARGS.split(' ') : [];
      const args = envArgs.concat(extraArgs);
      const browser = await puppeteer.launch({ args });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuf = await page.pdf({ format: 'A4' });
      await browser.close();

      const pdfPath = path.join(outDir, `render_${Date.now()}.pdf`);
      await fs.writeFile(pdfPath, pdfBuf);
      return pdfPath;
    } catch (err) {
      logger.error({ err }, 'PDF conversion failed');
      // fall back to DOCX path
    }
  }

  return outPath;
}
