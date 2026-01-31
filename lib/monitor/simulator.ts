/**
 * Sensor Data Simulator
 *
 * 개발/데모용 실시간 센서 데이터 생성기
 * 프로덕션에서는 실제 IoT/MQTT/OPC-UA로 교체
 *
 * @module lib/monitor/simulator
 */

import type {
  Equipment,
  EquipmentStatus,
  SensorReading,
  Alert,
  AgentAnalysis,
} from '@/types/monitor'
import { generateOEEByStatus } from './oee'
// Re-export getSensorStatus from shared module for backward compatibility
export { getSensorStatus } from './sensor-utils'
import { getSensorStatus } from './sensor-utils'

// =============================================================================
// Constants
// =============================================================================

export const EQUIPMENT_DATA: Omit<Equipment, 'sensors' | 'oee' | 'alertCount'>[] = [
  {
    id: 'eq-001',
    name: 'CNC 가공기 #1',
    code: 'CNC-A1-001',
    status: 'warning',
    location: 'A동 1층',
    operator: '김현수',
    operatorInitial: 'H',
    lastChecked: '',
    nextMaintenance: '',
  },
  {
    id: 'eq-002',
    name: '프레스 #2',
    code: 'PRS-A1-002',
    status: 'normal',
    location: 'A동 1층',
    operator: '이승재',
    operatorInitial: 'S',
    lastChecked: '',
    nextMaintenance: '',
  },
  {
    id: 'eq-003',
    name: '용접 로봇 #1',
    code: 'WLD-B1-001',
    status: 'normal',
    location: 'B동 1층',
    operator: '박준호',
    operatorInitial: 'J',
    lastChecked: '',
    nextMaintenance: '',
  },
  {
    id: 'eq-004',
    name: '사출기 #3',
    code: 'INJ-B2-003',
    status: 'critical',
    location: 'B동 2층',
    operator: '최민지',
    operatorInitial: 'M',
    lastChecked: '',
    nextMaintenance: '',
  },
  {
    id: 'eq-005',
    name: '컨베이어 #1',
    code: 'CNV-C1-001',
    status: 'normal',
    location: 'C동 1층',
    operator: '정다은',
    operatorInitial: 'D',
    lastChecked: '',
    nextMaintenance: '',
  },
  {
    id: 'eq-006',
    name: '포장기 #2',
    code: 'PKG-C1-002',
    status: 'maintenance',
    location: 'C동 1층',
    operator: '윤서연',
    operatorInitial: 'S',
    lastChecked: '',
    nextMaintenance: '',
  },
]

// =============================================================================
// Sensor Generation
// =============================================================================

/**
 * 상태에 따른 진동 값 생성
 */
function generateVibration(status: EquipmentStatus): number {
  switch (status) {
    case 'critical':
      return 8.5 + Math.random() * 2
    case 'warning':
      return 5.5 + Math.random() * 1.5
    case 'maintenance':
      return 0
    default:
      return 2 + Math.random() * 2.5
  }
}

/**
 * 상태에 따른 온도 값 생성
 */
function generateTemperature(status: EquipmentStatus): number {
  switch (status) {
    case 'critical':
      return 85 + Math.random() * 10
    case 'warning':
      return 70 + Math.random() * 10
    case 'maintenance':
      return 25
    default:
      return 45 + Math.random() * 20
  }
}

/**
 * 상태에 따른 전류 값 생성
 */
function generateCurrent(status: EquipmentStatus): number {
  if (status === 'maintenance') return 0
  return 10 + Math.random() * 5
}

/**
 * 상태에 따른 소음 값 생성
 */
function generateNoise(status: EquipmentStatus): number {
  if (status === 'maintenance') return 40
  return 60 + Math.random() * 15
}

/**
 * 센서 데이터 생성
 */
