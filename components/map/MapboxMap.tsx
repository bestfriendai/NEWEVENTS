"use client"

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, AlertCircle, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventDetailProps } from "@/components/event-detail-modal"

declare global {
  interface Window {
    mapboxgl: any;
    selectEvent: (eventId: string) => void;
  }
}

interface MapboxMapProps {
  events: EventDetailProps[];
  userLocation: { lat: number; lng: number; name: string } | null;
  selectedEvent?: EventDetailProps | null;
  onEventSelect?: (event: EventDetailProps) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface MapMarker {
  marker: any;
  popup: any;
  event: EventDetailProps;
}

export default function MapboxMap({
  events,
  userLocation,
  selectedEvent,
  onEventSelect,
  onError,
  className,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<MapMarker[]>([]);
  const userMarker = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/dark-v11");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapboxgl, setMapboxgl] = useState<any>(null);

  // Load Mapbox GL JS and CSS
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        // Dynamically import Mapbox GL
        const mapboxglModule = await import('mapbox-gl');
        setMapboxgl(mapboxglModule.default);
        
        // Set access token
        mapboxglModule.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';
        
        // Store on window for use in callbacks
        window.mapboxgl = mapboxglModule.default;
        
        // Load CSS
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        
        return () => {
          document.head.removeChild(link);
        };
      } catch (error) {
        console.error('Error loading Mapbox GL:', error);
        onError?.('Failed to load map. Please check your internet connection.');
      }
    };
    
    loadMapbox();
    
