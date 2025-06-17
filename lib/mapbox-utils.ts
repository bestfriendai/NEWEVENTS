"use client"

// This is a stub file that doesn't actually load Mapbox
// All functions are no-ops or return dummy values

export function loadMapbox(): Promise<any> {
  return Promise.resolve({})
}

export function isMapboxAvailable(): boolean {
  return false
}

export function getMapbox(): any | null {
  return null
}

export function createMap(): Promise<any> {
  return Promise.resolve({})
}

export function createMarker(): Promise<any> {
  return Promise.resolve({})
}

export function createPopup(): Promise<any> {
  return Promise.resolve({})
}

export function useMapbox() {
  return {
    loadMapbox,
    isMapboxAvailable,
    getMapbox,
    createMap,
    createMarker,
    createPopup,
  }
}

export function cleanupMap() {
  // No-op
}

export function resetMapbox() {
  // No-op
}
