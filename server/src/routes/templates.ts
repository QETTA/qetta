import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { validateFile } from '../middleware/fileValidation.js';
import * as templateService from '../services/templateService.js';
import * as auditService from '../services/auditTrailService.js';
import { importTemplateDto, renderTemplateDto } from '../dto/template.dto.js';

export const templatesRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/qetta/v1/templates/import
templatesRouter.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  if (!validateFile(file)) return res.status(400).json({ error: 'Invalid file type' });

  const firmId = req.firmAccount!.firm_id;
  const body = importTemplateDto.parse(req.body);

  const result = await templateService.importTemplate(firmId, file, body.name, body.description);

  await auditService.logAction({
    project_id: body.project_id ?? '',
    firm_id: firmId,
    actor_id: firmId,
    action: 'template.imported',
    detail: { template_id: result.id, placeholders: result.placeholders },
  });

  res.status(201).json(result);
});

// GET /api/qetta/v1/templates
templatesRouter.get('/', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const list = await templateService.listTemplates(firmId);
  res.json(list.map((t) => ({ id: t._id, name: t.name, placeholders: t.placeholders })));
});

// GET /api/qetta/v1/templates/:id/download
templatesRouter.get('/:id/download', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const id = String(req.params.id);
  const tpl = await templateService.getTemplate(firmId, id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  const version = tpl.versions.find((v: any) => v.version === tpl.current_version);
  if (!version) return res.status(404).json({ error: 'Template version not found' });
  res.download(version.file_path, `${tpl.name}.docx`);
});

// POST /api/qetta/v1/templates/:id/render
templatesRouter.post('/:id/render', async (req: Request, res: Response) => {
  const firmId = req.firmAccount!.firm_id;
  const id = String(req.params.id);
  const dto = renderTemplateDto.parse(req.body);

  const outPath = await templateService.renderTemplate(firmId, id, dto.data || {});

  await auditService.logAction({
    project_id: '',
    firm_id: firmId,
    actor_id: firmId,
    action: 'template.rendered',
    detail: { template_id: id, out_path: outPath },
  });

  res.json({ out_path: outPath });
});
