import { z } from 'zod';

export const importTemplateDto = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  project_id: z.string().optional(),
});

export const renderTemplateDto = z.object({
  data: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export type ImportTemplateDto = z.infer<typeof importTemplateDto>;
export type RenderTemplateDto = z.infer<typeof renderTemplateDto>;