    return () => {
      // Clean up global reference
      if (window.mapboxgl) {
        delete window.mapboxgl;
      }
      // Clean up global event handler
      if (window.selectEvent) {
        delete window.selectEvent;
      }
    };
  }, [onError]);
  
  // Initialize map when Mapbox GL is loaded and user location is available
  useEffect(() => {
    if (!mapboxgl || !mapContainer.current || !userLocation || map.current) return;
    
    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
        attributionControl: false,
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add attribution control
      map.current.addControl(
        new mapboxgl.AttributionControl({
          compact: true,
        }),
        'bottom-right'
      );
      
      map.current.on('load', () => {
        setMapLoaded(true);
      });
      
      // Add user location marker
      addUserMarker();
      
      // Set up global event handler for popup buttons
      window.selectEvent = (eventId: string) => {
        const event = events.find(e => e.id.toString() === eventId);
        if (event) {
          onEventSelect?.(event);
        }
      };
      
      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      onError?.('Failed to initialize map. Please check your Mapbox configuration.');
    }
  }, [mapboxgl, userLocation, mapStyle, onError, onEventSelect, events]);
  
  // Add user location marker
  const addUserMarker = () => {
    if (!map.current || !userLocation || !mapboxgl) return;
    
    // Remove existing marker
    if (userMarker.current) {
      userMarker.current.remove();
    }
    
    // Create marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'user-location-marker';
    markerElement.innerHTML = `
      <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
    `;
    
    // Create marker
    userMarker.current = new mapboxgl.Marker(markerElement)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
    
    // Add popup
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setHTML(`
        <div class="bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span class="font-medium">Your Location</span>
          </div>
          <p class="text-sm text-gray-300 mt-1">${userLocation.name}</p>
        </div>
      `);
    
    userMarker.current.setPopup(popup);
  };
  
  // Create event markers
  const createEventMarker = (event: EventDetailProps) => {
    if (!map.current || !event.coordinates || !mapboxgl) return null;
    
    // Create marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'event-marker';
    
    // Set marker color based on event type or other criteria
    const isFeatured = 'isFeatured' in event && (event as any).isFeatured;
    const categoryColors = {
      music: 'from-purple-600 to-blue-600',
      arts: 'from-pink-600 to-rose-600',
      sports: 'from-green-600 to-emerald-600',
      food: 'from-orange-600 to-red-600',
      business: 'from-gray-600 to-slate-600',
      education: 'from-blue-600 to-cyan-600',
      nightlife: 'from-yellow-600 to-orange-600',
    };
    
    const category = (event.category || '').toLowerCase() as keyof typeof categoryColors;
    const categoryColor = categoryColors[category] || 'from-purple-500 to-pink-500';
    
    markerElement.innerHTML = `
      <div class="relative group cursor-pointer">
        <div class="w-6 h-6 bg-gradient-to-r ${categoryColor} rounded-full border-2 border-white shadow-lg transform transition-all duration-200 group-hover:scale-110 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        ${isFeatured ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white"></div>' : ''}
      </div>
    `;
    
    // Create popup content
    const popupContent = `
      <div class="bg-gray-900 text-white p-4 rounded-lg border border-gray-700 max-w-sm">
        <div class="flex items-start space-x-3">
          <img 
            src="${event.image || '/placeholder.svg?height=60&width=60&text=Event'}" 
            alt="${event.title}"
            class="w-16 h-16 object-cover rounded-lg"
          />
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-white text-sm line-clamp-2 mb-1">${event.title}</h3>
            <div class="space-y-1 text-xs text-gray-300">
              <div class="flex items-center">
                <svg class="w-3 h-3 mr-1 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>${event.date}</span>
              </div>
              <div class="flex items-center">
                <svg class="w-3 h-3 mr-1 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span class="line-clamp-1">${event.location}</span>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-purple-400 font-semibold text-sm">${event.price || 'Free'}</span>
              <span class="text-xs text-gray-400">${event.attendees || 0} attending</span>
            </div>
          </div>
        </div>
        <button 
          class="w-full mt-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200"
          onclick="window.selectEvent('${event.id}')"
        >
          View Details
        </button>
      </div>
    `;
    
    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
      className: 'event-popup',
    }).setHTML(popupContent);
    
    // Create marker
    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([event.coordinates.lng, event.coordinates.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    // Add click handler
    markerElement.addEventListener('click', () => {
      onEventSelect?.(event);
    });
    
    return { marker, popup, event };
  };
  
  // Update markers when events change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Clear existing markers
    markers.current.forEach(({ marker }) => marker.remove());
    markers.current = [];
    
    // Add new markers
    events.forEach(event => {
      const markerData = createEventMarker(event);
      if (markerData) {
        markers.current.push(markerData);
      }
    });
    
    // Fit map to show all events
    if (events.length > 0 && userLocation) {
      const bounds = new mapboxgl.LngLatBounds();
      
      // Add user location to bounds
      bounds.extend([userLocation.lng, userLocation.lat]);
      
      // Add all event locations to bounds
      events.forEach(event => {
        if (event.coordinates) {
          bounds.extend([event.coordinates.lng, event.coordinates.lat]);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    }
  }, [events, mapLoaded, userLocation, onEventSelect]);
  
  // Handle selected event changes
  useEffect(() => {
    if (!selectedEvent || !map.current) return;
    
    const selectedMarker = markers.current.find(({ event }) => event.id === selectedEvent.id);
    if (selectedMarker && selectedEvent.coordinates) {
      // Fly to selected event
      map.current.flyTo({
        center: [selectedEvent.coordinates.lng, selectedEvent.coordinates.lat],
        zoom: 15,
        duration: 1000,
      });
      
      // Open popup
      selectedMarker.popup.addTo(map.current);
    }
  }, [selectedEvent]);
  
  // Map controls
  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };
  
  const handleRecenter = () => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
        duration: 1000,
      });
    }
  };
  
  const toggleMapStyle = () => {
    const newStyle = 
      mapStyle === 'mapbox://styles/mapbox/dark-v11'
        ? 'mapbox://styles/mapbox/streets-v12'
        : 'mapbox://styles/mapbox/dark-v11';
    setMapStyle(newStyle);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  if (!process.env.NEXT_PUBLIC_MAPBOX_API_KEY) {
    return (
      <div className={cn(
        'bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-800/50 flex items-center justify-center',
        className
      )}>
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Map Configuration Required</h3>
          <p className="text-gray-400 text-sm">Please configure your Mapbox API key to enable the map view.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('relative', className, isFullscreen && 'fixed inset-0 z-50 bg-black')}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRecenter}
          className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
        >
          <Navigation className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleMapStyle}
          className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleFullscreen}
          className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4">
        <Card className="bg-black/70 backdrop-blur-sm border-gray-700">
          <CardContent className="p-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-white">Your Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
                <span className="text-white">Events</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full relative">
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                </div>
                <span className="text-white">Featured</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Events Counter */}
      <div className="absolute top-4 right-4">
        <Badge className="bg-black/70 backdrop-blur-sm text-white border-gray-700">
          <MapPin className="h-3 w-3 mr-1" />
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </Badge>
      </div>
      
      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-white text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleFullscreen}
          className="absolute top-4 right-16 bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
