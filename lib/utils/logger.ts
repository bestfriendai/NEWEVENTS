type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
  component?: string
  action?: string
  metadata?: Record<string, unknown>
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

interface LogContext {
  component?: string
  action?: string
  metadata?: Record<string, unknown>
  error?: Error | unknown
}

// Production log levels - can be configured via environment
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private isProduction = process.env.NODE_ENV === "production"
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private timers: Map<string, number> = new Map()
  private logLevel: number
  private batchedLogs: LogEntry[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private readonly batchSize = 50
  private readonly batchInterval = 5000 // 5 seconds

  constructor() {
    // Set log level from environment or default to 'info' in production, 'debug' in development
    const envLogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info')).toLowerCase() as LogLevel
    this.logLevel = LOG_LEVELS[envLogLevel] || LOG_LEVELS.info
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.logLevel
  }

  private formatError(error: unknown): LogEntry['error'] | undefined {
    if (!error) return undefined

    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      }
    }

    if (typeof error === 'string') {
      return { message: error }
    }

    if (typeof error === 'object') {
      return {
        message: JSON.stringify(error),
      }
    }

    return { message: String(error) }
  }

  private async sendLogsToService(logs: LogEntry[]): Promise<void> {
    if (!this.isProduction || logs.length === 0) return

    try {
      // In a real production app, this would send to your logging service
      // Example: Datadog, New Relic, LogRocket, Sentry, etc.
      
      // For now, we'll just console log in a structured format
      const logBatch = {
        service: 'dateai-ui',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        logs: logs,
      }
      
      console.log('[LOG_BATCH]', JSON.stringify(logBatch))
      
      // Example external service call:
      // await fetch('https://your-logging-service.com/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logBatch),
      // })
    } catch (error) {
      // If logging service fails, fallback to console
      console.error('[LOGGER_ERROR] Failed to send logs:', error)
    }
  }

  private scheduleBatch() {
    if (this.batchTimer) return

    this.batchTimer = setTimeout(() => {
      this.flushBatch()
    }, this.batchInterval)
  }

  private async flushBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    if (this.batchedLogs.length === 0) return

    const logsToSend = [...this.batchedLogs]
    this.batchedLogs = []

    await this.sendLogsToService(logsToSend)
  }

  private log(level: LogLevel, message: string, context?: LogContext | unknown) {
    if (!this.shouldLog(level)) return

    // Handle both old and new API formats
    let logContext: LogContext = {}
    if (context && typeof context === 'object' && ('component' in context || 'action' in context || 'metadata' in context)) {
      logContext = context as LogContext
    } else {
      logContext = { metadata: { data: context } }
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component: logContext.component,
      action: logContext.action,
      metadata: logContext.metadata,
      error: this.formatError(logContext.error),
      data: !logContext.component ? context : undefined, // Backwards compatibility
    }

    // Store log entry
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output
    if (this.isDevelopment) {
      const consoleMethod = level === "debug" ? "log" : level
      const prefix = logContext.component && logContext.action 
        ? `[${level.toUpperCase()}] [${logContext.component}:${logContext.action}]`
        : `[${level.toUpperCase()}]`
      
      console[consoleMethod](prefix, message, logContext.metadata || context || "")
      if (logContext.error) {
        console[consoleMethod]('Error details:', logContext.error)
      }
    } else if (this.isProduction) {
      // In production, batch logs for external service
      this.batchedLogs.push(entry)
      
      if (this.batchedLogs.length >= this.batchSize) {
        this.flushBatch()
      } else {
        this.scheduleBatch()
      }

      // Always immediately log errors and warnings to console in production
      if (level === "error" || level === "warn") {
        console[level](`[${level.toUpperCase()}] ${message}`, entry)
      }
    }
  }

  debug(message: string, data?: LogContext | unknown) {
    this.log("debug", message, data)
  }

  info(message: string, data?: LogContext | unknown) {
    this.log("info", message, data)
  }

  warn(message: string, data?: LogContext | unknown, error?: Error) {
    if (error) {
      this.log("warn", message, { ...((data as LogContext) || {}), error })
    } else {
      this.log("warn", message, data)
    }
  }

  error(message: string, data?: LogContext | unknown, error?: Error) {
    if (error) {
      this.log("error", message, { ...((data as LogContext) || {}), error })
    } else {
      this.log("error", message, data)
    }
  }

  // Ensure logs are sent before process exits
  async flush(): Promise<void> {
    await this.flushBatch()
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  time(label: string, data?: any): () => void {
    const startTime = performance.now()
    const timerId = `${label}-${Date.now()}-${Math.random()}`
    this.timers.set(timerId, startTime)

    this.debug(`Timer started: ${label}`, data)

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.timers.delete(timerId)

      this.info(`Timer completed: ${label} (${duration.toFixed(2)}ms)`, {
        ...data,
        duration,
        startTime,
        endTime,
      })

      return duration
    }
  }

  timeEnd(label: string): number | null {
    const timer = Array.from(this.timers.entries()).find(([id]) => id.startsWith(label))
    if (!timer) {
      this.warn(`Timer not found: ${label}`)
      return null
    }

    const [timerId, startTime] = timer
    const endTime = performance.now()
    const duration = endTime - startTime
    this.timers.delete(timerId)

    this.info(`Timer ended: ${label} (${duration.toFixed(2)}ms)`, { duration })
    return duration
  }
}

export const logger = new Logger()

// Performance measurement utility
export async function measurePerformance<T>(label: string, fn: () => Promise<T> | T, data?: any): Promise<T> {
  const timerEnd = logger.time(label, data)

  try {
    const result = await fn()
    timerEnd()
    return result
  } catch (error) {
    timerEnd()
    logger.error(`Performance measurement failed: ${label}`, {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

// Format error message utility
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object") {
    // Handle objects with message property
    if ("message" in error && typeof error.message === "string") {
      return error.message
    }

    // Handle objects with error property
    if ("error" in error && typeof error.error === "string") {
      return error.error
    }

    // Try to stringify the object
    try {
      return JSON.stringify(error)
    } catch {
      return "Unknown error object"
    }
  }

  return "Unknown error occurred"
}

// API logging utilities
export function logApiCall(apiName: string, endpoint: string, params?: any): void {
  logger.info(`API Call: ${apiName}`, {
    component: "api-client",
    action: "api_call",
    metadata: { endpoint, params },
  })
}

// API logging utilities
export function logApiResponse(
  apiName: string,
  endpoint: string,
  success: boolean,
  responseTime?: number,
  data?: any,
): void {
  if (success) {
    logger.info(`API Success: ${apiName}`, {
      component: "api-client",
      action: "api_success",
      metadata: { endpoint, responseTime, dataLength: Array.isArray(data) ? data.length : undefined },
    })
  } else {
    logger.warn(`API Failed: ${apiName}`, {
      component: "api-client",
      action: "api_failure",
      metadata: { endpoint, responseTime },
    })
  }
}

// API logging utilities
export function logError(message: string, error: unknown, context?: any): void {
  logger.error(message, {
    component: context?.component || "unknown",
    action: context?.action || "error",
    metadata: context?.metadata,
    error: formatErrorMessage(error),
  })
}

// Export logApiCall, logApiResponse, logError
