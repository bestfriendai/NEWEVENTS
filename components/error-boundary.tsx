"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })

    // Log error to our logging service
    logger.error('React Error Boundary caught an error', {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    }, error)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-white">Something went wrong</CardTitle>
              <CardDescription className="text-gray-300">
                We encountered an unexpected error. This has been logged and we'll look into it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-sm text-red-300 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-400 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-red-300 mt-1 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Async error boundary for handling async errors
export function AsyncErrorBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', {
        component: 'AsyncErrorBoundary',
        action: 'unhandledRejection',
        metadata: {
          reason: event.reason,
          promise: event.promise
        }
      }, event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
      
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  if (error) {
    return fallback || (
      <ErrorBoundary>
        <div>An async error occurred</div>
      </ErrorBoundary>
    )
  }

  return <>{children}</>
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    logger.error('Error handled by useErrorHandler', {
      component: 'useErrorHandler',
      action: 'handleError',
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack
      }
    }, error)
    setError(error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError, error }
}

// Global error handler setup
export function setupGlobalErrorHandling() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', {
      component: 'GlobalErrorHandler',
      action: 'uncaughtError',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
      }
    }, event.error)
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      component: 'GlobalErrorHandler',
      action: 'unhandledRejection',
      metadata: {
        reason: event.reason
      }
    }, event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
  })
}
