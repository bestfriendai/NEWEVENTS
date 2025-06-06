"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Filter, 
  X, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star,
  Users,
  Zap,
  TrendingUp,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SmartEventFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  onApply: () => void
  onClear: () => void
  className?: string
}

interface EventFilters {
  categories: string[]
  priceRange: [number, number]
  dateRange: { from: Date | null; to: Date | null }
  distance: number
  timeOfDay: string[]
  eventType: string[]
  minRating: number
  hasTickets: boolean
  isFree: boolean
  isAccessible: boolean
  hasParking: boolean
  allowsChildren: boolean
  sortBy: string
  showOnlyFeatured: boolean
}

const CATEGORIES = [
  { name: "Music", icon: "🎵", color: "bg-purple-500" },
  { name: "Arts", icon: "🎨", color: "bg-pink-500" },
  { name: "Sports", icon: "⚽", color: "bg-green-500" },
  { name: "Food", icon: "🍕", color: "bg-orange-500" },
  { name: "Business", icon: "💼", color: "bg-blue-500" },
  { name: "Technology", icon: "💻", color: "bg-indigo-500" },
  { name: "Health", icon: "🏥", color: "bg-red-500" },
  { name: "Education", icon: "📚", color: "bg-yellow-500" },
  { name: "Entertainment", icon: "🎭", color: "bg-teal-500" },
  { name: "Community", icon: "👥", color: "bg-gray-500" },
]

const TIME_OF_DAY = [
  { value: "morning", label: "Morning (6AM-12PM)", icon: "🌅" },
  { value: "afternoon", label: "Afternoon (12PM-6PM)", icon: "☀️" },
  { value: "evening", label: "Evening (6PM-12AM)", icon: "🌆" },
  { value: "night", label: "Night (12AM-6AM)", icon: "🌙" },
]

const EVENT_TYPES = [
  { value: "indoor", label: "Indoor", icon: "🏢" },
  { value: "outdoor", label: "Outdoor", icon: "🌳" },
  { value: "virtual", label: "Virtual", icon: "💻" },
  { value: "hybrid", label: "Hybrid", icon: "🔄" },
]

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant", icon: "🎯" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "popularity", label: "Most Popular", icon: "🔥" },
  { value: "price_low", label: "Price: Low to High", icon: "💰" },
  { value: "price_high", label: "Price: High to Low", icon: "💎" },
  { value: "distance", label: "Distance", icon: "📍" },
  { value: "rating", label: "Highest Rated", icon: "⭐" },
]

