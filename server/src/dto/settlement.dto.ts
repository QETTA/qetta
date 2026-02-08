import { z } from 'zod';

export const createProjectDto = z.object({
  title: z.string().min(1).max(200),
  ministry_code: z.enum(['MSME', 'MOHW', 'MSIT']), // 중기부, 복지부, 과기부
  description: z.string().max(2000).optional(),
});

export const runQaDto = z.object({
  ruleset_id: z.string().optional(),
});

export const approvePackageDto = z.object({
  approved_by: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectDto>;
export type RunQaDto = z.infer<typeof runQaDto>;
export type ApprovePackageDto = z.infer<typeof approvePackageDto>;
