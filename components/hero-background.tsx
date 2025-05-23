"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"
import { gsap } from "gsap"

export default function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const timeRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Initialize camera with wider field of view
    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 25
    cameraRef.current = camera

    // Initialize renderer with better quality
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio for performance
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Create multiple particle systems for layered effect
    createParticleSystem(scene, 3000, 100, [0.4, 0.1, 0.6], 0.2, 0.6) // Background layer
    createParticleSystem(scene, 1500, 70, [0.6, 0.2, 0.8], 0.3, 0.8) // Middle layer
    createParticleSystem(scene, 800, 50, [0.8, 0.3, 1.0], 0.4, 1.0) // Foreground layer

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add directional light with better positioning
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Add point lights for more dynamic lighting
    const purpleLight = new THREE.PointLight(0x9c27b0, 2, 50)
    purpleLight.position.set(-15, 10, 10)
    scene.add(purpleLight)

    const blueLight = new THREE.PointLight(0x2196f3, 2, 50)
    blueLight.position.set(15, -10, 10)
    scene.add(blueLight)

    // Create nebula-like effect with fog
    scene.fog = new THREE.FogExp2(0x0a0b10, 0.015)

    // Mouse move event
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener("mousemove", handleMouseMove)

    // Resize event with debounce
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (!cameraRef.current || !rendererRef.current) return
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }, 200)
    }
    window.addEventListener("resize", handleResize)

    // Animation
    const animate = () => {
      timeRef.current += 0.001

      // Update all particle systems
      scene.children.forEach((child) => {
        if (child instanceof THREE.Points) {
          // Different rotation speeds for each layer
          child.rotation.x += 0.0001 + (child.userData.speed || 0)
          child.rotation.y += 0.0002 + (child.userData.speed || 0)

          // Subtle pulsing effect
          const scale = 1 + Math.sin(timeRef.current * 2) * 0.03 * (child.userData.pulseIntensity || 1)
          child.scale.set(scale, scale, scale)

          // Responsive to mouse movement
          child.rotation.x += mouseRef.current.y * 0.0002 * (child.userData.mouseResponsiveness || 1)
          child.rotation.y += mouseRef.current.x * 0.0002 * (child.userData.mouseResponsiveness || 1)

          // Update colors for some particles
          if (child.userData.colorShift) {
            const positions = child.geometry.attributes.position.array
            const colors = child.geometry.attributes.color.array

            for (let i = 0; i < colors.length; i += 3) {
              // Subtle color shifting over time
              const idx = i / 3
              const phase = timeRef.current + idx * 0.0001

              colors[i] = Math.max(0.3, Math.min(0.9, colors[i] + Math.sin(phase) * 0.001))
              colors[i + 1] = Math.max(0.1, Math.min(0.5, colors[i + 1] + Math.cos(phase) * 0.001))
              colors[i + 2] = Math.max(0.4, Math.min(1.0, colors[i + 2] + Math.sin(phase + 1) * 0.001))
            }

            child.geometry.attributes.color.needsUpdate = true
          }
        }
      })

      // Animate lights
      if (scene.children.length > 3) {
        const purpleLight = scene.children[3] as THREE.PointLight
        const blueLight = scene.children[4] as THREE.PointLight

        if (purpleLight && purpleLight.isPointLight) {
          purpleLight.position.x = Math.sin(timeRef.current) * 20
          purpleLight.position.y = Math.cos(timeRef.current) * 15
          purpleLight.intensity = 2 + Math.sin(timeRef.current * 2) * 0.5
        }

        if (blueLight && blueLight.isPointLight) {
          blueLight.position.x = Math.cos(timeRef.current) * 20
          blueLight.position.y = Math.sin(timeRef.current) * 15
          blueLight.intensity = 2 + Math.cos(timeRef.current * 2) * 0.5
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Initial animation
    gsap.fromTo(camera.position, { z: 40 }, { z: 25, duration: 2.5, ease: "power3.out" })

    // Animate scene children
    scene.children.forEach((child, index) => {
      if (child instanceof THREE.Points) {
        gsap.fromTo(
          child.rotation,
          { x: -Math.PI / 4, y: -Math.PI / 4 },
          {
            x: 0,
            y: 0,
            duration: 2 + index * 0.5,
            ease: "power3.out",
          },
        )

        gsap.fromTo(
          child.material,
          { opacity: 0 },
          {
            opacity: child.userData.opacity || 0.8,
            duration: 3 + index * 0.5,
            ease: "power2.out",
          },
        )
      }
    })

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimeout)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }

      // Dispose all resources
      scene.children.forEach((child) => {
        if (child instanceof THREE.Points) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })

      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  // Helper function to create particle systems with different properties
  function createParticleSystem(
    scene: THREE.Scene,
    count: number,
    size: number,
    colorBase: [number, number, number],
    speed: number,
    opacity: number,
  ) {
    const particlesGeometry = new THREE.BufferGeometry()
    const posArray = new Float32Array(count * 3)
    const colorsArray = new Float32Array(count * 3)
    const sizesArray = new Float32Array(count)

    // Create positions, colors, and sizes for particles
    for (let i = 0; i < count; i++) {
      // Position - create a spherical distribution
      const radius = 30 + Math.random() * 40
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      posArray[i * 3 + 2] = radius * Math.cos(phi)

      // Colors - purple to pink gradient with variation
      colorsArray[i * 3] = colorBase[0] + Math.random() * 0.3 // R value
      colorsArray[i * 3 + 1] = colorBase[1] + Math.random() * 0.2 // G value
      colorsArray[i * 3 + 2] = colorBase[2] + Math.random() * 0.3 // B value

      // Varied sizes for depth effect
      sizesArray[i] = (0.5 + Math.random() * 0.5) * (size / 100)
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3))
    particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizesArray, 1))

    // Create shader material for better looking particles
    const particlesMaterial = new THREE.PointsMaterial({
      size: size / 1000,
      vertexColors: true,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(particlesGeometry, particlesMaterial)

    // Store custom properties for animation
    particles.userData = {
      speed: speed / 100,
      opacity: opacity,
      pulseIntensity: Math.random() * 0.5 + 0.5,
      mouseResponsiveness: Math.random() * 0.5 + 0.5,
      colorShift: Math.random() > 0.5,
    }

    scene.add(particles)
    return particles
  }

  return <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden="true" />
}
