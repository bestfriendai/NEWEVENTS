"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamic imports for both globe types
const SimpleCobeGlobe = dynamic(() => import("@/components/simple-cobe-globe"), {
  ssr: false,
})

const CSSGlobe = dynamic(() => import("@/components/css-globe"), {
  ssr: false,
})

interface GlobeWithFallbackProps {
  size?: number
  className?: string
}

export default function GlobeWithFallback({ size = 600, className = "" }: GlobeWithFallbackProps) {
  const [globeType, setGlobeType] = useState<"loading" | "cobe" | "css">("loading")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Try to load COBE first
    const tryCobeGlobe = async () => {
      try {
        // Check if COBE is available
        const cobeModule = await import("cobe")
        if (cobeModule.default) {
          setGlobeType("cobe")
        } else {
          setGlobeType("css")
        }
      } catch (error) {
        console.warn("COBE globe failed to load, using CSS fallback:", error)
        setGlobeType("css")
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(tryCobeGlobe, 100)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading || globeType === "loading") {
    return (
      <div 
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 ${className}`}
        style={{ width: size, height: size, maxWidth: "100%" }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400 text-sm">Loading Interactive Globe...</p>
        </div>
      </div>
    )
  }

  if (globeType === "cobe") {
    return (
      <div className={className}>
        <SimpleCobeGlobe />
      </div>
    )
  }

  return (
    <div className={className}>
      <CSSGlobe size={size} />
    </div>
  )
}
