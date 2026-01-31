/**
 * Semantic Deduplication
 *
 * 의미적으로 유사한 Facts를 제거하여 중복 없는 정보만 보존.
 *
 * 알고리즘:
 * 1. Jaccard 유사도 기반 텍스트 비교
 * 2. 키워드 추출 및 비교
 * 3. 높은 confidence를 가진 Fact 보존
 */

import type { CompanyFact } from '../types'

// ============================================
// Similarity Calculation
// ============================================

/**
 * 두 텍스트의 유사도를 계산합니다 (0-1).
 * Jaccard 유사도 + 키워드 매칭 조합
 */
export function calculateSimilarity(text1: string, text2: string): number {
  // 빈 텍스트 처리
  if (!text1 || !text2) return 0
  if (text1 === text2) return 1

  // 토큰화
  const tokens1 = tokenize(text1)
  const tokens2 = tokenize(text2)

  // Jaccard 유사도
  const intersection = tokens1.filter(t => tokens2.includes(t))
  const union = new Set([...tokens1, ...tokens2])

  if (union.size === 0) return 0

  return intersection.length / union.size
}

/**
 * 텍스트를 토큰으로 분리합니다.
 */
function tokenize(text: string): string[] {
  // 특수문자 제거 및 공백 기준 분리
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1) // 1글자 제외
}

// ============================================
// Semantic Deduplication
// ============================================

/**
 * 의미적으로 유사한 Facts를 제거합니다.
 *
 * @param facts - 원본 Facts 배열
 * @param threshold - 유사도 임계값 (0-1, 기본 0.85)
 * @returns 중복 제거된 Facts 배열
 */
export function semanticDedup(
  facts: CompanyFact[],
  threshold: number = 0.85
): CompanyFact[] {
  if (facts.length <= 1) return facts

  const result: CompanyFact[] = []
  const seen: string[] = []

  // Confidence 높은 순으로 정렬
  const sortedFacts = [...facts].sort((a, b) => b.confidence - a.confidence)

  for (const fact of sortedFacts) {
    // 이미 유사한 Fact가 있는지 확인
    const isDuplicate = seen.some(
      seenContent => calculateSimilarity(fact.content, seenContent) >= threshold
    )

    if (!isDuplicate) {
      result.push(fact)
      seen.push(fact.content)
    }
  }

  return result
}

// ============================================
// Keyword Extraction
// ============================================

/**
 * 텍스트에서 핵심 키워드를 추출합니다.
 */
export function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  const tokens = tokenize(text)

  // 빈도 계산
  const frequency: Record<string, number> = {}
  for (const token of tokens) {
    frequency[token] = (frequency[token] ?? 0) + 1
  }

  // 불용어 제거
  const stopwords = new Set([
    '및', '의', '등', '를', '이', '가', '은', '는', '에', '로', '와', '과',
    '있는', '있음', '것', '수', '년', '월', '일', '외', '더', '또',
    'the', 'and', 'or', 'is', 'are', 'in', 'to', 'for', 'of', 'a', 'an',
  ])

  const keywords = Object.entries(frequency)
    .filter(([word]) => !stopwords.has(word))
    .filter(([word]) => word.length >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)

  return keywords
}

// ============================================
// Fact Clustering
// ============================================

/**
 * Facts를 유사도 기반으로 클러스터링합니다.
 * 각 클러스터에서 가장 대표적인 Fact만 반환합니다.
 */
export function clusterFacts(
  facts: CompanyFact[],
  threshold: number = 0.7
): CompanyFact[][] {
  if (facts.length === 0) return []

  const clusters: CompanyFact[][] = []
  const assigned = new Set<string>()

  for (const fact of facts) {
    if (assigned.has(fact.id)) continue

    const cluster: CompanyFact[] = [fact]
    assigned.add(fact.id)

    // 유사한 Facts 찾기
    for (const other of facts) {
      if (assigned.has(other.id)) continue

      if (calculateSimilarity(fact.content, other.content) >= threshold) {
        cluster.push(other)
        assigned.add(other.id)
      }
    }

    clusters.push(cluster)
  }

  return clusters
}

/**
 * 클러스터에서 대표 Fact를 선택합니다.
 * 가장 높은 confidence를 가진 Fact 선택
 */
export function selectRepresentative(cluster: CompanyFact[]): CompanyFact {
  return cluster.reduce((best, current) =>
    current.confidence > best.confidence ? current : best
  )
}

// ============================================
// Content Merging
// ============================================

/**
 * 유사한 Facts의 내용을 병합합니다.
 */
export function mergeSimilarFacts(facts: CompanyFact[]): CompanyFact[] {
  const clusters = clusterFacts(facts)

  return clusters.map(cluster => {
    if (cluster.length === 1) return cluster[0]

    // 대표 Fact 선택
    const representative = selectRepresentative(cluster)

    // 다른 Facts에서 추가 키워드 추출
    const additionalKeywords = cluster
      .filter(f => f.id !== representative.id)
      .flatMap(f => extractKeywords(f.content, 2))

    // 키워드가 있으면 보완
    if (additionalKeywords.length > 0) {
      const uniqueKeywords = [...new Set(additionalKeywords)]
        .filter(k => !representative.content.includes(k))
        .slice(0, 2)

      if (uniqueKeywords.length > 0) {
        return {
          ...representative,
          content: `${representative.content} (관련: ${uniqueKeywords.join(', ')})`,
        }
      }
    }

    return representative
  })
}
