/**
 * QETTA Widget v2.0
 *
 * 임베드 가능한 AI 문서 생성 위젯
 *
 * @module widget
 */

// Main components
export { WizardContainer, WizardModal } from './wizard/WizardContainer'

// Wizard steps
export { StepIndicator } from './wizard/StepIndicator'
export { StepDataSource } from './wizard/StepDataSource'
export { StepValidation } from './wizard/StepValidation'
export { StepGeneration } from './wizard/StepGeneration'
export { StepComplete } from './wizard/StepComplete'

// Progress components
export { ProgressTimeline } from './progress/ProgressTimeline'
export { TimeSavedCounter, TimeComparison } from './progress/TimeSavedCounter'

// Stores
export { useWizardStore, useProgressStore, useThemeStore } from './store'

// Types
export type {
  WidgetDocumentType,
  WidgetDocumentStatus,
  WizardStep,
  WizardState,
  ProgressPhase,
  ProgressState,
  GeneratedWidgetDocument,
  PartnerConfig,
  EmbedConfig,
  FieldDefinition,
  DocumentTemplate,
} from './types'

export { WIDGET_TEMPLATES } from './types'
