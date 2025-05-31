"use client"

import { motion } from "framer-motion"
import { Star, Users, Calendar, ExternalLink, Heart, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface Artist {
  id: number
  name: string
  genre: string
  image: string
  upcoming: number
  followers: string
  verified: boolean
  bio: string
}

interface FeaturedArtistsProps {
  artists: Artist[]
}

export function FeaturedArtists({ artists }: FeaturedArtistsProps) {
  return (
    <section className="mt-12 mb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Featured Artists</h2>
          </div>
          <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
            View All Artists
          </Button>
        </div>
        <p className="text-gray-400 mt-2">Discover the hottest DJs and artists in the party scene</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {artists.map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="bg-[#1A1D25] border-gray-800 hover:border-purple-500/50 transition-all duration-300 overflow-hidden group">
              <CardContent className="p-0">
                {/* Artist Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={artist.image || "/placeholder.svg"}
                    alt={artist.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Verified Badge */}
                  {artist.verified && (
                    <Badge className="absolute top-3 left-3 bg-blue-600 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}

                  {/* Play Button Overlay */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Button size="lg" className="rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg">
                      <Play className="h-6 w-6" />
                    </Button>
                  </motion.div>

                  {/* Artist Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-bold text-white text-lg mb-1">{artist.name}</h3>
                    <p className="text-purple-300 text-sm">{artist.genre}</p>
                  </div>
                </div>

                {/* Artist Details */}
                <div className="p-4">
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{artist.bio}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-gray-400">
                        <Users className="h-4 w-4 mr-1" />
                        {artist.followers}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {artist.upcoming} upcoming
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Events
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-700 hover:bg-gray-800">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-700 hover:bg-gray-800">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8"
      >
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-6 border border-purple-600/30">
          <h3 className="text-xl font-semibold text-white mb-2">Are you an artist?</h3>
          <p className="text-gray-400 mb-4">Join our platform and showcase your talent to party-goers worldwide</p>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Apply to Perform
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
