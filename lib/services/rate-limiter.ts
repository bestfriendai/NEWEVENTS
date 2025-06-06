/**
 * API Rate Limiting Service with Circuit Breaker Pattern
 * Optimizes API calls and respects rate limits
 */

import { logger } from '@/lib/utils/logger'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  retryAfterMs?: number
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeoutMs: number
  monitoringPeriodMs: number
}

export interface ApiCallOptions {
  retries?: number
  retryDelayMs?: number
  timeout?: number
  priority?: 'low' | 'normal' | 'high'
}

interface RequestRecord {
  timestamp: number
  success: boolean
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailureTime: number
  nextAttemptTime: number
}

class RateLimiter {
  private requestHistory = new Map<string, RequestRecord[]>()
  private circuitBreakers = new Map<string, CircuitBreakerState>()
  private requestQueue = new Map<string, Array<() => Promise<any>>>()
  private rateLimitConfigs = new Map<string, RateLimitConfig>()
  private circuitBreakerConfigs = new Map<string, CircuitBreakerConfig>()

  constructor() {
    // Default configurations for common APIs
    this.setupDefaultConfigs()
    
    // Clean up old records periodically
    setInterval(() => this.cleanup(), 60000) // Every minute
  }

  private setupDefaultConfigs() {
    // Ticketmaster API limits
    this.rateLimitConfigs.set('ticketmaster', {
      maxRequests: 5000,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      retryAfterMs: 1000
    })

    // RapidAPI limits (varies by subscription)
    this.rateLimitConfigs.set('rapidapi', {
      maxRequests: 500,
      windowMs: 60 * 60 * 1000, // 1 hour
      retryAfterMs: 2000
    })

    // Eventbrite API limits
    this.rateLimitConfigs.set('eventbrite', {
      maxRequests: 1000,
      windowMs: 60 * 60 * 1000, // 1 hour
      retryAfterMs: 1500
    })

    // Default circuit breaker config
    const defaultCircuitConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeoutMs: 60000, // 1 minute
      monitoringPeriodMs: 300000 // 5 minutes
    }

