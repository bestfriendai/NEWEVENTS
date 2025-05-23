"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Search } from "lucide-react"

interface SidebarHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function SidebarHeader({ searchQuery, setSearchQuery }: SidebarHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-800/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button variant="ghost" size="icon" className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300">
            <Edit className="h-4 w-4 text-purple-400" />
          </Button>
        </motion.div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          className="w-full bg-[#1A1D25]/60 border-gray-800/50 rounded-full pl-10 text-sm focus-visible:ring-purple-500/50 transition-all duration-300 placeholder:text-gray-500"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  )
}
