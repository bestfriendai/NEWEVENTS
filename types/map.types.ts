// types/map.types.ts
import type * as mapboxgl from 'mapbox-gl';
import type * as GeoJSON from 'geojson';

export interface MapViewport {
  latitude: number
  longitude: number
  zoom: number
}

// Mapbox GL Types
// Note: These interfaces are simplified representations.
// For full type safety, use types directly from 'mapbox-gl' where possible,
// or ensure these definitions align with the version of Mapbox GL being used.

export interface MapboxMap {
  on(type: string, listener: (e: any) => void): void;
  off(type: string, listener: (e: any) => void): void;
  addSource(id: string, source: mapboxgl.SourceSpecification): void;
  removeSource(id: string): void;
  addLayer(layer: mapboxgl.AnyLayer, before?: string): void;
  removeLayer(id: string): void;
  getLayer(id: string): mapboxgl.AnyLayer | undefined;
  setStyle(style: mapboxgl.Style | string): void;
  flyTo(options: any): void;
  fitBounds(bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions): void;
  queryRenderedFeatures(
    pointOrBox?: mapboxgl.PointLike | [mapboxgl.PointLike, mapboxgl.PointLike],
    options?: { layers?: string[]; filter?: mapboxgl.Expression; validate?: boolean }
  ): mapboxgl.MapboxGeoJSONFeature[];
  getSource(id: string): mapboxgl.Source | undefined;
  remove(): void;
  resize(): void;
  getZoom(): number;
  getCenter(): mapboxgl.LngLat;
  getBounds(): mapboxgl.LngLatBounds;
  project(lngLat: mapboxgl.LngLatLike): mapboxgl.Point;
  unproject(point: mapboxgl.PointLike): mapboxgl.LngLat;
  addControl(control: mapboxgl.IControl, position?: mapboxgl.ControlPosition): void;
  removeControl(control: mapboxgl.IControl): void;
  isStyleLoaded(): boolean;
  isSourceLoaded(id: string): boolean;
  loadImage(
    url: string,
    callback: (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) => void
  ): void;
  addImage(
    id: string,
    image: HTMLImageElement | ImageBitmap | ImageData | { width: number; height: number; data: Uint8Array | Uint8ClampedArray; },
    options?: { pixelRatio?: number; sdf?: boolean; }
  ): void;
  hasImage(id: string): boolean;
  removeImage(id: string): void;
  setLayoutProperty(layerId: string, name: string, value: unknown): void;
  setPaintProperty(layerId: string, name: string, value: unknown): void;
  setFilter(layerId: string, filter: mapboxgl.Expression | null | undefined): void;
  getCanvas(): HTMLCanvasElement;
  getContainer(): HTMLElement;
  setTerrain(terrain?: mapboxgl.TerrainSpecification | null): void;
}

export interface MapboxMarker {
  setLngLat(lngLat: mapboxgl.LngLatLike): MapboxMarker;
  addTo(map: MapboxMap | mapboxgl.Map): MapboxMarker;
  remove(): MapboxMarker;
  getElement(): HTMLElement;
  setPopup(popup?: MapboxPopup | mapboxgl.Popup): MapboxMarker;
  togglePopup(): MapboxMarker;
}

export interface MapboxPopup {
  setLngLat(lngLat: mapboxgl.LngLatLike): MapboxPopup;
  setHTML(html: string): MapboxPopup;
  addTo(map: MapboxMap | mapboxgl.Map): MapboxPopup;
  remove(): MapboxPopup;
  isOpen(): boolean;
}

export interface MapboxGeoJSONSource {
  setData(data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> | string): void;
  getClusterExpansionZoom(clusterId: number, callback: (err: Error | null, zoom: number) => void): void;
}

export interface MapboxEvent { 
  type: string;
  target?: MapboxMap | mapboxgl.Map;
  originalEvent?: Event;
  point?: mapboxgl.Point;
  lngLat?: mapboxgl.LngLat;
  features?: mapboxgl.MapboxGeoJSONFeature[];
}
