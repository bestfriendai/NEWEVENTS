"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Image as ImageIcon, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import Image from "next/image"

interface ImageTestResult {
  success: boolean
  data?: {
    stats: {
      totalEvents: number
      eventsWithRealImages: number
      eventsWithFallback: number
      imageSourceBreakdown: {
        ticketmaster: number
        eventbrite: number
        rapidapi: number
        fallback: number
        unknown: number
      }
    }
    events: Array<{
      id: number
      title: string
      image: string
      hasRealImage: boolean
      imageSource: string
    }>
    searchResult: {
      totalCount: number
      sources: string[]
      cached: boolean
    }
  }
  error?: string
}

export default function TestImagesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImageTestResult | null>(null)
  const [location, setLocation] = useState("Washington DC")
  const [limit, setLimit] = useState(10)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test-images?location=${encodeURIComponent(location)}&limit=${limit}`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Image Extraction Test</h1>
          <p className="text-gray-300">Testing image fetching from RapidAPI and Ticketmaster</p>
        </div>

        {/* Test Controls */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location" className="text-gray-300">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <Label htmlFor="limit" className="text-gray-300">Number of Events</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  min="1"
                  max="50"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={runTest} 
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            {result.success && result.data ? (
              <>
                {/* Statistics */}
                <Card className="bg-gray-800/50 border-gray-700 mb-8">
                  <CardHeader>
                    <CardTitle className="text-white">Image Extraction Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{result.data.stats.totalEvents}</div>
                        <div className="text-gray-400">Total Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{result.data.stats.eventsWithRealImages}</div>
                        <div className="text-gray-400">With Real Images</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{result.data.stats.eventsWithFallback}</div>
                        <div className="text-gray-400">Using Fallback</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {Math.round((result.data.stats.eventsWithRealImages / result.data.stats.totalEvents) * 100)}%
                        </div>
                        <div className="text-gray-400">Success Rate</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">Image Sources:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.data.stats.imageSourceBreakdown).map(([source, count]) => (
                          <Badge 
                            key={source} 
                            variant={count > 0 ? "default" : "secondary"}
                            className={count > 0 ? "bg-purple-600" : "bg-gray-600"}
                          >
                            {source}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-400">
                      Sources: {result.data.searchResult.sources.join(", ")} | 
                      Cached: {result.data.searchResult.cached ? "Yes" : "No"}
                    </div>
                  </CardContent>
                </Card>

                {/* Event Images Grid */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Event Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.data.events.map((event) => (
                        <div key={event.id} className="bg-gray-700/50 rounded-lg p-4">
                          <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                            <Image
                              src={event.image}
                              alt={event.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-white font-medium text-sm line-clamp-2">{event.title}</h4>
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={event.hasRealImage ? "default" : "secondary"}
                                className={event.hasRealImage ? "bg-green-600" : "bg-red-600"}
                              >
                                {event.hasRealImage ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {event.imageSource}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-400 break-all">
                              {event.image}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-red-900/20 border-red-800">
                <CardContent className="p-6">
                  <div className="flex items-center text-red-400">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Test Failed</span>
                  </div>
                  <p className="text-red-300 mt-2">{result.error}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
