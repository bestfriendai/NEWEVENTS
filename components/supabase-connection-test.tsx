"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [serverStatus, setServerStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [serverError, setServerError] = useState<string>("")
  const [databaseInfo, setDatabaseInfo] = useState<any>(null)
  const [serverInfo, setServerInfo] = useState<any>(null)

  const testConnection = async () => {
    setConnectionStatus("testing")
    setErrorMessage("")
    setDatabaseInfo(null)

    try {
      // Create Supabase client
      const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      // Test basic connection by trying to query the database
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .limit(1)

      if (error) {
        throw new Error(`Connection failed: ${error.message}`)
      }

      setDatabaseInfo({
        tablesFound: data?.length || 0,
        sampleTable: data?.[0]?.table_name || null,
        connectionTest: "successful"
      })

      setConnectionStatus("success")
    } catch (error) {
      console.error("Supabase connection test failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred")
      setConnectionStatus("error")
    }
  }

  const testServerConnection = async () => {
    setServerStatus("testing")
    setServerError("")
    setServerInfo(null)

    try {
      const response = await fetch('/api/test-supabase')
      const result = await response.json()

      if (result.success) {
        setServerInfo(result)
        setServerStatus("success")
      } else {
        setServerError(result.error || "Server test failed")
        setServerStatus("error")
      }
    } catch (error) {
      console.error("Server connection test failed:", error)
      setServerError(error instanceof Error ? error.message : "Unknown error occurred")
      setServerStatus("error")
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "testing":
        return <Badge variant="secondary">Testing...</Badge>
      case "success":
        return <Badge variant="default" className="bg-green-500">Connected</Badge>
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  const getServerStatusIcon = () => {
    switch (serverStatus) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getServerStatusBadge = () => {
    switch (serverStatus) {
      case "testing":
        return <Badge variant="secondary">Testing...</Badge>
      case "success":
        return <Badge variant="default" className="bg-green-500">Connected</Badge>
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Supabase Connection Test
        </CardTitle>
        <CardDescription>
          Test the connection to your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Client-Side Connection</p>
              <p className="text-xs text-muted-foreground">
                URL: {env.NEXT_PUBLIC_SUPABASE_URL}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          <Button
            onClick={testConnection}
            disabled={connectionStatus === "testing"}
            className="w-full"
          >
            {connectionStatus === "testing" ? "Testing Client Connection..." : "Test Client Connection"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Server-Side Connection</p>
              <p className="text-xs text-muted-foreground">
                Tests server-side Supabase client
              </p>
            </div>
            {getServerStatusBadge()}
          </div>

          <Button
            onClick={testServerConnection}
            disabled={serverStatus === "testing"}
            className="w-full"
            variant="outline"
          >
            {serverStatus === "testing" ? "Testing Server Connection..." : "Test Server Connection"}
          </Button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 font-medium">Client Error:</p>
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 font-medium">Server Error:</p>
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        {databaseInfo && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600 font-medium">Client Connection Successful!</p>
            <pre className="text-xs text-green-600 mt-2 overflow-auto">
              {JSON.stringify(databaseInfo, null, 2)}
            </pre>
          </div>
        )}

        {serverInfo && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600 font-medium">Server Connection Successful!</p>
            <pre className="text-xs text-green-600 mt-2 overflow-auto">
              {JSON.stringify(serverInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Database URL:</strong> {env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p><strong>Anon Key:</strong> {env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
        </div>
      </CardContent>
    </Card>
  )
}
