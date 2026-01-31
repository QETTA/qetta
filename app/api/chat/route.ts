import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import type { EnginePresetType } from '@/types/inbox'
import { getDomainSystemPrompt } from '@/lib/chat/domain-prompts'
import { QETTA_SYSTEM_PROMPT } from '@/lib/chat/system-prompt'
import { qettaTools, executeToolCall } from '@/lib/claude/tools'
import { chatRequestSchema } from '@/lib/api/schemas'
import { createErrorResponse } from '@/lib/api/errors'
import { rateLimit, createRateLimitResponse } from '@/lib/api/rate-limiter'
import { logger } from '@/lib/api/logger'

// Node.js runtime for Tool Use support (crypto, external APIs)

/**
 * Tool result를 안전하게 JSON 직렬화
 * 직렬화 실패 시 에러 메시지 반환
 */
function safeSerializeToolResult(toolResult: unknown): string {
  try {
    return JSON.stringify(toolResult)
  } catch (error) {
    logger.warn('[Chat] Failed to serialize tool result:', error)
    return '{"error":"Failed to serialize tool result"}'
  }
}
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout

/**
 * Chat API Route - Claude Streaming with Domain Engine Support
 *
 * Features:
 * - Domain-specific system prompts
 * - Prompt caching for 90% cost reduction on cached prompts
 * - Streaming responses for real-time UI updates
 *
 * The Vercel AI SDK's useChat hook on the client side expects
 * a specific response format (text/event-stream with data: prefixes).
 */
export async function POST(req: Request) {
  try {
    // Rate limit check (manual — streaming response incompatible with withApiMiddleware)
    const rateLimitResult = await rateLimit(req, 'chat')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const body = await req.json()

    // Validate request with Zod
    const result = chatRequestSchema.safeParse(body)
    if (!result.success) {
      return new Response(
        JSON.stringify(createErrorResponse('VALIDATION_ERROR', result.error.issues[0].message)),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages, enginePreset, inlineCommand, context, intelligentContext, memoryContext } = result.data

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({
      apiKey,
    })

    // Convert messages to Anthropic format with proper typing
    const anthropicMessages: MessageParam[] = messages.map(
      (msg: { role: 'user' | 'assistant'; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })
    )

    // Get domain-specific system prompt or use default
    const domain = enginePreset as EnginePresetType | undefined
    const domainSystemPrompt = domain
      ? getDomainSystemPrompt(domain)
      : QETTA_SYSTEM_PROMPT

    // Build dynamic context (small, changes frequently)
    const dynamicContextParts: string[] = []

    if (intelligentContext) {
      dynamicContextParts.push(`## 지능형 컨텍스트 (현재 상태 인식)\n${intelligentContext}`)
    }

    if (memoryContext) {
      dynamicContextParts.push(`## 세션 메모리 (이전 대화 기억)\n${memoryContext}`)
    }

    if (inlineCommand && context) {
      dynamicContextParts.push(`## 인라인 명령어 컨텍스트\n명령어: ${inlineCommand}\n컨텍스트: ${context}`)
    }

    const dynamicContext = dynamicContextParts.length > 0
      ? dynamicContextParts.join('\n\n')
      : null

    // Create streaming response with optimized prompt caching
    // Strategy: Separate static (cached) and dynamic (uncached) blocks
    // This achieves ~90% cache efficiency vs ~70% with single block
    const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
      // Block 1: Static system prompt (CACHED - large, stable)
      {
        type: 'text',
        text: QETTA_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
      // Block 2: Domain-specific terminology (CACHED - stable per domain)
      {
        type: 'text',
        text: domainSystemPrompt !== QETTA_SYSTEM_PROMPT
          ? domainSystemPrompt
          : '도메인: 일반 QETTA 어시스턴트',
        cache_control: { type: 'ephemeral' },
      },
    ]

    // Block 3: Dynamic context (NOT CACHED - small, changes frequently)
    if (dynamicContext) {
      systemBlocks.push({
        type: 'text',
        text: dynamicContext,
        // No cache_control = not cached, but small so minimal cost
      })
    }

    // Create a ReadableStream for the response with Tool Use support
    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Initial call with tools - typed for Anthropic API
          let currentMessages: MessageParam[] = [...anthropicMessages]
          let continueLoop = true
          let iteration = 0
          const maxIterations = 5 // Prevent infinite loops

          while (continueLoop && iteration < maxIterations) {
            iteration++

            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              system: systemBlocks,
              messages: currentMessages,
              tools: qettaTools,
              tool_choice: { type: 'auto' },
            })

            // Process response content
            for (const block of response.content) {
              if (block.type === 'text') {
                // Stream text content
                const data = JSON.stringify({ text: block.text })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              } else if (block.type === 'tool_use') {
                // Execute tool and notify client
                const toolNotification = JSON.stringify({
                  toolUse: {
                    name: block.name,
                    id: block.id,
                    status: 'executing',
                  },
                })
                controller.enqueue(encoder.encode(`data: ${toolNotification}\n\n`))

                // Execute the tool
                const toolResult = await executeToolCall(block.name, block.input)

                // Send tool result notification
                const resultNotification = JSON.stringify({
                  toolResult: {
                    name: block.name,
                    id: block.id,
                    success: toolResult.success,
                    data: toolResult.data,
                  },
                })
                controller.enqueue(encoder.encode(`data: ${resultNotification}\n\n`))

                // Add assistant response and tool result to messages
                currentMessages = [
                  ...currentMessages,
                  {
                    role: 'assistant' as const,
                    content: response.content,
                  },
                  {
                    role: 'user' as const,
                    content: [
                      {
                        type: 'tool_result' as const,
                        tool_use_id: block.id,
                        content: safeSerializeToolResult(toolResult),
                      },
                    ],
                  },
                ]
              }
            }

            // Check if we should continue (tool_use means continue, otherwise stop)
            continueLoop = response.stop_reason === 'tool_use'
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          logger.error('Streaming error:', error)
          const errorData = JSON.stringify({
            error: 'Streaming error occurred',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    logger.error('Chat API error:', error)

    return new Response(JSON.stringify({ error: 'Chat request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
