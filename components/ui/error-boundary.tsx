"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorFallbackProps {
  error: Error | null
  resetError: () => void
  showDetails?: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          showDetails={this.props.showDetails ?? false}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError, showDetails = false }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>

        <div className="px-6 pb-4">
          {(showDetails || isDevelopment) && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-red-800 dark:text-red-200 mb-2">
                  Error Details (Click to expand)
                </summary>
                <div className="mt-2 whitespace-pre-wrap break-all text-red-700 dark:text-red-300 font-mono text-xs">
                  <strong>Error:</strong> {error.message}
                  {error.stack && (
                    <>
                      <br />
                      <strong>Stack:</strong>
                      <br />
                      {error.stack}
                    </>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row p-6 pt-0">
          <button
            onClick={resetError}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

// Compact error fallback for smaller components
function CompactErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="text-center space-y-2">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto" />
        <p className="text-sm text-red-700 dark:text-red-300">Something went wrong</p>
        <button
          onClick={resetError}
          className="inline-flex items-center px-3 py-1 text-sm border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </button>
      </div>
    </div>
  )
}

// Inline error fallback for form fields or small components
function InlineErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
      <span className="text-red-700 dark:text-red-300 flex-1">Error loading content</span>
      <button
        onClick={resetError}
        className="h-6 px-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
      </button>
    </div>
  )
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      // You might want to show a toast notification here
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <ErrorBoundary {...props}>{children}</ErrorBoundary>
}

export { DefaultErrorFallback, CompactErrorFallback, InlineErrorFallback }
export type { ErrorBoundaryProps, ErrorFallbackProps }
