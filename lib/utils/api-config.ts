/**
 * Centralized API configuration and validation
 */

import { logger } from '@/lib/utils/logger'
import { API_CONFIG } from '@/lib/env'

export interface ApiKeyValidation {
  isValid: boolean
  provider: string
  error?: string
  lastChecked?: Date
}

export interface ApiProviderConfig {
  name: string
  baseUrl: string
  apiKey?: string
  headers?: Record<string, string>
  rateLimit?: {
    requests: number
    window: number // in milliseconds
  }
  timeout?: number
  retryAttempts?: number
}

class ApiConfigManager {
  private validationCache = new Map<string, ApiKeyValidation>()
  private rateLimitTracking = new Map<string, { count: number; resetTime: number }>()

  constructor() {
    this.validateAllApiKeys()
  }

  /**
   * Get configuration for a specific API provider
   */
  getProviderConfig(provider: keyof typeof API_CONFIG): ApiProviderConfig | null {
    const config = API_CONFIG[provider]
    if (!config) {
      logger.warn(`No configuration found for provider: ${provider}`)
      return null
    }

    switch (provider) {
      case 'ticketmaster':
        return {
          name: 'Ticketmaster',
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          timeout: 10000,
          retryAttempts: 3,
          rateLimit: {
            requests: 5000,
            window: 24 * 60 * 60 * 1000, // 24 hours
          },
        }

      case 'eventbrite':
        return {
          name: 'Eventbrite',
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
          timeout: 10000,
          retryAttempts: 3,
          rateLimit: {
            requests: 1000,
            window: 60 * 60 * 1000, // 1 hour
          },
        }

      case 'rapidapi':
        return {
          name: 'RapidAPI',
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          headers: {
            'x-rapidapi-key': config.apiKey || '',
            'x-rapidapi-host': config.host,
          },
          timeout: 15000,
          retryAttempts: 2,
          rateLimit: {
            requests: 500,
            window: 60 * 60 * 1000, // 1 hour
          },
        }

      case 'predicthq':
        return {
          name: 'PredictHQ',
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
          timeout: 10000,
          retryAttempts: 3,
          rateLimit: {
            requests: 1000,
            window: 60 * 60 * 1000, // 1 hour
          },
        }

      case 'maps':
        if ('mapbox' in config && config.mapbox.apiKey) {
          return {
            name: 'Mapbox',
            baseUrl: 'https://api.mapbox.com',
            apiKey: config.mapbox.apiKey,
            timeout: 8000,
            retryAttempts: 2,
            rateLimit: {
              requests: 100000,
              window: 60 * 60 * 1000, // 1 hour
            },
          }
        }
        if ('tomtom' in config && config.tomtom.apiKey) {
          return {
            name: 'TomTom',
            baseUrl: 'https://api.tomtom.com',
            apiKey: config.tomtom.apiKey,
            timeout: 8000,
            retryAttempts: 2,
            rateLimit: {
              requests: 2500,
              window: 24 * 60 * 60 * 1000, // 24 hours
            },
          }
        }
        return null

      default:
        logger.warn(`Unknown provider: ${provider}`)
        return null
    }
  }

  /**
   * Validate API key for a specific provider
   */
  async validateApiKey(provider: string, apiKey: string): Promise<ApiKeyValidation> {
    const cacheKey = `${provider}:${apiKey.substring(0, 8)}`
    const cached = this.validationCache.get(cacheKey)

    // Return cached result if it's less than 1 hour old
    if (cached && cached.lastChecked && Date.now() - cached.lastChecked.getTime() < 60 * 60 * 1000) {
      return cached
    }

    try {
      let isValid = false
      let error: string | undefined

      switch (provider) {
        case 'ticketmaster':
          isValid = await this.validateTicketmasterKey(apiKey)
          break
        case 'mapbox':
          isValid = await this.validateMapboxKey(apiKey)
          break
        case 'rapidapi':
          isValid = await this.validateRapidApiKey(apiKey)
          break
        default:
          // For other providers, just check if the key exists and has reasonable length
          isValid = apiKey.length > 10
      }

      const validation: ApiKeyValidation = {
        isValid,
        provider,
        error: isValid ? undefined : `Invalid ${provider} API key`,
        lastChecked: new Date(),
      }

      this.validationCache.set(cacheKey, validation)
      return validation

    } catch (err) {
      const validation: ApiKeyValidation = {
        isValid: false,
        provider,
        error: `Failed to validate ${provider} API key: ${err instanceof Error ? err.message : 'Unknown error'}`,
        lastChecked: new Date(),
      }

      this.validationCache.set(cacheKey, validation)
      return validation
    }
  }

