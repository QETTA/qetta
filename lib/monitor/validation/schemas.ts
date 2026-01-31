/**
 * Monitor Validation Schemas
 *
 * Zod schemas for validating monitor module inputs.
 * Provides type-safe validation for API requests and sensor data.
 *
 * @module lib/monitor/validation/schemas
 *
 * @example
 * ```ts
 * import { SensorDataSchema, AlertRuleSchema } from '@/lib/monitor/validation/schemas'
 *
 * // Validate sensor data
 * const result = SensorDataSchema.safeParse(input)
 * if (result.success) {
 *   // result.data is typed SensorData
 * } else {
 *   // result.error contains validation errors
 * }
 * ```
 */

import { z } from 'zod'

// =============================================================================
// Equipment ID Patterns
// =============================================================================

/**
 * Equipment ID format: eq-XXX where XXX is 3 digits
 * Examples: eq-001, eq-042, eq-999
 */
export const EquipmentIdSchema = z
  .string()
  .regex(/^eq-\d{3}$/, 'Equipment ID must match format eq-XXX (e.g., eq-001)')

/**
 * Flexible equipment ID for external systems
 * Allows alphanumeric with hyphens and underscores
 */
export const FlexibleEquipmentIdSchema = z
  .string()
  .min(1, 'Equipment ID is required')
  .max(50, 'Equipment ID must be at most 50 characters')
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
    'Equipment ID must start with alphanumeric and contain only alphanumerics, hyphens, and underscores'
  )

// =============================================================================
// Sensor Types
// =============================================================================

export const SensorTypeSchema = z.enum([
  'temperature',
  'vibration',
  'current',
  'noise',
])

export const SensorStatusSchema = z.enum(['normal', 'warning', 'critical'])

export const EquipmentStatusSchema = z.enum([
  'normal',
  'warning',
  'critical',
  'maintenance',
])

export const AlertSeveritySchema = z.enum(['info', 'warning', 'critical'])

// =============================================================================
// Sensor Data
// =============================================================================

/**
 * Individual sensor reading validation
 */
export const SensorReadingSchema = z.object({
  type: z.string().min(1).max(50),
  value: z.number().min(-1000).max(10000),
  unit: z.string().max(20),
  normalRange: z.tuple([z.number(), z.number()]),
  status: SensorStatusSchema,
  timestamp: z.string().datetime({ offset: true }).or(z.string().datetime()),
})

/**
 * Incoming sensor data from external sources
 */
export const SensorDataInputSchema = z.object({
  equipmentId: FlexibleEquipmentIdSchema,
  sensorType: SensorTypeSchema,
  value: z.number().min(-1000).max(10000),
  timestamp: z.string().datetime({ offset: true }).optional(),
})

/**
 * Batch sensor data update
 */
export const BatchSensorDataSchema = z.object({
  readings: z.array(SensorDataInputSchema).min(1).max(100),
})

// =============================================================================
// OEE Metrics
// =============================================================================

export const OEEMetricsSchema = z.object({
  availability: z.number().min(0).max(100),
  performance: z.number().min(0).max(100),
  quality: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
})

// =============================================================================
// Alert Rules
// =============================================================================

/** Comparison operators */
export const ComparisonOperatorSchema = z.enum([
  'gt',
  'gte',
  'lt',
  'lte',
  'eq',
  'neq',
])

/** Threshold condition */
export const ThresholdConditionSchema = z.object({
  type: z.literal('threshold'),
  field: z.string().min(1).max(50),
  operator: ComparisonOperatorSchema,
  value: z.number(),
})

/** Range condition */
export const RangeConditionSchema = z.object({
  type: z.literal('range'),
  field: z.string().min(1).max(50),
  min: z.number(),
  max: z.number(),
  mode: z.enum(['inside', 'outside']),
})

/** Trend condition */
export const TrendConditionSchema = z.object({
  type: z.literal('trend'),
  field: z.string().min(1).max(50),
  direction: z.enum(['increasing', 'decreasing', 'stable']),
  sampleCount: z.number().int().min(2).max(1000),
  changeThreshold: z.number().min(0).max(100),
})

/** Base condition (non-recursive) */
const BaseConditionSchema = z.discriminatedUnion('type', [
  ThresholdConditionSchema,
  RangeConditionSchema,
  TrendConditionSchema,
])

