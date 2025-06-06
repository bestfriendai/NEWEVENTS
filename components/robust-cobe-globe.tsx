"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle, RotateCcw } from "lucide-react"

interface RobustCobeGlobeProps {
  className?: string
  size?: number
  markers?: Array<{ location: [number, number]; size: number }>
}

export default function RobustCobeGlobe({ 
  className = "", 
  size = 600, 
  markers = [
    { location: [37.7595, -122.4367], size: 0.03 }, // San Francisco
    { location: [40.7128, -74.0060], size: 0.03 },  // New York
    { location: [51.5074, -0.1278], size: 0.03 },   // London
    { location: [35.6762, 139.6503], size: 0.03 },  // Tokyo
    { location: [48.8566, 2.3522], size: 0.03 },    // Paris
    { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney
    { location: [19.4326, -99.1332], size: 0.03 },  // Mexico City
    { location: [-22.9068, -43.1729], size: 0.03 }, // Rio de Janeiro
  ]
}: RobustCobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const [retryCount, setRetryCount] = useState(0)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)

  const initializeGlobe = async () => {
    if (!canvasRef.current) return

    try {
      setStatus("loading")
      
      // Dynamic import of COBE
      const { default: createGlobe } = await import("cobe")
      
      let phi = 0
      let globe: any = null

      // Initialize the globe with official COBE configuration
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: size * 2,
        height: size * 2,
        phi: 0,
        theta: 0,
        dark: 1, // Dark theme
        diffuse: 1.2,
        scale: 1,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [1, 0.5, 1], // Purple markers
        glowColor: [1, 1, 1],
        offset: [0, 0],
        markers: markers,
        onRender: (state) => {
          // Auto-rotation when not interacting
          if (!pointerInteracting.current) {
            phi += 0.005
          }
          state.phi = phi + pointerInteractionMovement.current
        },
      })

      // Mouse interaction handlers
      const onPointerDown = (e: PointerEvent) => {
        pointerInteracting.current = e.clientX - pointerInteractionMovement.current
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grabbing"
        }
      }

      const onPointerUp = () => {
        pointerInteracting.current = null
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grab"
        }
      }

      const onPointerOut = () => {
        pointerInteracting.current = null
        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grab"
        }
      }

      const onMouseMove = (e: MouseEvent) => {
        if (pointerInteracting.current !== null) {
          const delta = e.clientX - pointerInteracting.current
          pointerInteractionMovement.current = delta * 0.01
        }
      }

      // Add event listeners
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grab"
        canvasRef.current.addEventListener("pointerdown", onPointerDown)
        canvasRef.current.addEventListener("pointerup", onPointerUp)
        canvasRef.current.addEventListener("pointerout", onPointerOut)
        canvasRef.current.addEventListener("mousemove", onMouseMove)
      }

      setStatus("loaded")

      // Return cleanup function
      return () => {
        if (globe) {
          globe.destroy()
        }
        if (canvasRef.current) {
          canvasRef.current.removeEventListener("pointerdown", onPointerDown)
          canvasRef.current.removeEventListener("pointerup", onPointerUp)
          canvasRef.current.removeEventListener("pointerout", onPointerOut)
          canvasRef.current.removeEventListener("mousemove", onMouseMove)
        }
      }

    } catch (error) {
      console.error("Failed to initialize COBE globe:", error)
      setStatus("error")
    }
  }

  useEffect(() => {
    const cleanup = initializeGlobe()
    return () => {
      if (cleanup) {
        cleanup.then(cleanupFn => cleanupFn?.())
      }
    }
  }, [size, markers, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400 text-sm">Loading Interactive Globe...</p>
              {retryCount > 0 && (
                <p className="text-gray-500 text-xs mt-2">Attempt {retryCount + 1}</p>
              )}
            </div>
          </div>
        )

      case "error":
        return (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-4">Failed to load globe</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )

      case "loaded":
        return (
          <canvas
            ref={canvasRef}
            className="transition-opacity duration-500 opacity-100"
            style={{
              width: size,
              height: size,
              maxWidth: "100%",
              aspectRatio: "1",
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      {/* Background container */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30" />
      
      {/* Content */}
      {renderContent()}
      
      {/* Glow effects */}
      {status === "loaded" && (
        <>
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Interactive hint */}
      {status === "loaded" && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-gray-300 px-3 py-2 rounded-lg text-xs pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
          Drag to rotate
        </div>
      )}
    </div>
  )
}
