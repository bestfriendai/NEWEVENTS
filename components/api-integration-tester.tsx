"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertTriangle, Loader2, Play, RefreshCw } from "lucide-react"

interface ApiTestResult {
  status: "success" | "error" | "warning" | "pending"
  message: string
  data?: any
  responseTime?: number
  timestamp?: string
}

interface ApiTestResults {
  [key: string]: ApiTestResult
}

export function ApiIntegrationTester() {
  const [results, setResults] = useState<ApiTestResults>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [activeTab, setActiveTab] = useState("overview")

  const apiProviders = [
    {
      id: "ticketmaster",
      name: "Ticketmaster",
      description: "Event discovery and ticketing platform",
      testEndpoint: "/api/test-ticketmaster",
    },
    {
      id: "eventbrite",
      name: "Eventbrite",
      description: "Event management and ticketing service",
      testEndpoint: "/api/test-eventbrite",
    },
    {
      id: "rapidapi",
      name: "RapidAPI Events",
      description: "Real-time events search API",
      testEndpoint: "/api/test-rapidapi",
    },
    {
      id: "predicthq",
      name: "PredictHQ",
      description: "Event intelligence and prediction platform",
      testEndpoint: "/api/test-predicthq",
    },
    {
      id: "mapbox",
      name: "Mapbox",
      description: "Mapping and geocoding services",
      testEndpoint: "/api/test-mapbox",
    },
    {
      id: "tomtom",
      name: "TomTom",
      description: "Alternative mapping and location services",
      testEndpoint: "/api/test-tomtom",
    },
    {
      id: "supabase",
      name: "Supabase",
      description: "Database and authentication backend",
      testEndpoint: "/api/test-supabase",
    },
  ]

  const testApi = async (provider: typeof apiProviders[0]) => {
    setLoading(prev => ({ ...prev, [provider.id]: true }))
    setResults(prev => ({
      ...prev,
      [provider.id]: { status: "pending", message: "Testing connection..." }
    }))

    const startTime = Date.now()

    try {
      const response = await fetch(provider.testEndpoint)
      const data = await response.json()
      const responseTime = Date.now() - startTime

      setResults(prev => ({
        ...prev,
        [provider.id]: {
          status: data.success ? "success" : "error",
          message: data.message || (data.success ? "Connection successful" : "Connection failed"),
          data: data.data,
          responseTime,
          timestamp: new Date().toISOString(),
        }
      }))
    } catch (error) {
      const responseTime = Date.now() - startTime
      setResults(prev => ({
        ...prev,
        [provider.id]: {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
          responseTime,
          timestamp: new Date().toISOString(),
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [provider.id]: false }))
    }
  }

  const testAllApis = async () => {
    for (const provider of apiProviders) {
      await testApi(provider)
      // Add small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "pending":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500">Connected</Badge>
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      case "warning":
        return <Badge variant="secondary">Warning</Badge>
      case "pending":
        return <Badge variant="outline">Testing...</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const successCount = Object.values(results).filter(r => r.status === "success").length
  const totalCount = Object.keys(results).length
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">API Integration Testing</h2>
          <p className="text-gray-400">Test individual API connections and event search functionality</p>
        </div>
        <Button onClick={testAllApis} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Test All APIs
        </Button>
      </div>

      {totalCount > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Test Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{successCount}</div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalCount}</div>
                <div className="text-sm text-gray-400">Total APIs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{successRate}%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apiProviders.map((provider) => {
              const result = results[provider.id]
              const isLoading = loading[provider.id]

              return (
                <Card key={provider.id} className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>{provider.name}</span>
                      {result ? getStatusIcon(result.status) : null}
                    </CardTitle>
                    <p className="text-sm text-gray-400">{provider.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Status:</span>
                      {result ? getStatusBadge(result.status) : <Badge variant="outline">Not tested</Badge>}
                    </div>

                    {result && (
                      <>
                        <div className="text-sm text-gray-300">{result.message}</div>
                        {result.responseTime && (
                          <div className="text-xs text-gray-500">
                            Response time: {result.responseTime}ms
                          </div>
                        )}
                      </>
                    )}

                    <Button
                      onClick={() => testApi(provider)}
                      disabled={isLoading}
                      size="sm"
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? "Testing..." : "Test API"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {Object.entries(results).map(([providerId, result]) => {
            const provider = apiProviders.find(p => p.id === providerId)
            if (!provider) return null

            return (
              <Card key={providerId} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {provider.name} - Detailed Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-400">Status:</span>
                      <div>{getStatusBadge(result.status)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Response Time:</span>
                      <div className="text-white">{result.responseTime || 0}ms</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-400">Message:</span>
                    <div className="text-white">{result.message}</div>
                  </div>

                  {result.data && (
                    <div>
                      <span className="text-sm text-gray-400">Response Data:</span>
                      <pre className="text-xs text-gray-300 bg-gray-900/50 p-3 rounded mt-2 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.timestamp && (
                    <div className="text-xs text-gray-500">
                      Tested at: {new Date(result.timestamp).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
