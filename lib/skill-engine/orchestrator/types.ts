/**
 * QETTA Multi-Agent Orchestrator Types
 *
 * 멀티에이전트 오케스트레이터 관련 타입 정의
 *
 * @see docs/plans/2026-01-22-claude-ecosystem-integration.md
 */

import type { EnginePresetType } from '../types'
import type { ClaudeModelId } from '@/lib/claude/cost-manager'

// ============================================
// Agent Types
// ============================================

/**
 * 에이전트 유형
 */
export type AgentType =
  | 'orchestrator' // Opus - 오케스트레이터
  | 'document_generator' // Sonnet - 문서 생성
  | 'announcement_parser' // Sonnet - 공고문 파싱
  | 'matcher' // Sonnet - 기업-프로그램 매칭
  | 'rejection_analyzer' // Opus - 탈락 분석 (Extended Thinking)
  | 'validator' // Haiku - 형식 검증
  | 'email_detector' // Haiku - 이메일 이벤트 감지

/**
 * 에이전트 상태
 */
export type AgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * 에이전트 설정
 */
export interface AgentConfig {
  type: AgentType
  model: ClaudeModelId
  maxTokens: number
  systemPrompt: string
  tools?: string[]
  priority: number // 높을수록 먼저 실행
  timeout: number // ms
  retries: number
}

/**
 * 에이전트 인스턴스
 */
export interface AgentInstance {
  id: string
  type: AgentType
  config: AgentConfig
  status: AgentStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  input?: unknown
  output?: unknown
  error?: string
  tokenUsage?: {
    input: number
    output: number
    thinking?: number
  }
  cost?: number
}

// ============================================
// Task Types
// ============================================

/**
 * 작업 유형
 */
export type TaskType =
  | 'generate_document'
  | 'parse_announcement'
  | 'match_company'
  | 'analyze_rejection'
  | 'validate_document'
  | 'scan_emails'
  | 'batch_process'
  | 'workflow' // 여러 작업의 조합

/**
 * 작업 정의
 */
export interface TaskDefinition {
  id: string
  type: TaskType
  name: string
  description: string
  requiredAgents: AgentType[]
  dependencies?: string[] // 선행 작업 ID
  domain?: EnginePresetType
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedDuration: number // ms
  estimatedCost: number // USD
}

/**
 * 작업 인스턴스
 */
export interface TaskInstance {
  id: string
  definition: TaskDefinition
  status: AgentStatus
  progress: number // 0-100
  agents: AgentInstance[]
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  input: unknown
  output?: unknown
  error?: string
  metrics?: {
    totalTokens: number
    totalCost: number
    duration: number
  }
}

// ============================================
// Workflow Types
// ============================================

/**
 * 워크플로우 정의
 */
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  tasks: TaskDefinition[]
  edges: WorkflowEdge[] // 작업 간 연결
  triggers?: WorkflowTrigger[]
}

/**
 * 워크플로우 엣지 (작업 간 연결)
 */
export interface WorkflowEdge {
  from: string // 작업 ID
  to: string // 작업 ID
  condition?: {
    field: string
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains'
    value: unknown
  }
}

/**
 * 워크플로우 트리거
 */
export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event'
  config: {
    schedule?: string // cron expression
    event?: string // event name
  }
}

/**
 * 워크플로우 인스턴스
 */
export interface WorkflowInstance {
  id: string
  definition: WorkflowDefinition
  status: AgentStatus
  currentTask?: string // 현재 실행 중인 작업 ID
  completedTasks: string[]
  tasks: Map<string, TaskInstance>
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}

// ============================================
// Queue Types
// ============================================

/**
 * 작업 큐 항목
 */
export interface QueueItem {
  id: string
  task: TaskInstance
  priority: number
  addedAt: Date
  estimatedStart?: Date
}

/**
 * 큐 상태
 */
export interface QueueStatus {
  pending: number
  running: number
  completed: number
  failed: number
  items: QueueItem[]
}

// ============================================
// Event Types
// ============================================

/**
 * 오케스트레이터 이벤트
 */
export interface OrchestratorEvent {
  type:
    | 'task_queued'
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'agent_started'
    | 'agent_completed'
    | 'workflow_started'
    | 'workflow_completed'
  timestamp: Date
  taskId?: string
  agentId?: string
  workflowId?: string
  data?: unknown
}

export type OrchestratorEventCallback = (event: OrchestratorEvent) => void

// ============================================
// Config Types
// ============================================

/**
 * 오케스트레이터 설정
 */
export interface OrchestratorConfig {
  maxConcurrentTasks: number
  maxConcurrentAgents: number
  defaultTimeout: number // ms
  defaultRetries: number
  budgetLimit: number // USD per day
  enableBatchProcessing: boolean
  enableExtendedThinking: boolean
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxConcurrentTasks: 5,
  maxConcurrentAgents: 10,
  defaultTimeout: 60000, // 1분
  defaultRetries: 3,
  budgetLimit: 50, // $50/day
  enableBatchProcessing: true,
  enableExtendedThinking: true,
}
