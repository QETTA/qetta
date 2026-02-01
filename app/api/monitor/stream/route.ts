/**
 * Monitor SSE Streaming API
 *
 * GET /api/monitor/stream - 실시간 설비 모니터링 데이터 스트리밍
 *
 * Event Types:
 * - full-sync: 초기 전체 데이터
 * - sensor-update: 개별 센서 업데이트
 * - oee-update: OEE 메트릭 업데이트
 * - alert: 새 알림
 * - connection-status: MQTT/OPC-UA 연결 상태
 * - heartbeat: 연결 유지
 *
 * @module api/monitor/stream
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  generateMonitorData,
  generateSensors,
  generateAlerts,
  EQUIPMENT_DATA,
} from '@/lib/monitor/simulator'
import { generateOEEByStatus } from '@/lib/monitor/oee'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify({ type: event, timestamp: new Date().toISOString(), data })}\n\n`
}

export async function GET(request: NextRequest) {
  // Authentication
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval> | null = null
  let heartbeatId: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send initial full-sync
      const monitorData = generateMonitorData()
      controller.enqueue(
        encoder.encode(
          sseEvent('full-sync', {
            equipment: monitorData.equipment,
            alerts: monitorData.alerts,
            summary: monitorData.summary,
          })
        )
      )

      // Send initial connection status (simulated as connected)
      controller.enqueue(
        encoder.encode(
          sseEvent('connection-status', {
            mqtt: { state: 'connected', reconnectAttempts: 0 },
            opcua: { state: 'connected', reconnectAttempts: 0 },
          })
        )
      )

      // Periodic sensor updates (every 3 seconds)
      intervalId = setInterval(() => {
        try {
          // Pick a random equipment to update
          const eqIdx = Math.floor(Math.random() * EQUIPMENT_DATA.length)
          const eq = EQUIPMENT_DATA[eqIdx]
          const sensors = generateSensors(eq.status)

          controller.enqueue(
            encoder.encode(
              sseEvent('sensor-update', {
                equipmentId: eq.id,
                sensors,
              })
            )
          )

          // Occasionally send OEE updates (every ~3rd tick)
          if (Math.random() < 0.33) {
            const oee = generateOEEByStatus(eq.status)
            controller.enqueue(
              encoder.encode(
                sseEvent('oee-update', {
                  equipmentId: eq.id,
                  oee,
                })
              )
            )
          }

          // Rarely send alerts (every ~10th tick, only for non-normal equipment)
          if (Math.random() < 0.1 && eq.status !== 'normal') {
            const alerts = generateAlerts([
              {
                ...eq,
                sensors,
                oee: generateOEEByStatus(eq.status),
                alertCount: 0,
                lastChecked: new Date().toISOString(),
                nextMaintenance: new Date().toISOString(),
              },
            ])
            if (alerts.length > 0) {
              controller.enqueue(
                encoder.encode(sseEvent('alert', alerts[0]))
              )
            }
          }
        } catch {
          // Stream may be closed
        }
      }, 3000)

      // Heartbeat every 15 seconds
      heartbeatId = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(sseEvent('heartbeat', null))
          )
        } catch {
          // Stream may be closed
        }
      }, 15000)

      // Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        if (intervalId) clearInterval(intervalId)
        if (heartbeatId) clearInterval(heartbeatId)
        controller.close()
      })
    },
    cancel() {
      if (intervalId) clearInterval(intervalId)
      if (heartbeatId) clearInterval(heartbeatId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
