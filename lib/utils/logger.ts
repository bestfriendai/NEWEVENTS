/**
 * Centralized logging utility for structured logging and error tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: LogContext
  error?: Error
  stack?: string
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development"
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const level = LogLevel[entry.level]
    const context = entry.context ? ` [${entry.context.component || "Unknown"}]` : ""

    return `[${timestamp}] ${level}${context}: ${entry.message}`
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      stack: error?.stack,
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formattedMessage = this.formatMessage(entry)

    // In development, use console methods for better formatting
    if (this.isDevelopment) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, entry.context, entry.error)
          break
        case LogLevel.INFO:
          console.info(formattedMessage, entry.context)
          break
        case LogLevel.WARN:
          console.warn(formattedMessage, entry.context, entry.error)
          break
        case LogLevel.ERROR:
          console.error(formattedMessage, entry.context, entry.error)
          break
      }
    } else {
      // In production, use structured logging
      console.log(JSON.stringify(entry))
    }

    // In production, you might want to send logs to an external service
    // this.sendToExternalService(entry)
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.log(entry)
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.log(entry)
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, error)
    this.log(entry)
  }

  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error)
    this.log(entry)
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      action: "api_request",
      metadata: { method, url },
    })
  }

  apiResponse(method: string, url: string, status: number, duration?: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO
    const message = `API Response: ${method} ${url} - ${status}${duration ? ` (${duration}ms)` : ""}`

    const entry = this.createLogEntry(level, message, {
      ...context,
      action: "api_response",
      metadata: { method, url, status, duration },
    })

    this.log(entry)
  }

  apiError(method: string, url: string, error: Error, context?: LogContext): void {
    this.error(
      `API Error: ${method} ${url}`,
      {
        ...context,
        action: "api_error",
        metadata: { method, url },
      },
      error,
    )
  }

  // User action logging
  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action: "user_action",
      metadata: { action },
    })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO
    const message = `Performance: ${operation} took ${duration}ms`

    const entry = this.createLogEntry(level, message, {
      ...context,
      action: "performance",
      metadata: { operation, duration },
    })

    this.log(entry)
  }

  // Security logging
  security(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      action: "security_event",
      metadata: { event },
    })
  }
}

// Create singleton instance
export const logger = new Logger()

// Convenience functions for common logging patterns
export const logApiCall = (method: string, url: string, context?: LogContext) => {
  logger.apiRequest(method, url, context)
}

export const logApiResponse = (
  method: string,
  url: string,
  status: number,
  duration?: number,
  context?: LogContext,
) => {
  logger.apiResponse(method, url, status, duration, context)
}

export const logError = (message: string, error?: Error, context?: LogContext) => {
  logger.error(message, context, error)
}

export const logUserAction = (action: string, context?: LogContext) => {
  logger.userAction(action, context)
}

export const logPerformance = (operation: string, duration: number, context?: LogContext) => {
  logger.performance(operation, duration, context)
}

// Performance measurement utility
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> => {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    logPerformance(operation, duration, context)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logPerformance(`${operation} (failed)`, duration, context)
    throw error
  }
}

// Error boundary logging helper
export const logComponentError = (componentName: string, error: Error, errorInfo?: any) => {
  logger.error(
    `Component Error in ${componentName}`,
    {
      component: componentName,
      action: "component_error",
      metadata: { errorInfo },
    },
    error,
  )
}
