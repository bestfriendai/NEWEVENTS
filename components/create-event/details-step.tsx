"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { DollarSign, Users, Calendar } from "lucide-react"

export function DetailsStep() {
  return (
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
              <Input placeholder="Enter tags separated by commas" className="bg-[#22252F] border-gray-800 text-white" />
              <p className="text-xs text-gray-400">Tags help people discover your event</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
