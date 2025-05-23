"use client"

import { useState } from "react"
import { testRapidApiConnection } from "@/lib/api/events-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function ApiConnectionTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runTest = async () => {
    setTesting(true)
    setResult(null)
    setError(null)

    try {
      const isConnected = await testRapidApiConnection()
      setResult(isConnected)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setResult(false)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test RapidAPI Connection"
          )}
        </Button>

        {result !== null && (
          <Alert variant={result ? "default" : "destructive"}>
            {result ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{result ? "API connection successful!" : "API connection failed"}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
