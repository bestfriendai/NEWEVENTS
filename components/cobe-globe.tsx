"use client"

import { useEffect, useRef } from "react"
import createGlobe from "cobe"

export default function CobeGlobe() {
  const canvasRef = useRef(null)

  useEffect(() => {
    let phi = 0

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
      markerColor: [0.7, 0.3, 0.9],
      glowColor: [0.2, 0.2, 0.2],
      onRender: (state) => {
        state.phi = phi
        phi += 0.01
      },
    })

    return () => {
      globe.destroy()
    }
  }, [])

  return (
    <div style={{ width: 600, height: 600, maxWidth: "100%" }}>
      <canvas ref={canvasRef} style={{ width: 600, height: 600, maxWidth: "100%" }} />
    </div>
  )
}
