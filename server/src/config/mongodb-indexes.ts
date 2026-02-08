import { type Db } from 'mongodb';
import { logger } from './logger.js';

/**
 * 7개 신규 컬렉션 인덱스 생성 (MVP)
 */
export async function ensureIndexes(db: Db): Promise<void> {
  // settlement_projects
  await db.collection('settlement_projects').createIndexes([
    { key: { firm_id: 1, status: 1 } },
    { key: { created_at: -1 } },
  ]);

  // settlement_packages (과금 단위)
  await db.collection('settlement_packages').createIndexes([
    { key: { project_id: 1 } },
    { key: { firm_id: 1, status: 1 } },
    { key: { completed_at: -1 } },
  ]);

  // settlement_evidences
  await db.collection('settlement_evidences').createIndexes([
    { key: { package_id: 1 } },
    { key: { type: 1, status: 1 } },
  ]);

  // settlement_rules
  await db.collection('settlement_rules').createIndexes([
    { key: { ministry_code: 1 } },
    { key: { firm_id: 1 } },
  ]);

  // settlement_audit_logs
  await db.collection('settlement_audit_logs').createIndexes([
    { key: { project_id: 1, timestamp: -1 } },
    { key: { actor_id: 1 } },
  ]);

  // firm_accounts
  await db.collection('firm_accounts').createIndexes([
    { key: { firm_id: 1 }, unique: true },
    { key: { plan_type: 1 } },
  ]);

  // pii_processing_logs
  await db.collection('pii_processing_logs').createIndexes([
    { key: { document_id: 1 } },
    { key: { processed_at: -1 } },
  ]);

  logger.info('MongoDB indexes ensured for 7 QETTA collections');
}
