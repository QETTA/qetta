import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { DashboardSkeleton } from '@/components/dashboard/skeleton'

const QettaDashboardPage = dynamic(
  () => import('@/components/dashboard/page').then(mod => ({ default: mod.QettaDashboardPage })),
  { loading: () => <DashboardSkeleton /> }
)

export const metadata: Metadata = {
  title: 'MONITOR - Real-time Monitoring',
  description: 'QETTA MONITOR - IoT sensor-based real-time equipment monitoring. TMS, smart factory integration.',
  keywords: ['real-time monitoring', 'TMS', 'equipment control', 'sensor data', 'OPC-UA'],
}

export default function MonitorPage() {
  return <QettaDashboardPage initialTab="MONITOR" />
}
