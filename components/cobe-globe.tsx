"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"

interface CobeGlobeProps {
  className?: string
  size?: number
  markers?: Array<{ location: [number, number]; size: number }>
}

export default function CobeGlobe({
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
}: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)

  useEffect(() => {
    let phi = 0
    let globe: any = null

    if (!canvasRef.current) return

    // Initialize the globe based on official COBE documentation
    globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
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
        // Called on every animation frame
        // Auto-rotation when not interacting
        if (!pointerInteracting.current) {
          phi += 0.005
        }
        state.phi = phi + pointerInteractionMovement.current
      },
    })

    setIsLoaded(true)

    // Mouse interaction handlers for dragging
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

    // Add event listeners for interaction
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab"
      canvasRef.current.addEventListener("pointerdown", onPointerDown)
      canvasRef.current.addEventListener("pointerup", onPointerUp)
      canvasRef.current.addEventListener("pointerout", onPointerOut)
      canvasRef.current.addEventListener("mousemove", onMouseMove)
    }

    // Cleanup function
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
  }, [size, markers])

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, maxWidth: "100%" }}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        style={{
          width: size,
          height: size,
          maxWidth: "100%",
          aspectRatio: "1",
        }}
      />
    </div>
  )
}
