"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"
import { logger } from "@/lib/utils/logger"

export default function SimpleCobeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    let phi = 0

    if (!canvasRef.current) return

    try {
      globeRef.current = createGlobe(canvasRef.current, {
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
        markerColor: [0.1, 0.8, 1],
        glowColor: [1, 1, 1],
        markers: [
          // Major cities around the world
          { location: [37.7595, -122.4367], size: 0.03 }, // San Francisco
          { location: [40.7128, -74.006], size: 0.1 }, // New York
          { location: [51.5074, -0.1278], size: 0.1 }, // London
          { location: [48.8566, 2.3522], size: 0.1 }, // Paris
          { location: [35.6762, 139.6503], size: 0.1 }, // Tokyo
          { location: [-33.8688, 151.2093], size: 0.1 }, // Sydney
          { location: [55.7558, 37.6173], size: 0.1 }, // Moscow
          { location: [28.6139, 77.209], size: 0.1 }, // Delhi
          { location: [-23.5505, -46.6333], size: 0.1 }, // São Paulo
          { location: [19.4326, -99.1332], size: 0.1 }, // Mexico City
        ],
        onRender: (state) => {
          // Called on every animation frame.
          // `state` will be an empty object, return updated params.
          state.phi = phi
          phi += 0.01
        },
      })
    } catch (error) {
      logger.warn("Error creating COBE globe", {
        component: "SimpleCobeGlobe",
        action: "globe_creation_error",
        error: error instanceof Error ? error.message : String(error)
      })
      setHasError(true)
    }

    return () => {
      try {
        if (globeRef.current) {
          globeRef.current.destroy()
        }
      } catch (error) {
        logger.warn("Error destroying COBE globe", {
          component: "SimpleCobeGlobe",
          action: "globe_destroy_error",
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }, [])

  if (hasError) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-[600px] h-[600px] max-w-full aspect-square rounded-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Interactive Globe</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
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
