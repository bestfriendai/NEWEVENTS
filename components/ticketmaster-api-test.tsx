"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { searchTicketmasterEvents, getTicketmasterEventDetails } from "@/lib/api/ticketmaster-api"
import type { EventDetailProps } from "@/components/event-detail-modal"

export default function TicketmasterApiTest() {
  const [searchResults, setSearchResults] = useState<EventDetailProps[]>([])
  const [eventDetails, setEventDetails] = useState<EventDetailProps | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search form state
  const [keyword, setKeyword] = useState("concerts")
  const [location, setLocation] = useState("San Francisco")
  const [radius, setRadius] = useState("25")

  // Event details form state
  const [eventId, setEventId] = useState("")

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setSearchResults([])

    try {
      const result = await searchTicketmasterEvents({
        keyword,
        location,
        radius: Number.parseInt(radius),
        size: 10,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSearchResults(result.events)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGetEventDetails = async () => {
    if (!eventId.trim()) {
      setError("Please enter an event ID")
      return
    }

    setLoading(true)
    setError(null)
    setEventDetails(null)

    try {
      const details = await getTicketmasterEventDetails(eventId.trim())
      if (details) {
        setEventDetails(details)
      } else {
        setError("Event not found")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Ticketmaster API Test</h1>
        <p className="text-muted-foreground">Test the Ticketmaster Discovery API integration</p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Event Search</TabsTrigger>
          <TabsTrigger value="details">Event Details</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Events</CardTitle>
              <CardDescription>Search for events using the Ticketmaster API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Keyword</label>
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g., concerts, sports, theater"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., San Francisco, New York"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Radius (miles)</label>
                  <Input value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="25" type="number" />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                {loading ? "Searching..." : "Search Events"}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({searchResults.length} events)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                          <p className="text-sm">
                            {event.date} • {event.time}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="secondary">{event.category}</Badge>
                          <p className="text-sm font-medium">{event.price}</p>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                      {event.ticketLinks && event.ticketLinks.length > 0 && (
                        <div className="flex gap-2">
                          {event.ticketLinks.map((link, index) => (
                            <a
                              key={index}
                              href={link.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              {link.source}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Get Event Details</CardTitle>
              <CardDescription>Get detailed information about a specific event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Event ID</label>
                <Input
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="Enter Ticketmaster event ID"
                />
              </div>
              <Button onClick={handleGetEventDetails} disabled={loading} className="w-full">
                {loading ? "Loading..." : "Get Event Details"}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {eventDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{eventDetails.title}</h3>
                      <p className="text-muted-foreground">{eventDetails.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{eventDetails.price}</p>
                      <p className="text-sm text-muted-foreground">{eventDetails.attendees} interested</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p>
                      <strong>Date:</strong> {eventDetails.date}
                    </p>
                    <p>
                      <strong>Time:</strong> {eventDetails.time}
                    </p>
                    <p>
                      <strong>Location:</strong> {eventDetails.location}
                    </p>
                    <p>
                      <strong>Address:</strong> {eventDetails.address}
                    </p>
                  </div>

                  {eventDetails.description && (
                    <div>
                      <strong>Description:</strong>
                      <p className="mt-1 text-muted-foreground">{eventDetails.description}</p>
                    </div>
                  )}

                  {eventDetails.coordinates && (
                    <div>
                      <strong>Coordinates:</strong>
                      <p className="text-sm text-muted-foreground">
                        {eventDetails.coordinates.lat}, {eventDetails.coordinates.lng}
                      </p>
                    </div>
                  )}

                  {eventDetails.ticketLinks && eventDetails.ticketLinks.length > 0 && (
                    <div>
                      <strong>Ticket Links:</strong>
                      <div className="flex gap-2 mt-1">
                        {eventDetails.ticketLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200"
                          >
                            {link.source}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
