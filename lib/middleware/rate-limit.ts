import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/services/rate-limiter'
import { logger } from '@/lib/utils/logger'

// In-memory store for IP-based rate limiting
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now > data.resetTime) {
      ipRequestCounts.delete(ip)
    }
  }
}, 60000) // Every minute

export interface RateLimitOptions {
  maxRequests?: number
  windowMs?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  handler?: (req: NextRequest) => NextResponse
}

const defaultOptions: Required<RateLimitOptions> = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Get IP from headers or fall back to a default
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown'
    return ip.split(',')[0].trim() // Handle multiple IPs in x-forwarded-for
  },
  handler: (req) => {
    return NextResponse.json(
      { 
        error: 'Too many requests', 
        message: 'Please try again later',
        retryAfter: 60 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
        }
      }
    )
  }
}

export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return async function rateLimitMiddleware(
    req: NextRequest,
    apiName?: string
  ): Promise<NextResponse | null> {
    try {
      const key = config.keyGenerator(req)
      const now = Date.now()

      // Get or create request count for this key
      let requestData = ipRequestCounts.get(key)
      
      if (!requestData || now > requestData.resetTime) {
        requestData = {
          count: 0,
          resetTime: now + config.windowMs
        }
      }

      // Check if limit exceeded
      if (requestData.count >= config.maxRequests) {
        logger.warn('Rate limit exceeded', {
          component: 'RateLimitMiddleware',
          action: 'rateLimitExceeded',
          metadata: {
            key,
            path: req.nextUrl.pathname,
            method: req.method,
            count: requestData.count,
            limit: config.maxRequests
          }
        })

        return config.handler(req)
      }

      // Increment count
      requestData.count++
      ipRequestCounts.set(key, requestData)

      // Add rate limit headers to help clients
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      headers.set('X-RateLimit-Remaining', (config.maxRequests - requestData.count).toString())
      headers.set('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString())

      // If apiName is provided, also check API-specific rate limits
      if (apiName) {
        const canProceed = await rateLimiter.canMakeRequest(apiName)
        if (!canProceed) {
          logger.warn('API rate limit exceeded', {
            component: 'RateLimitMiddleware',
            action: 'apiRateLimitExceeded',
            metadata: {
              apiName,
              path: req.nextUrl.pathname
            }
          })

          return NextResponse.json(
            { 
              error: 'API rate limit exceeded', 
              message: `Too many requests to ${apiName} API`,
              retryAfter: 300 
            },
            { 
              status: 429,
              headers: {
                'Retry-After': '300',
                'X-API-RateLimit-Source': apiName
              }
            }
          )
        }
      }

      // Continue with the request
      return null

    } catch (error) {
      logger.error('Rate limit middleware error', {
        component: 'RateLimitMiddleware',
        action: 'middlewareError',
        metadata: {
          path: req.nextUrl.pathname,
          method: req.method
        }
      }, error as Error)

      // On error, allow the request to proceed
      return null
    }
  }
}

// Pre-configured middleware for different API endpoints
export const generalRateLimit = createRateLimitMiddleware({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000 // 15 minutes
})

export const strictRateLimit = createRateLimitMiddleware({
  maxRequests: 20,
  windowMs: 15 * 60 * 1000 // 15 minutes
})

export const authRateLimit = createRateLimitMiddleware({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  handler: (req) => {
    return NextResponse.json(
      { 
        error: 'Too many authentication attempts', 
        message: 'Please try again in 15 minutes',
        retryAfter: 900 
      },
      { status: 429 }
    )
  }
})

// Helper to apply rate limiting in API routes
export async function withRateLimit(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  options?: RateLimitOptions
): Promise<NextResponse> {
  const rateLimitMiddleware = createRateLimitMiddleware(options)
  const rateLimitResponse = await rateLimitMiddleware(req)
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  return handler()
}