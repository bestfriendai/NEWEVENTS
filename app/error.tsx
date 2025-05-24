'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0F1116] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1A1D23] rounded-lg shadow-lg border border-gray-800">
        <div className="text-center p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong!</h2>
          <p className="text-gray-300 mb-4">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row p-6 pt-0">
          <Button 
            onClick={reset} 
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
