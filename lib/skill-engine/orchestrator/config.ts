/**
 * QETTA Multi-Agent Orchestrator Configuration
 *
 * 에이전트 설정, 작업 정의, 사전 정의된 워크플로우
 *
 * @see docs/plans/2026-01-22-claude-ecosystem-integration.md
 */

import type {
  AgentType,
  AgentConfig,
  TaskType,
  TaskDefinition,
  WorkflowDefinition,
} from './types'

// ============================================
// Agent Configurations
// ============================================

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  orchestrator: {
    type: 'orchestrator',
    model: 'claude-opus-4-5-20251101',
    maxTokens: 4096,
    systemPrompt: `당신은 QETTA 멀티에이전트 시스템의 오케스트레이터입니다.
다른 에이전트들의 작업을 조율하고 최적의 순서로 실행합니다.
비용 효율성과 품질을 균형있게 고려합니다.`,
    tools: ['assign_task', 'check_status', 'aggregate_results'],
    priority: 100,
    timeout: 120000,
    retries: 2,
  },
  document_generator: {
    type: 'document_generator',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    systemPrompt: `당신은 QETTA 문서 생성 에이전트입니다.
정부지원사업 서류 (사업계획서, 정산보고서, 실적보고서)를 생성합니다.
도메인 엔진의 용어 사전과 템플릿을 활용합니다.`,
    tools: ['generate_tms_daily_report', 'generate_smart_factory_report', 'generate_ai_voucher_report'],
    priority: 80,
    timeout: 90000,
    retries: 3,
  },
  announcement_parser: {
    type: 'announcement_parser',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    systemPrompt: `당신은 QETTA 공고문 파싱 에이전트입니다.
정부지원사업 공고문에서 핵심 정보를 추출합니다.
- 사업명, 지원자격, 예산, 일정
- 필수 서류 목록
- 평가 기준`,
    tools: ['parse_announcement', 'extract_requirements'],
    priority: 70,
    timeout: 60000,
    retries: 3,
  },
  matcher: {
    type: 'matcher',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    systemPrompt: `당신은 QETTA 매칭 에이전트입니다.
기업 프로필과 정부지원사업을 매칭합니다.
적합도 점수와 추천 이유를 제공합니다.`,
    tools: ['match_company', 'calculate_score'],
    priority: 60,
    timeout: 60000,
    retries: 3,
  },
  rejection_analyzer: {
    type: 'rejection_analyzer',
    model: 'claude-opus-4-5-20251101',
    maxTokens: 4096,
    systemPrompt: `당신은 QETTA 탈락 분석 에이전트입니다.
Extended Thinking을 활용하여 탈락 사유를 심층 분석합니다.
패턴을 식별하고 재도전 전략을 제안합니다.`,
    tools: ['analyze_rejection', 'identify_pattern', 'generate_feedback'],
    priority: 90,
    timeout: 180000, // Extended Thinking 고려
    retries: 2,
  },
  validator: {
    type: 'validator',
    model: 'claude-haiku-4-20250514',
    maxTokens: 2048,
    systemPrompt: `당신은 QETTA 검증 에이전트입니다.
문서의 형식, 필수 항목, 용어 일관성을 검증합니다.
빠르고 정확한 검증 결과를 제공합니다.`,
    tools: ['validate_format', 'check_requirements'],
    priority: 50,
    timeout: 30000,
    retries: 5,
  },
  email_detector: {
    type: 'email_detector',
    model: 'claude-haiku-4-20250514',
    maxTokens: 2048,
    systemPrompt: `당신은 QETTA 이메일 감지 에이전트입니다.
정부지원사업 관련 이메일 이벤트를 감지합니다.
선정/탈락 결과를 정확히 분류합니다.`,
    tools: ['detect_event', 'extract_info'],
    priority: 40,
    timeout: 30000,
    retries: 5,
  },
}

// ============================================
// Task Definitions
// ============================================

