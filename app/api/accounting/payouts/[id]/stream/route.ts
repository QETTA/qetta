/**
 * Real-time Payout Tracking via SSE
 * GET /api/accounting/payouts/[id]/stream - Subscribe to payout status updates
 *
 * Uses Redis Pub/Sub for real-time updates
 * @see Plan: Part A3 - Real-time Features
 */

import { NextRequest } from 'next/server'
import { getPayout } from '@/lib/accounting/payout-service'
import { createClient } from 'redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const payoutId = params.id

  // Verify payout exists
  try {
    await getPayout(payoutId)
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Payout not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Create Redis subscriber
      const subscriber = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      })

      await subscriber.connect()

      const channel = `payout:${payoutId}:status`
      
      // Subscribe to payout status updates
      await subscriber.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message)
          const sseData = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(sseData))
        } catch (error) {
          console.error('[SSE] Error parsing message:', error)
        }
      })

      // Send initial status
      try {
        const result = await getPayout(payoutId)
        const initialData = {
          status: result.data.status,
          timestamp: new Date().toISOString(),
          type: 'initial'
        }
        const sseData = `data: ${JSON.stringify(initialData)}\n\n`
        controller.enqueue(encoder.encode(sseData))
      } catch (error) {
        console.error('[SSE] Error sending initial status:', error)
      }

      // Keep-alive heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`
          controller.enqueue(encoder.encode(heartbeatData))
        } catch (error) {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup on close
      req.signal.addEventListener('abort', async () => {
        clearInterval(heartbeat)
        await subscriber.unsubscribe(channel)
        await subscriber.quit()
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    }
  })
}
