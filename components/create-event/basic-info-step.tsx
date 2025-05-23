"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Upload, ChevronRight } from "lucide-react"

interface BasicInfoStepProps {
  handleNextStep: () => void
}

export function BasicInfoStep({ handleNextStep }: BasicInfoStepProps) {
  return (
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
  )
}