export function SmartEventFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  className
}: SmartEventFiltersProps) {
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters)
  const [activeTab, setActiveTab] = useState<"basic" | "advanced" | "preferences">("basic")

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilter = useCallback(<K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleCategory = useCallback((category: string) => {
    setLocalFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }, [])

  const toggleTimeOfDay = useCallback((time: string) => {
    setLocalFilters(prev => ({
      ...prev,
      timeOfDay: prev.timeOfDay.includes(time)
        ? prev.timeOfDay.filter(t => t !== time)
        : [...prev.timeOfDay, time]
    }))
  }, [])

  const toggleEventType = useCallback((type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      eventType: prev.eventType.includes(type)
        ? prev.eventType.filter(t => t !== type)
        : [...prev.eventType, type]
    }))
  }, [])

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters)
    onApply()
    onClose()
  }, [localFilters, onFiltersChange, onApply, onClose])

  const handleClear = useCallback(() => {
    const clearedFilters: EventFilters = {
      categories: [],
      priceRange: [0, 500],
      dateRange: { from: null, to: null },
      distance: 25,
      timeOfDay: [],
      eventType: [],
      minRating: 0,
      hasTickets: false,
      isFree: false,
      isAccessible: false,
      hasParking: false,
      allowsChildren: false,
      sortBy: "relevance",
      showOnlyFeatured: false,
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onClear()
  }, [onFiltersChange, onClear])

  const getActiveFiltersCount = useCallback(() => {
    let count = 0
    if (localFilters.categories.length > 0) count++
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 500) count++
    if (localFilters.dateRange.from || localFilters.dateRange.to) count++
    if (localFilters.distance !== 25) count++
    if (localFilters.timeOfDay.length > 0) count++
    if (localFilters.eventType.length > 0) count++
    if (localFilters.minRating > 0) count++
    if (localFilters.hasTickets || localFilters.isFree || localFilters.isAccessible || 
        localFilters.hasParking || localFilters.allowsChildren || localFilters.showOnlyFeatured) count++
    return count
  }, [localFilters])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={cn(
            "bg-[#1A1D25] border border-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Smart Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()} active
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-1 mt-4">
              {[
                { id: "basic", label: "Basic", icon: Filter },
                { id: "advanced", label: "Advanced", icon: Zap },
                { id: "preferences", label: "Preferences", icon: Star },
              ].map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={activeTab === id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(id as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {activeTab === "basic" && (
                <motion.div
                  key="basic"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Categories */}
                  <div>
                    <Label className="text-white mb-3 block">Categories</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {CATEGORIES.map((category) => (
                        <Button
                          key={category.name}
                          variant={localFilters.categories.includes(category.name) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCategory(category.name)}
                          className="justify-start"
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-white mb-3 block">
                      Price Range: ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
                    </Label>
                    <Slider
                      value={localFilters.priceRange}
                      onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
                      max={500}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>Free</span>
                      <span>$500+</span>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="mr-2 h-4 w-4" />
                            {localFilters.dateRange.from 
                              ? localFilters.dateRange.from.toLocaleDateString() 
                              : "Select date"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={localFilters.dateRange.from || undefined}
                            onSelect={(date) => updateFilter("dateRange", { 
                              ...localFilters.dateRange, 
                              from: date || null 
                            })}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="mr-2 h-4 w-4" />
                            {localFilters.dateRange.to 
                              ? localFilters.dateRange.to.toLocaleDateString() 
                              : "Select date"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={localFilters.dateRange.to || undefined}
                            onSelect={(date) => updateFilter("dateRange", { 
                              ...localFilters.dateRange, 
                              to: date || null 
                            })}
                            disabled={(date) => date < (localFilters.dateRange.from || new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Distance */}
                  <div>
                    <Label className="text-white mb-3 block">
                      Search Radius: {localFilters.distance} km
                    </Label>
                    <Slider
                      value={[localFilters.distance]}
                      onValueChange={(value) => updateFilter("distance", value[0])}
                      max={100}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === "advanced" && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Time of Day */}
                  <div>
                    <Label className="text-white mb-3 block">Time of Day</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_OF_DAY.map((time) => (
                        <Button
                          key={time.value}
                          variant={localFilters.timeOfDay.includes(time.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleTimeOfDay(time.value)}
                          className="justify-start"
                        >
                          <span className="mr-2">{time.icon}</span>
                          {time.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Event Type */}
                  <div>
                    <Label className="text-white mb-3 block">Event Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENT_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          variant={localFilters.eventType.includes(type.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleEventType(type.value)}
                          className="justify-start"
                        >
                          <span className="mr-2">{type.icon}</span>
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <Label className="text-white mb-3 block">
                      Minimum Rating: {localFilters.minRating} stars
                    </Label>
                    <Slider
                      value={[localFilters.minRating]}
                      onValueChange={(value) => updateFilter("minRating", value[0])}
                      max={5}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  {/* Sort By */}
                  <div>
                    <Label className="text-white mb-3 block">Sort By</Label>
                    <Select value={localFilters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {activeTab === "preferences" && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Quick Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "isFree", label: "Free Events Only", icon: "💰" },
                      { key: "hasTickets", label: "Has Available Tickets", icon: "🎫" },
                      { key: "showOnlyFeatured", label: "Featured Events Only", icon: "⭐" },
                      { key: "isAccessible", label: "Wheelchair Accessible", icon: "♿" },
                      { key: "hasParking", label: "Has Parking", icon: "🅿️" },
                      { key: "allowsChildren", label: "Family Friendly", icon: "👨‍👩‍👧‍👦" },
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{icon}</span>
                          <Label className="text-white">{label}</Label>
                        </div>
                        <Switch
                          checked={localFilters[key as keyof EventFilters] as boolean}
                          onCheckedChange={(checked) => updateFilter(key as keyof EventFilters, checked as any)}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Footer Actions */}
          <div className="border-t border-gray-800 p-4 flex justify-between">
            <Button variant="outline" onClick={handleClear}>
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply} className="bg-purple-600 hover:bg-purple-700">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
