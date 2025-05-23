"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, MapPin } from "lucide-react"

export function ReviewStep() {
  return (
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
    </motion.div>
  )
}