export const TASK_DEFINITIONS: Record<TaskType, Omit<TaskDefinition, 'id'>> = {
  generate_document: {
    type: 'generate_document',
    name: '문서 생성',
    description: '정부지원사업 서류 자동 생성',
    requiredAgents: ['document_generator', 'validator'],
    priority: 'high',
    estimatedDuration: 60000,
    estimatedCost: 0.05,
  },
  parse_announcement: {
    type: 'parse_announcement',
    name: '공고문 파싱',
    description: '정부지원사업 공고문 분석 및 정보 추출',
    requiredAgents: ['announcement_parser'],
    priority: 'medium',
    estimatedDuration: 30000,
    estimatedCost: 0.02,
  },
  match_company: {
    type: 'match_company',
    name: '기업 매칭',
    description: '기업과 지원사업 적합도 분석',
    requiredAgents: ['matcher'],
    priority: 'medium',
    estimatedDuration: 45000,
    estimatedCost: 0.03,
  },
  analyze_rejection: {
    type: 'analyze_rejection',
    name: '탈락 분석',
    description: '탈락 사유 심층 분석 (Extended Thinking)',
    requiredAgents: ['rejection_analyzer'],
    priority: 'high',
    estimatedDuration: 120000,
    estimatedCost: 0.15,
  },
  validate_document: {
    type: 'validate_document',
    name: '문서 검증',
    description: '제출 서류 형식 및 내용 검증',
    requiredAgents: ['validator'],
    priority: 'medium',
    estimatedDuration: 15000,
    estimatedCost: 0.005,
  },
  scan_emails: {
    type: 'scan_emails',
    name: '이메일 스캔',
    description: '정부지원사업 관련 이메일 감지',
    requiredAgents: ['email_detector'],
    priority: 'low',
    estimatedDuration: 20000,
    estimatedCost: 0.003,
  },
  batch_process: {
    type: 'batch_process',
    name: '일괄 처리',
    description: '대량 작업 일괄 처리 (Batch API)',
    requiredAgents: ['orchestrator'],
    priority: 'low',
    estimatedDuration: 300000,
    estimatedCost: 0.25,
  },
  workflow: {
    type: 'workflow',
    name: '워크플로우',
    description: '여러 작업의 순차/병렬 실행',
    requiredAgents: ['orchestrator'],
    priority: 'high',
    estimatedDuration: 180000,
    estimatedCost: 0.2,
  },
}

// ============================================
// Predefined Workflows (Scout → Matcher → Writer → Analyst Chain)
// ============================================

/**
 * 사전 정의된 워크플로우
 *
 * Scout → Matcher → Writer → Analyst 체인 완성
 * @see docs/plans/2026-01-22-domain-engine-master-plan.md
 */
