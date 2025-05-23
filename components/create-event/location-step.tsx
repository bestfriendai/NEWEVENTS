"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationPicker } from "@/components/location-picker"
import { MapPin } from "lucide-react"

interface LocationStepProps {
  eventLocation: { address: string; lat: number; lng: number } | null
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void
}

export function LocationStep({ eventLocation, onLocationSelect }: LocationStepProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border-gray-800/50 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Event Location</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Location Type</Label>
              <Tabs defaultValue="physical">
                <TabsList className="bg-[#22252F] p-1 rounded-lg">
                  <TabsTrigger
                    value="physical"
                    className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
                  >
                    Physical Location
                  </TabsTrigger>
                  <TabsTrigger
                    value="online"
                    className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
                  >
                    Online Event
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="physical" className="mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Venue Name</Label>
                      <Input placeholder="Enter venue name" className="bg-[#22252F] border-gray-800 text-white" />
                    </div>

                    <div className="space-y-2">
                      <Label>Location</Label>
                      <LocationPicker onLocationSelect={onLocationSelect} />
                    </div>

                    {eventLocation && (
                      <div className="p-4 bg-[#22252F] rounded-lg">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-purple-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-white">{eventLocation.address}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Lat: {eventLocation.lat.toFixed(6)}, Lng: {eventLocation.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="online" className="mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select>
                        <SelectTrigger className="bg-[#22252F] border-gray-800 text-white">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#22252F] border-gray-800 text-white">
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="meet">Google Meet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Meeting Link</Label>
                      <Input placeholder="https://" className="bg-[#22252F] border-gray-800 text-white" />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="require-registration" />
                      <Label htmlFor="require-registration">Require registration</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
