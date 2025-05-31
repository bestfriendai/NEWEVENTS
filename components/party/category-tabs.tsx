"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon: LucideIcon
  color: string
}

interface CategoryTabsProps {
  categories: Category[]
  activeTab: string
  setActiveTab: (tab: string) => void
  onFilterClick: () => void
}

export function CategoryTabs({ categories, activeTab, setActiveTab, onFilterClick }: CategoryTabsProps) {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive = activeTab === category.id

          return (
            <motion.div key={category.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveTab(category.id)}
                className={cn(
                  "relative overflow-hidden transition-all duration-300",
                  isActive
                    ? `${category.color} text-white border-transparent shadow-lg`
                    : "bg-[#1A1D25] border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600",
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-md"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Button>
            </motion.div>
          )
        })}
      </div>

      {/* Filter Button and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-[#1A1D25] text-gray-300">
            RapidAPI Live Events
          </Badge>
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            Party & Nightlife
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onFilterClick}
          className="border-gray-700 hover:bg-gray-800 md:hidden"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>
    </div>
  )
}
