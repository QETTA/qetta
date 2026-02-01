/**
 * API Request Validation Schemas (Zod)
 *
 * Centralized schemas for all POST API routes.
 * Each schema validates request body and provides type inference.
 *
 * Security: User-provided text fields are sanitized to prevent XSS attacks.
 * @see lib/security/sanitize.ts
 */

import { z } from 'zod'
import { stripHtml, sanitizeUrl, normalizeString } from '@/lib/security/sanitize'

// ============================================
// Sanitized String Transformers
// ============================================

/** 모든 HTML 태그 제거 + 정규화 */
const safeString = z.string().transform((val) => normalizeString(stripHtml(val)))

/** URL 살균 (javascript: 등 차단) */
const safeUrl = z.string().transform(sanitizeUrl)

// ============================================
// /api/chat
// ============================================

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        // User messages are sanitized to prevent XSS
        content: z.string().max(32000, 'Message content exceeds maximum length').transform(stripHtml),
      })
    )
    .min(1, 'Messages array must not be empty')
    .max(100, 'Too many messages'),
  enginePreset: safeString.pipe(z.string().max(50, 'Engine preset too long')).optional(),
  inlineCommand: safeString.pipe(z.string().max(100, 'Inline command too long')).optional(),
  // Context fields with reasonable length limits (8KB each)
  context: z.string().max(8192, 'Context exceeds maximum length').optional(),
  intelligentContext: z.string().max(8192, 'Intelligent context exceeds maximum length').optional(),
  memoryContext: z.string().max(8192, 'Memory context exceeds maximum length').optional(),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>

// ============================================
// /api/verify/chain (JSON body path)
// ============================================

export const verifyChainRequestSchema = z.object({
  entryId: z.string().optional(),
  documentBuffer: z.string().optional(),
  expectedHash: z.string().optional(),
})

export type VerifyChainRequest = z.infer<typeof verifyChainRequestSchema>

// ============================================
// /api/analyze-rejection
// ============================================

const companyHistoryEntrySchema = z.object({
  programName: z.string(),
  year: z.number().int().min(2000).max(2100).optional(),
  result: z.enum(['selected', 'rejected', 'pending']).optional(),
  notes: z.string().optional(),
}).passthrough()

export const analyzeRejectionRequestSchema = z.object({
  // User-provided rejection text is sanitized
  rejectionText: z.string().min(1, '탈락 사유 텍스트가 필요합니다.').transform(stripHtml),
  domain: safeString.pipe(z.string()).default('general'),
  companyHistory: z.array(companyHistoryEntrySchema).optional(),
  useExtendedThinking: z.boolean().optional(),
})

export type AnalyzeRejectionRequest = z.infer<typeof analyzeRejectionRequestSchema>

// ============================================
// /api/batch
// ============================================

const batchItemSchema = z.object({
  id: z.string().optional(),
  text: z.string().optional(),
  domain: z.string().optional(),
}).passthrough()

export const batchRequestSchema = z.object({
  type: z.enum(['announcement_analysis', 'rejection_classification']),
  items: z.array(batchItemSchema).min(1, 'Items array must not be empty').max(1000, 'Maximum 1,000 items per batch'),
})

export type BatchRequest = z.infer<typeof batchRequestSchema>

// ============================================
// /api/skill-engine
// ============================================

export const skillEngineRequestSchema = z.object({
  action: z.string().min(1, 'action is required'),
  domain: z.string().optional().default('general'),
  data: z.record(z.string(), z.unknown()).default({}),
})

export type SkillEngineRequest = z.infer<typeof skillEngineRequestSchema>

// ============================================
// /api/templates
// ============================================

export const templateRequestSchema = z.object({
  action: z.enum(['generate', 'analyze', 'fill']).default('generate'),
  announcement: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    agency: z.string().optional(),
    deadline: z.string().optional(),
    description: z.string().optional(),
  }).passthrough().optional(),
  templateType: z.string().optional(),
  domain: z.string().optional(),
  options: z
    .object({
      includeOptionalVariables: z.boolean().optional(),
      mergeCommonVariables: z.boolean().optional(),
    })
    .optional(),
  templateId: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
})

