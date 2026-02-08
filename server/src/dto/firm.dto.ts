import { z } from 'zod';

export const registerFirmDto = z.object({
  firm_name: z.string().min(1).max(100),
  contact_name: z.string().min(1).max(50),
  contact_email: z.string().email(),
  plan_type: z.enum(['trial', 'starter', 'pro', 'firm']).default('trial'),
});

export type RegisterFirmDto = z.infer<typeof registerFirmDto>;
