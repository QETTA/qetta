import { ObjectId } from 'mongodb';
import { logger } from '../config/logger.js';
import { getDb } from '../config/mongodb.js';
import type { QaResult, SettlementProject } from '../types/settlement.js';

/**
 * S1. 3단계 QA 엔진
 * 품질검수 → 노하우구조화 → 감사대비패키징
 */

export async function runQualityCheck(projectId: string): Promise<QaResult> {
  const db = getDb();
  const project = await db
    .collection<SettlementProject>('settlement_projects')
    .findOne({ _id: new ObjectId(projectId) });

  if (!project) throw new Error(`Project not found: ${projectId}`);

  logger.info({ projectId }, 'Running QA quality check');

  // TODO: 증빙 누락/부적격/비목 불일치 자동 감지 구현
  const result: QaResult = {
    passed: true,
    total_checks: 0,
    passed_checks: 0,
    warnings: [],
    errors: [],
    run_at: new Date(),
  };

  await db
    .collection('settlement_projects')
    .updateOne({ _id: new ObjectId(projectId) }, { $set: { qa_result: result, status: 'reviewed' } });

  return result;
}

export async function applyRules(
  projectId: string,
  _rulesetId?: string,
): Promise<QaResult> {
  // reference param until rule selector is implemented
  void _rulesetId;
  logger.info({ projectId }, 'Applying settlement rules');
  // TODO: 부처별 + 법인 커스텀 룰 적용
  return runQualityCheck(projectId);
} 

export async function generatePackage(projectId: string): Promise<string> {
  logger.info({ projectId }, 'Generating settlement package (4종)');
  // TODO: 정산서 + 증빙목록 + 성과보고 초안 + 감사 체크리스트 생성
  // 담당자 승인 시 = 1건 과금 확정
  return 'package_id_placeholder';
}

export async function getQaReport(projectId: string): Promise<QaResult | null> {
  const db = getDb();
  const project = await db
    .collection<SettlementProject>('settlement_projects')
    .findOne({ _id: new ObjectId(projectId) });

  return project?.qa_result ?? null;
}
