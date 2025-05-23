"use client"

import { useEffect, useRef } from "react"
import createGlobe from "cobe"

export default function CobeGlobe() {
  const canvasRef = useRef(null)

  useEffect(() => {
    let phi = 0
    let globe: ReturnType<typeof createGlobe> | undefined

    // Only create the globe when the canvas reference is available
    if (canvasRef.current) {
      globe = createGlobe(canvasRef.current, {
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
        markerColor: [0.7, 0.3, 0.9],
        glowColor: [0.2, 0.2, 0.2],
        markers: [
          // Add some example markers
          { location: [37.7595, -122.4367], size: 0.05 }, // San Francisco
          { location: [40.7128, -74.0060], size: 0.05 },  // New York
          { location: [51.5074, -0.1278], size: 0.05 },   // London
        ],
        onRender: (state) => {
          state.phi = phi
          phi += 0.01
        },
      })
    }

    return () => {
      if (globe) {
        globe.destroy()
      }
    }
  }, [])

  return (
    <div style={{ width: 600, height: 600, maxWidth: "100%" }}>
      <canvas ref={canvasRef} style={{ width: 600, height: 600, maxWidth: "100%" }} />
    </div>
  )
}
