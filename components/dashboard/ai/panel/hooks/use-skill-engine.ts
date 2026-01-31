'use client'

import { useCallback } from 'react'
import { apiPost } from '@/lib/api/client'
import { DISPLAY_METRICS } from '@/constants/metrics'
import type { MetricBlockAttributes } from '@/components/editor'
import type { Message, SkillResult } from '../chat-types'
import type {
  RejectionAnalysisResult,
  ValidationResult,
  ProgramMatch,
  QettaMetrics,
  QettaTestResult,
  BizInfoSearchResultData,
} from '../skill-blocks'
import { clientLogger } from '@/lib/logger/client'

interface SkillEngineResult {
  content: string
  metrics?: MetricBlockAttributes[]
  skillResult?: SkillResult
}

/**
 * Formats skill engine API responses into chat messages.
 * Extracted from chat-thread.tsx to reduce component size.
 */
function formatSkillResponse(action: string, commandLabel: string, result: Record<string, any>): SkillEngineResult {
  let responseContent = ''
  let metrics: MetricBlockAttributes[] | undefined
  let skillResult: SkillResult | undefined

  if (action === 'qetta-test') {
    skillResult = {
      type: 'qetta-test',
      data: result as QettaTestResult,
    }
    responseContent = `## QETTA 사업자료 테스트 결과

### 회사 프로필
- **회사명**: ${result.companyProfile?.name}
- **업종**: ${result.companyProfile?.basic?.industry}
- **지역**: ${result.companyProfile?.basic?.region}

### 매칭 프로그램 (상위 3개)
${result.results?.matchedPrograms?.map((p: { program: string; matchScore: number; issues: string[] }) =>
  `- **${p.program}** (점수: ${p.matchScore}점) ${p.issues.length > 0 ? `\n  - ⚠️ ${p.issues.join(', ')}` : ''}`
).join('\n') || '매칭 결과 없음'}

### 사전 검증 결과
- **점수**: ${result.results?.validation?.score}점
${result.results?.validation?.warnings?.length > 0 ? `- **경고**: ${result.results.validation.warnings.join(', ')}` : ''}
${result.results?.validation?.rejectionRisks?.length > 0 ? `- **탈락 리스크**: ${result.results.validation.rejectionRisks.join(', ')}` : '✅ 탈락 리스크 없음'}

### 사업계획서 초안
- 총 ${result.results?.businessPlan?.wordCount?.toLocaleString()}자 생성
`
    if (result.metrics) {
      metrics = [
        { value: result.metrics.timeReduction?.value, label: result.metrics.timeReduction?.label, detail: result.metrics.timeReduction?.detail, trend: 'up', domain: 'DIGITAL' },
        { value: result.metrics.rejectionReduction?.value, label: result.metrics.rejectionReduction?.label, domain: 'DIGITAL' },
      ]
    }
  } else if (action === 'get-qetta-metrics') {
    skillResult = {
      type: 'qetta-metrics',
      data: result.metrics as QettaMetrics,
    }
    responseContent = `## QETTA 핵심 수치

### 슬로건
- **한글**: ${result.slogan?.primary}
- **영문**: ${result.slogan?.english}
- **태그라인**: ${result.slogan?.tagline}

### 핵심 기술
**${result.coreTechnology?.name}**
${result.coreTechnology?.description}

### Claude 생태계 통합
- **현재 점수**: ${result.claudeIntegration?.currentScore}점
- **목표 점수**: ${result.claudeIntegration?.targetScore}점
- **차별화**: ${result.claudeIntegration?.differentiator}
`
    metrics = [
      { value: DISPLAY_METRICS.timeSaved.value, label: DISPLAY_METRICS.timeSaved.label, detail: DISPLAY_METRICS.timeSaved.detail, trend: 'up', domain: 'DIGITAL' },
      { value: DISPLAY_METRICS.rejectionReduction.value, label: DISPLAY_METRICS.rejectionReduction.label, detail: DISPLAY_METRICS.rejectionReduction.detail, trend: 'up', domain: 'DIGITAL' },
      { value: DISPLAY_METRICS.apiUptime.value, label: DISPLAY_METRICS.apiUptime.label, detail: DISPLAY_METRICS.apiUptime.detail, domain: 'DIGITAL' },
    ]
  } else if (action === 'find-programs') {
    skillResult = {
      type: 'program-match',
      data: result.matches as ProgramMatch[],
    }
    responseContent = `## 적합 정부지원사업 매칭 결과

총 ${result.totalPrograms}개 프로그램 중 ${result.matches?.length || 0}개 매칭

${result.matches?.map((m: { program: { name: string; category: string; support: { maxAmount: number } }; matchScore: number; eligibilityIssues: string[] }) =>
  `### ${m.program.name}
- **카테고리**: ${m.program.category}
- **매칭 점수**: ${m.matchScore}점
- **최대 지원금**: ${(m.program.support.maxAmount / 10000).toFixed(0)}억원
${m.eligibilityIssues.length > 0 ? `- ⚠️ 자격 이슈: ${m.eligibilityIssues.join(', ')}` : '- ✅ 자격 요건 충족'}`
).join('\n\n') || '매칭 결과 없음'}
`
  } else if (action === 'bizinfo-search') {
    skillResult = {
      type: 'bizinfo-search',
      data: {
        announcements: result.announcements || [],
        totalCount: result.totalCount || 0,
        currentPage: result.currentPage || 1,
        totalPages: result.totalPages || 1,
        searchedAt: result.searchedAt || new Date().toISOString(),
        fromCache: result.fromCache || false,
      } as BizInfoSearchResultData,
    }
    const openCount = result.announcements?.filter((a: { status: string }) => a.status === 'open').length || 0
    responseContent = `## 기업마당 공고 검색 결과

**총 ${result.totalCount?.toLocaleString() || 0}건** 중 **접수중 ${openCount}건**

${result.announcements?.length > 0
  ? `최근 공고:\n${result.announcements.slice(0, 5).map((a: { title: string; agency: string; status: string }) =>
      `- **${a.title}** (${a.agency}) - ${a.status === 'open' ? '🟢 접수중' : a.status === 'upcoming' ? '🔵 접수예정' : '⚫ 마감'}`
    ).join('\n')}`
  : '검색 결과가 없습니다.'
}

${result.fromCache ? '_캐시된 결과입니다._' : ''}
`
  } else if (action === 'pre-validate') {
    const validationResult = result.validation || result
    skillResult = {
      type: 'validation',
      data: {
        score: validationResult.score ?? 75,
        warnings: validationResult.warnings ?? [],
        suggestions: validationResult.suggestions ?? [],
        rejectionRisks: validationResult.rejectionRisks ?? [],
      } as ValidationResult,
      programName: result.programName || 'QETTA 사업계획서',
    }

    const scoreLabel = validationResult.score >= 80 ? '우수' : validationResult.score >= 60 ? '보통' : '미흡'
    responseContent = `## 사전 검증 결과

**검증 점수**: ${validationResult.score ?? 75}점 (${scoreLabel})

### 경고사항 (${validationResult.warnings?.length || 0}개)
${validationResult.warnings?.length > 0
  ? validationResult.warnings.map((w: string) => `- ⚠️ ${w}`).join('\n')
  : '- 경고사항 없음'
}

### 탈락 위험 (${validationResult.rejectionRisks?.length || 0}개)
${validationResult.rejectionRisks?.length > 0
  ? validationResult.rejectionRisks.map((r: string) => `- 🔴 ${r}`).join('\n')
  : '- ✅ 탈락 위험 없음'
}

### 개선 제안
${validationResult.suggestions?.length > 0
  ? validationResult.suggestions.map((s: string) => `- 💡 ${s}`).join('\n')
  : '- 추가 제안사항 없음'
}
`
  } else if (action === 'analyze-rejection') {
    const analysisResult = result.result
    const patterns = analysisResult?.patterns || []
    const recommendations = analysisResult?.recommendations || []
    const extendedThinking = analysisResult?.extendedThinking

    const highFrequencyCount = patterns.filter((p: { stats?: { frequency?: number } }) =>
      (p.stats?.frequency ?? 0) > 15
    ).length
    const overallRisk: 'high' | 'medium' | 'low' =
      highFrequencyCount >= 2 ? 'high' : highFrequencyCount >= 1 ? 'medium' : 'low'

    skillResult = {
      type: 'rejection-analysis',
      data: {
        overallRisk,
        patterns: patterns.map((p: {
          category: string
          stats?: { frequency?: number }
          pattern?: { context?: string }
          solution?: { prevention?: string }
        }) => ({
          category: p.category || '기타',
          frequency: (p.stats?.frequency ?? 0) > 15 ? 'high' : (p.stats?.frequency ?? 0) > 8 ? 'medium' : 'low',
          description: p.pattern?.context || '상세 내용 없음',
          prevention: p.solution?.prevention || '예방책 분석 중',
        })),
        suggestions: recommendations.map((r: { action?: string }) => r.action || '').filter(Boolean),
        thinking: extendedThinking?.reasoning,
      } as RejectionAnalysisResult,
    }

    const riskLabels = { high: '높음', medium: '보통', low: '낮음' }
    const riskEmojis = { high: '🔴', medium: '🟠', low: '🟢' }

    responseContent = `## 탈락 사유 분석 결과

**위험도**: ${riskEmojis[overallRisk]} ${riskLabels[overallRisk]}

### 감지된 패턴 (${patterns.length}개)
${patterns.length > 0
  ? patterns.slice(0, 5).map((p: {
      category: string
      pattern?: { context?: string }
      solution?: { immediate?: string; prevention?: string }
      stats?: { preventionRate?: number }
    }) =>
      `- **${p.category}**: ${p.pattern?.context || ''}
  - 즉시 조치: ${p.solution?.immediate || '-'}
  - 예방책: ${p.solution?.prevention || '-'}
  - 예방 효과: ${p.stats?.preventionRate || 0}%`
    ).join('\n')
  : '- 매칭된 패턴이 없습니다. 수동 분석이 필요합니다.'
}

### 개선 권고사항
${recommendations.length > 0
  ? recommendations.map((r: { priority?: string; action?: string; expectedOutcome?: string }) =>
      `- [${r.priority?.toUpperCase() || 'MEDIUM'}] ${r.action || ''} (예상 효과: ${r.expectedOutcome || '-'})`
    ).join('\n')
  : '- 권고사항 없음'
}

${extendedThinking?.enabled ? `\n---\n_Extended Thinking으로 ${extendedThinking.thinkingBudget?.toLocaleString() || 10000}토큰 분석 완료_` : ''}
`
  } else {
    responseContent = `## ${commandLabel} 결과\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
  }

  return { content: responseContent, metrics, skillResult }
}

interface UseSkillEngineOptions {
  selectedPreset: string
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
}

export function useSkillEngine({ selectedPreset, setMessages, setIsLoading, setError }: UseSkillEngineOptions) {
  const executeSkillEngineCommand = useCallback(
    async (action: string, commandLabel: string, extraData?: Record<string, unknown>) => {
      setIsLoading(true)
      setError(null)

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: `/${commandLabel}`,
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await apiPost<any>('/api/skill-engine', {
          action,
          domain: selectedPreset,
          data: extraData || {},
        })

        const formatted = formatSkillResponse(action, commandLabel, result)

        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: formatted.content,
          metrics: formatted.metrics,
          skillResult: formatted.skillResult,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        clientLogger.error('[Skill Engine Error]', err)
        setError(err instanceof Error ? err.message : 'Skill engine error')
      } finally {
        setIsLoading(false)
      }
    },
    [selectedPreset, setMessages, setIsLoading, setError]
  )

  return { executeSkillEngineCommand }
}
