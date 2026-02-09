/**
 * Distributed Rate Limiter with Redis Sliding Window
 * 
 * Critical for P0 security hardening - prevents DDoS attacks
 * Works in serverless/multi-instance deployments
 * 
 * @see Plan: Part B: Security Hardening - B1. Redis-Based Rate Limiting
 */

import { Redis } from 'ioredis'

// Singleton Redis client
let redisClient: Redis | null = null

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    })
  }
  return redisClient
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

/**
 * Check rate limit using Redis sliding window algorithm
 * 
 * @param identifier - Unique identifier (API key, IP address, user ID)
 * @param limit - Maximum requests allowed in the window
 * @param windowSec - Time window in seconds
 * @returns RateLimitResult with allowed status and remaining requests
 * 
 * @example
 * const result = await checkRateLimit('partner:pk_abc123', 100, 60)
 * if (!result.allowed) {
 *   return res.status(429).json({ error: 'Rate limit exceeded' })
 * }
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - windowSec * 1000

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()

    // 1. Remove old requests outside the window
    pipeline.zremrangebyscore(key, 0, windowStart)

    // 2. Count current requests in window
    pipeline.zcard(key)

    // 3. Get oldest request timestamp (for resetAt calculation)
    pipeline.zrange(key, 0, 0, 'WITHSCORES')

    const results = await pipeline.exec()

    if (!results) {
      throw new Error('Redis pipeline failed')
    }

    const count = (results[1][1] as number) || 0
    const oldest = results[2][1] as string[]

    // Check if limit exceeded
    if (count >= limit) {
      const resetTimestamp = oldest.length > 0 
        ? parseInt(oldest[1]) + windowSec * 1000
        : now + windowSec * 1000

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(resetTimestamp),
        limit
      }
    }

    // 4. Add current request to sorted set
    // Use timestamp + random nonce to ensure uniqueness
    const requestId = `${now}-${Math.random().toString(36).substring(7)}`
    await redis.zadd(key, now, requestId)

    // 5. Set expiry on key (cleanup old data)
    await redis.expire(key, windowSec * 2) // 2x window for safety

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: new Date(now + windowSec * 1000),
      limit
    }
  } catch (error) {
    console.error('[RateLimiter] Error:', error)
    // Fail open - allow request if Redis is down (degraded mode)
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(now + windowSec * 1000),
      limit
    }
  }
}

/**
 * Reset rate limit for an identifier (admin function)
 * 
 * @param identifier - Identifier to reset
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const redis = getRedisClient()
  const key = `ratelimit:${identifier}`
  await redis.del(key)
}

/**
 * Get current rate limit status without incrementing
 * 
 * @param identifier - Identifier to check
 * @param windowSec - Time window in seconds
 */
export async function getRateLimitStatus(
  identifier: string,
  windowSec: number
): Promise<{ count: number; oldestRequest: Date | null }> {
  const redis = getRedisClient()
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - windowSec * 1000

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart)

  // Get count and oldest
  const [count, oldest] = await Promise.all([
    redis.zcard(key),
    redis.zrange(key, 0, 0, 'WITHSCORES')
  ])

  return {
    count,
    oldestRequest: oldest.length > 0 ? new Date(parseInt(oldest[1])) : null
  }
}

/**
 * Express middleware for rate limiting
 * 
 * @example
 * app.use('/api/accounting', rateLimitMiddleware({ limit: 100, windowSec: 60 }))
 */
export function rateLimitMiddleware(options: {
  limit: number
  windowSec: number
  identifier?: (req: any) => string
}) {
  return async (req: any, res: any, next: any) => {
    const identifier = options.identifier 
      ? options.identifier(req)
      : req.headers['x-api-key'] || req.ip

    const result = await checkRateLimit(identifier, options.limit, options.windowSec)

    // Set rate limit headers (RFC 6585 style)
    res.setHeader('X-RateLimit-Limit', result.limit.toString())
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString())
    res.setHeader('Retry-After', Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString())

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${result.limit} per ${options.windowSec}s`,
        retryAfter: result.resetAt.toISOString()
      })
    }

    next()
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeRateLimiter(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
