"use client"

import React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EventsErrorBoundaryProps {
  children: React.ReactNode
}

interface EventsErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class EventsErrorBoundary extends React.Component<EventsErrorBoundaryProps, EventsErrorBoundaryState> {
  constructor(props: EventsErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): EventsErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // console.error("Events Error Boundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1116] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="bg-red-900/30 border border-red-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.error?.message || "An unexpected error occurred while loading events."}
              </AlertDescription>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                variant="outline"
                size="sm"
                className="mt-4 border-red-700 text-white hover:bg-red-800"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
