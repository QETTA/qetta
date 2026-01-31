/**
 * QETTA Multi-Agent Orchestrator Module
 *
 * Claude 기반 멀티에이전트 오케스트레이션 시스템
 *
 * Scout → Matcher → Writer → Analyst 에이전트 체인 지원
 *
 * @example
 * ```ts
 * import {
 *   orchestrator,
 *   getOrchestrator,
 *   PREDEFINED_WORKFLOWS,
 *   listPredefinedWorkflows
 * } from '@/lib/skill-engine/orchestrator'
 *
 * // 단일 작업 실행
 * const task = await orchestrator.createTask('generate_document', {
 *   domain: 'ENVIRONMENT',
 *   template: 'daily_report',
 *   data: {...}
 * })
 *
 * // 사전 정의된 워크플로우 실행 (Scout → Matcher → Writer → Analyst)
 * const workflow = await orchestrator.startPredefinedWorkflow('complete_application', {
 *   announcementId: 'ann-12345',
 *   companyProfile: { name: 'QETTA', ... }
 * })
 *
 * // 사용 가능한 워크플로우 목록 확인
 * const workflows = orchestrator.listAvailableWorkflows()
 * console.log(workflows) // ['complete_application', 'quick_document', ...]
 *
 * // 큐 상태 확인
 * const queueStatus = orchestrator.getQueueStatus()
 *
 * // 이벤트 구독
 * orchestrator.onEvent((event) => {
 *   console.log(`[${event.type}]`, event)
 * })
 * ```
 */

// Re-export from config
export {
  AGENT_CONFIGS,
  TASK_DEFINITIONS,
  PREDEFINED_WORKFLOWS,
} from './config'
export type { PredefinedWorkflowName } from './config'

// Re-export from workflows
export { getPredefinedWorkflow, listPredefinedWorkflows } from './workflows'

// Re-export from orchestrator
export {
  MultiAgentOrchestrator,
  getOrchestrator,
  initOrchestrator,
  orchestrator,
} from './orchestrator'

// Re-export types
export type {
  AgentType,
  AgentConfig,
  AgentInstance,
  AgentStatus,
  TaskType,
  TaskDefinition,
  TaskInstance,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowEdge,
  WorkflowTrigger,
  QueueItem,
  QueueStatus,
  OrchestratorEvent,
  OrchestratorEventCallback,
  OrchestratorConfig,
} from './types'

export { DEFAULT_ORCHESTRATOR_CONFIG } from './types'
