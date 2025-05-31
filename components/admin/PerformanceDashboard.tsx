"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Database, Cpu, HardDrive, Network, AlertTriangle } from "lucide-react"

export function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [metrics, setMetrics] = useState({
    responseTime: 120, // ms
    cacheHitRate: 78, // percentage
    errorRate: 0.5, // percentage
    apiCalls: 245, // count
    dbQueries: 189, // count
    memoryUsage: 68, // percentage
    cpuUsage: 42, // percentage
    networkLatency: 35, // ms
  })

  // Simulate metrics changing over time
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        responseTime: Math.max(80, Math.min(200, prev.responseTime + (Math.random() - 0.5) * 20)),
        cacheHitRate: Math.max(50, Math.min(95, prev.cacheHitRate + (Math.random() - 0.5) * 5)),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.3)),
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 3),
        dbQueries: prev.dbQueries + Math.floor(Math.random() * 2),
        memoryUsage: Math.max(30, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        cpuUsage: Math.max(20, Math.min(80, prev.cpuUsage + (Math.random() - 0.5) * 8)),
        networkLatency: Math.max(20, Math.min(100, prev.networkLatency + (Math.random() - 0.5) * 10)),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number, thresholds: [number, number, number]) => {
    const [good, warning, critical] = thresholds
    if (value <= good) return "bg-green-500"
    if (value <= warning) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Response Time"
              value={`${Math.round(metrics.responseTime)} ms`}
              icon={<Clock className="h-5 w-5" />}
              status={getStatusColor(metrics.responseTime, [100, 150, 200])}
              change="-5%"
            />
            <MetricCard
              title="Cache Hit Rate"
              value={`${Math.round(metrics.cacheHitRate)}%`}
              icon={<Database className="h-5 w-5" />}
              status={getStatusColor(100 - metrics.cacheHitRate, [20, 40, 60])}
              change="+2%"
            />
            <MetricCard
              title="Error Rate"
              value={`${metrics.errorRate.toFixed(2)}%`}
              icon={<AlertTriangle className="h-5 w-5" />}
              status={getStatusColor(metrics.errorRate, [1, 2, 5])}
              change="-0.1%"
            />
            <MetricCard
              title="API Calls"
              value={metrics.apiCalls.toString()}
              icon={<Activity className="h-5 w-5" />}
              status="bg-blue-500"
              change="+24"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Performance chart would render here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">API Endpoints Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <EndpointRow endpoint="/api/events" responseTime={85} calls={124} errorRate={0.2} />
                <EndpointRow endpoint="/api/events/featured" responseTime={112} calls={56} errorRate={0} />
                <EndpointRow endpoint="/api/events/search" responseTime={178} calls={42} errorRate={1.2} />
                <EndpointRow endpoint="/api/mapbox" responseTime={95} calls={23} errorRate={0.5} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="DB Queries"
              value={metrics.dbQueries.toString()}
              icon={<Database className="h-5 w-5" />}
              status="bg-blue-500"
              change="+18"
            />
            <MetricCard
              title="Query Time (avg)"
              value="45 ms"
              icon={<Clock className="h-5 w-5" />}
              status="bg-green-500"
              change="-3 ms"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Database Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <TableRow name="events" size="2.4 GB" records="12,458" />
                <TableRow name="users" size="450 MB" records="8,932" />
                <TableRow name="favorites" size="120 MB" records="24,567" />
                <TableRow name="categories" size="5 MB" records="42" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="CPU Usage"
              value={`${Math.round(metrics.cpuUsage)}%`}
              icon={<Cpu className="h-5 w-5" />}
              status={getStatusColor(metrics.cpuUsage, [50, 70, 90])}
              change="+5%"
            />
            <MetricCard
              title="Memory Usage"
              value={`${Math.round(metrics.memoryUsage)}%`}
              icon={<HardDrive className="h-5 w-5" />}
              status={getStatusColor(metrics.memoryUsage, [60, 80, 90])}
              change="+2%"
            />
            <MetricCard
              title="Network Latency"
              value={`${Math.round(metrics.networkLatency)} ms`}
              icon={<Network className="h-5 w-5" />}
              status={getStatusColor(metrics.networkLatency, [40, 60, 80])}
              change="-3 ms"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm h-[200px] overflow-y-auto">
                <p className="text-green-400">[INFO] System started successfully</p>
                <p className="text-blue-400">[DEBUG] Cache initialized with 256MB capacity</p>
                <p className="text-yellow-400">[WARN] High memory usage detected (78%)</p>
                <p className="text-blue-400">[DEBUG] API request to /events/featured completed in 112ms</p>
                <p className="text-red-400">[ERROR] Failed to connect to external service: timeout</p>
                <p className="text-blue-400">[DEBUG] Reconnecting to external service...</p>
                <p className="text-green-400">[INFO] Successfully reconnected to external service</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
  status,
  change,
}: {
  title: string
  value: string
  icon: React.ReactNode
  status: string
  change: string
}) {
  const isPositive = change.startsWith("+")

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300`}>
              {icon}
            </div>
            <span className="font-medium text-sm">{title}</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${status}`} />
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">{value}</div>
          <div className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>{change} from last period</div>
        </div>
      </CardContent>
    </Card>
  )
}

function EndpointRow({
  endpoint,
  responseTime,
  calls,
  errorRate,
}: {
  endpoint: string
  responseTime: number
  calls: number
  errorRate: number
}) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="font-mono text-sm">{endpoint}</div>
      <div className="flex items-center space-x-6">
        <div className="flex flex-col items-end">
          <div className="text-sm font-medium">{responseTime} ms</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Response Time</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-sm font-medium">{calls}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Calls</div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-sm font-medium ${errorRate > 1 ? "text-red-500" : "text-green-500"}`}>{errorRate}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Error Rate</div>
        </div>
      </div>
    </div>
  )
}

function TableRow({
  name,
  size,
  records,
}: {
  name: string
  size: string
  records: string
}) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center space-x-2">
        <Database className="h-4 w-4 text-blue-500" />
        <span className="font-medium">{name}</span>
      </div>
      <div className="flex items-center space-x-6">
        <div>
          <Badge variant="outline">{size}</Badge>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{records} records</div>
      </div>
    </div>
  )
}
