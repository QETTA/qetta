/**
 * QETTA Multi-Agent Orchestrator
 *
 * Claude 기반 멀티에이전트 오케스트레이션 시스템
 *
 * 기능:
 * 1. 에이전트 생성 및 관리
 * 2. 작업 큐 관리
 * 3. 워크플로우 실행
 * 4. 비용/토큰 최적화
 *
 * 에이전트 구성:
 * - Orchestrator (Opus): 전체 흐름 조율
 * - Document Generator (Sonnet): 문서 생성
 * - Announcement Parser (Sonnet): 공고문 파싱
 * - Matcher (Sonnet): 기업-프로그램 매칭
 * - Rejection Analyzer (Opus + Extended Thinking): 탈락 분석
 * - Validator (Haiku): 형식 검증
 * - Email Detector (Haiku): 이메일 감지
 *
 * @see docs/plans/2026-01-22-claude-ecosystem-integration.md
 */

import type {
  AgentType,
  AgentInstance,
  TaskType,
  TaskDefinition,
  TaskInstance,
  WorkflowDefinition,
  WorkflowInstance,
  QueueItem,
  QueueStatus,
  OrchestratorEvent,
  OrchestratorEventCallback,
  OrchestratorConfig,
} from './types'
import { DEFAULT_ORCHESTRATOR_CONFIG } from './types'
import {
  getCostManager,
  selectModelWithBudget,
  CLAUDE_PRICING,
} from '@/lib/claude'
import type { ClaudeModelId } from '@/lib/claude/cost-manager'
import type { EnginePresetType } from '../types'
import { logger } from '@/lib/api/logger'

// Import from separated modules
import {
  AGENT_CONFIGS,
  TASK_DEFINITIONS,
  type PredefinedWorkflowName,
} from './config'
import { getPredefinedWorkflow, listPredefinedWorkflows } from './workflows'

// Re-export for backwards compatibility
export { PREDEFINED_WORKFLOWS, type PredefinedWorkflowName } from './config'
export { getPredefinedWorkflow, listPredefinedWorkflows } from './workflows'

// ============================================
// Orchestrator Class
// ============================================

