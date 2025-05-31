"use client"

/**
 * Performance Dashboard Component
 * Real-time monitoring of app performance, cache, and user metrics
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Database, 
  Zap, 
  Users, 
  Clock, 
  TrendingUp,
  Server,
  Wifi,
  BarChart3,
  RefreshCw,
  Download,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import { useQueryClient } from '@tanstack/react-query'
import { advancedCache } from '@/lib/cache/advanced-cache'
import { cn } from '@/lib/utils'

interface PerformanceDashboardProps {
  className?: string
  refreshInterval?: number
}

export function PerformanceDashboard({ 
  className,
  refreshInterval = 5000 
}: PerformanceDashboardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const queryClient = useQueryClient()
  const {
    metrics,
    events,
    isMonitoring,
    performanceScore,
    trackApiCall,
    exportMetrics
  } = usePerformanceMonitor()

  // Get cache statistics
  const cacheStats = advancedCache.getStats()
  
  // Get query client statistics
  const getQueryStats = () => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.error !== null).length,
    }
  }

  const queryStats = getQueryStats()

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Trigger re-render to update stats
      setIsVisible(prev => !prev)
      setTimeout(() => setIsVisible(prev => !prev), 50)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Calculate performance grade
  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 80) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (score >= 60) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const performanceGrade = getPerformanceGrade(performanceScore)

  // Export performance data
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      performance: exportMetrics(),
      cache: cacheStats,
      queries: queryStats,
      system: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        memory: metrics.memoryUsage
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Performance Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
              performanceGrade.bg,
              performanceGrade.color
            )}>
              {performanceGrade.grade}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Score: {performanceScore}/100</span>
                <Badge variant={performanceScore >= 80 ? "default" : "destructive"}>
                  {isMonitoring ? 'Monitoring' : 'Stopped'}
                </Badge>
              </div>
              <Progress value={performanceScore} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Page Load Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Page Load</span>
            </div>
            <div className="text-2xl font-bold">
              {formatDuration(metrics.pageLoadTime || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target: &lt; 2s
            </p>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(cacheStats.hitRate * 100)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {cacheStats.hits} hits / {cacheStats.hits + cacheStats.misses} total
            </p>
          </CardContent>
        </Card>

        {/* Active Queries */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Active Queries</span>
            </div>
            <div className="text-2xl font-bold">
              {queryStats.activeQueries}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {queryStats.totalQueries} total queries
            </p>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Network</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.connectionType || 'Unknown'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.isOnline ? 'Online' : 'Offline'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Web Vitals */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">First Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatDuration(metrics.firstContentfulPaint || 0)}
                </div>
                <Progress 
                  value={Math.min(100, ((metrics.firstContentfulPaint || 0) / 1800) * 100)} 
                  className="mt-2 h-1"
                />
                <p className="text-xs text-gray-500 mt-1">Target: &lt; 1.8s</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Largest Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatDuration(metrics.largestContentfulPaint || 0)}
                </div>
                <Progress 
                  value={Math.min(100, ((metrics.largestContentfulPaint || 0) / 2500) * 100)} 
                  className="mt-2 h-1"
                />
                <p className="text-xs text-gray-500 mt-1">Target: &lt; 2.5s</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cumulative Layout Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {(metrics.cumulativeLayoutShift || 0).toFixed(3)}
                </div>
                <Progress 
                  value={Math.min(100, ((metrics.cumulativeLayoutShift || 0) / 0.25) * 100)} 
                  className="mt-2 h-1"
                />
                <p className="text-xs text-gray-500 mt-1">Target: &lt; 0.1</p>
              </CardContent>
            </Card>
          </div>

          {/* Memory Usage */}
          {metrics.memoryUsage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Used</div>
                    <div className="text-lg font-semibold">
                      {formatBytes(metrics.memoryUsage.usedJSHeapSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-semibold">
                      {formatBytes(metrics.memoryUsage.totalJSHeapSize)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Limit</div>
                    <div className="text-lg font-semibold">
                      {formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}
                    </div>
                  </div>
                </div>
                <Progress 
                  value={(metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit) * 100}
                  className="mt-4 h-2"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cache Details */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{cacheStats.hits}</div>
                <div className="text-sm text-gray-500">Cache Hits</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{cacheStats.misses}</div>
                <div className="text-sm text-gray-500">Cache Misses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{cacheStats.size}</div>
                <div className="text-sm text-gray-500">Cache Size</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{cacheStats.evictions}</div>
                <div className="text-sm text-gray-500">Evictions</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Query Details */}
        <TabsContent value="queries" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{queryStats.totalQueries}</div>
                <div className="text-sm text-gray-500">Total Queries</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{queryStats.activeQueries}</div>
                <div className="text-sm text-gray-500">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{queryStats.staleQueries}</div>
                <div className="text-sm text-gray-500">Stale</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{queryStats.errorQueries}</div>
                <div className="text-sm text-gray-500">Errors</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Events */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Performance Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.slice(0, 10).map((event, index) => (
                  <motion.div
                    key={`${event.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-sm">{event.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.duration ? formatDuration(event.duration) : '—'}
                    </div>
                  </motion.div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No performance events recorded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
