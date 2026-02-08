import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDb } from './config/mongodb.js';
import { ensureIndexes } from './config/mongodb-indexes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requirePartnerOrg } from './middleware/partnerAuth.js';
import { firmRls } from './middleware/firmRls.js';
import { firmRateLimit } from './middleware/firmRateLimit.js';
import { healthRouter } from './routes/health.js';
import { settlementRouter } from './routes/settlement.js';
import { evidenceRouter } from './routes/evidence.js';
import { auditRouter } from './routes/audit.js';
import { firmRouter } from './routes/firm.js';
import { rulesRouter } from './routes/rules.js';
import { templatesRouter } from './routes/templates.js';

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json());

// --- Request logging ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      firm_id: req.firmAccount?.firm_id,
    });
  });
  next();
});

// --- Public routes ---
app.use('/health', healthRouter);

// --- 법인 등록 (인증 불필요) ---
app.post('/api/qetta/v1/firm/register', firmRouter);

// --- QETTA 정산 서비스 라우트 (API key 인증) ---
const qettaAuth = [requirePartnerOrg, firmRls, firmRateLimit];

app.use('/api/qetta/v1/settlement', ...qettaAuth, settlementRouter);
app.use('/api/qetta/v1/evidence', ...qettaAuth, evidenceRouter);
app.use('/api/qetta/v1/audit', ...qettaAuth, auditRouter);
app.use('/api/qetta/v1/firm', ...qettaAuth, firmRouter);
app.use('/api/qetta/v1/rules', ...qettaAuth, rulesRouter);
app.use('/api/qetta/v1/templates', ...qettaAuth, templatesRouter);

// --- Error handler ---
app.use(errorHandler);

// --- Start ---
async function start() {
  const db = await connectDb();
  await ensureIndexes(db);

  app.listen(env.PORT, env.HOST, () => {
    logger.info({ host: env.HOST, port: env.PORT, env: env.NODE_ENV }, 'QETTA server started');
  });
}

start().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
