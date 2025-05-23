"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export default function ThreeGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.z = 2

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    // Initial size setup
    handleResize()
    containerRef.current.appendChild(renderer.domElement)

    // Add window resize listener
    window.addEventListener("resize", handleResize)

    // Create globe
    const geometry = new THREE.SphereGeometry(1, 64, 64)

    // Load earth texture
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load("/earth-blue-marble.png", () => {
      setIsLoading(false)
    })

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpScale: 0.05,
      shininess: 5,
    })

    const globe = new THREE.Mesh(geometry, material)
    scene.add(globe)

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 3, 5)
    scene.add(directionalLight)

    // Add purple point light
    const purpleLight = new THREE.PointLight(0x9c27b0, 1, 10)
    purpleLight.position.set(2, 0, 2)
    scene.add(purpleLight)

    // Add blue point light
    const blueLight = new THREE.PointLight(0x2196f3, 1, 10)
    blueLight.position.set(-2, 1, -2)
    scene.add(blueLight)

    // Add city markers
    const cities = [
      { name: "New York", lat: 40.7128, lng: -74.006 },
      { name: "London", lat: 51.5074, lng: -0.1278 },
      { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
      { name: "Sydney", lat: -33.8688, lng: 151.2093 },
      { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
      { name: "Cape Town", lat: -33.9249, lng: 18.4241 },
      { name: "Moscow", lat: 55.7558, lng: 37.6173 },
      { name: "Beijing", lat: 39.9042, lng: 116.4074 },
      { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
      { name: "Mumbai", lat: 19.076, lng: 72.8777 },
      { name: "Berlin", lat: 52.52, lng: 13.405 },
      { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
      { name: "Paris", lat: 48.8566, lng: 2.3522 },
      { name: "Dubai", lat: 25.2048, lng: 55.2708 },
      { name: "Singapore", lat: 1.3521, lng: 103.8198 },
    ]

    // Convert lat/lng to 3D coordinates
    const latLngToVector3 = (lat, lng) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)

      const x = -Math.sin(phi) * Math.cos(theta)
      const z = Math.sin(phi) * Math.sin(theta)
      const y = Math.cos(phi)

      return new THREE.Vector3(x, y, z)
    }

    // Add markers for each city
    cities.forEach((city) => {
      const position = latLngToVector3(city.lat, city.lng)
      const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16)
      const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x9c27b0 })
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)

      marker.position.copy(position)
      marker.position.multiplyScalar(1.02) // Slightly above surface
      globe.add(marker)
    })

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = false
    controls.enablePan = false
    controls.rotateSpeed = 0.5
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      window.removeEventListener("resize", handleResize)

      // Dispose resources
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full h-full transition-opacity duration-1000 ${isLoading ? "opacity-0" : "opacity-100"}`}
        style={{ filter: "drop-shadow(0 0 30px rgba(156, 39, 176, 0.3))" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none"></div>
    </div>
  )
}
