/**
 * Monitor Types
 *
 * Centralized type definitions for equipment monitoring and sensor data
 *
 * @module types/monitor
 */

// =============================================================================
// Equipment Status
// =============================================================================

export type EquipmentStatus = 'normal' | 'warning' | 'critical' | 'maintenance'

export type SensorStatus = 'normal' | 'warning' | 'critical'

export type AlertSeverity = 'info' | 'warning' | 'critical'

// =============================================================================
// Sensor Types
// =============================================================================

export type SensorType = 'vibration' | 'temperature' | 'current' | 'noise'

export interface SensorConfig {
  /** 센서 유형 */
  type: SensorType
  /** 표시명 (한글) */
  label: string
  /** 단위 */
  unit: string
  /** 정상 범위 [min, max] */
  normalRange: [number, number]
  /** 값 생성 함수 (시뮬레이터용) */
  generateValue?: (status: EquipmentStatus) => number
}

export const SENSOR_CONFIGS: Record<SensorType, SensorConfig> = {
  vibration: {
    type: 'vibration',
    label: '진동',
    unit: 'mm/s',
    normalRange: [0, 5],
  },
  temperature: {
    type: 'temperature',
    label: '온도',
    unit: '°C',
    normalRange: [20, 70],
  },
  current: {
    type: 'current',
    label: '전류',
    unit: 'A',
    normalRange: [8, 16],
  },
  noise: {
    type: 'noise',
    label: '소음',
    unit: 'dB',
    normalRange: [50, 80],
  },
}

// =============================================================================
// Sensor Reading
// =============================================================================

export interface SensorReading {
  /** 센서 유형 */
  type: string
  /** 측정값 */
  value: number
  /** 단위 */
  unit: string
  /** 정상 범위 (min, max) */
  normalRange: [number, number]
  /** 상태 */
  status: SensorStatus
  /** 마지막 업데이트 */
  timestamp: string
}

// =============================================================================
// OEE (Overall Equipment Effectiveness)
// =============================================================================

export interface OEEMetrics {
  /** 가용성 (%) */
  availability: number
  /** 성능 (%) */
  performance: number
  /** 품질 (%) */
  quality: number
  /** 종합 OEE (%) */
  overall: number
}

// =============================================================================
// Equipment
// =============================================================================

export interface Equipment {
  /** 설비 ID */
  id: string
  /** 설비명 */
  name: string
  /** 설비 코드 */
  code: string
  /** 상태 */
  status: EquipmentStatus
  /** 위치 */
  location: string
  /** 담당자 */
  operator: string
  /** 담당자 이니셜 */
  operatorInitial: string
  /** 마지막 점검 시각 */
  lastChecked: string
  /** 다음 점검 예정 */
  nextMaintenance: string
  /** 센서 데이터 */
  sensors: SensorReading[]
  /** OEE 지표 */
  oee: OEEMetrics
  /** 알림 수 */
  alertCount: number
}

// =============================================================================
// Alert
// =============================================================================

export interface Alert {
  /** 알림 ID */
  id: string
  /** 설비 ID */
  equipmentId: string
  /** 설비명 */
  equipmentName: string
  /** 심각도 */
  severity: AlertSeverity
  /** 메시지 */
  message: string
  /** 발생 시각 */
  timestamp: string
  /** 확인 여부 */
  acknowledged: boolean
}

// =============================================================================
// Agent Analysis
// =============================================================================

export interface AgentAnalysis {
  /** 분석 ID */
  id: string
  /** 설비 ID */
  equipmentId: string
  /** 분석 메시지 목록 */
  messages: string[]
  /** 권장 조치 */
  recommendations: string[]
  /** 분석 시각 */
  analyzedAt: string
  /** 신뢰도 (%) */
  confidence: number
}

// =============================================================================
// API Response Types
// =============================================================================

export interface MonitorSummary {
  total: number
  normal: number
  warning: number
  critical: number
  maintenance: number
  averageOee: number
}

export interface MonitorData {
  equipment: Equipment[]
  alerts: Alert[]
  agentAnalysis: AgentAnalysis
  summary: MonitorSummary
}

export interface MonitorResponse {
  success: boolean
  data?: MonitorData
  error?: {
    code: string
    message: string
  }
}

// =============================================================================
// SSE Event Types
// =============================================================================

export type MonitorEventType =
  | 'sensor-update'
  | 'status-change'
  | 'alert'
  | 'oee-update'
  | 'full-sync'

export interface MonitorEvent {
  type: MonitorEventType
  timestamp: string
  data: SensorUpdateData | StatusChangeData | AlertData | OEEUpdateData | MonitorData
}

export interface SensorUpdateData {
  equipmentId: string
  sensors: SensorReading[]
}

export interface StatusChangeData {
  equipmentId: string
  previousStatus: EquipmentStatus
  newStatus: EquipmentStatus
  reason?: string
}

export interface AlertData {
  alert: Alert
  action: 'created' | 'acknowledged' | 'resolved'
}

export interface OEEUpdateData {
  equipmentId: string
  oee: OEEMetrics
}
