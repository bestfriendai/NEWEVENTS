"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LocationPicker } from "@/components/location-picker"
import { Calendar, Clock, Upload, MapPin, DollarSign, Users, Check, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

export default function CreateEventPage() {
  const [activeStep, setActiveStep] = useState(1)
  const [eventLocation, setEventLocation] = useState<{ address: string; lat: number; lng: number } | null>(null)

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setEventLocation(location)
  }

  const handleNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, 4))
  }

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Create New Event</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    step < activeStep
                      ? "bg-green-500 text-white"
                      : step === activeStep
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {step < activeStep ? <Check className="h-5 w-5" /> : step}
                </div>
                <span className={`text-sm ${step === activeStep ? "text-purple-400" : "text-gray-400"}`}>
                  {step === 1 && "Basic Info"}
                  {step === 2 && "Location"}
                  {step === 3 && "Details"}
                  {step === 4 && "Review"}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Line */}
          <div className="relative max-w-2xl mx-auto mt-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 rounded-full"></div>
            <div
              className="absolute top-0 left-0 h-1 bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${(activeStep - 1) * 33.33}%` }}
            ></div>
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Basic Info */}
          {activeStep === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border-gray-800/50 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="event-title">Event Title</Label>
                      <Input
                        id="event-title"
                        placeholder="Enter event title"
                        className="bg-[#22252F] border-gray-800 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-description">Event Description</Label>
                      <Textarea
                        id="event-description"
                        placeholder="Describe your event"
                        className="bg-[#22252F] border-gray-800 text-white min-h-[120px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Event Category</Label>
                      <Select>
                        <SelectTrigger className="bg-[#22252F] border-gray-800 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#22252F] border-gray-800 text-white">
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="arts">Arts & Theater</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="comedy">Comedy</SelectItem>
                          <SelectItem value="food">Food & Drink</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Event Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <Input type="date" className="bg-[#22252F] border-gray-800 text-white pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Event Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <Input type="time" className="bg-[#22252F] border-gray-800 text-white pl-10" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Event Image</Label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-400 mb-2">Drag and drop an image, or click to browse</p>
                        <Button variant="outline" className="border-gray-700 text-gray-300">
                          Upload Image
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {activeStep === 2 && (
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
                              <Input
                                placeholder="Enter venue name"
                                className="bg-[#22252F] border-gray-800 text-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Location</Label>
                              <LocationPicker onLocationSelect={handleLocationSelect} />
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

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handlePrevStep} className="border-gray-700 text-gray-300">
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Details */}
          {activeStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border-gray-800/50 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Event Details</h2>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Ticket Information</Label>
                      <Tabs defaultValue="free">
                        <TabsList className="bg-[#22252F] p-1 rounded-lg">
                          <TabsTrigger
                            value="free"
                            className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
                          >
                            Free Event
                          </TabsTrigger>
                          <TabsTrigger
                            value="paid"
                            className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
                          >
                            Paid Event
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="free" className="mt-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Maximum Attendees</Label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                  type="number"
                                  placeholder="Enter maximum number of attendees"
                                  className="bg-[#22252F] border-gray-800 text-white pl-10"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch id="require-registration-free" />
                              <Label htmlFor="require-registration-free">Require registration</Label>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="paid" className="mt-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Ticket Price</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                  type="number"
                                  placeholder="Enter ticket price"
                                  className="bg-[#22252F] border-gray-800 text-white pl-10"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Available Tickets</Label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                  type="number"
                                  placeholder="Enter number of available tickets"
                                  className="bg-[#22252F] border-gray-800 text-white pl-10"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Ticket Sale End Date</Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input type="date" className="bg-[#22252F] border-gray-800 text-white pl-10" />
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Information</Label>
                      <Textarea
                        placeholder="Enter any additional information about your event"
                        className="bg-[#22252F] border-gray-800 text-white min-h-[120px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <Input
                        placeholder="Enter tags separated by commas"
                        className="bg-[#22252F] border-gray-800 text-white"
                      />
                      <p className="text-xs text-gray-400">Tags help people discover your event</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handlePrevStep} className="border-gray-700 text-gray-300">
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {activeStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border-gray-800/50 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Review Your Event</h2>

                  <div className="space-y-6">
                    {/* Preview would go here */}
                    <div className="bg-[#22252F] rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Event Preview</h3>
                      <p className="text-gray-400 mb-4">This is how your event will appear to others.</p>

                      {/* Mock event card */}
                      <div className="bg-[#1A1D25] rounded-lg overflow-hidden">
                        <div className="h-48 bg-gray-800"></div>
                        <div className="p-4">
                          <div className="text-xs font-medium text-purple-400 mb-2">Music</div>
                          <h4 className="text-white font-medium mb-2">Your Event Title</h4>
                          <div className="flex items-center text-gray-400 text-sm mb-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>May 22, 2025</span>
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>Event Location</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="terms" />
                        <Label htmlFor="terms">I agree to the terms and conditions</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="privacy" />
                        <Label htmlFor="privacy">I understand my event will be public</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handlePrevStep} className="border-gray-700 text-gray-300">
                  Back
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                  Create Event
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
