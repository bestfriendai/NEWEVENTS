"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Filter, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdvancedFiltersProps {
  isFiltering: boolean
  handleFilter: () => void
}

export function AdvancedFilters({ isFiltering, handleFilter }: AdvancedFiltersProps) {
  return (
    <motion.div
      id="filter-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="mb-8"
    >
      <Card className="bg-[#1A1D25] border-gray-800 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Advanced Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Date Range</h3>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  className="bg-[#22252F] border-gray-800 rounded-lg text-gray-300 text-sm focus-visible:ring-purple-500"
                />
                <Input
                  type="date"
                  className="bg-[#22252F] border-gray-800 rounded-lg text-gray-300 text-sm focus-visible:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Price Range</h3>
              <div className="px-2">
                <Slider defaultValue={[0, 100]} max={200} step={5} className="mb-2" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>$0</span>
                  <span>$200+</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Event Type</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                  Nightclub
                </Badge>
                <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                  Festival
                </Badge>
                <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">Concert</Badge>
                <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                  Warehouse
                </Badge>
                <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">Rooftop</Badge>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-800" />

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-gray-800 rounded-lg mr-2"
            >
              Reset
            </Button>
            <Button
              className={cn(
                "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300",
                isFiltering && "opacity-90",
              )}
              onClick={handleFilter}
              disabled={isFiltering}
            >
              {isFiltering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
