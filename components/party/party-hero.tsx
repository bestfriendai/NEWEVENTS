"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export function PartyHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 z-10"></div>
      <img
        src="/party-hero.png?height=400&width=1200&query=nightclub with dj and crowd"
        alt="Party events"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-white mb-2"
        >
          Find Your Perfect Night Out
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-gray-200 mb-6 max-w-lg"
        >
          Discover the hottest parties, clubs, and music events happening near you
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-wrap gap-3"
        >
          <Badge className="bg-purple-600/80 hover:bg-purple-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
            Nightclubs
          </Badge>
          <Badge className="bg-indigo-600/80 hover:bg-indigo-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
            Live Music
          </Badge>
          <Badge className="bg-blue-600/80 hover:bg-blue-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
            DJ Sets
          </Badge>
          <Badge className="bg-pink-600/80 hover:bg-pink-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
            Festivals
          </Badge>
        </motion.div>
      </div>
    </motion.div>
  )
}
