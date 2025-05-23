"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Heart, Music, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PartyHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function PartyHeader({ searchQuery, setSearchQuery }: PartyHeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0F1116] z-10"
    >
      <div className="flex items-center">
        <Link href="/">
          <Button variant="ghost" className="mr-2 text-gray-400 hover:text-gray-200 p-1">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-2 rounded-xl mr-2 shadow-glow-sm"
        >
          <Music size={18} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400"
        >
          Party & Music Events
        </motion.h1>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            className="w-full bg-[#1A1D25] border-gray-800 rounded-xl pl-10 text-sm focus-visible:ring-purple-500 transition-all duration-300"
            placeholder="Search for events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Link href="/favorites">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="bg-[#0F1116] hover:bg-[#1A1D25] text-gray-400 border-gray-800 rounded-xl transition-colors duration-300"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1A1D25] border-gray-800 text-gray-300">
                <p>View your saved events</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Link>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-glow-sm cursor-pointer"
        >
          <span className="text-sm font-medium text-white">DA</span>
        </motion.div>
      </div>
    </motion.header>
  )
}
