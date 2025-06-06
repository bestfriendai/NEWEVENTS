"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import createGlobe from "cobe"
import { Loader2, Globe, AlertCircle } from "lucide-react"

interface InteractiveGlobeProps {
  className?: string
  size?: number
  markers?: Array<{ location: [number, number]; size: number; label?: string }>
  autoRotate?: boolean
  interactive?: boolean
  theme?: "dark" | "light"
}

export default function InteractiveGlobe({ 
  className = "", 
  size = 600, 
  markers = [
    { location: [37.7595, -122.4367], size: 0.04, label: "San Francisco" },
    { location: [40.7128, -74.0060], size: 0.04, label: "New York" },
    { location: [51.5074, -0.1278], size: 0.04, label: "London" },
    { location: [35.6762, 139.6503], size: 0.04, label: "Tokyo" },
    { location: [48.8566, 2.3522], size: 0.04, label: "Paris" },
    { location: [-33.8688, 151.2093], size: 0.04, label: "Sydney" },
    { location: [19.4326, -99.1332], size: 0.04, label: "Mexico City" },
    { location: [-22.9068, -43.1729], size: 0.04, label: "Rio de Janeiro" },
    { location: [55.7558, 37.6173], size: 0.04, label: "Moscow" },
    { location: [39.9042, 116.4074], size: 0.04, label: "Beijing" },
    { location: [34.0522, -118.2437], size: 0.04, label: "Los Angeles" },
    { location: [19.076, 72.8777], size: 0.04, label: "Mumbai" },
  ],
  autoRotate = true,
  interactive = true,
  theme = "dark"
}: InteractiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)

  const initializeGlobe = useCallback(() => {
    if (!canvasRef.current) return

    try {
      let phi = 0
      let width = 0

      const onResize = () => {
        if (canvasRef.current) {
          width = canvasRef.current.offsetWidth
        }
      }

      window.addEventListener("resize", onResize)
      onResize()

      const globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: size * 2,
        height: size * 2,
        phi: 0,
        theta: 0.3,
        dark: theme === "dark" ? 1 : 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: theme === "dark" ? 6 : 8,
        baseColor: theme === "dark" ? [0.3, 0.3, 0.3] : [0.8, 0.8, 0.8],
        markerColor: [0.8, 0.4, 1.0],
        glowColor: [0.8, 0.4, 1.0],
        markers: markers,
        onRender: (state) => {
          // Auto-rotation
          if (autoRotate && !pointerInteracting.current) {
            phi += 0.005
          }
          state.phi = phi + pointerInteractionMovement.current
        },
      })

      globeRef.current = globe

      // Mouse interaction handlers
      if (interactive) {
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

        if (canvasRef.current) {
          canvasRef.current.style.cursor = "grab"
          canvasRef.current.addEventListener("pointerdown", onPointerDown)
          canvasRef.current.addEventListener("pointerup", onPointerUp)
          canvasRef.current.addEventListener("pointerout", onPointerOut)
          canvasRef.current.addEventListener("mousemove", onMouseMove)
        }

        // Cleanup function
        return () => {
          window.removeEventListener("resize", onResize)
          if (globeRef.current) {
            globeRef.current.destroy()
          }
          if (canvasRef.current) {
            canvasRef.current.removeEventListener("pointerdown", onPointerDown)
            canvasRef.current.removeEventListener("pointerup", onPointerUp)
            canvasRef.current.removeEventListener("pointerout", onPointerOut)
            canvasRef.current.removeEventListener("mousemove", onMouseMove)
          }
        }
      }

      setIsLoading(false)
      setHasError(false)

    } catch (error) {
      console.error("Failed to initialize globe:", error)
      setHasError(true)
      setIsLoading(false)
    }
  }, [size, markers, autoRotate, interactive, theme])

  useEffect(() => {
    const cleanup = initializeGlobe()
    return cleanup
  }, [initializeGlobe])

  // Fallback component for when globe fails to load
  const GlobeFallback = () => (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 flex items-center justify-center">
      <div className="text-center">
        {hasError ? (
          <>
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Globe failed to load</p>
            <button 
              onClick={() => {
                setHasError(false)
                setIsLoading(true)
                initializeGlobe()
              }}
              className="mt-2 text-purple-400 hover:text-purple-300 text-xs underline"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <Globe className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-400 text-sm">Interactive Globe</p>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, maxWidth: "100%" }}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400 text-sm">Loading Interactive Globe...</p>
          </div>
        </div>
      )}

      {/* Globe canvas or fallback */}
      {hasError ? (
        <GlobeFallback />
      ) : (
        <canvas
          ref={canvasRef}
          className={`w-full h-full transition-opacity duration-1000 ${isLoading ? "opacity-0" : "opacity-100"}`}
          style={{
            width: size,
            height: size,
            maxWidth: "100%",
            aspectRatio: "1",
            contain: "layout paint size",
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none rounded-full"></div>

      {/* Marker tooltip */}
      {hoveredMarker && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm pointer-events-none">
          {hoveredMarker}
        </div>
      )}

      {/* Controls hint */}
      {interactive && !isLoading && !hasError && (
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-gray-300 px-3 py-2 rounded-lg text-xs pointer-events-none">
          Drag to rotate
        </div>
      )}
    </div>
  )
}

// Export both components for flexibility
export { InteractiveGlobe }
export const SimpleGlobe = (props: Omit<InteractiveGlobeProps, 'interactive' | 'autoRotate'>) => (
  <InteractiveGlobe {...props} interactive={false} autoRotate={true} />
)
