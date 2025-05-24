"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"
import { useTheme } from "next-themes"

export default function EnhancedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let phi = 0
    let width = 0

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth
        canvas.width = width * 2
        canvas.height = width * 2
      }
    }

    window.addEventListener("resize", onResize)
    onResize()

    // Set loading to false after a short delay
    const loadingTimeout = setTimeout(() => setIsLoading(false), 200)

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: isDarkTheme ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.8, 0.4, 1.0],
      glowColor: [0.8, 0.4, 1.0],
      markers: [
        // Add some example markers for major cities
        { location: [37.7595, -122.4367], size: 0.05 }, // San Francisco
        { location: [40.7128, -74.0060], size: 0.05 },  // New York
        { location: [51.5074, -0.1278], size: 0.05 },   // London
        { location: [35.6762, 139.6503], size: 0.05 },  // Tokyo
        { location: [-33.8688, 151.2093], size: 0.05 }, // Sydney
        { location: [19.4326, -99.1332], size: 0.05 },  // Mexico City
        { location: [-22.9068, -43.1729], size: 0.05 }, // Rio de Janeiro
      ],
      onRender: (state) => {
        // This prevents rotation when dragging
        if (!pointerInteracting.current) {
          phi += 0.005
        }
        state.phi = phi + pointerInteractionMovement.current
        state.width = width * 2
        state.height = width * 2
      },
    })

    const onPointerDown = (e: PointerEvent) => {
      pointerInteracting.current = e.clientX - pointerInteractionMovement.current
      if (canvas) {
        canvas.style.cursor = "grabbing"
      }
    }

    const onPointerUp = () => {
      pointerInteracting.current = null
      if (canvas) {
        canvas.style.cursor = "grab"
      }
    }

    const onPointerOut = () => {
      pointerInteracting.current = null
      if (canvas) {
        canvas.style.cursor = "grab"
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (pointerInteracting.current !== null) {
        const delta = e.clientX - pointerInteracting.current
        pointerInteractionMovement.current = delta / 100
      }
    }

    // Add event listeners for interaction
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointerout", onPointerOut)
    canvas.addEventListener("mousemove", onMouseMove)
    canvas.style.cursor = "grab"

    return () => {
      globe.destroy()
      clearTimeout(loadingTimeout)
      window.removeEventListener("resize", onResize)
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("pointerout", onPointerOut)
      canvas.removeEventListener("mousemove", onMouseMove)
    }
  }, [isDarkTheme])

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-1000 ${isLoading ? "opacity-0" : "opacity-100"}`}
        style={{
          width: "100%",
          height: "100%",
          contain: "layout paint size",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
    </div>
  )
}
