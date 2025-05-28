type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private timers: Map<string, number> = new Map()

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }

    // Store log entry
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = level === "debug" ? "log" : level
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || "")
    }

    // In production, only log errors and warnings
    if (!this.isDevelopment && (level === "error" || level === "warn")) {
      console[level](`[${level.toUpperCase()}] ${message}`, data || "")
    }
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data)
  }

  info(message: string, data?: any) {
    this.log("info", message, data)
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data)
  }

  error(message: string, data?: any) {
    this.log("error", message, data)
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
