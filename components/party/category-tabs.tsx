"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter } from "lucide-react"

interface CategoryTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  onFilterClick: () => void
}

export function CategoryTabs({ activeTab, setActiveTab, onFilterClick }: CategoryTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-100">Party Events</h2>
        <Button
          variant="outline"
          className="bg-[#1A1D25] hover:bg-[#22252F] text-gray-300 border-gray-800 rounded-xl transition-colors duration-300"
          onClick={onFilterClick}
        >
          <Filter className="mr-2 h-4 w-4 text-purple-400" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1A1D25] p-1 rounded-xl mb-6 w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="techno"
            className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
          >
            Techno
          </TabsTrigger>
          <TabsTrigger
            value="house"
            className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
          >
            House
          </TabsTrigger>
          <TabsTrigger
            value="hiphop"
            className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
          >
            Hip-Hop
          </TabsTrigger>
          <TabsTrigger
            value="dnb"
            className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
          >
            Drum & Bass
          </TabsTrigger>
          <TabsTrigger
            value="retro"
            className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
          >
            Retro
          </TabsTrigger>
          <TabsTrigger
            value="festival"
            className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
          >
            Festivals
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </motion.div>
  )
}
