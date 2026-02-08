import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongodb.js';
import { logger } from '../config/logger.js';
import type { AuditLog } from '../types/settlement.js';

/**
 * S5. 감사 추적 로그
 * 생성/수정/검수/마스킹/승인 모든 액션 기록
 */

export async function logAction(action: {
  project_id: string;
  firm_id: string;
  actor_id: string;
  action: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  const log: Omit<AuditLog, '_id'> = {
    project_id: new ObjectId(action.project_id),
    firm_id: action.firm_id,
    actor_id: action.actor_id,
    action: action.action,
    detail: action.detail,
    timestamp: new Date(),
  };

  await db.collection('settlement_audit_logs').insertOne(log);
  logger.debug({ action: action.action, projectId: action.project_id }, 'Audit log recorded');
}

export async function getTrail(projectId: string): Promise<AuditLog[]> {
  const db = getDb();
  return db
    .collection<AuditLog>('settlement_audit_logs')
    .find({ project_id: new ObjectId(projectId) })
    .sort({ timestamp: -1 })
    .toArray();
}

export async function exportTrail(
  projectId: string,
  _format: 'json' | 'csv',
): Promise<string> {
  // reference param to satisfy lint rule until exporter implemented
  void _format;
  const trail = await getTrail(projectId);
  // TODO: PDF/Excel 내보내기 구현 (P1)
  return JSON.stringify(trail, null, 2);
} 