export class MultiAgentOrchestrator {
  private config: OrchestratorConfig
  private queue: QueueItem[] = []
  private runningTasks: Map<string, TaskInstance> = new Map()
  private completedTasks: Map<string, TaskInstance> = new Map()
  private workflows: Map<string, WorkflowInstance> = new Map()
  private eventCallbacks: OrchestratorEventCallback[] = []

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config }
  }

  // ============================================
  // Task Management
  // ============================================

  /**
   * 작업 생성 및 큐에 추가
   */
  async createTask(
    type: TaskType,
    input: unknown,
    options: {
      domain?: EnginePresetType
      priority?: 'critical' | 'high' | 'medium' | 'low'
    } = {}
  ): Promise<TaskInstance> {
    const baseDef = TASK_DEFINITIONS[type]
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const definition: TaskDefinition = {
      ...baseDef,
      id: taskId,
      domain: options.domain,
      priority: options.priority || baseDef.priority,
    }

    const task: TaskInstance = {
      id: taskId,
      definition,
      status: 'queued',
      progress: 0,
      agents: [],
      createdAt: new Date(),
      input,
    }

    // 큐에 추가
    const queueItem: QueueItem = {
      id: taskId,
      task,
      priority: this.getPriorityScore(definition.priority),
      addedAt: new Date(),
    }

    this.queue.push(queueItem)
    this.sortQueue()

    this.emitEvent({
      type: 'task_queued',
      timestamp: new Date(),
      taskId,
      data: { type, priority: definition.priority },
    })

    // 자동 실행 시도
    this.processQueue()

    return task
  }

  /**
   * 작업 실행
   */
  private async executeTask(task: TaskInstance): Promise<void> {
    task.status = 'running'
    task.startedAt = new Date()
    this.runningTasks.set(task.id, task)

    this.emitEvent({
      type: 'task_started',
      timestamp: new Date(),
      taskId: task.id,
    })

    try {
      // 필요한 에이전트들 생성
      for (const agentType of task.definition.requiredAgents) {
        const agent = await this.createAgent(agentType, task.input)
        task.agents.push(agent)
      }

      // 에이전트 순차 실행
      let currentOutput = task.input
      for (const agent of task.agents) {
        const result = await this.executeAgent(agent, currentOutput)
        currentOutput = result
        task.progress = Math.round(
          ((task.agents.indexOf(agent) + 1) / task.agents.length) * 100
        )
      }

      // 완료
      task.status = 'completed'
      task.completedAt = new Date()
      task.output = currentOutput
      task.metrics = this.calculateTaskMetrics(task)

      this.emitEvent({
        type: 'task_completed',
        timestamp: new Date(),
        taskId: task.id,
        data: { metrics: task.metrics },
      })
    } catch (error) {
      task.status = 'failed'
      task.completedAt = new Date()
      task.error = String(error)

      this.emitEvent({
        type: 'task_failed',
        timestamp: new Date(),
        taskId: task.id,
        data: { error: task.error },
      })
    } finally {
      this.runningTasks.delete(task.id)
      this.completedTasks.set(task.id, task)
      this.processQueue()
    }
  }

  // ============================================
  // Agent Management
  // ============================================

  /**
   * 에이전트 생성
   */
  private async createAgent(
    type: AgentType,
    input: unknown
  ): Promise<AgentInstance> {
    const config = AGENT_CONFIGS[type]

    // 예산 체크 및 모델 다운그레이드
    const model = this.selectModelWithBudget(config.model)

    const agent: AgentInstance = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      config: { ...config, model },
      status: 'idle',
      createdAt: new Date(),
      input,
    }

    return agent
  }

  /**
   * 에이전트 실행
   */
  private async executeAgent(
    agent: AgentInstance,
    input: unknown
  ): Promise<unknown> {
    agent.status = 'running'
    agent.startedAt = new Date()
    agent.input = input

    this.emitEvent({
      type: 'agent_started',
      timestamp: new Date(),
      agentId: agent.id,
      data: { type: agent.type, model: agent.config.model },
    })

    try {
      // 실제 Claude API 호출 (시뮬레이션)
      const result = await this.callClaudeAPI(agent, input)

      agent.status = 'completed'
      agent.completedAt = new Date()
      agent.output = result.output
      agent.tokenUsage = result.tokenUsage
      agent.cost = this.calculateAgentCost(agent)

      // Cost Manager에 기록
      getCostManager().recordUsage(
        agent.config.model,
        result.tokenUsage.input,
        result.tokenUsage.output,
        agent.type,
        {
          thinkingTokens: result.tokenUsage.thinking,
          requestId: agent.id,
        }
      )

      this.emitEvent({
        type: 'agent_completed',
        timestamp: new Date(),
        agentId: agent.id,
        data: { cost: agent.cost, tokenUsage: agent.tokenUsage },
      })

      return result.output
    } catch (error) {
      agent.status = 'failed'
      agent.completedAt = new Date()
      agent.error = String(error)
      throw error
    }
  }

  /**
   * Claude API 호출 (시뮬레이션 - 실제 구현 시 교체)
   */
  private async callClaudeAPI(
    agent: AgentInstance,
    input: unknown
  ): Promise<{
    output: unknown
    tokenUsage: { input: number; output: number; thinking?: number }
  }> {
    // 실제 구현에서는 Anthropic SDK 사용
    // 여기서는 시뮬레이션

    const processingTime = Math.random() * 2000 + 1000 // 1-3초

    await new Promise((resolve) => setTimeout(resolve, processingTime))

    const baseInputTokens = 500
    const baseOutputTokens = 300

    const tokenUsage = {
      input: baseInputTokens + Math.floor(Math.random() * 200),
      output: baseOutputTokens + Math.floor(Math.random() * 500),
      thinking:
        agent.type === 'rejection_analyzer'
          ? 2000 + Math.floor(Math.random() * 3000)
          : undefined,
    }

    return {
      output: {
        success: true,
        agentType: agent.type,
        processedAt: new Date().toISOString(),
        input,
        result: `${agent.type} 에이전트 처리 완료`,
      },
      tokenUsage,
    }
  }

  // ============================================
  // Queue Management
  // ============================================

  /**
   * 큐 처리
   */
  private processQueue(): void {
    while (
      this.queue.length > 0 &&
      this.runningTasks.size < this.config.maxConcurrentTasks
    ) {
      // 예산 체크
      const summary = getCostManager().getSummary()
      if (summary.budgetStatus.isOverDaily) {
        logger.warn('[Orchestrator] Daily budget exceeded, pausing queue')
        break
      }

      const item = this.queue.shift()
      if (item) {
        this.executeTask(item.task)
      }
    }
  }

  /**
   * 큐 정렬 (우선순위 기준)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 큐 상태 조회
   */
  getQueueStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      running: this.runningTasks.size,
      completed: this.completedTasks.size,
      failed: Array.from(this.completedTasks.values()).filter(
        (t) => t.status === 'failed'
      ).length,
      items: this.queue.slice(0, 10), // 최대 10개
    }
  }

  // ============================================
  // Workflow Management
  // ============================================

  /**
   * 워크플로우 시작
   */
  async startWorkflow(
    definition: WorkflowDefinition,
    input: unknown
  ): Promise<WorkflowInstance> {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const workflow: WorkflowInstance = {
      id: workflowId,
      definition,
      status: 'running',
      completedTasks: [],
      tasks: new Map(),
      createdAt: new Date(),
      startedAt: new Date(),
    }

    this.workflows.set(workflowId, workflow)

    this.emitEvent({
      type: 'workflow_started',
      timestamp: new Date(),
      workflowId,
    })

    // 첫 번째 작업 실행 (의존성 없는 것들)
    const startTasks = definition.tasks.filter(
      (t) => !t.dependencies || t.dependencies.length === 0
    )

    for (const taskDef of startTasks) {
      const task = await this.createTask(taskDef.type, input)
      workflow.tasks.set(taskDef.id, task)
    }

    return workflow
  }

  /**
   * 워크플로우 상태 조회
   */
  getWorkflowStatus(workflowId: string): WorkflowInstance | undefined {
    return this.workflows.get(workflowId)
  }

  /**
   * 사전 정의된 워크플로우 시작
   *
   * Scout → Matcher → Writer → Analyst 체인 등 자주 사용하는 워크플로우를 쉽게 시작
   *
   * @example
   * ```ts
   * // 완전 신청 워크플로우 시작 (Scout → Matcher → Writer → Analyst)
   * const workflow = await orchestrator.startPredefinedWorkflow('complete_application', {
   *   announcementId: 'ann-12345',
   *   companyProfile: { name: 'QETTA', ... }
   * })
   * ```
   */
  async startPredefinedWorkflow(
    name: PredefinedWorkflowName,
    input: unknown,
    options?: {
      priority?: 'critical' | 'high' | 'medium' | 'low'
      domain?: EnginePresetType
    }
  ): Promise<WorkflowInstance> {
    const original = getPredefinedWorkflow(name)

    // Deep clone to avoid mutating the shared constant
    const definition: WorkflowDefinition = {
      ...original,
      tasks: original.tasks.map((task) => ({ ...task })),
      edges: original.edges.map((edge) => ({ ...edge })),
      triggers: original.triggers?.map((trigger) => ({
        ...trigger,
        config: { ...trigger.config },
      })),
    }

    // 옵션이 제공된 경우 작업 우선순위 오버라이드
    if (options?.priority) {
      definition.tasks = definition.tasks.map((task) => ({
        ...task,
        priority: options.priority!,
      }))
    }

    // 도메인이 제공된 경우 모든 작업에 도메인 설정
    if (options?.domain) {
      definition.tasks = definition.tasks.map((task) => ({
        ...task,
        domain: options.domain,
      }))
    }

    return this.startWorkflow(definition, input)
  }

  /**
   * 사전 정의된 워크플로우 목록 조회
   */
  listAvailableWorkflows(): Array<{
    name: string
    displayName: string
    description: string
    estimatedCost: number
    estimatedDuration: number
  }> {
    return listPredefinedWorkflows()
  }

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * 예산 고려한 모델 선택
   */
  private selectModelWithBudget(preferredModel: ClaudeModelId): ClaudeModelId {
    const taskType = this.mapModelToTaskType(preferredModel)
    return selectModelWithBudget(taskType)
  }

  /**
   * 모델 ID를 작업 유형으로 매핑
   */
  private mapModelToTaskType(
    model: ClaudeModelId
  ): Parameters<typeof selectModelWithBudget>[0] {
    if (model === 'claude-opus-4-5-20251101') {
      return 'rejection_analysis'
    }
    if (model === 'claude-haiku-4-20250514') {
      return 'validation'
    }
    return 'chat'
  }

  /**
   * 우선순위 점수 계산
   */
  private getPriorityScore(
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): number {
    const scores = { critical: 100, high: 75, medium: 50, low: 25 }
    return scores[priority]
  }

  /**
   * 에이전트 비용 계산
   */
  private calculateAgentCost(agent: AgentInstance): number {
    if (!agent.tokenUsage) return 0

    const pricing = CLAUDE_PRICING[agent.config.model]
    const inputCost = (agent.tokenUsage.input / 1_000_000) * pricing.input
    const outputCost = (agent.tokenUsage.output / 1_000_000) * pricing.output
    const thinkingCost =
      agent.tokenUsage.thinking && 'extendedThinking' in pricing
        ? (agent.tokenUsage.thinking / 1_000_000) * pricing.extendedThinking
        : 0

    return inputCost + outputCost + thinkingCost
  }

  /**
   * 작업 메트릭 계산
   */
  private calculateTaskMetrics(task: TaskInstance): TaskInstance['metrics'] {
    let totalTokens = 0
    let totalCost = 0

    for (const agent of task.agents) {
      if (agent.tokenUsage) {
        totalTokens +=
          agent.tokenUsage.input +
          agent.tokenUsage.output +
          (agent.tokenUsage.thinking || 0)
      }
      if (agent.cost) {
        totalCost += agent.cost
      }
    }

    return {
      totalTokens,
      totalCost: Math.round(totalCost * 10000) / 10000,
      duration: task.completedAt
        ? task.completedAt.getTime() - (task.startedAt?.getTime() || 0)
        : 0,
    }
  }

  // ============================================
  // Event System
  // ============================================

  /**
   * 이벤트 콜백 등록
   */
  onEvent(callback: OrchestratorEventCallback): void {
    this.eventCallbacks.push(callback)
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: OrchestratorEvent): void {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event)
      } catch (error) {
        logger.error('[Orchestrator] Event callback error:', error)
      }
    }
  }

  // ============================================
  // Configuration
  // ============================================

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config }
  }
}

// ============================================
// Singleton Instance
// ============================================

let orchestratorInstance: MultiAgentOrchestrator | null = null

export function getOrchestrator(
  config?: Partial<OrchestratorConfig>
): MultiAgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new MultiAgentOrchestrator(config)
  } else if (config) {
    orchestratorInstance.updateConfig(config)
  }
  return orchestratorInstance
}

export function initOrchestrator(
  config?: Partial<OrchestratorConfig>
): MultiAgentOrchestrator {
  orchestratorInstance = new MultiAgentOrchestrator(config)
  return orchestratorInstance
}

// 기본 export
export const orchestrator = getOrchestrator()
