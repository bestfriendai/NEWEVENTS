"use client"

import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface MapSidebarProps {
  events: EventDetailProps[]
  selectedEvent: EventDetailProps | null
  handleEventSelect: (event: EventDetailProps) => void
  handleViewDetails: (event: EventDetailProps) => void
  handleToggleFavorite: (id: number) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  locationName: string
  isLoadingEvents: boolean
  locationError: string | null
}

export function MapSidebar({
  events,
  selectedEvent,
  handleEventSelect,
  handleViewDetails,
  handleToggleFavorite,
  searchQuery,
  setSearchQuery,
  locationName,
  isLoadingEvents,
  locationError,
}: MapSidebarProps) {
  return (
    <motion.div
      initial={{ x: -350 }}
      animate={{ x: 0 }}
      exit={{ x: -350 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute top-0 left-0 bottom-0 w-full md:w-[350px] bg-[#1A1D25]/95 backdrop-blur-md border-r border-gray-800 z-20 overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-4">Explore Events</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Location display */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-purple-400 mr-2" />
          <span className="text-gray-\
