/**
 * Enhanced API client with retry logic, error handling, and logging
 */

import { withRetry, isNetworkError } from '@/lib/utils'
import { logApiCall, logApiResponse, logError } from '@/lib/utils/logger'
import type { ApiResponse } from '../../types/api.types' // Use 'type' import for interfaces

export interface ApiClientConfig {
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  headers?: Record<string, string>
}

// Removed local ApiResponse definition, will use the one from types/api.types.ts

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

  private sanitizeHeaderString(str: string): string {
    // Remove any characters that are not a-z, A-Z, 0-9, or typical header separators like -_.
    // Specifically, remove newline characters \r and \n to prevent header injection.
    return str.replace(/[^\w\s._~-]/g, '').replace(/[\r\n]+/g, '');
  }

  private sanitizeHeaders(headers: Record<string, string> | undefined): Record<string, string> {
    if (!headers) {
      return {};
    }
    const sanitized: Record<string, string> = {};
    for (const key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key)) {
        const sanitizedKey = this.sanitizeHeaderString(key);
        const sanitizedValue = this.sanitizeHeaderString(headers[key]);
        if (sanitizedKey && sanitizedValue) { // Only add if both key and value are non-empty after sanitization
          sanitized[sanitizedKey] = sanitizedValue;
        }
      }
    }
    return sanitized;
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
      const sanitizedOptionHeaders = this.sanitizeHeaders(options.headers as Record<string, string> | undefined);
      const response = await fetch(url, {
        method,
        headers: {
          ...this.config.headers,
          ...sanitizedOptionHeaders,
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
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${this.config.timeout}ms`) as ApiError
        timeoutError.isNetworkError = true
        timeoutError.isRetryable = true
        logError(`${method} ${url} - Request timeout`, timeoutError, { component: 'ApiClient' })
        throw timeoutError
      }

      if (error instanceof Error) {
        const apiError = error as ApiError
        apiError.isNetworkError = isNetworkError(error)
        apiError.isRetryable = this.isRetryableError(apiError)
        logError(`${method} ${url} - API error`, apiError, { component: 'ApiClient' })
        throw apiError
      }

      throw error
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')?.toLowerCase();
    const url = response.url;

    // 1. Attempt to parse as JSON
    try {
      // Clone the response because its body can only be consumed once.
      // This allows us to attempt text parsing if JSON parsing fails.
      const clonedResponseForJson = response.clone();
      const jsonData = await clonedResponseForJson.json();
      return jsonData;
    } catch (jsonError) {
      logError(
        `JSON parsing failed for ${url}. Status: ${response.status}, Content-Type: ${contentType}. Error: ${(jsonError as Error).message}`,
        jsonError,
        { component: 'ApiClient', responseStatus: response.status, contentType }
      );

      // 2. If JSON parsing fails, attempt to parse as text
      try {
        // Use the original response for text parsing. Its body is still available
        // because .json() was called on a clone.
        const textData = await response.text();
        
        // If original Content-Type was JSON, this textData is a fallback (e.g., an error message).
        return textData as unknown as T;
      } catch (textError) {
        logError(
          `Text parsing failed for ${url} after JSON attempt. Status: ${response.status}, Content-Type: ${contentType}. Error: ${(textError as Error).message}`,
          textError,
          { component: 'ApiClient', responseStatus: response.status, contentType }
        );
        
        // 3. If both JSON and text parsing fail
        const message = `Failed to parse response from ${url}. Status: ${response.status}, Content-Type: '${contentType}'. ` +
                        `JSON parse error: ${(jsonError as Error).message}. Text parse error: ${(textError as Error).message}.`;
        
        const parsingError = new Error(message) as ApiError;
        parsingError.status = response.status;
        parsingError.statusText = response.statusText;
        parsingError.response = response; // Original response, body likely consumed or in error state
        parsingError.isNetworkError = false; // This is a parsing error
        parsingError.isRetryable = this.isRetryableStatus(response.status); // Or consider false if parsing errors for 2xx are not typically retryable
        throw parsingError;
      }
    }
  }

  private async createApiError(response: Response, method: string, url: string): Promise<ApiError> {
    let message = `${method} ${url} failed with status ${response.status}`
    
    try {
      const errorData: unknown = await response.json()
      if (
        typeof errorData === 'object' &&
        errorData !== null
      ) {
        if (
          'message' in errorData &&
          typeof (errorData as { message: unknown }).message === 'string'
        ) {
          message = (errorData as { message: string }).message
        } else if (
          'error' in errorData &&
          typeof (errorData as { error: unknown }).error === 'string'
        ) {
          message = (errorData as { error: string }).error
        }
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
      this,
      function() { return this.makeRequest<T>('GET', endpoint, options); },
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    );
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : null
    
    return withRetry(
      this,
      function() { return this.makeRequest<T>('POST', endpoint, { ...options, body }); },
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    );
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : null
    
    return withRetry(
      this,
      function() { return this.makeRequest<T>('PUT', endpoint, { ...options, body }); },
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    );
  }

  async patch<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : null
    
    return withRetry(
      this,
      function() { return this.makeRequest<T>('PATCH', endpoint, { ...options, body }); },
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    );
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return withRetry(
      this,
      function() { return this.makeRequest<T>('DELETE', endpoint, options); },
      {
        maxAttempts: this.config.retryAttempts,
        baseDelay: this.config.retryDelay,
      }
    );
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
// Note: ApiClientConfig, ApiResponse, and ApiError are already exported as interfaces above
