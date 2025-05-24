// lib/utils/logger.ts

// Define a simple logger class
interface LogContext {
  [key: string]: any
}

class Logger {
  private serviceName: string

  constructor(serviceName = "default-service") {
    this.serviceName = serviceName
  }

  private log(level: string, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      context,
      error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
    }
    console.log(JSON.stringify(logEntry))
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context)
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log("error", message, context, error)
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context)
  }

  apiRequest(method: string, url: string, context?: LogContext) {
    this.info(`API Request: ${method} ${url}`, { ...context, action: "api_request", method, url })
  }

  apiResponse(method: string, url: string, status: number, duration?: number, context?: LogContext) {
    const message = `API Response: ${method} ${url} - Status: ${status}`
    const logContext: LogContext = {
      ...context,
      action: "api_response",
      method,
      url,
      status,
    }
    if (duration) {
      logContext.duration = duration
    }
    this.info(message, logContext)
  }

  userAction(action: string, context?: LogContext) {
    this.info(`User Action: ${action}`, { ...context, action })
  }

  performance(operation: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${operation} took ${duration.toFixed(2)}ms`, {
      ...context,
      action: "performance",
      operation,
      duration,
    })
  }
}

// Create singleton instance
const logger = new Logger()

// Export the logger instance as default and named export
export { logger }
export default logger

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
export const measurePerformance = async <T>(\
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
)
: Promise<T> =>
{
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
