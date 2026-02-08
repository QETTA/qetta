import { ObjectId } from 'mongodb';

export type ProjectStatus = 'draft' | 'uploading' | 'qa_running' | 'reviewed' | 'approved' | 'archived';
export type EvidenceStatus = 'uploaded' | 'pii_masked' | 'validated' | 'rejected' | 'approved';
export type PlanType = 'trial' | 'starter' | 'pro' | 'firm';

export interface SettlementProject {
  _id: ObjectId;
  firm_id: string;
  title: string;
  ministry_code: string;
  status: ProjectStatus;
  evidence_count: number;
  qa_result?: QaResult;
  created_at: Date;
  updated_at: Date;
}

export interface SettlementPackage {
  _id: ObjectId;
  project_id: ObjectId;
  firm_id: string;
  status: 'generating' | 'pending_approval' | 'approved' | 'rejected';
  outputs: PackageOutputs;
  approved_by?: string;
  approved_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface PackageOutputs {
  settlement_report?: string;
  evidence_list?: string;
  performance_draft?: string;
  audit_checklist?: string;
}

export interface SettlementEvidence {
  _id: ObjectId;
  package_id?: ObjectId;
  project_id: ObjectId;
  firm_id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  masked_storage_path?: string;
  status: EvidenceStatus;
  pii_detected: boolean;
  pii_fields?: string[];
  qa_notes?: string[];
  created_at: Date;
}

export interface QaResult {
  passed: boolean;
  total_checks: number;
  passed_checks: number;
  warnings: QaWarning[];
  errors: QaError[];
  run_at: Date;
}

export interface QaWarning {
  code: string;
  message: string;
  evidence_id?: string;
}

export interface QaError {
  code: string;
  message: string;
  evidence_id?: string;
  rule_ref?: string;
}

export interface FirmAccount {
  _id: ObjectId;
  firm_id: string;
  firm_name: string;
  plan_type: PlanType;
  contact_email: string;
  contact_name: string;
  api_key_hash: string;
  included_packages: number;
  used_packages: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  _id: ObjectId;
  project_id: ObjectId;
  firm_id: string;
  actor_id: string;
  action: string;
  detail?: Record<string, unknown>;
  timestamp: Date;
}

export interface PiiProcessingLog {
  _id: ObjectId;
  document_id: ObjectId;
  firm_id: string;
  pii_types_found: string[];
  masked_count: number;
  processed_at: Date;
}