export function generateSensors(status: EquipmentStatus): SensorReading[] {
  const now = new Date().toISOString()

  const vibrationValue = generateVibration(status)
  const tempValue = generateTemperature(status)
  const currentValue = generateCurrent(status)
  const noiseValue = generateNoise(status)

  return [
    {
      type: '진동',
      value: Math.round(vibrationValue * 10) / 10,
      unit: 'mm/s',
      normalRange: [0, 5] as [number, number],
      status: getSensorStatus(vibrationValue, [0, 5]),
      timestamp: now,
    },
    {
      type: '온도',
      value: Math.round(tempValue * 10) / 10,
      unit: '°C',
      normalRange: [20, 70] as [number, number],
      status: getSensorStatus(tempValue, [20, 70]),
      timestamp: now,
    },
    {
      type: '전류',
      value: Math.round(currentValue * 10) / 10,
      unit: 'A',
      normalRange: [8, 16] as [number, number],
      status: getSensorStatus(currentValue, [8, 16]),
      timestamp: now,
    },
    {
      type: '소음',
      value: Math.round(noiseValue * 10) / 10,
      unit: 'dB',
      normalRange: [50, 80] as [number, number],
      status: getSensorStatus(noiseValue, [50, 80]),
      timestamp: now,
    },
  ]
}

// =============================================================================
// Equipment Generation
// =============================================================================

/**
 * 전체 설비 데이터 생성
 */
export function generateEquipmentData(): Equipment[] {
  const now = new Date()

  return EQUIPMENT_DATA.map((eq, index) => {
    const sensors = generateSensors(eq.status)
    const oee = generateOEEByStatus(eq.status)

    // 시간 설정
    const hoursAgo = [2, 1, 0.5, 4, 0.75, 6][index] || 1
    const daysUntil = [7, 14, 21, 1, 30, -1][index] || 7

    const lastChecked = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString()
    const nextMaintenance = new Date(
      now.getTime() + daysUntil * 24 * 60 * 60 * 1000
    ).toISOString()

    const alertCount =
      eq.status === 'critical' ? 3 : eq.status === 'warning' ? 1 : 0

    return {
      ...eq,
      lastChecked,
      nextMaintenance,
      sensors,
      oee,
      alertCount,
    }
  })
}

/**
 * 특정 설비 센서 업데이트 (실시간 시뮬레이션용)
 */
export function updateEquipmentSensors(equipment: Equipment): Equipment {
  return {
    ...equipment,
    sensors: generateSensors(equipment.status),
    oee: generateOEEByStatus(equipment.status),
  }
}

// =============================================================================
// Alert Generation
// =============================================================================

/**
 * 알림 데이터 생성
 */
export function generateAlerts(equipment: Equipment[]): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()

  equipment.forEach((eq) => {
    if (eq.status === 'critical') {
      alerts.push({
        id: `alert-${eq.id}-1`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        severity: 'critical',
        message: `진동 수치 이상 감지 (${eq.sensors[0]?.value}mm/s)`,
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        acknowledged: false,
      })
      alerts.push({
        id: `alert-${eq.id}-2`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        severity: 'critical',
        message: `온도 임계치 초과 (${eq.sensors[1]?.value}°C)`,
        timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
        acknowledged: false,
      })
    }

    if (eq.status === 'warning') {
      alerts.push({
        id: `alert-${eq.id}-1`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        severity: 'warning',
        message: `진동 수치 주의 필요 (${eq.sensors[0]?.value}mm/s)`,
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        acknowledged: true,
      })
    }

    if (eq.status === 'maintenance') {
      alerts.push({
        id: `alert-${eq.id}-1`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        severity: 'info',
        message: '정기 점검 진행 중',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
      })
    }
  })

  return alerts.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

// =============================================================================
// Agent Analysis Generation
// =============================================================================

/**
 * AI 에이전트 분석 생성
 */