export type TemplateRequest = z.infer<typeof templateRequestSchema>

// ============================================
// /api/email/scan
// ============================================

export const emailScanRequestSchema = z.object({
  provider: z.enum(['gmail', 'outlook'], {
    message: 'Invalid provider. Must be "gmail" or "outlook"',
  }),
  query: z.string().optional(),
  maxResults: z.number().int().positive().max(100).optional().default(20),
  processRejections: z.boolean().optional().default(true),
})

export type EmailScanRequest = z.infer<typeof emailScanRequestSchema>

// ============================================
// /api/generate-document/preview
// ============================================

export const generateDocumentRequestSchema = z.object({
  documentType: z.string().min(1, 'documentType is required'),
  enginePreset: z.string().min(1, 'enginePreset is required'),
  data: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type GenerateDocumentRequest = z.infer<typeof generateDocumentRequestSchema>

// ============================================
// /api/documents (GET only — no POST schema needed, but included for completeness)
// ============================================

export const documentsRequestSchema = z.object({
  action: z.string().optional(),
  documentId: z.string().optional(),
  domain: z.enum(['MANUFACTURING', 'ENVIRONMENT', 'DIGITAL', 'FINANCE', 'STARTUP', 'EXPORT']).optional(),
  status: z.string().optional(),
  type: z.string().optional(),
})

export type DocumentsRequest = z.infer<typeof documentsRequestSchema>

// ============================================
// /api/company-blocks
// ============================================

export const industryBlockEnum = z.enum([
  'FOOD',
  'TEXTILE',
  'METAL',
  'CHEMICAL',
  'ELECTRONICS',
  'MACHINERY',
  'AUTOMOTIVE',
  'BIO_PHARMA',
  'ENVIRONMENT',
  'GENERAL',
])

export const companyProfileBasicSchema = z.object({
  foundedDate: z.string(),
  employeeCount: z.number().int().positive(),
  annualRevenue: z.number().nonnegative(), // 억원
  region: z.string(),
  industry: z.string(),
  mainProducts: z.array(z.string()),
})

export const companyProfileQualificationsSchema = z.object({
  certifications: z.array(z.string()),
  registrations: z.array(z.string()),
  patents: z.number().int().nonnegative(),
  trademarks: z.number().int().nonnegative(),
})

// FundingSource enum matching lib/skill-engine/types.ts
export const fundingSourceEnum = z.enum([
  'MSS', 'MOTIE', 'MSIT', 'ME', 'MOHW', 'MOLIT', 'MOF', 'MAFRA', 'MOD', 'MOE',
  'KIBO', 'KODIT', 'KOREG', 'IBK', 'KDB',
  'LOCAL_SEOUL', 'LOCAL_BUSAN', 'LOCAL_DAEGU', 'LOCAL_INCHEON', 'LOCAL_GWANGJU',
  'LOCAL_DAEJEON', 'LOCAL_ULSAN', 'LOCAL_SEJONG', 'LOCAL_GYEONGGI', 'LOCAL_OTHER',
  'PRIVATE', 'GLOBAL',
])

// ProgramType enum matching lib/skill-engine/types.ts
export const programTypeEnum = z.enum([
  'grant', 'subsidy', 'voucher', 'loan', 'guarantee', 'equity', 'tender',
])

export const applicationHistorySchema = z.object({
  id: z.string(),
  programId: z.string(),
  programName: z.string(),
  source: fundingSourceEnum,
  type: programTypeEnum,
  appliedAt: z.string(),
  result: z.enum(['selected', 'rejected', 'pending', 'withdrawn']),
  rejectionReason: z.string().optional(),
  rejectionCategory: z.string().optional(),
  amount: z.number().optional(),
  feedbackApplied: z.boolean(),
})

export const companyProfileHistorySchema = z.object({
  applications: z.array(applicationHistorySchema),
  totalApplications: z.number().int().nonnegative(),
  selectionCount: z.number().int().nonnegative(),
  rejectionCount: z.number().int().nonnegative(),
  qettaCreditScore: z.number().min(0).max(1000),
})

export const companyProfileSchema = z.object({
  id: z.string(),
  // Company name is sanitized
  name: safeString.pipe(z.string().min(1, '회사명은 필수입니다')),
  businessNumber: z.string(),
  basic: companyProfileBasicSchema,
  qualifications: companyProfileQualificationsSchema,
  history: companyProfileHistorySchema,
  emailIntegration: z.object({
    provider: z.enum(['gmail', 'outlook', 'naver', 'daum']),
    connected: z.boolean(),
    lastSyncAt: z.string().optional(),
    detectedEvents: z.number().int().nonnegative(),
  }).optional(),
})

export const createCompanyBlockRequestSchema = z.object({
  companyName: z.string().min(1, '회사명은 필수입니다'),
  businessNumber: z.string().optional(),
  industryBlock: industryBlockEnum.optional().default('GENERAL'),
  profile: companyProfileSchema,
})

export type CreateCompanyBlockRequest = z.infer<typeof createCompanyBlockRequestSchema>

export const updateCompanyBlockRequestSchema = z.object({
  companyName: z.string().min(1).optional(),
  businessNumber: z.string().nullable().optional(),
  industryBlock: industryBlockEnum.optional(),
  profile: companyProfileSchema.optional(),
})

export type UpdateCompanyBlockRequest = z.infer<typeof updateCompanyBlockRequestSchema>

// ============================================
// /api/company-blocks/[id]/facts
// ============================================

export const companyFactTypeEnum = z.enum([
  'profile',
  'certification',
  'application',
  'preference',
  'rejection_pattern',
  'success_pattern',
  'capability',
])

export const factSourceEnum = z.enum([
  'user_input',
  'document_parsed',
  'email_detected',
  'ai_inferred',
])

export const createCompanyFactRequestSchema = z.object({
  type: companyFactTypeEnum,
  // User-provided content is sanitized
  content: safeString.pipe(z.string().min(1, '내용은 필수입니다')),
  confidence: z.number().min(0).max(1).optional().default(1.0),
  source: factSourceEnum.optional().default('user_input'),
  relatedId: z.string().optional(),
  expiresAt: z.string().datetime().optional(), // ISO 8601
})

export type CreateCompanyFactRequest = z.infer<typeof createCompanyFactRequestSchema>

export const updateCompanyFactRequestSchema = z.object({
  content: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
})

export type UpdateCompanyFactRequest = z.infer<typeof updateCompanyFactRequestSchema>

// ============================================
// /api/proposals/generate
// ============================================

/**
 * Cache strategy for proposal generation
 * - prefer: L1 → L2 → Generate → Cache (default)
 * - bypass: Generate → Cache (skip cache lookup)
 * - only: L1 → L2 only (no generation, throw if miss)
 */
export const cacheStrategyEnum = z.enum(['prefer', 'bypass', 'only'])

export type CacheStrategy = z.infer<typeof cacheStrategyEnum>

export const generateProposalRequestSchema = z.object({
  companyBlockId: z.string().min(1, 'CompanyBlock ID는 필수입니다'),
  programId: z.string().min(1, '프로그램 ID는 필수입니다'),
  programName: z.string().min(1, '프로그램명은 필수입니다'),
  industryBlock: industryBlockEnum.optional(),
  sections: z.array(z.string()).optional(),
  userRequest: z.string().optional(),
  options: z.object({
    maxTokens: z.number().int().positive().max(32000).optional(),
    includeHistory: z.boolean().optional().default(true),
    priority: z.enum(['normal', 'high']).optional().default('normal'),
  }).optional(),
  /** P2-2: Enable SSE streaming for real-time progress updates */
  streaming: z.boolean().optional().default(false),
  /** P2-2: Cache strategy for semantic caching */
  cacheStrategy: cacheStrategyEnum.optional().default('prefer'),
})

export type GenerateProposalRequest = z.infer<typeof generateProposalRequestSchema>

// ============================================
// /api/proposals/[jobId]/status
// ============================================

export const proposalJobStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
])

export type ProposalJobStatus = z.infer<typeof proposalJobStatusSchema>
