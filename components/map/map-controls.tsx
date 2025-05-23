"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, Compass, Layers, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface MapControlsProps {
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  mapStyle: string
  setMapStyle: (style: string) => void
  show3DBuildings: boolean
  setShow3DBuildings: (show: boolean) => void
  showTerrain: boolean
  setShowTerrain: (show: boolean) => void
  showClusters: boolean
  setShowClusters: (show: boolean) => void
}

export function MapControls({
  showSidebar,
  setShowSidebar,
  mapStyle,
  setMapStyle,
  show3DBuildings,
  setShow3DBuildings,
  showTerrain,
  setShowTerrain,
  showClusters,
  setShowClusters,
}: MapControlsProps) {
  return (
    <>
      {/* Toggle sidebar button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-4 left-4 z-10 bg-[#1A1D25]/80 backdrop-blur-sm hover:bg-[#1A1D25] text-white shadow-md"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <ChevronLeft /> : <ChevronRight />}
      </Button>

      {/* Map style controls */}
      <div className="absolute bottom-4 left-4 z-10">
        <TooltipProvider>
          <div className="bg-[#1A1D25]/80 backdrop-blur-sm p-2 rounded-lg shadow-md flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    mapStyle === "dark-v11" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                  )}
                  onClick={() => setMapStyle("dark-v11")}
                >
                  <span className="sr-only">Dark Mode</span>
                  <div className="h-4 w-4 rounded-full bg-gray-800 border border-gray-600"></div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Dark Mode</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    mapStyle === "light-v11" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                  )}
                  onClick={() => setMapStyle("light-v11")}
                >
                  <span className="sr-only">Light Mode</span>
                  <div className="h-4 w-4 rounded-full bg-gray-200 border border-gray-300"></div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Light Mode</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    mapStyle === "satellite-streets-v12"
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white",
                  )}
                  onClick={() => setMapStyle("satellite-streets-v12")}
                >
                  <span className="sr-only">Satellite Mode</span>
                  <div className="h-4 w-4 rounded-full bg-blue-900 border border-blue-700"></div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Satellite Mode</p>
              </TooltipContent>
            </Tooltip>

            <div className="border-t border-gray-700 my-1"></div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    show3DBuildings ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                  )}
                  onClick={() => setShow3DBuildings(!show3DBuildings)}
                >
                  <span className="sr-only">3D Buildings</span>
                  <Layers size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>3D Buildings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", showTerrain ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white")}
                  onClick={() => setShowTerrain(!showTerrain)}
                >
                  <span className="sr-only">Terrain</span>
                  <Compass size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Terrain</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    showClusters ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                  )}
                  onClick={() => setShowClusters(!showClusters)}
                >
                  <span className="sr-only">Clusters</span>
                  <Zap size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Clusters</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </>
  )
}
