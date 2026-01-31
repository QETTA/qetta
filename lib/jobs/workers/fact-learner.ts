/**
 * Fact Learner Worker
 *
 * 탈락 분석, 신청 이력 등에서 Facts를 자동 학습합니다.
 * - 텍스트에서 핵심 인사이트 추출
 * - Company Block에 Fact 추가
 * - 중복 제거 및 신뢰도 관리
 */

import { Job } from 'bullmq'
import {
  registerWorker,
  QUEUE_NAMES,
  type FactLearningJobData,
  type JobResult,
} from '../queue'
import { logger } from '@/lib/api/logger'

// ============================================
// Types
// ============================================

interface ExtractedFact {
  type: 'capability' | 'rejection_pattern' | 'success_pattern' | 'certification' | 'preference'
  content: string
  confidence: number
  keywords: string[]
}

// ============================================
// Worker Processor
// ============================================

/**
 * Fact 학습 작업을 처리합니다.
 */
async function processFactLearning(
  job: Job<FactLearningJobData, JobResult>
): Promise<JobResult> {
  const { companyId, source, sourceId, content, userId } = job.data

  try {
    logger.info(`[FactLearner] Starting fact learning`, {
      jobId: job.id,
      companyId,
      source,
      sourceId,
    })

    await job.updateProgress(10)

    // Step 1: 텍스트 전처리
    await job.log('Preprocessing text...')
    const preprocessed = preprocessText(content)
    await job.updateProgress(20)

    // Step 2: Fact 추출
    await job.log('Extracting facts...')
    const extractedFacts = await extractFacts(preprocessed, source)
    await job.updateProgress(50)

    // Step 3: 기존 Facts와 비교 (중복 제거)
    await job.log('Deduplicating facts...')
    const existingFacts = await loadExistingFacts(companyId)
    const newFacts = deduplicateFacts(extractedFacts, existingFacts)
    await job.updateProgress(70)

    // Step 4: Facts 저장
    await job.log('Saving new facts...')
    const savedCount = await saveFacts(companyId, newFacts, source, sourceId)
    await job.updateProgress(90)

    // Step 5: Company Block 캐시 무효화
    await job.log('Invalidating cache...')
    await invalidateCompanyBlockCache(companyId)
    await job.updateProgress(100)

    logger.info(`[FactLearner] Fact learning completed`, {
      jobId: job.id,
      extractedCount: extractedFacts.length,
      savedCount,
    })

    return {
      success: true,
      data: {
        companyId,
        extractedCount: extractedFacts.length,
        savedCount,
        facts: newFacts.map(f => ({ type: f.type, content: f.content })),
      },
      completedAt: new Date().toISOString(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[FactLearner] Fact learning failed`, {
      jobId: job.id,
      error: message,
    })

    return {
      success: false,
      error: message,
      completedAt: new Date().toISOString(),
    }
  }
}

// ============================================
// Fact Extraction Logic
// ============================================

/**
 * 텍스트 전처리
 */
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣.,!?:;()]/g, '')
    .trim()
}

/**
 * 텍스트에서 Facts를 추출합니다.
 */
async function extractFacts(
  text: string,
  source: FactLearningJobData['source']
): Promise<ExtractedFact[]> {
  const facts: ExtractedFact[] = []

  // Source에 따른 패턴 적용
  if (source === 'rejection') {
    // 탈락 사유에서 패턴 추출
    const rejectionPatterns = extractRejectionPatterns(text)
    facts.push(...rejectionPatterns)
  } else if (source === 'application') {
    // 신청서에서 역량 추출
    const capabilities = extractCapabilities(text)
    facts.push(...capabilities)
  } else if (source === 'document') {
    // 문서에서 다양한 Fact 추출
    const mixedFacts = extractMixedFacts(text)
    facts.push(...mixedFacts)
  }

  // 키워드 기반 추가 추출
  const keywordBasedFacts = extractKeywordBasedFacts(text)
  facts.push(...keywordBasedFacts)

  return facts
}

/**
 * 탈락 패턴 추출
 */
function extractRejectionPatterns(text: string): ExtractedFact[] {
  const patterns: ExtractedFact[] = []

  const rejectionKeywords = [
    { pattern: /기술성.*(?:부족|미흡|낮음)/g, type: 'rejection_pattern' as const },
    { pattern: /사업성.*(?:부족|미흡|불명확)/g, type: 'rejection_pattern' as const },
    { pattern: /시장.*분석.*(?:부족|미흡)/g, type: 'rejection_pattern' as const },
    { pattern: /경쟁.*우위.*(?:불명확|부족)/g, type: 'rejection_pattern' as const },
    { pattern: /구체성.*(?:부족|결여)/g, type: 'rejection_pattern' as const },
  ]

  for (const { pattern, type } of rejectionKeywords) {
    const matches = text.match(pattern)
    if (matches) {
      for (const match of matches) {
        patterns.push({
          type,
          content: match,
          confidence: 0.85,
          keywords: extractKeywords(match),
        })
      }
    }
  }

  return patterns
}

/**
 * 역량 추출
 */
function extractCapabilities(text: string): ExtractedFact[] {
  const capabilities: ExtractedFact[] = []

  const capabilityPatterns = [
    { pattern: /(?:AI|ML|딥러닝|인공지능).*(?:기술|역량|능력)/gi, confidence: 0.9 },
    { pattern: /특허.*(?:\d+건|\d+개)/g, confidence: 0.95 },
    { pattern: /(?:연구원|개발자).*(?:\d+명)/g, confidence: 0.9 },
    { pattern: /(?:매출|수익).*(?:\d+억|\d+만원)/g, confidence: 0.85 },
  ]

  for (const { pattern, confidence } of capabilityPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      for (const match of matches) {
        capabilities.push({
          type: 'capability',
          content: match,
          confidence,
          keywords: extractKeywords(match),
        })
      }
    }
  }

  return capabilities
}

/**
 * 다양한 Fact 추출 (문서용)
 */
function extractMixedFacts(text: string): ExtractedFact[] {
  const facts: ExtractedFact[] = []

  // 인증 관련
  const certPatterns = /(?:ISO|ISMS|벤처기업|이노비즈|메인비즈|GMP).*?(?:인증|취득|획득)/gi
  const certMatches = text.match(certPatterns)
  if (certMatches) {
    for (const match of certMatches) {
      facts.push({
        type: 'certification',
        content: match,
        confidence: 0.95,
        keywords: extractKeywords(match),
      })
    }
  }

  // 성공 패턴
  const successPatterns = /(?:선정|합격|성공).*?(?:요인|이유|비결)/gi
  const successMatches = text.match(successPatterns)
  if (successMatches) {
    for (const match of successMatches) {
      facts.push({
        type: 'success_pattern',
        content: match,
        confidence: 0.8,
        keywords: extractKeywords(match),
      })
    }
  }

  return facts
}

/**
 * 키워드 기반 Fact 추출
 */
function extractKeywordBasedFacts(text: string): ExtractedFact[] {
  const facts: ExtractedFact[] = []

  const importantKeywords = ['핵심', '강점', '차별화', '경쟁력', '전문성']

  for (const keyword of importantKeywords) {
    if (text.includes(keyword)) {
      // 키워드 주변 문맥 추출
      const regex = new RegExp(`.{0,30}${keyword}.{0,50}`, 'g')
      const matches = text.match(regex)
      if (matches) {
        for (const match of matches.slice(0, 2)) { // 최대 2개
          facts.push({
            type: 'capability',
            content: match.trim(),
            confidence: 0.7,
            keywords: [keyword, ...extractKeywords(match)],
          })
        }
      }
    }
  }

  return facts
}

/**
 * 키워드 추출
 */
function extractKeywords(text: string): string[] {
  const words = text.split(/\s+/).filter(w => w.length >= 2)
  const stopwords = new Set(['및', '의', '등', '를', '이', '가', '은', '는', '에', '로', '와', '과'])
  return words.filter(w => !stopwords.has(w)).slice(0, 5)
}

// ============================================
// Deduplication
// ============================================

/**
 * 중복 Facts 제거
 */
function deduplicateFacts(
  newFacts: ExtractedFact[],
  existingFacts: Array<{ content: string; type: string }>
): ExtractedFact[] {
  return newFacts.filter(newFact => {
    // 동일 내용 검사
    const isDuplicate = existingFacts.some(existing =>
      calculateSimilarity(newFact.content, existing.content) > 0.8 &&
      newFact.type === existing.type
    )
    return !isDuplicate
  })
}

/**
 * Jaccard 유사도 계산
 */
function calculateSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(text1.toLowerCase().split(/\s+/))
  const tokens2 = new Set(text2.toLowerCase().split(/\s+/))

  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)))
  const union = new Set([...tokens1, ...tokens2])

  if (union.size === 0) return 0
  return intersection.size / union.size
}

// ============================================
// Data Operations (Stubs)
// ============================================

/**
 * 기존 Facts 로드
 */
async function loadExistingFacts(companyId: string): Promise<Array<{ content: string; type: string }>> {
  // 시뮬레이션
  await simulateDelay(200)

  // 실제 구현에서는 DB에서 로드
  // const facts = await prisma.companyFact.findMany({ where: { companyId } })
  return []
}

/**
 * Facts 저장
 */
async function saveFacts(
  companyId: string,
  facts: ExtractedFact[],
  source: string,
  sourceId: string
): Promise<number> {
  await simulateDelay(300)

  // 실제 구현에서는 DB에 저장
  // await prisma.companyFact.createMany({ data: facts.map(...) })

  logger.info(`[FactLearner] Saved ${facts.length} facts for company ${companyId}`, {
    source,
    sourceId,
  })

  return facts.length
}

/**
 * Company Block 캐시 무효화
 */
async function invalidateCompanyBlockCache(companyId: string): Promise<void> {
  // 실제 구현에서는 캐시 무효화
  // await getDomainCache().invalidateCompanyBlock(companyId)
  logger.debug(`[FactLearner] Cache invalidated for company ${companyId}`)
}

/**
 * 딜레이 시뮬레이션
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================
// Worker Registration
// ============================================

let isWorkerRegistered = false

/**
 * Fact Learner Worker를 시작합니다.
 */
export function startFactLearnerWorker(): void {
  if (isWorkerRegistered) {
    logger.warn('[FactLearner] Worker already registered')
    return
  }

  registerWorker<FactLearningJobData>(
    QUEUE_NAMES.LEARNING,
    processFactLearning,
    {
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 60000, // 분당 최대 20개
      },
    }
  )

  isWorkerRegistered = true
  logger.info('[FactLearner] Worker started')
}

// ============================================
// Export for testing
// ============================================

export const __test__ = {
  processFactLearning,
  preprocessText,
  extractFacts,
  extractRejectionPatterns,
  extractCapabilities,
  extractMixedFacts,
  extractKeywordBasedFacts,
  deduplicateFacts,
  calculateSimilarity,
}
