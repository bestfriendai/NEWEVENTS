"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react"

interface ApiResult {
  status: "success" | "error" | "warning"
  message: string
  data?: any
}

interface ApiTestResults {
  success: boolean
  summary: {
    connected: number
    total: number
    percentage: number
  }
  results: Record<string, ApiResult>
  timestamp: string
}

export default function ApiStatusPage() {
  const [results, setResults] = useState<ApiTestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAllApis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-all-apis")
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.message || "Failed to test APIs")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAllApis()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Connected
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      case "warning":
        return <Badge variant="secondary">Warning</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">API Status Dashboard</h1>
            <p className="text-gray-400">Monitor the health of all integrated APIs</p>
          </div>
          <Button onClick={testAllApis} disabled={loading} className="flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Testing..." : "Refresh Status"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <>
            {/* Summary Card */}
            <Card className="mb-6 bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Connection Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{results.summary.connected}</div>
                    <div className="text-sm text-gray-400">Connected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{results.summary.total}</div>
                    <div className="text-sm text-gray-400">Total APIs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{results.summary.percentage}%</div>
                    <div className="text-sm text-gray-400">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual API Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(results.results).map(([apiName, result]) => (
                <Card key={apiName} className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="capitalize">{apiName}</span>
                      {getStatusIcon(result.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Status:</span>
                        {getStatusBadge(result.status)}
                      </div>

                      <div className="text-sm text-gray-300">{result.message}</div>

                      {result.data && (
                        <div className="text-xs text-gray-500 bg-gray-900/50 p-2 rounded">
                          <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Timestamp */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Last updated: {new Date(results.timestamp).toLocaleString()}
            </div>
          </>
        )}

        {loading && !results && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400">Testing API connections...</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
