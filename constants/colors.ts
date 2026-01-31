export const OEE_COLORS = {
  excellent: 'rgb(34, 197, 94)', // emerald-500
  good: 'rgb(234, 179, 8)', // amber-500
  fair: 'rgb(249, 115, 22)', // orange-500
  poor: 'rgb(239, 68, 68)', // red-500
} as const

export function getOeeColor(value: number): string {
  if (value >= 85) return OEE_COLORS.excellent
  if (value >= 70) return OEE_COLORS.good
  if (value >= 50) return OEE_COLORS.fair
  return OEE_COLORS.poor
}
