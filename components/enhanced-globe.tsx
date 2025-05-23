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
    if (!canvasRef.current) return

    let phi = 0
    let width = 0

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
        canvasRef.current.width = width * 2
        canvasRef.current.height = width * 2
      }
    }

    window.addEventListener("resize", onResize)
    onResize()

    // Set loading to false after a short delay
    const loadingTimeout = setTimeout(() => setIsLoading(false), 200)

    const globe = createGlobe(canvasRef.current, {
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

    const onPointerDown = (e) => {
      pointerInteracting.current = e.clientX - pointerInteractionMovement.current
      canvasRef.current.style.cursor = "grabbing"
    }

    const onPointerUp = () => {
      pointerInteracting.current = null
      canvasRef.current.style.cursor = "grab"
    }

    const onPointerOut = () => {
      pointerInteracting.current = null
      canvasRef.current.style.cursor = "grab"
    }

    const onMouseMove = (e) => {
      if (pointerInteracting.current !== null) {
        const delta = e.clientX - pointerInteracting.current
        pointerInteractionMovement.current = delta / 100
      }
    }

    // Add event listeners for interaction
    canvasRef.current.addEventListener("pointerdown", onPointerDown)
    canvasRef.current.addEventListener("pointerup", onPointerUp)
    canvasRef.current.addEventListener("pointerout", onPointerOut)
    canvasRef.current.addEventListener("mousemove", onMouseMove)

    canvasRef.current.style.cursor = "grab"

    return () => {
      globe.destroy()
      clearTimeout(loadingTimeout)
      window.removeEventListener("resize", onResize)
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("pointerdown", onPointerDown)
        canvasRef.current.removeEventListener("pointerup", onPointerUp)
        canvasRef.current.removeEventListener("pointerout", onPointerOut)
        canvasRef.current.removeEventListener("mousemove", onMouseMove)
      }
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
