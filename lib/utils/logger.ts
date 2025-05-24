// lib/utils/logger.ts

// Define a simple logger class

/**
 * Defines the structured context for log messages.
 * It is crucial to ensure that no sensitive information (e.g., PII, API keys, tokens)
 * is included in any part of the context, especially the `metadata` field,
 * unless explicitly sanitized or if the logging level/environment permits.
 *
 * For sensitive data, prefer logging only non-sensitive identifiers or omitting the data entirely,
 * particularly in production environments.
 */
export interface LogContext {
  /** The general action being logged (e.g., 'api_request', 'user_login', 'file_upload'). */
  action?: string
  /** The component or module where the log originated (e.g., 'PaymentForm', 'AuthService'). */
  component?: string
  /** A specific operation within the action or component (e.g., 'submit_payment', 'validate_token'). */
  operation?: string
  /** HTTP method for API calls (e.g., 'GET', 'POST'). */
  method?: string
  /** URL for API calls, navigation, or resource identifiers. */
  url?: string
  /** HTTP status code for API responses (e.g., 200, 404, 500). */
  status?: number
  /** Duration of an operation in milliseconds. */
  duration?: number
  /** Non-PII identifier for the user associated with the log event. */
  userId?: string | number
  /** Identifier for tracing requests or a series of operations. */
  transactionId?: string
  /**
   * A flexible object for additional, non-sensitive, structured data.
   * IMPORTANT: Developers MUST ensure no sensitive data (PII, secrets, tokens, etc.)
   * is logged here. Review carefully before adding data to this field.
   * Consider if the data truly needs to be logged or if an identifier would suffice.
   */
  metadata?: Record<string, unknown>
}

// New: LogLevel enum
export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  DEBUG = "debug",
}

// New: LogEntry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: LogContext;
  error?: { name: string; message: string; stack?: string };
}

// New: LogTransport interface
export interface LogTransport {
  handle(logEntry: LogEntry): void;
}

// New: ConsoleTransport class
class ConsoleTransport implements LogTransport {
  handle(logEntry: LogEntry): void {
    // In development, log the object directly for better browser console inspection.
    // In production, stringify for structured logging systems.
    const output = process.env.NODE_ENV === "development" ? logEntry : JSON.stringify(logEntry);

    switch (logEntry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      // INFO, DEBUG, and any other levels will use console.log
      case LogLevel.INFO:
      case LogLevel.DEBUG:
      default:
        console.log(output);
        break;
    }
  }
}
class Logger {
  private serviceName: string;
  private transports: LogTransport[];

  constructor(serviceName = "default-service") {
    this.serviceName = serviceName;
    this.transports = [new ConsoleTransport()];
  }

  private logInternal(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      context,
      error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
    };

    this.transports.forEach(transport => transport.handle(logEntry));
  }
  /**
   * Logs an informational message.
   * @param message - The message to log.
   * @param context - Optional. Additional context. Ensure no sensitive data is passed.
   */
  info(message: string, context?: LogContext) {
    this.logInternal(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message.
   * @param message - The message to log.
   * @param context - Optional. Additional context. Ensure no sensitive data is passed.
   */
  warn(message: string, context?: LogContext) {
    this.logInternal(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message.
   * @param message - The message to log.
   * @param context - Optional. Additional context. Ensure no sensitive data is passed.
   * @param error - Optional. The error object.
   */
  error(message: string, context?: LogContext, error?: Error) {
    this.logInternal(LogLevel.ERROR, message, context, error);
  }

  /**
   * Logs a debug message.
   * @param message - The message to log.
   * @param context - Optional. Additional context. Ensure no sensitive data is passed.
   */
  debug(message: string, context?: LogContext) {
    this.logInternal(LogLevel.DEBUG, message, context);
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
export const logComponentError = (componentName: string, error: Error, errorInfo?: unknown) => {
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
