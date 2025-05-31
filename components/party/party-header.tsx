"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Menu, Bell, User, Heart, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface PartyHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  onFilterClick?: () => void
}

export function PartyHeader({ searchQuery, setSearchQuery, onFilterClick }: PartyHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [notifications] = useState(3) // Mock notification count

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-[#0F1116]/95 backdrop-blur-md border-b border-gray-800"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-6">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                PartyHub
              </span>
            </motion.div>

            {/* Navigation Links - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Events
              </Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Artists
              </Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Venues
              </Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Calendar
              </Button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search parties, DJs, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={cn(
                  "pl-10 pr-4 bg-[#1A1D25] border-gray-700 text-white placeholder-gray-400 transition-all duration-200",
                  isSearchFocused && "border-purple-500 ring-1 ring-purple-500",
                )}
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ×
                </motion.button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Filter Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              className="border-gray-700 hover:bg-gray-800 hidden sm:flex"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center p-0">
                      {notifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#1A1D25] border-gray-700">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-semibold text-white">Notifications</h3>
                </div>
                <DropdownMenuItem className="p-3 hover:bg-gray-800">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-white">New party near you!</p>
                      <p className="text-xs text-gray-400">Electronic night at Club Pulse</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 hover:bg-gray-800">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-white">DJ Pulse is performing tonight</p>
                      <p className="text-xs text-gray-400">At The Warehouse, 11 PM</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="p-3 text-center text-purple-400 hover:bg-gray-800">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatar-1.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1A1D25] border-gray-700">
                <DropdownMenuItem className="hover:bg-gray-800">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">
                  <Calendar className="mr-2 h-4 w-4" />
                  My Events
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">
                  <MapPin className="mr-2 h-4 w-4" />
                  Nearby Venues
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="hover:bg-gray-800 text-red-400">Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#1A1D25] border-gray-700">
                <DropdownMenuItem className="hover:bg-gray-800">Events</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Artists</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Venues</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800">Calendar</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={onFilterClick} className="hover:bg-gray-800">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
