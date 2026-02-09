/**
 * Commission Chart
 * Real-time line chart for commission trends using Recharts
 * 
 * @see Plan: Part D1 - Premium Landing Page Components
 * @requires npm install recharts
 */

'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface CommissionDataPoint {
  month: string
  commission: number
  conversions?: number
}

interface CommissionChartProps {
  data?: CommissionDataPoint[]
  height?: number
  showGrid?: boolean
  animate?: boolean
}

const defaultData: CommissionDataPoint[] = [
  { month: 'Jan', commission: 4200, conversions: 12 },
  { month: 'Feb', commission: 5800, conversions: 18 },
  { month: 'Mar', commission: 7100, conversions: 24 },
  { month: 'Apr', commission: 8900, conversions: 31 },
  { month: 'May', commission: 11200, conversions: 42 },
  { month: 'Jun', commission: 14500, conversions: 58 }
]

export function CommissionChart({
  data = defaultData,
  height = 320,
  showGrid = true,
  animate = true
}: CommissionChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />
          )}
          
          <XAxis
            dataKey="month"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value >= 1000 ? `${value / 1000}k` : value}`}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px'
            }}
            labelStyle={{ color: '#fafafa', fontWeight: 600, marginBottom: '4px' }}
            itemStyle={{ color: '#10b981' }}
            cursor={{ stroke: '#27272a', strokeWidth: 1 }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Commission']}
          />
          
          <Line
            type="monotone"
            dataKey="commission"
            stroke="#10b981"
            strokeWidth={3}
            dot={{
              fill: '#10b981',
              r: 5,
              strokeWidth: 2,
              stroke: '#18181b'
            }}
            activeDot={{
              r: 7,
              fill: '#10b981',
              strokeWidth: 2,
              stroke: '#18181b'
            }}
            animationDuration={animate ? 1500 : 0}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Mini Commission Chart
 * Compact version without labels for dashboard cards
 */
export function MiniCommissionChart({
  data = defaultData,
  height = 80
}: {
  data?: CommissionDataPoint[]
  height?: number
}) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="commission"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
