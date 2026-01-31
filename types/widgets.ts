/**
 * Dashboard Widget System Types
 *
 * Phase 1: Interactive Customizable Dashboards
 * Supports drag-and-drop, resize, minimize/maximize
 */

// ============================================
// Widget Types
// ============================================

export type WidgetType = 'stats' | 'chart' | 'list' | 'timeline' | 'calendar' | 'gauge'

export type WidgetSize = 'small' | 'medium' | 'large' | 'xl'

export interface WidgetPosition {
  x: number
  y: number
  w: number  // width in grid units
  h: number  // height in grid units
}

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  size: WidgetSize
  position: WidgetPosition
  data?: StatsWidgetData | ChartWidgetData | ListWidgetData | TimelineWidgetData | GaugeWidgetData
  minimized?: boolean
  refreshInterval?: number  // milliseconds
  lastUpdated?: string
}

// ============================================
// Widget Data Types
// ============================================

export interface StatsWidgetData {
  metric: string
  value: string | number
  change?: number  // percentage
  trend?: 'up' | 'down' | 'neutral'
  unit?: string
}

export interface ChartWidgetData {
  chartType: 'line' | 'bar' | 'radar' | 'pie'
  data: Array<{
    label: string
    value: number
    [key: string]: string | number | boolean | undefined
  }>
}

export interface ListWidgetData {
  items: Array<{
    id: string
    title: string
    subtitle?: string
    badge?: string
    badgeColor?: string
  }>
}

export interface TimelineWidgetData {
  events: Array<{
    id: string
    title: string
    time: string
    type: 'created' | 'updated' | 'verified' | 'submitted'
  }>
}

export interface GaugeWidgetData {
  value: number
  max: number
  label: string
  unit: string
  thresholds?: {
    warning: number
    critical: number
  }
}

// ============================================
// Layout Types
// ============================================

export interface DashboardLayout {
  id: string
  name: string
  widgets: DashboardWidget[]
  createdAt: string
  updatedAt: string
  isDefault?: boolean
}

export interface LayoutPreset {
  id: string
  name: string
  description: string
  thumbnail?: string
  widgets: Omit<DashboardWidget, 'id'>[]
  forRole?: 'admin' | 'operator' | 'analyst' | 'viewer'
}

// ============================================
// Widget Catalog
// ============================================

export interface WidgetTemplate {
  type: WidgetType
  title: string
  description: string
  icon: string
  defaultSize: WidgetSize
  defaultPosition: WidgetPosition
  availableSizes: WidgetSize[]
  previewImage?: string
}

export const WIDGET_CATALOG: WidgetTemplate[] = [
  {
    type: 'stats',
    title: 'Stat Card',
    description: 'Display a single metric with trend',
    icon: 'chart-bar',
    defaultSize: 'small',
    defaultPosition: { x: 0, y: 0, w: 2, h: 1 },
    availableSizes: ['small', 'medium'],
  },
  {
    type: 'chart',
    title: 'Chart',
    description: 'Visualize data with various chart types',
    icon: 'chart-line',
    defaultSize: 'medium',
    defaultPosition: { x: 0, y: 0, w: 4, h: 3 },
    availableSizes: ['medium', 'large', 'xl'],
  },
  {
    type: 'list',
    title: 'Item List',
    description: 'Show a list of documents or tasks',
    icon: 'list',
    defaultSize: 'medium',
    defaultPosition: { x: 0, y: 0, w: 3, h: 4 },
    availableSizes: ['medium', 'large'],
  },
  {
    type: 'timeline',
    title: 'Timeline',
    description: 'Recent activity and events',
    icon: 'clock',
    defaultSize: 'medium',
    defaultPosition: { x: 0, y: 0, w: 3, h: 4 },
    availableSizes: ['medium', 'large'],
  },
  {
    type: 'gauge',
    title: 'OEE Gauge',
    description: 'Real-time equipment effectiveness',
    icon: 'gauge',
    defaultSize: 'medium',
    defaultPosition: { x: 0, y: 0, w: 2, h: 2 },
    availableSizes: ['small', 'medium'],
  },
]

// ============================================
// Layout Presets
// ============================================

// Import metrics for layout preset data
import { DISPLAY_METRICS } from '@/constants/metrics'

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    name: 'Default Dashboard',
    description: 'Balanced view with stats, charts, and recent activity',
    forRole: undefined,
    widgets: [
      {
        type: 'stats',
        title: 'Time Reduction',
        size: 'small',
        position: { x: 0, y: 0, w: 2, h: 1 },
        data: { metric: 'Time Reduction', value: DISPLAY_METRICS.timeSaved.value, trend: 'up' },
      },
      {
        type: 'stats',
        title: 'Rejection Rate',
        size: 'small',
        position: { x: 2, y: 0, w: 2, h: 1 },
        data: { metric: 'Rejection Reduction', value: DISPLAY_METRICS.rejectionReduction.value, trend: 'up' },
      },
      {
        type: 'chart',
        title: 'Domain Match Analysis',
        size: 'medium',
        position: { x: 0, y: 1, w: 4, h: 3 },
      },
      {
        type: 'timeline',
        title: 'Recent Activity',
        size: 'medium',
        position: { x: 4, y: 0, w: 3, h: 4 },
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics Focus',
    description: 'Chart-heavy layout for data analysis',
    forRole: 'analyst',
    widgets: [
      {
        type: 'chart',
        title: 'Domain Distribution',
        size: 'large',
        position: { x: 0, y: 0, w: 6, h: 4 },
      },
      {
        type: 'chart',
        title: 'Monthly Trends',
        size: 'medium',
        position: { x: 6, y: 0, w: 4, h: 4 },
      },
      {
        type: 'stats',
        title: 'Total Documents',
        size: 'small',
        position: { x: 0, y: 4, w: 2, h: 1 },
      },
      {
        type: 'stats',
        title: 'API Uptime',
        size: 'small',
        position: { x: 2, y: 4, w: 2, h: 1 },
      },
    ],
  },
  {
    id: 'monitor',
    name: 'Monitoring Dashboard',
    description: 'Real-time equipment monitoring',
    forRole: 'operator',
    widgets: [
      {
        type: 'gauge',
        title: 'OEE - Equipment 1',
        size: 'medium',
        position: { x: 0, y: 0, w: 2, h: 2 },
      },
      {
        type: 'gauge',
        title: 'OEE - Equipment 2',
        size: 'medium',
        position: { x: 2, y: 0, w: 2, h: 2 },
      },
      {
        type: 'gauge',
        title: 'OEE - Equipment 3',
        size: 'medium',
        position: { x: 4, y: 0, w: 2, h: 2 },
      },
      {
        type: 'list',
        title: 'Alerts & Warnings',
        size: 'large',
        position: { x: 6, y: 0, w: 4, h: 4 },
      },
      {
        type: 'timeline',
        title: 'Equipment Events',
        size: 'medium',
        position: { x: 0, y: 2, w: 6, h: 3 },
      },
    ],
  },
]