/** Composite condition (with recursion limit) */
export const AlertConditionSchema: z.ZodType<
  | z.infer<typeof ThresholdConditionSchema>
  | z.infer<typeof RangeConditionSchema>
  | z.infer<typeof TrendConditionSchema>
  | {
      type: 'composite'
      operator: 'and' | 'or'
      conditions: Array<z.infer<typeof BaseConditionSchema>>
    }
> = z.union([
  BaseConditionSchema,
  z.object({
    type: z.literal('composite'),
    operator: z.enum(['and', 'or']),
    // Limit nesting to prevent deep recursion
    conditions: z.array(BaseConditionSchema).min(1).max(10),
  }),
])

/**
 * Alert rule validation
 */
export const AlertRuleSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Rule ID must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  condition: AlertConditionSchema,
  severity: AlertSeveritySchema,
  cooldownMs: z.number().int().min(0).max(86400000), // Max 24 hours
  enabled: z.boolean().optional().default(true),
  equipmentIds: z.array(FlexibleEquipmentIdSchema).max(100).optional(),
  messageTemplate: z
    .string()
    .max(500)
    .refine(
      (val) => !val || !/<script/i.test(val),
      'Message template cannot contain script tags'
    )
    .optional(),
})

/**
 * Alert rule creation (without ID - server generates)
 */
export const CreateAlertRuleSchema = AlertRuleSchema.omit({ id: true })

/**
 * Alert rule update (all fields optional except ID)
 */
export const UpdateAlertRuleSchema = AlertRuleSchema.partial().required({ id: true })

// =============================================================================
// Equipment
// =============================================================================

/**
 * Equipment creation/update validation
 */
export const EquipmentSchema = z.object({
  id: FlexibleEquipmentIdSchema,
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  status: EquipmentStatusSchema,
  location: z.string().max(200),
  operator: z.string().max(100),
  operatorInitial: z.string().max(5),
  lastChecked: z.string().datetime().optional(),
  nextMaintenance: z.string().datetime().optional(),
})

/**
 * Equipment update (partial)
 */
export const UpdateEquipmentSchema = EquipmentSchema.partial().required({ id: true })

// =============================================================================
// Alert Actions
// =============================================================================

/**
 * Alert acknowledgment
 */
export const AcknowledgeAlertSchema = z.object({
  alertId: z.string().min(1).max(50),
  acknowledgedBy: z.string().max(100).optional(),
})

/**
 * Batch alert acknowledgment
 */
export const BatchAcknowledgeSchema = z.object({
  alertIds: z.array(z.string().min(1).max(50)).min(1).max(100),
  acknowledgedBy: z.string().max(100).optional(),
})

// =============================================================================
// API Query Parameters
// =============================================================================

/**
 * Equipment list query
 */
export const EquipmentQuerySchema = z.object({
  status: EquipmentStatusSchema.optional(),
  location: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

/**
 * Alerts query
 */
export const AlertsQuerySchema = z.object({
  equipmentId: FlexibleEquipmentIdSchema.optional(),
  severity: AlertSeveritySchema.optional(),
  acknowledged: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  since: z.string().datetime().optional(),
})

// =============================================================================
// Type Exports
// =============================================================================

export type SensorReading = z.infer<typeof SensorReadingSchema>
export type SensorDataInput = z.infer<typeof SensorDataInputSchema>
export type BatchSensorData = z.infer<typeof BatchSensorDataSchema>
export type OEEMetrics = z.infer<typeof OEEMetricsSchema>
export type AlertRule = z.infer<typeof AlertRuleSchema>
export type CreateAlertRule = z.infer<typeof CreateAlertRuleSchema>
export type UpdateAlertRule = z.infer<typeof UpdateAlertRuleSchema>
export type Equipment = z.infer<typeof EquipmentSchema>
export type UpdateEquipment = z.infer<typeof UpdateEquipmentSchema>
export type AcknowledgeAlert = z.infer<typeof AcknowledgeAlertSchema>
export type BatchAcknowledge = z.infer<typeof BatchAcknowledgeSchema>
export type EquipmentQuery = z.infer<typeof EquipmentQuerySchema>
export type AlertsQuery = z.infer<typeof AlertsQuerySchema>

// =============================================================================
// Validation Helper
// =============================================================================

/**
 * Validate and parse with friendly error messages
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })

  return { success: false, errors }
}
