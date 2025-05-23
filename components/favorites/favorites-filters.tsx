"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, SlidersHorizontal } from "lucide-react"

interface FavoritesFiltersProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isSearching: boolean
  handleSearch: () => void
}

export function FavoritesFilters({ activeTab, setActiveTab, isSearching, handleSearch }: FavoritesFiltersProps) {
  return (
    <>
      {/* Favorites header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-100">Your Saved Events</h2>
          <div className="flex items-center">
            <Button
              variant="outline"
              className="bg-[#1A1D25] hover:bg-[#22252F] text-gray-300 border-gray-800 rounded-xl transition-colors duration-300 mr-2"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4 text-purple-400" />
                  Search
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-[#1A1D25] hover:bg-[#22252F] text-gray-300 border-gray-800 rounded-xl transition-colors duration-300"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4 text-purple-400" />
              Sort
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Favorites tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-6"
      >
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#1A1D25] p-1 rounded-xl mb-6 w-full grid grid-cols-3 sm:grid-cols-5">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="music"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              Music
            </TabsTrigger>
            <TabsTrigger
              value="art"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              Art
            </TabsTrigger>
            <TabsTrigger
              value="other"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              Other
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>
    </>
  )
}
