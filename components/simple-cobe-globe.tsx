"use client"

import { useEffect, useRef } from "react"
import createGlobe from "cobe"

export default function SimpleCobeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)

  useEffect(() => {
    let phi = 0

    if (!canvasRef.current) return

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

    return () => {
      if (globeRef.current) {
        globeRef.current.destroy()
      }
    }
  }, [])

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
