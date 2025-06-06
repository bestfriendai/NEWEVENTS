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
  const globeRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)

  useEffect(() => {
    let phi = 0
    let width = 0

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }

    window.addEventListener("resize", onResize)
    onResize()

    if (!canvasRef.current) return

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.8, 0.4, 1.0],
      glowColor: [0.8, 0.4, 1.0],
      markers: markers,
      onRender: (state) => {
        // Auto-rotation
        if (!pointerInteracting.current) {
          phi += 0.005
        }
        state.phi = phi + pointerInteractionMovement.current
      },
    })

    globeRef.current = globe
    setIsLoading(false)

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

    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab"
      canvasRef.current.addEventListener("pointerdown", onPointerDown)
      canvasRef.current.addEventListener("pointerup", onPointerUp)
      canvasRef.current.addEventListener("pointerout", onPointerOut)
      canvasRef.current.addEventListener("mousemove", onMouseMove)
    }

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
  }, [size, markers])

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, maxWidth: "100%" }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none rounded-full"></div>
    </div>
  )
}