export function generateAgentAnalysis(equipment: Equipment[]): AgentAnalysis {
  const criticalEquipment = equipment.find((eq) => eq.status === 'critical')
  const warningEquipment = equipment.find((eq) => eq.status === 'warning')
  const targetEquipment = criticalEquipment || warningEquipment || equipment[0]

  const messages = [
    `${targetEquipment.name} 설비 분석을 시작합니다.`,
    `현재 상태: ${targetEquipment.status === 'critical' ? '위험' : targetEquipment.status === 'warning' ? '주의' : '정상'}`,
  ]

  const recommendations: string[] = []

  if (criticalEquipment) {
    messages.push(
      `[위험] 베어링 마모로 인한 진동 증가 패턴이 감지되었습니다.`,
      `최근 24시간 진동 데이터 분석 결과, 2.3mm/s → ${criticalEquipment.sensors[0]?.value}mm/s로 급격히 상승했습니다.`,
      `온도 상승 추이와의 상관관계를 분석한 결과, 베어링 과열 가능성이 높습니다.`,
      `유사 설비 고장 이력 3건을 참조했습니다.`,
      `예상 고장 시점: 48시간 이내 (신뢰도 87%)`,
      `OEE 영향 분석: 가용성 ${criticalEquipment.oee.availability}% → 예상 0%`
    )
    recommendations.push(
      '1. 즉시 설비 가동 중단 권고',
      '2. 베어링 교체 작업 발주 (예상 소요: 4시간)',
      '3. 윤활유 상태 점검 필요',
      '4. 진동 센서 캘리브레이션 확인'
    )
  } else if (warningEquipment) {
    messages.push(
      `[주의] 진동 수치가 정상 범위를 초과하고 있습니다.`,
      `현재 진동: ${warningEquipment.sensors[0]?.value}mm/s (정상: 0-5mm/s)`,
      `추이 분석 결과, 점진적 상승 패턴이 관찰됩니다.`,
      `예방 정비 시점 권고: 7일 이내`
    )
    recommendations.push(
      '1. 축 정렬 상태 점검 및 필요시 재정렬',
      '2. 진동 데이터 추이 분석 결과 첨부',
      '3. 다음 정기점검 시 베어링 상태 확인'
    )
  } else {
    const avgOee = Math.round(
      equipment.reduce((acc, eq) => acc + eq.oee.overall, 0) / equipment.length
    )
    messages.push(
      `모든 설비가 정상 운영 중입니다.`,
      `평균 OEE: ${avgOee}%`,
      `다음 예정 정비: ${equipment[0].name} (${new Date(equipment[0].nextMaintenance).toLocaleDateString('ko-KR')})`
    )
    recommendations.push('1. 현재 운영 상태 유지', '2. 정기 점검 일정 확인')
  }

  return {
    id: `analysis-${Date.now()}`,
    equipmentId: targetEquipment.id,
    messages,
    recommendations,
    analyzedAt: new Date().toISOString(),
    confidence: criticalEquipment ? 87 : warningEquipment ? 92 : 98,
  }
}

// =============================================================================
// Full Data Generation
// =============================================================================

/**
 * 전체 모니터링 데이터 생성
 */
export function generateMonitorData() {
  const equipment = generateEquipmentData()
  const alerts = generateAlerts(equipment)
  const agentAnalysis = generateAgentAnalysis(equipment)

  const criticalCount = equipment.filter((eq) => eq.status === 'critical').length
  const warningCount = equipment.filter((eq) => eq.status === 'warning').length
  const maintenanceCount = equipment.filter((eq) => eq.status === 'maintenance').length
  const operationalCount = equipment.filter((eq) => eq.status === 'normal').length

  const summary = {
    totalEquipment: equipment.length,
    operational: operationalCount,
    maintenance: maintenanceCount,
    offline: 0, // No offline status in current data
    error: criticalCount, // Map critical to error
    avgOEE: Math.round(
      equipment.reduce((acc, eq) => acc + eq.oee.overall, 0) / equipment.length
    ),
    activeAlerts: alerts.filter((alert) => !alert.acknowledged).length,
    critical: criticalCount,
    warning: warningCount,
  }

  return {
    equipment,
    alerts,
    agentAnalysis,
    summary,
  }
}
