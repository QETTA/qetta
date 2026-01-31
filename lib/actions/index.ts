/**
 * Server Actions Index
 *
 * Centralized export of all Server Actions
 * Next.js 15 + React 19 modern architecture
 */

// ============================================
// Tier 1: Core Actions (Completed)
// ============================================

// Verify Actions
export { verifyFileHash } from './verify/hash'

// Batch Actions
export { createBatch } from './batch/create'
export { cancelBatch } from './batch/cancel'

// ============================================
// Tier 2: High Priority (Completed)
// ============================================

// Documents Actions
export { generateDocument } from './documents/generate'

// Skills Actions
export { executeSkill } from './skills/execute'

// Analysis Actions
export { analyzeRejection } from './analyze/rejection'

// ============================================
// Tier 3: Medium & Low Priority (Completed)
// ============================================

// Verify Actions (Extended)
export { submitHashChain } from './verify/chain'

// Email Actions
export { scanEmail } from './email/scan'

// Templates Actions
export { createTemplate } from './templates/create'

// Auth Actions
export { registerUser } from './auth/register'
