/**
 * QETTA Rejection Feedback Loop Module
 *
 * 탈락 패턴 학습 및 도메인 엔진 피드백 시스템
 *
 * @example
 * ```ts
 * import {
 *   learnFromRejection,
 *   createFeedbackRecord,
 *   generateEngineSuggestions,
 *   getStats,
 * } from '@/lib/skill-engine/feedback'
 *
 * // 탈락 분석 결과에서 패턴 학습
 * const patterns = learnFromRejection(analysisResult, 'ENVIRONMENT', '스마트제조혁신 R&D')
 *
 * // 피드백 기록 생성
 * const record = createFeedbackRecord(rejectionId, pattern, reason, domain, program)
 *
 * // 도메인 엔진 업데이트 제안
 * const suggestions = generateEngineSuggestions()
 *
 * // 통계 조회
 * const stats = getStats()
 * ```
 */

// Core Functions
export {
  learnFromRejection,
  createFeedbackRecord,
  generateEngineSuggestions,
  getStats,
  markFeedbackApplied,
  updateSuggestionStatus,
  updateConfig,
  clearStore,
  feedbackStore,
} from './feedback-loop'

// Types
export type {
  RejectionCategory,
  LearnedPattern,
  FeedbackRecord,
  FeedbackAction,
  FeedbackLoopStats,
  EnginePresetSuggestion,
  LearningConfig,
} from './types'

export { DEFAULT_LEARNING_CONFIG } from './types'
