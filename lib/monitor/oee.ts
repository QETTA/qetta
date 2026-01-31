/**
 * OEE (Overall Equipment Effectiveness) Calculator
 *
 * OEE = Availability × Performance × Quality
 *
 * @module lib/monitor/oee
 *
 * @example
 * ```ts
 * const oee = calculateOEE(95, 90, 99)
 * // { availability: 95, performance: 90, quality: 99, overall: 84.6 }
 * ```
 */

import type { OEEMetrics, EquipmentStatus } from '@/types/monitor'

// =============================================================================
// Types
// =============================================================================

export interface OEEThresholds {
  /** World Class OEE 기준 */
  worldClass: number
  /** 양호 기준 */
  good: number
  /** 보통 기준 */
  acceptable: number
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_THRESHOLDS: OEEThresholds = {
  worldClass: 85, // World Class OEE
  good: 75,
  acceptable: 60,
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * OEE 계산 (백분율 입력)
 *
 * @param availability - 가용성 (0-100)
 * @param performance - 성능 (0-100)
 * @param quality - 품질 (0-100)
 * @returns OEE 지표
 */
export function calculateOEE(
  availability: number,
  performance: number,
  quality: number
): OEEMetrics {
  // 입력값 정규화 (0-100 범위 보장)
  const normalizedAvailability = Math.max(0, Math.min(100, availability))
  const normalizedPerformance = Math.max(0, Math.min(100, performance))
  const normalizedQuality = Math.max(0, Math.min(100, quality))

  // OEE = A × P × Q (각각 백분율이므로 10000으로 나눔)
  const overall =
    (normalizedAvailability * normalizedPerformance * normalizedQuality) / 10000

  return {
    availability: Math.round(normalizedAvailability * 10) / 10,
    performance: Math.round(normalizedPerformance * 10) / 10,
    quality: Math.round(normalizedQuality * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  }
}

/**
 * OEE 등급 판정
 *
 * @param oee - OEE 전체 값 (%)
 * @param thresholds - 기준값 (optional)
 * @returns 등급 문자열
 */
export function getOEEGrade(
  oee: number,
  thresholds: OEEThresholds = DEFAULT_THRESHOLDS
): 'world-class' | 'good' | 'acceptable' | 'low' {
  if (oee >= thresholds.worldClass) return 'world-class'
  if (oee >= thresholds.good) return 'good'
  if (oee >= thresholds.acceptable) return 'acceptable'
  return 'low'
}

/**
 * OEE 상태 색상 반환 (Tailwind 클래스)
 *
 * @param oee - OEE 전체 값 (%)
 * @returns Tailwind 색상 클래스
 */
export function getOEEColor(oee: number): string {
  const grade = getOEEGrade(oee)

  switch (grade) {
    case 'world-class':
      return 'text-emerald-400'
    case 'good':
      return 'text-blue-400'
    case 'acceptable':
      return 'text-amber-400'
    case 'low':
      return 'text-red-400'
  }
}

/**
 * OEE 배경 색상 반환 (Tailwind 클래스, 대시보드 다크 테마용)
 *
 * @param oee - OEE 전체 값 (%)
 * @returns Tailwind 배경 색상 클래스
 */
export function getOEEBgColor(oee: number): string {
  const grade = getOEEGrade(oee)

  switch (grade) {
    case 'world-class':
      return 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
    case 'good':
      return 'bg-blue-500/10 ring-1 ring-blue-500/20'
    case 'acceptable':
      return 'bg-amber-500/10 ring-1 ring-amber-500/20'
    case 'low':
      return 'bg-red-500/10 ring-1 ring-red-500/20'
  }
}

// =============================================================================
// Status-Based OEE Generation (시뮬레이터용)
// =============================================================================

/**
 * 설비 상태에 따른 OEE 생성 (시뮬레이터용)
 *
 * @param status - 설비 상태
 * @returns OEE 지표
 */
export function generateOEEByStatus(status: EquipmentStatus): OEEMetrics {
  // 상태별 기본 OEE 값
  const baseValues: Record<EquipmentStatus, { a: number; p: number; q: number }> = {
    normal: { a: 92, p: 90, q: 98 },
    warning: { a: 82, p: 80, q: 96 },
    critical: { a: 65, p: 60, q: 92 },
    maintenance: { a: 0, p: 0, q: 100 },
  }

  const base = baseValues[status]

  // 약간의 랜덤 변동 추가 (maintenance 제외)
  if (status === 'maintenance') {
    return calculateOEE(0, 0, 100)
  }

  const availability = base.a + (Math.random() - 0.5) * 6
  const performance = base.p + (Math.random() - 0.5) * 6
  const quality = base.q + (Math.random() - 0.5) * 2

  return calculateOEE(availability, performance, quality)
}

// =============================================================================
// OEE Analysis Helpers
// =============================================================================

/**
 * OEE 병목 요소 분석
 *
 * @param oee - OEE 지표
 * @returns 가장 낮은 요소
 */
export function findOEEBottleneck(
  oee: OEEMetrics
): 'availability' | 'performance' | 'quality' {
  const { availability, performance, quality } = oee

  if (availability <= performance && availability <= quality) {
    return 'availability'
  }
  if (performance <= availability && performance <= quality) {
    return 'performance'
  }
  return 'quality'
}

