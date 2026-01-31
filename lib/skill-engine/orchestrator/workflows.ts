/**
 * QETTA Multi-Agent Orchestrator Workflow Utilities
 *
 * 사전 정의된 워크플로우 조회 및 목록 유틸리티
 *
 * @see docs/plans/2026-01-22-claude-ecosystem-integration.md
 */

import type { WorkflowDefinition } from './types'
import { PREDEFINED_WORKFLOWS, type PredefinedWorkflowName } from './config'

/**
 * 사전 정의된 워크플로우 조회
 *
 * @param name 워크플로우 이름
 * @returns 워크플로우 정의
 *
 * @example
 * ```ts
 * const workflow = getPredefinedWorkflow('complete_application')
 * console.log(workflow.name) // '완전 신청 워크플로우'
 * ```
 */
export function getPredefinedWorkflow(name: PredefinedWorkflowName): WorkflowDefinition {
  return PREDEFINED_WORKFLOWS[name]
}

/**
 * 모든 사전 정의된 워크플로우 목록 조회
 *
 * @returns 워크플로우 목록 (이름, 설명, 예상 비용/시간)
 *
 * @example
 * ```ts
 * const workflows = listPredefinedWorkflows()
 * workflows.forEach(wf => {
 *   console.log(`${wf.displayName}: $${wf.estimatedCost.toFixed(2)}`)
 * })
 * ```
 */
export function listPredefinedWorkflows(): Array<{
  name: string
  displayName: string
  description: string
  estimatedCost: number
  estimatedDuration: number
}> {
  return Object.entries(PREDEFINED_WORKFLOWS).map(([name, workflow]) => ({
    name,
    displayName: workflow.name,
    description: workflow.description,
    estimatedCost: workflow.tasks.reduce((sum, t) => sum + t.estimatedCost, 0),
    estimatedDuration: workflow.tasks.reduce((sum, t) => sum + t.estimatedDuration, 0),
  }))
}
