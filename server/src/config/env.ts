import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // MongoDB
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default('qetta'),

  // Auth
  DEVICE_AUTH_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // Claude API
  ANTHROPIC_API_KEY: z.string().optional(),
  SETTLEMENT_CLAUDE_MODEL: z.string().default('claude-sonnet-4-5-20250929'),

  // PII / Security
  PII_ENCRYPTION_KEY: z.string().optional(),
  FILE_STORAGE_PATH: z.string().default('./storage'),
  MAX_EVIDENCE_SIZE_MB: z.coerce.number().default(50),
  PII_AUTO_DELETE_DAYS: z.coerce.number().default(90),

  // ClamAV / Virus scan
  CLAMAV_SCAN_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  CLAMAV_COMMAND: z.string().default('clamscan'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Optional
  SENTRY_DSN: z.string().optional(),
  UPTIME_CHECK_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  // For test environments, allow a default local MongoDB to avoid failing tests
  if (process.env.NODE_ENV === 'test' && !process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/qetta_test';
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
