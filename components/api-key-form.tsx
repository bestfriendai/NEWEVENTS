"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Key, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { hasTicketmasterApiKey, hasEventbriteApiKey, hasPredictHQApiKey } from "@/lib/env"

export function ApiKeyForm() {
  const [activeTab, setActiveTab] = useState<string>("ticketmaster")
  const [ticketmasterKey, setTicketmasterKey] = useState<string>("")
  const [eventbriteKey, setEventbriteKey] = useState<string>("")
  const [predicthqKey, setPredicthqKey] = useState<string>("")
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // In a real app, this would save to a secure storage or environment variables
      // For this demo, we'll just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message
      setSuccess(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} API key saved successfully!`)

      // In a real app, we would reload the page or update environment variables
      console.log(`Saved ${activeTab} API key`)
    } catch (err) {
      setError("Failed to save API key. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border-gray-800/50 rounded-xl overflow-hidden transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Key className="mr-2 h-5 w-5 text-purple-400" />
          Configure Event API
        </CardTitle>
        <CardDescription>Add your API keys to connect to real event data providers</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ticketmaster" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#22252F] p-1 rounded-lg mb-4">
            <TabsTrigger
              value="ticketmaster"
              className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
            >
              Ticketmaster
            </TabsTrigger>
            <TabsTrigger
              value="eventbrite"
              className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
            >
              Eventbrite
            </TabsTrigger>
            <TabsTrigger
              value="predicthq"
              className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
            >
              PredictHQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ticketmaster">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticketmaster-key">Ticketmaster API Key</Label>
                <Input
                  id="ticketmaster-key"
                  type="password"
                  placeholder="Enter your Ticketmaster API key"
                  value={ticketmasterKey}
                  onChange={(e) => setTicketmasterKey(e.target.value)}
                  className="bg-[#22252F] border-gray-800/50 text-gray-300 focus-visible:ring-purple-500/50"
                />
              </div>
              <div className="text-sm text-gray-400">
                <p>
                  You can get a Ticketmaster API key by registering at{" "}
                  <a
                    href="https://developer.ticketmaster.com/products-and-docs/apis/getting-started/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Ticketmaster Developer Portal
                  </a>
                </p>
              </div>
              {hasTicketmasterApiKey && (
                <Alert className="bg-green-500/20 border-green-500/30 text-green-200">
                  <AlertTitle>API Key Configured</AlertTitle>
                  <AlertDescription>
                    Ticketmaster API key is already configured. You can update it if needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="eventbrite">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventbrite-key">Eventbrite API Key</Label>
                <Input
                  id="eventbrite-key"
                  type="password"
                  placeholder="Enter your Eventbrite API key"
                  value={eventbriteKey}
                  onChange={(e) => setEventbriteKey(e.target.value)}
                  className="bg-[#22252F] border-gray-800/50 text-gray-300 focus-visible:ring-purple-500/50"
                />
              </div>
              <div className="text-sm text-gray-400">
                <p>
                  You can get an Eventbrite API key by registering at{" "}
                  <a
                    href="https://www.eventbrite.com/platform/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Eventbrite API Portal
                  </a>
                </p>
              </div>
              {hasEventbriteApiKey && (
                <Alert className="bg-green-500/20 border-green-500/30 text-green-200">
                  <AlertTitle>API Key Configured</AlertTitle>
                  <AlertDescription>
                    Eventbrite API key is already configured. You can update it if needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="predicthq">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="predicthq-key">PredictHQ API Key</Label>
                <Input
                  id="predicthq-key"
                  type="password"
                  placeholder="Enter your PredictHQ API key"
                  value={predicthqKey}
                  onChange={(e) => setPredicthqKey(e.target.value)}
                  className="bg-[#22252F] border-gray-800/50 text-gray-300 focus-visible:ring-purple-500/50"
                />
              </div>
              <div className="text-sm text-gray-400">
                <p>
                  You can get a PredictHQ API key by registering at{" "}
                  <a
                    href="https://docs.predicthq.com/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    PredictHQ Developer Portal
                  </a>
                </p>
              </div>
              {hasPredictHQApiKey && (
                <Alert className="bg-green-500/20 border-green-500/30 text-green-200">
                  <AlertTitle>API Key Configured</AlertTitle>
                  <AlertDescription>
                    PredictHQ API key is already configured. You can update it if needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert className="bg-red-500/20 border-red-500/30 text-red-200 mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/20 border-green-500/30 text-green-200 mt-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300"
            onClick={handleSave}
            disabled={
              isSaving ||
              (activeTab === "ticketmaster" && !ticketmasterKey) ||
              (activeTab === "eventbrite" && !eventbriteKey) ||
              (activeTab === "predicthq" && !predicthqKey)
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save API Key
              </>
            )}
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
  )
}
