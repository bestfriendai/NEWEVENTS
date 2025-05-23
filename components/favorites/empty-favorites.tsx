"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HeartOff } from "lucide-react"
import Link from "next/link"

interface EmptyFavoritesProps {
  searchQuery: string
}

export function EmptyFavorites({ searchQuery }: EmptyFavoritesProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1A1D25] p-4 rounded-full mb-4"
      >
        <HeartOff size={48} className="text-gray-500" />
      </motion.div>
      <h3 className="text-xl font-bold text-gray-300 mb-2">
        {searchQuery ? "No matching favorites found" : "No favorites yet"}
      </h3>
      <p className="text-gray-500 max-w-md mb-6">
        {searchQuery
          ? `We couldn't find any favorites matching "${searchQuery}". Try adjusting your search or browse all events to find something you like.`
          : "Start exploring events and save your favorites to see them here. Discover music, art, and more events happening near you."}
      </p>
      <Link href="/">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300">
            Discover Events
          </Button>
        </motion.div>
      </Link>
    </motion.div>
  )
}
