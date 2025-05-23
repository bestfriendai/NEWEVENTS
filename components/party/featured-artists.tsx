"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Headphones, ChevronRight } from "lucide-react"

interface Artist {
  id: number
  name: string
  genre: string
  image: string
  upcoming: number
}

interface FeaturedArtistsProps {
  artists: Artist[]
}

export function FeaturedArtists({ artists }: FeaturedArtistsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mb-8"
    >
      <h2 className="text-xl font-bold text-gray-100 mb-4">Featured Artists</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {artists.map((artist, i) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
            whileHover={{ y: -5 }}
          >
            <Card className="bg-[#1A1D25] border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow-sm">
              <div className="h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D25] to-transparent z-10"></div>
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="font-bold text-gray-100">{artist.name}</h3>
                  <p className="text-sm text-gray-400">{artist.genre}</p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Headphones size={16} className="mr-2 text-purple-400" />
                    <span className="text-sm text-gray-300">{artist.upcoming} upcoming events</span>
                  </div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300 hover:bg-[#22252F] rounded-lg p-1 h-8 w-8"
                    >
                      <ChevronRight size={18} />
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