  /**
   * Check rate limit for a provider
   */
  checkRateLimit(provider: string): { allowed: boolean; resetTime?: number } {
    const config = this.getProviderConfig(provider as any)
    if (!config?.rateLimit) {
      return { allowed: true }
    }

    const tracking = this.rateLimitTracking.get(provider)
    const now = Date.now()

    if (!tracking || now > tracking.resetTime) {
      // Reset or initialize tracking
      this.rateLimitTracking.set(provider, {
        count: 1,
        resetTime: now + config.rateLimit.window,
      })
      return { allowed: true }
    }

    if (tracking.count >= config.rateLimit.requests) {
      return { allowed: false, resetTime: tracking.resetTime }
    }

    tracking.count++
    return { allowed: true }
  }

  /**
   * Get all available providers with their status
   */
  getProviderStatus(): Record<string, { available: boolean; validated: boolean; error?: string }> {
    const providers = ['ticketmaster', 'eventbrite', 'rapidapi', 'predicthq', 'mapbox', 'tomtom'] as const
    const status: Record<string, { available: boolean; validated: boolean; error?: string }> = {}

    for (const provider of providers) {
      const config = this.getProviderConfig(provider as any)
      const hasApiKey = Boolean(config?.apiKey)
      
      let validation: ApiKeyValidation | undefined
      if (hasApiKey && config?.apiKey) {
        const cacheKey = `${provider}:${config.apiKey.substring(0, 8)}`
        validation = this.validationCache.get(cacheKey)
      }

      status[provider] = {
        available: hasApiKey,
        validated: validation?.isValid ?? false,
        error: validation?.error,
      }
    }

    return status
  }

  private async validateTicketmasterKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=1`,
        { method: 'GET' }
      )
      return response.ok
    } catch {
      return false
    }
  }

  private async validateMapboxKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${apiKey}`,
        { method: 'GET' }
      )
      return response.ok
    } catch {
      return false
    }
  }

  private async validateRapidApiKey(apiKey: string): Promise<boolean> {
    try {
      // This is a basic check - in practice, you'd test against a specific endpoint
      return apiKey.length > 20 && apiKey.includes('-')
    } catch {
      return false
    }
  }

  private async validateAllApiKeys(): Promise<void> {
    const providers = ['ticketmaster', 'eventbrite', 'rapidapi', 'predicthq'] as const
    
    for (const provider of providers) {
      const config = this.getProviderConfig(provider)
      if (config?.apiKey) {
        // Validate in background, don't await
        this.validateApiKey(provider, config.apiKey).catch(error => {
          logger.warn(`Failed to validate ${provider} API key`, { component: 'ApiConfigManager' }, error)
        })
      }
    }
  }
}

// Create singleton instance
export const apiConfigManager = new ApiConfigManager()

// Convenience functions
export const getProviderConfig = (provider: keyof typeof API_CONFIG) => {
  return apiConfigManager.getProviderConfig(provider)
}

export const validateApiKey = (provider: string, apiKey: string) => {
  return apiConfigManager.validateApiKey(provider, apiKey)
}

export const checkRateLimit = (provider: string) => {
  return apiConfigManager.checkRateLimit(provider)
}

export const getProviderStatus = () => {
  return apiConfigManager.getProviderStatus()
}
