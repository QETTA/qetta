/**
 * Alert Rule Engine
 *
 * Declarative rule system for monitoring alerts.
 *
 * @module lib/monitor/alerts
 */

export {
  createAlertRuleEngine,
  sensorReadingsToRecord,
  DEFAULT_SMART_FACTORY_RULES,
  type AlertRuleEngine,
  type AlertRule,
  type AlertCondition,
  type ThresholdCondition,
  type RangeCondition,
  type TrendCondition,
  type CompositeCondition,
  type TriggeredAlert,
  type ComparisonOperator,
  type LogicalOperator,
  type TrendDirection,
  type DataPoint,
} from './rules'
