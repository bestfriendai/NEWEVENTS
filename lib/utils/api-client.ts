/**
 * Enhanced API client with retry logic, error handling, and logging
 */

import { withRetry, formatErrorMessage, isNetworkError } from '@/lib/utils'
import { logger, logApiCall, logApiResponse, logApiError } from '@/lib/utils/logger'

export interface ApiClientConfig {
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  headers?: Record<string, string>
}

export interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export interface ApiError extends Error {
  status?: number
  statusText?: string
  response?: Response
  isNetworkError: boolean
  isRetryable: boolean
}

class ApiClient {
  private config: Required<ApiClientConfig>

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: '',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    }
  }

  private createUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint
    }
    return `${this.config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.createUrl(endpoint)
    const startTime = performance.now()

    logApiCall(method, url, { component: 'ApiClient' })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)
      const duration = performance.now() - startTime

      logApiResponse(method, url, response.status, duration, { component: 'ApiClient' })

      if (!response.ok) {
        throw await this.createApiError(response, method, url)
      }

      const data = await this.parseResponse<T>(response)

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      const duration = performance.now() - startTime

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${this.config.timeout}ms`) as ApiError
        timeoutError.isNetworkError = true
        timeoutError.isRetryable = true
        logApiError(method, url, timeoutError, { component: 'ApiClient' })
        throw timeoutError
      }

      if (error instanceof Error) {
        const apiError = error as ApiError
        apiError.isNetworkError = isNetworkError(error)
        apiError.isRetryable = this.isRetryableError(apiError)
        logApiError(method, url, apiError, { component: 'ApiClient' })
        throw apiError
      }

      throw error
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    if (contentType?.includes('text/')) {
      return (await response.text()) as unknown as T
    }
    
    return (await response.blob()) as unknown as T
  }

  private async createApiError(response: Response, method: string, url: string): Promise<ApiError> {
    let message = `${method} ${url} failed with status ${response.status}`
    
    try {
      const errorData = await response.json()
      if (errorData.message) {
        message = errorData.message
      } else if (errorData.error) {
        message = errorData.error
      }
    } catch {
      // If we can't parse the error response, use the default message
    }

    const error = new Error(message) as ApiError
    error.status = response.status
    error.statusText = response.statusText
    error.response = response
    error.isNetworkError = false
    error.isRetryable = this.isRetryableStatus(response.status)

    return error
  }

  private isRetryableError(error: ApiError): boolean {
    // Retry on network errors
    if (error.isNetworkError) return true
    
    // Retry on specific HTTP status codes
    if (error.status) {
      return this.isRetryableStatus(error.status)
    }
    
    return false
  }

  private isRetryableStatus(status: number): boolean {
    // Retry on server errors and rate limiting
    return status >= 500 || status === 429 || status === 408
  }

  // Public methods
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return withRetry(
      () => this.makeRequest<T>('GET', endpoint, options),
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    )
  }

  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined
    
    return withRetry(
      () => this.makeRequest<T>('POST', endpoint, { ...options, body }),
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    )
  }

  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined
    
    return withRetry(
      () => this.makeRequest<T>('PUT', endpoint, { ...options, body }),
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    )
  }

  async patch<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined
    
    return withRetry(
      () => this.makeRequest<T>('PATCH', endpoint, { ...options, body }),
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    )
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return withRetry(
      () => this.makeRequest<T>('DELETE', endpoint, options),
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    )
  }

  // Create a new client with different configuration
  withConfig(config: Partial<ApiClientConfig>): ApiClient {
    return new ApiClient({ ...this.config, ...config })
  }

  // Add authentication header
  withAuth(token: string, type: 'Bearer' | 'Basic' | 'ApiKey' = 'Bearer'): ApiClient {
    const authHeader = type === 'ApiKey' ? token : `${type} ${token}`
    
    return this.withConfig({
      headers: {
        ...this.config.headers,
        Authorization: authHeader,
      },
    })
  }
}

// Create default client instance
export const apiClient = new ApiClient()

// Convenience function for creating API clients with specific configurations
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config)
}

// Export types
export type { ApiClientConfig, ApiResponse, ApiError }
