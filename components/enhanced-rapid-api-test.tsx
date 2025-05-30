"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, AlertCircle, MapPin, Calendar, Clock, ExternalLink, Search, Info } from "lucide-react"
import { searchEvents, getEventDetails } from "@/lib/api/events-api"
import type { EventDetail } from "@/types/event.types"
import { logger } from "@/lib/utils/logger"

export function EnhancedRapidApiTest() {
  const [searchKeyword, setSearchKeyword] = useState("concerts")
  const [searchLocation, setSearchLocation] = useState("san-francisco")
  const [eventId, setEventId] = useState(
    "L2F1dGhvcml0eS9ob3Jpem9uL2NsdXN0ZXJlZF9ldmVudC8yMDI0LTA2LTE0fDEwNDI0MTY1NDYxNzYzMzMzNTg4",
  )
  const [searchResults, setSearchResults] = useState<EventDetail[]>([])
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingDetail, setIsFetchingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)

  // Function to search for events
  const handleSearch = async () => {
    setIsSearching(true)
    setError(null)
    setSearchResults([])
    setApiResponse(null)

    try {
      const result = await searchEvents({
        keyword: searchKeyword,
        location: searchLocation,
        size: 10,
      })

      logger.info("Search results received", {
        component: "EnhancedRapidApiTest",
        action: "search_events_success",
        metadata: { eventCount: result.events.length }
      })
      setSearchResults(result.events)

      // Store the raw API response for debugging
      setApiResponse({
        totalCount: result.totalCount,
        page: result.page,
        totalPages: result.totalPages,
        events: result.events,
        sources: result.sources,
      })

      if (result.events.length === 0) {
        setError("No events found. Try different search terms.")
      }
    } catch (err) {
      logger.error("Error searching events", {
        component: "EnhancedRapidApiTest",
        action: "search_events_error"
      }, err instanceof Error ? err : new Error(String(err)))
      setError(`Error searching events: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSearching(false)
    }
  }

  // Function to get event details
  const handleGetEventDetail = async () => {
    if (!eventId) {
      setDetailError("Please enter an event ID")
      return
    }

    setIsFetchingDetail(true)
    setDetailError(null)
    setEventDetail(null)

    try {
      const result = await getEventDetails(eventId)
      logger.info("Event detail received", {
        component: "EnhancedRapidApiTest",
        action: "get_event_detail_success",
        metadata: { eventId }
      })

      if (result) {
        setEventDetail(result)
      } else {
        setDetailError("Event not found or error retrieving event details")
      }
    } catch (err) {
      logger.error("Error getting event detail", {
        component: "EnhancedRapidApiTest",
        action: "get_event_detail_error",
        metadata: { eventId }
      }, err instanceof Error ? err : new Error(String(err)))
      setDetailError(`Error getting event detail: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsFetchingDetail(false)
    }
  }

  // Function to make a direct API call for testing
  const handleDirectApiCall = async () => {
    setIsSearching(true)
    setError(null)
    setApiResponse(null)

    try {
      // Build the URL for the API call using the exact format from your examples
      const baseUrl = "https://real-time-events-search.p.rapidapi.com/search-events"
      const queryParams = new URLSearchParams()

      // Format query like "concerts in san-francisco"
      if (searchKeyword && searchLocation) {
        queryParams.append("query", `${searchKeyword} in ${searchLocation}`)
      } else if (searchKeyword) {
        queryParams.append("query", searchKeyword)
      } else if (searchLocation) {
        queryParams.append("query", `events in ${searchLocation}`)
      } else {
        queryParams.append("query", "concerts in san-francisco")
      }

      queryParams.append("date", "any")
      queryParams.append("is_virtual", "false")
      queryParams.append("start", "0")

      const url = `${baseUrl}?${queryParams.toString()}`
      logger.info("Making direct API call", {
        component: "EnhancedRapidApiTest",
        action: "direct_api_call",
        metadata: { url }
      })

      // Make the API call with the exact headers you provided
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": "92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9",
          "x-rapidapi-host": "real-time-events-search.p.rapidapi.com",
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      logger.info("Direct API response received", {
        component: "EnhancedRapidApiTest",
        action: "direct_api_response_success",
        metadata: { status: response.status }
      })
      setApiResponse(data)

      // Process the events if available
      if (data.status === "OK" && data.data) {
        const events = Array.isArray(data.data) ? data.data : [data.data]
        logger.info("Events found in direct API response", {
          component: "EnhancedRapidApiTest",
          action: "direct_api_events_found",
          metadata: { eventCount: events.length }
        })

        // Transform events to our format for display
        const transformedEvents = events.map((event: any) => ({
          id: Math.floor(Math.random() * 10000),
          title: event.name || "Untitled Event",
          description: event.description || "No description available.",
          category: event.tags?.[0] || "Event",
          date: event.start_time ? new Date(event.start_time).toLocaleDateString() : "Date TBA",
          time: event.start_time ? new Date(event.start_time).toLocaleTimeString() : "Time TBA",
          location: event.venue?.name || "Venue TBA",
          address: event.venue?.full_address || "Address TBA",
          price: event.ticket_links?.length > 0 ? "Tickets Available" : "Price TBA",
          image: event.thumbnail || "/community-event.png",
          organizer: {
            name: event.venue?.name || event.publisher || "Event Organizer",
            avatar: "/avatar-1.png",
          },
          attendees: Math.floor(Math.random() * 1000) + 50,
          isFavorite: false,
          coordinates:
            event.venue?.latitude && event.venue?.longitude
              ? {
                  lat: Number(event.venue.latitude),
                  lng: Number(event.venue.longitude),
                }
              : undefined,
          ticketLinks: event.ticket_links || [],
        }))

        setSearchResults(transformedEvents)
      } else {
        setError("No events found or invalid API response format")
      }
    } catch (err) {
      logger.error("Error making direct API call", {
        component: "EnhancedRapidApiTest",
        action: "direct_api_call_error"
      }, err instanceof Error ? err : new Error(String(err)))
      setError(`Error making direct API call: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RapidAPI Events Integration Test</h1>
      <p className="text-gray-500 mb-8">
        This page tests the integration with the RapidAPI Events API using real event data. The API key is configured
        and ready to use.
      </p>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search Events</TabsTrigger>
          <TabsTrigger value="detail">Event Detail</TabsTrigger>
          <TabsTrigger value="direct">Direct API Call</TabsTrigger>
        </TabsList>

        {/* Search Events Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Events</CardTitle>
              <CardDescription>Search for events by keyword and location using the RapidAPI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="keyword" className="text-sm font-medium">
                      Keyword
                    </label>
                    <Input
                      id="keyword"
                      placeholder="e.g., concerts, festivals"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium">
                      Location
                    </label>
                    <Input
                      id="location"
                      placeholder="e.g., san-francisco, new-york"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Example searches: &quot;concerts in san-francisco&quot;, &quot;festivals in new-york&quot;, &quot;theater in chicago&quot;
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Events
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Search Results</h2>
              <p className="text-gray-500 mb-4">Found {searchResults.length} events</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((event, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="h-48 overflow-hidden relative">
                      <Image
                        src={event.image || "/community-event.png"}
                        alt={event.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge>{event.category}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{event.time}</span>
                      </div>
                      {event.coordinates && (
                        <div className="text-xs text-gray-500 mt-2">
                          Coordinates: {event.coordinates.lat.toFixed(6)}, {event.coordinates.lng.toFixed(6)}
                        </div>
                      )}
                      {event.ticketLinks && event.ticketLinks.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Ticket Links:</div>
                          <div className="space-y-1">
                            {event.ticketLinks.slice(0, 2).map((link: any, i: number) => (
                              <a
                                key={i}
                                href={link.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {link.source}
                              </a>
                            ))}
                            {event.ticketLinks.length > 2 && (
                              <div className="text-xs text-gray-500">+{event.ticketLinks.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* API Response Debug */}
          {apiResponse && (
            <div className="mt-8">
              <Separator className="my-4" />
              <h3 className="text-xl font-bold mb-2">API Response Debug</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Event Detail Tab */}
        <TabsContent value="detail">
          <Card>
            <CardHeader>
              <CardTitle>Get Event Detail</CardTitle>
              <CardDescription>Retrieve details for a specific event by ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label htmlFor="eventId" className="text-sm font-medium">
                  Event ID
                </label>
                <Input
                  id="eventId"
                  placeholder="Enter event ID"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Example: L2F1dGhvcml0eS9ob3Jpem9uL2NsdXN0ZXJlZF9ldmVudC8yMDI0LTA2LTE0fDEwNDI0MTY1NDYxNzYzMzMzNTg4
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGetEventDetail} disabled={isFetchingDetail} className="w-full">
                {isFetchingDetail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Info className="mr-2 h-4 w-4" />
                    Get Event Detail
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Error message */}
          {detailError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{detailError}</AlertDescription>
            </Alert>
          )}

          {/* Event detail */}
          {eventDetail && (
            <div className="mt-8">
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3 relative">
                    <Image
                      src={eventDetail.image || "/community-event.png"}
                      alt={eventDetail.title}
                      width={400}
                      height={256}
                      style={{ objectFit: 'cover' }}
                      className="w-full h-64"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold">{eventDetail.title}</h2>
                      <Badge>{eventDetail.category}</Badge>
                    </div>

                    <div className="space-y-4">
                      <p className="text-gray-700">{eventDetail.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">{eventDetail.date}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">{eventDetail.time}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">{eventDetail.location}</span>
                          </div>
                          <div className="text-sm text-gray-700">{eventDetail.address}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Organizer:</div>
                          <div className="flex items-center">
                            <Image
                              src={eventDetail.organizer.avatar || "/placeholder.svg"}
                              alt={eventDetail.organizer.name}
                              width={24}
                              height={24}
                              className="rounded-full mr-2"
                            />
                            <span className="text-sm">{eventDetail.organizer.name}</span>
                          </div>
                          <div className="text-sm font-medium">Price:</div>
                          <div className="text-sm">{eventDetail.price}</div>
                          {eventDetail.coordinates && (
                            <div className="text-xs text-gray-500 mt-2">
                              Coordinates: {eventDetail.coordinates.lat.toFixed(6)},{" "}
                              {eventDetail.coordinates.lng.toFixed(6)}
                            </div>
                          )}
                        </div>
                      </div>

                      {eventDetail.ticketLinks && eventDetail.ticketLinks.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Ticket Links:</div>
                          <div className="space-y-2">
                            {eventDetail.ticketLinks.map((link, i) => (
                              <a
                                key={i}
                                href={link.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {link.source}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Debug information */}
              <div className="mt-4">
                <Separator className="my-4" />
                <h3 className="text-xl font-bold mb-2">Event Detail Debug</h3>
                <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(eventDetail, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Direct API Call Tab */}
        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle>Direct API Call</CardTitle>
              <CardDescription>Make a direct call to the RapidAPI endpoint with your exact headers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="direct-keyword" className="text-sm font-medium">
                      Keyword
                    </label>
                    <Input
                      id="direct-keyword"
                      placeholder="e.g., concerts, festivals"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="direct-location" className="text-sm font-medium">
                      Location
                    </label>
                    <Input
                      id="direct-location"
                      placeholder="e.g., san-francisco, new-york"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <strong>API Headers:</strong>
                  <br />
                  x-rapidapi-key: 92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9
                  <br />
                  x-rapidapi-host: real-time-events-search.p.rapidapi.com
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleDirectApiCall} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calling API...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Make Direct API Call
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* API Response Debug */}
          {apiResponse && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-2">Raw API Response</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
