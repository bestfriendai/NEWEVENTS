"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"

export default function SimpleCobeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let phi = 0

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!canvasRef.current) return

      try {
        const globe = createGlobe(canvasRef.current, {
          devicePixelRatio: 2,
          width: 600 * 2,
          height: 600 * 2,
          phi: 0,
          theta: 0,
          dark: 1,
          diffuse: 1.2,
          mapSamples: 16000,
          mapBrightness: 6,
          baseColor: [0.3, 0.3, 0.3],
          markerColor: [0.8, 0.4, 1.0],
          glowColor: [0.8, 0.4, 1.0],
          markers: [
            // Add some example markers for events
            { location: [37.7595, -122.4367], size: 0.03 }, // San Francisco
            { location: [40.7128, -74.006], size: 0.03 }, // New York
            { location: [51.5074, -0.1278], size: 0.03 }, // London
            { location: [35.6762, 139.6503], size: 0.03 }, // Tokyo
            { location: [48.8566, 2.3522], size: 0.03 }, // Paris
            { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney
          ],
          onRender: (state) => {
            // Called on every animation frame.
            // `state` will be an empty object, return updated params.
            state.phi = phi
            phi += 0.005
          },
        })

        globeRef.current = globe
        setIsLoaded(true)
      } catch (error) {
        console.error("Failed to create globe:", error)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (globeRef.current) {
        globeRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="flex items-center justify-center relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          width: 600,
          height: 600,
          maxWidth: "100%",
          aspectRatio: 1,
        }}
      />
    </div>
  )
}
