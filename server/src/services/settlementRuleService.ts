import { getDb } from '../config/mongodb.js';
import { logger } from '../config/logger.js';

/**
 * S4. 부처별 정산 규칙 관리 + 법인 커스텀 체크리스트
 * MVP: 중기부(MSME), 복지부(MOHW), 과기부(MSIT) 기본 규칙셋
 */

export interface SettlementRule {
  ministry_code: string;
  firm_id?: string;
  rule_name: string;
  description: string;
  check_type: 'required_evidence' | 'amount_limit' | 'format_check' | 'deadline_check';
  config: Record<string, unknown>;
  active: boolean;
}

export async function getRuleset(ministryCode: string): Promise<SettlementRule[]> {
  const db = getDb();
  const rules = await db
    .collection<SettlementRule>('settlement_rules')
    .find({ ministry_code: ministryCode, active: true, firm_id: { $exists: false } })
    .toArray();

  logger.info({ ministryCode, count: rules.length }, 'Fetched ministry ruleset');
  return rules;
}

export async function getFirmRules(firmId: string): Promise<SettlementRule[]> {
  const db = getDb();
  return db
    .collection<SettlementRule>('settlement_rules')
    .find({ firm_id: firmId, active: true })
    .toArray();
}

export async function upsertFirmRule(firmId: string, rule: Omit<SettlementRule, 'firm_id'>): Promise<void> {
  const db = getDb();
  await db.collection('settlement_rules').updateOne(
    { firm_id: firmId, rule_name: rule.rule_name },
    { $set: { ...rule, firm_id: firmId } },
    { upsert: true },
  );
  logger.info({ firmId, ruleName: rule.rule_name }, 'Firm rule upserted');
}

export async function validateEvidence(
  _evidence: Record<string, unknown>,
  _ruleset: SettlementRule[],
): Promise<{ passed: boolean; violations: string[] }> {
  // reference params to satisfy lint rules until implementation
  void _evidence;
  void _ruleset;
  // TODO: 증빙 vs 규칙 매칭 검증 구현
  return { passed: true, violations: [] };
} 
