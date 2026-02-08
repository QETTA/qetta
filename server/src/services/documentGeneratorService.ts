import { logger } from '../config/logger.js';
import type { PackageOutputs } from '../types/settlement.js';

/**
 * S3. 정산 완료 패키지 4종 산출물 생성
 * Claude API를 활용한 초안 생성
 */

export async function generateSettlementReport(projectId: string): Promise<string> {
  logger.info({ projectId }, 'Generating settlement report');
  // TODO: 집행내역 기반 정산서 구성 (Claude Sonnet)
  return '';
}

export async function generateEvidenceList(projectId: string): Promise<string> {
  logger.info({ projectId }, 'Generating evidence list');
  // TODO: 증빙목록 자동 매핑 (Claude Sonnet)
  return '';
}

export async function generatePerformanceDraft(projectId: string): Promise<string> {
  logger.info({ projectId }, 'Generating performance draft');
  // TODO: 성과보고서 KPI 초안 (Claude Sonnet)
  return '';
}

export async function generateAuditChecklist(projectId: string): Promise<string> {
  logger.info({ projectId }, 'Generating audit checklist');
  // TODO: 감사 대비 체크리스트 + 근거 규정 링크 (Claude Opus - 품질 우선)
  return '';
}

export async function generateFullPackage(projectId: string): Promise<PackageOutputs> {
  const [settlementReport, evidenceList, performanceDraft, auditChecklist] = await Promise.all([
    generateSettlementReport(projectId),
    generateEvidenceList(projectId),
    generatePerformanceDraft(projectId),
    generateAuditChecklist(projectId),
  ]);

  return {
    settlement_report: settlementReport,
    evidence_list: evidenceList,
    performance_draft: performanceDraft,
    audit_checklist: auditChecklist,
  };
}
