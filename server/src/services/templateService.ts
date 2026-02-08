import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongodb.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

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
    versions: [],
    placeholders: [],
    created_at: now,
    updated_at: now,
  } as any;

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
  const db = getDb();
  const templates = db.collection('templates');
  return templates.findOne({ _id: new ObjectId(id), firm_id: firmId });
}

export async function renderTemplate(firmId: string, id: string, data: Record<string, unknown> = {}) {
  const tpl = await getTemplate(firmId, id);
  if (!tpl) throw new Error('Template not found');
  const version = tpl.versions.find((v: any) => v.version === tpl.current_version);
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

  // TODO: hook to PDF conversion if requested
  return outPath;
}