export const PREDEFINED_WORKFLOWS: Record<string, WorkflowDefinition> = {
  /**
   * 완전 신청 워크플로우: 공고 스캔 → 매칭 → 문서 생성 → 분석
   * Scout → Matcher → Writer → Analyst 체인
   */
  complete_application: {
    id: 'wf_complete_application',
    name: '완전 신청 워크플로우',
    description: '공고 탐색부터 문서 생성까지 전체 프로세스 자동화 (Scout → Matcher → Writer → Analyst)',
    tasks: [
      {
        id: 'scout_task',
        type: 'parse_announcement',
        name: '공고 스캔 (Scout)',
        description: '정부지원사업 공고문 탐색 및 핵심 정보 추출',
        requiredAgents: ['announcement_parser'],
        priority: 'high',
        estimatedDuration: 30000,
        estimatedCost: 0.02,
      },
      {
        id: 'match_task',
        type: 'match_company',
        name: '기업 매칭 (Matcher)',
        description: '기업 프로필과 공고 요건 적합도 분석',
        requiredAgents: ['matcher'],
        dependencies: ['scout_task'],
        priority: 'high',
        estimatedDuration: 45000,
        estimatedCost: 0.03,
      },
      {
        id: 'write_task',
        type: 'generate_document',
        name: '문서 생성 (Writer)',
        description: '사업계획서 및 첨부 서류 자동 생성',
        requiredAgents: ['document_generator', 'validator'],
        dependencies: ['match_task'],
        priority: 'high',
        estimatedDuration: 60000,
        estimatedCost: 0.05,
      },
      {
        id: 'analyze_task',
        type: 'analyze_rejection',
        name: '품질 분석 (Analyst)',
        description: '생성된 문서의 품질 심층 분석 및 개선점 도출',
        requiredAgents: ['rejection_analyzer'],
        dependencies: ['write_task'],
        priority: 'medium',
        estimatedDuration: 120000,
        estimatedCost: 0.15,
      },
    ],
    edges: [
      { from: 'scout_task', to: 'match_task' },
      { from: 'match_task', to: 'write_task' },
      { from: 'write_task', to: 'analyze_task' },
    ],
    triggers: [{ type: 'manual', config: {} }],
  },

  /**
   * 빠른 문서 생성: 매칭 → 문서 생성 → 검증
   */
  quick_document: {
    id: 'wf_quick_document',
    name: '빠른 문서 생성',
    description: '이미 선정된 공고에 대한 빠른 문서 생성 (Matcher → Writer → Validator)',
    tasks: [
      {
        id: 'match_quick_task',
        type: 'match_company',
        name: '적합도 확인',
        description: '기업 프로필과 공고 요건 빠른 확인',
        requiredAgents: ['matcher'],
        priority: 'high',
        estimatedDuration: 30000,
        estimatedCost: 0.02,
      },
      {
        id: 'write_quick_task',
        type: 'generate_document',
        name: '문서 생성',
        description: '핵심 서류 생성',
        requiredAgents: ['document_generator'],
        dependencies: ['match_quick_task'],
        priority: 'high',
        estimatedDuration: 45000,
        estimatedCost: 0.04,
      },
      {
        id: 'validate_quick_task',
        type: 'validate_document',
        name: '문서 검증',
        description: '형식 및 필수 항목 검증',
        requiredAgents: ['validator'],
        dependencies: ['write_quick_task'],
        priority: 'medium',
        estimatedDuration: 15000,
        estimatedCost: 0.005,
      },
    ],
    edges: [
      { from: 'match_quick_task', to: 'write_quick_task' },
      { from: 'write_quick_task', to: 'validate_quick_task' },
    ],
    triggers: [{ type: 'manual', config: {} }],
  },

  /**
   * 탈락 분석 워크플로우: 이메일 감지 → 분석 → 피드백
   */
  rejection_analysis: {
    id: 'wf_rejection_analysis',
    name: '탈락 분석 워크플로우',
    description: '탈락 결과 감지 및 심층 분석 (Email Detector → Analyst)',
    tasks: [
      {
        id: 'detect_task',
        type: 'scan_emails',
        name: '결과 감지',
        description: '정부지원사업 결과 이메일 감지',
        requiredAgents: ['email_detector'],
        priority: 'medium',
        estimatedDuration: 20000,
        estimatedCost: 0.003,
      },
      {
        id: 'deep_analyze_task',
        type: 'analyze_rejection',
        name: '심층 분석',
        description: 'Extended Thinking을 활용한 탈락 사유 심층 분석',
        requiredAgents: ['rejection_analyzer'],
        dependencies: ['detect_task'],
        priority: 'high',
        estimatedDuration: 180000,
        estimatedCost: 0.2,
      },
    ],
    edges: [{ from: 'detect_task', to: 'deep_analyze_task' }],
    triggers: [
      { type: 'manual', config: {} },
      { type: 'event', config: { event: 'email_received' } },
    ],
  },

  /**
   * 공고 모니터링: 스캔 → 매칭 → 알림
   */
  announcement_monitoring: {
    id: 'wf_announcement_monitoring',
    name: '공고 모니터링',
    description: '새 공고 탐색 및 적합 공고 알림 (Scout → Matcher)',
    tasks: [
      {
        id: 'scan_task',
        type: 'parse_announcement',
        name: '공고 스캔',
        description: '기업마당, K-Startup, NIPA 공고 스캔',
        requiredAgents: ['announcement_parser'],
        priority: 'low',
        estimatedDuration: 60000,
        estimatedCost: 0.03,
      },
      {
        id: 'match_scan_task',
        type: 'match_company',
        name: '적합도 평가',
        description: '기업 프로필 기반 적합 공고 필터링',
        requiredAgents: ['matcher'],
        dependencies: ['scan_task'],
        priority: 'low',
        estimatedDuration: 30000,
        estimatedCost: 0.02,
      },
    ],
    edges: [{ from: 'scan_task', to: 'match_scan_task' }],
    triggers: [
      { type: 'manual', config: {} },
      { type: 'scheduled', config: { schedule: '0 9 * * *' } }, // 매일 오전 9시
    ],
  },

  /**
   * 배치 문서 생성: 여러 공고에 대한 일괄 문서 생성
   */
  batch_document_generation: {
    id: 'wf_batch_document',
    name: '배치 문서 생성',
    description: '여러 공고에 대한 일괄 문서 생성 (Batch API 활용)',
    tasks: [
      {
        id: 'batch_prep_task',
        type: 'batch_process',
        name: '배치 준비',
        description: '입력 데이터 검증 및 배치 작업 준비',
        requiredAgents: ['orchestrator'],
        priority: 'medium',
        estimatedDuration: 30000,
        estimatedCost: 0.01,
      },
      {
        id: 'batch_gen_task',
        type: 'batch_process',
        name: '일괄 생성',
        description: 'Batch API를 통한 대량 문서 생성',
        requiredAgents: ['orchestrator'],
        dependencies: ['batch_prep_task'],
        priority: 'low',
        estimatedDuration: 600000, // 최대 10분
        estimatedCost: 0.25,
      },
      {
        id: 'batch_validate_task',
        type: 'validate_document',
        name: '일괄 검증',
        description: '생성된 문서 일괄 검증',
        requiredAgents: ['validator'],
        dependencies: ['batch_gen_task'],
        priority: 'medium',
        estimatedDuration: 60000,
        estimatedCost: 0.02,
      },
    ],
    edges: [
      { from: 'batch_prep_task', to: 'batch_gen_task' },
      { from: 'batch_gen_task', to: 'batch_validate_task' },
    ],
    triggers: [{ type: 'manual', config: {} }],
  },
}

/**
 * 사전 정의된 워크플로우 이름 목록
 */
export type PredefinedWorkflowName = keyof typeof PREDEFINED_WORKFLOWS