    this.circuitBreakerConfigs.set('ticketmaster', defaultCircuitConfig)
    this.circuitBreakerConfigs.set('rapidapi', defaultCircuitConfig)
    this.circuitBreakerConfigs.set('eventbrite', defaultCircuitConfig)
  }

  /**
   * Check if API call is allowed under rate limits
   */
  async canMakeRequest(apiName: string): Promise<boolean> {
    const config = this.rateLimitConfigs.get(apiName)
    if (!config) return true

    const now = Date.now()
    const history = this.requestHistory.get(apiName) || []
    
    // Remove old requests outside the window
    const validRequests = history.filter(
      record => now - record.timestamp < config.windowMs
    )

    this.requestHistory.set(apiName, validRequests)

    return validRequests.length < config.maxRequests
  }

  /**
   * Check circuit breaker state
   */
  private getCircuitBreakerState(apiName: string): CircuitBreakerState {
    const existing = this.circuitBreakers.get(apiName)
    if (existing) return existing

    const newState: CircuitBreakerState = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    }
    this.circuitBreakers.set(apiName, newState)
    return newState
  }

  /**
   * Update circuit breaker state based on request result
   */
  private updateCircuitBreaker(apiName: string, success: boolean) {
    const state = this.getCircuitBreakerState(apiName)
    const config = this.circuitBreakerConfigs.get(apiName)
    if (!config) return

    const now = Date.now()

    if (success) {
      // Reset on success
      if (state.state === 'half-open') {
        state.state = 'closed'
        state.failures = 0
        logger.info('Circuit breaker closed', {
          component: 'RateLimiter',
          action: 'circuitBreakerClosed',
          metadata: { apiName }
        })
      } else if (state.state === 'closed') {
        state.failures = Math.max(0, state.failures - 1)
      }
    } else {
      // Handle failure
      state.failures++
      state.lastFailureTime = now

      if (state.failures >= config.failureThreshold && state.state === 'closed') {
        state.state = 'open'
        state.nextAttemptTime = now + config.resetTimeoutMs
        logger.warn('Circuit breaker opened', {
          component: 'RateLimiter',
          action: 'circuitBreakerOpened',
          metadata: { apiName, failures: state.failures }
        })
      }
    }

    // Check if we should try half-open
    if (state.state === 'open' && now >= state.nextAttemptTime) {
      state.state = 'half-open'
      logger.info('Circuit breaker half-open', {
        component: 'RateLimiter',
        action: 'circuitBreakerHalfOpen',
        metadata: { apiName }
      })
    }

    this.circuitBreakers.set(apiName, state)
  }

  /**
   * Execute API call with rate limiting and circuit breaker
   */
  async executeApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T> {
    const {
      retries = 3,
      retryDelayMs = 1000,
      timeout = 10000,
      priority = 'normal'
    } = options

    // Check circuit breaker
    const circuitState = this.getCircuitBreakerState(apiName)
    if (circuitState.state === 'open') {
      throw new Error(`Circuit breaker is open for ${apiName}`)
    }

    // Check rate limits
    if (!(await this.canMakeRequest(apiName))) {
      const config = this.rateLimitConfigs.get(apiName)
      const delay = config?.retryAfterMs || 1000
      
      logger.warn('Rate limit exceeded, queuing request', {
        component: 'RateLimiter',
        action: 'rateLimitExceeded',
        metadata: { apiName, delay }
      })

      // Queue the request if rate limited
      return this.queueRequest(apiName, apiCall, options)
    }

    // Execute the API call with retries
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug('Executing API call', {
          component: 'RateLimiter',
          action: 'executeApiCall',
          metadata: { apiName, attempt, maxRetries: retries }
        })

        // Record the request
        this.recordRequest(apiName, true)

        // Execute with timeout
        const result = await Promise.race([
          apiCall(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ])

        // Update circuit breaker on success
        this.updateCircuitBreaker(apiName, true)

        logger.debug('API call successful', {
          component: 'RateLimiter',
          action: 'apiCallSuccess',
          metadata: { apiName, attempt }
        })

        return result

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Record failed request
        this.recordRequest(apiName, false)
        this.updateCircuitBreaker(apiName, false)

        logger.warn('API call failed', {
          component: 'RateLimiter',
          action: 'apiCallFailed',
          metadata: { apiName, attempt, maxRetries: retries }
        }, lastError)

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = retryDelayMs * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('API call failed after all retries')
  }

  /**
   * Queue request for later execution
   */
  private async queueRequest<T>(
    apiName: string,
    apiCall: () => Promise<T>,
    options: ApiCallOptions
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queue = this.requestQueue.get(apiName) || []
      
      const queuedCall = async () => {
        try {
          const result = await this.executeApiCall(apiName, apiCall, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      // Add to queue based on priority
      if (options.priority === 'high') {
        queue.unshift(queuedCall)
      } else {
        queue.push(queuedCall)
      }

      this.requestQueue.set(apiName, queue)
      
      // Process queue after delay
      const config = this.rateLimitConfigs.get(apiName)
      const delay = config?.retryAfterMs || 1000
      
      setTimeout(() => this.processQueue(apiName), delay)
    })
  }

  /**
   * Process queued requests
   */
  private async processQueue(apiName: string) {
    const queue = this.requestQueue.get(apiName) || []
    if (queue.length === 0) return

    if (await this.canMakeRequest(apiName)) {
      const nextCall = queue.shift()
      if (nextCall) {
        this.requestQueue.set(apiName, queue)
        await nextCall()
      }
    }

    // Continue processing if there are more requests
    if (queue.length > 0) {
      const config = this.rateLimitConfigs.get(apiName)
      const delay = config?.retryAfterMs || 1000
      setTimeout(() => this.processQueue(apiName), delay)
    }
  }

  /**
   * Record API request
   */
  private recordRequest(apiName: string, success: boolean) {
    const history = this.requestHistory.get(apiName) || []
    history.push({
      timestamp: Date.now(),
      success
    })
    this.requestHistory.set(apiName, history)
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'unauthorized',
      'forbidden',
      'not found',
      'bad request',
      'invalid api key'
    ]

    const message = error.message.toLowerCase()
    return nonRetryableMessages.some(msg => message.includes(msg))
  }

  /**
   * Clean up old records
   */
  private cleanup() {
    const now = Date.now()
    
    // Clean up request history
    for (const [apiName, history] of this.requestHistory.entries()) {
      const config = this.rateLimitConfigs.get(apiName)
      if (!config) continue

      const validRequests = history.filter(
        record => now - record.timestamp < config.windowMs
      )
      this.requestHistory.set(apiName, validRequests)
    }

    // Clean up circuit breaker states
    for (const [apiName, state] of this.circuitBreakers.entries()) {
      const config = this.circuitBreakerConfigs.get(apiName)
      if (!config) continue

      // Reset old failures
      if (now - state.lastFailureTime > config.monitoringPeriodMs) {
        state.failures = 0
      }
    }
  }

  /**
   * Get API statistics
   */
  getApiStats(apiName: string) {
    const history = this.requestHistory.get(apiName) || []
    const circuitState = this.getCircuitBreakerState(apiName)
    const queueLength = this.requestQueue.get(apiName)?.length || 0

    const successCount = history.filter(r => r.success).length
    const failureCount = history.filter(r => !r.success).length
    const successRate = history.length > 0 ? successCount / history.length : 0

    return {
      totalRequests: history.length,
      successCount,
      failureCount,
      successRate,
      circuitBreakerState: circuitState.state,
      queueLength
    }
  }
}

export const rateLimiter = new RateLimiter()
