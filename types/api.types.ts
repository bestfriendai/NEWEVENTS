// types/api.types.ts

export interface ApiResponse<T> {
  data: T;
  status: number; // HTTP status code
  statusText: string;
  headers: Headers; // Standard Fetch API Headers object
  message?: string; // Optional error or success message
  // Optional pagination fields, if applicable to the response
  totalCount?: number;
  page?: number;
  totalPages?: number;
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: unknown
}

// API Configuration Types
export interface ApiProviderConfig {
  name: string
  baseUrl: string
  apiKey: string | undefined
  timeout: number
  retryAttempts: number
  rateLimit: {
    requests: number
    window: number
  }
}

export interface ApiKeyValidation {
  isValid: boolean
  provider: string
  error?: string | undefined
  lastChecked: Date
}
