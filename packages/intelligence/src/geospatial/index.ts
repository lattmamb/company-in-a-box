import { ulid } from "ulid";
import { EventEmitter } from "events";
import { z } from "zod";

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoFeature {
  id: string;
  type: "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";
  geometry: any; // GeoJSON geometry
  properties: Record<string, any>;
}

export interface LayerConfig {
  id: string;
  name: string;
  type: "raster" | "vector" | "heatmap" | "3d";
  source: string;
  style: Record<string, any>;
  visible: boolean;
  opacity: number;
  minZoom: number;
  maxZoom: number;
}

export interface MapViewState {
  center: GeoCoordinate;
  zoom: number;
  bearing: number;
  pitch: number;
  bounds?: GeoBounds;
}

export interface GeoSearchOptions {
  query: string;
  bounds?: GeoBounds;
  limit?: number;
  types?: string[];
}

export interface GeoSearchResult {
  id: string;
  name: string;
  address: string;
  coordinate: GeoCoordinate;
  type: string;
  properties: Record<string, any>;
}

export interface RouteOptions {
  origin: GeoCoordinate;
  destination: GeoCoordinate;
  waypoints?: GeoCoordinate[];
  profile?: "driving" | "walking" | "cycling" | "transit";
  alternatives?: boolean;
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: any; // GeoJSON LineString
  legs: RouteLeg[];
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  geometry: any;
}

export interface LayerStyle {
  id: string;
  type: "circle" | "line" | "fill" | "symbol" | "raster" | "heatmap" | "fill-extrusion";
  source: string;
  paint: Record<string, any>;
  layout: Record<string, any>;
  filter?: any[];
  minZoom?: number;
  maxZoom?: number;
}

export interface DataSource {
  id: string;
  type: "geojson" | "vector" | "raster" | "raster-dem" | "video" | "image";
  url?: string;
  data?: any;
  tileSize?: number;
  minZoom?: number;
  maxZoom?: number;
  attribution?: string;
}

export interface GeospatialConfig {
  defaultCenter: GeoCoordinate;
  defaultZoom: number;
  defaultBearing: number;
  defaultPitch: number;
  maxZoom: number;
  minZoom: number;
  style: string; // MapLibre style URL
  attribution: string;
}

export class GeospatialEngine extends EventEmitter {
  private config: GeospatialConfig;
  private layers: Map<string, LayerConfig> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  private viewState: MapViewState;

  constructor(config: Partial<GeospatialConfig> = {}) {
    super();
    this.config = {
      defaultCenter: config.defaultCenter || { latitude: 39.8283, longitude: -98.5795 }, // US center
      defaultZoom: config.defaultZoom || 4,
      defaultBearing: config.defaultBearing || 0,
      defaultPitch: config.defaultPitch || 0,
      maxZoom: config.maxZoom || 22,
      minZoom: config.minZoom || 0,
      style: config.style || "https://demotiles.maplibre.org/style.json",
      attribution: config.attribution || "© MapLibre contributors",
    };

    this.viewState = {
      center: this.config.defaultCenter,
      zoom: this.config.defaultZoom,
      bearing: this.config.defaultBearing,
      pitch: this.config.defaultPitch,
    };
  }

  async initialize(): Promise<void> {
    // Initialize map style, data sources, etc.
    this.emit("initialized");
  }

  // View state management
  getViewState(): MapViewState {
    return { ...this.viewState };
  }

  setViewState(state: Partial<MapViewState>): void {
    this.viewState = { ...this.viewState, ...state };
    this.emit("viewStateChanged", this.viewState);
  }

  flyTo(center: GeoCoordinate, zoom?: number, options?: { duration?: number; easing?: (t: number) => number }): void {
    this.viewState.center = center;
    if (zoom !== undefined) this.viewState.zoom = zoom;
    this.emit("flyTo", { center, zoom: this.viewState.zoom, options });
  }

  // Layer management
  addLayer(layer: LayerConfig): void {
    this.layers.set(layer.id, layer);
    this.emit("layerAdded", layer);
  }

  removeLayer(layerId: string): void {
    this.layers.delete(layerId);
    this.emit("layerRemoved", layerId);
  }

  getLayer(layerId: string): LayerConfig | undefined {
    return this.layers.get(layerId);
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = visible;
      this.emit("layerVisibilityChanged", { layerId, visible });
    }
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
      this.emit("layerOpacityChanged", { layerId, opacity: layer.opacity });
    }
  }

  // Data source management
  addDataSource(source: DataSource): void {
    this.dataSources.set(source.id, source);
    this.emit("dataSourceAdded", source);
  }

  removeDataSource(sourceId: string): void {
    this.dataSources.delete(sourceId);
    this.emit("dataSourceRemoved", sourceId);
  }

  getDataSource(sourceId: string): DataSource | undefined {
    return this.dataSources.get(sourceId);
  }

  // Geo search
  async search(options: GeoSearchOptions): Promise<GeoSearchResult[]> {
    // In a real implementation, this would query a geocoding service
    // For now, return mock results
    return this.mockGeocode(options);
  }

  async reverseGeocode(coordinate: GeoCoordinate): Promise<GeoSearchResult[]> {
    // Mock reverse geocoding
    return [{
      id: ulid(),
      name: "Mock Location",
      address: "123 Mock Street, Mock City, MC 12345",
      coordinate,
      type: "address",
      properties: {},
    }];
  }

  // Routing
  async getRoute(options: RouteOptions): Promise<RouteResult> {
    // Mock routing
    return this.mockRoute(options);
  }

  // Layer styling
  getLayerStyle(layerId: string): LayerStyle | undefined {
    const layer = this.layers.get(layerId);
    if (!layer) return undefined;
    return layer.style as LayerStyle;
  }

  setLayerStyle(layerId: string, style: Partial<LayerStyle>): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.style = { ...layer.style, ...style };
      this.emit("layerStyleChanged", { layerId, style: layer.style });
    }
  }

  // Mock implementations
  private mockGeocode(options: GeoSearchOptions): GeoSearchResult[] {
    const count = Math.min(options.limit || 10, 5);
    return Array.from({ length: count }, (_, i) => ({
      id: ulid(),
      name: `${options.query} Result ${i + 1}`,
      address: `${i + 1} Mock Street, Mock City, MC 12345`,
      coordinate: {
        latitude: 39.8283 + (Math.random() - 0.5) * 10,
        longitude: -98.5795 + (Math.random() - 0.5) * 10,
      },
      type: options.types?.[0] || "address",
      properties: { mock: true },
    });
  }

  private mockRoute(options: RouteOptions): RouteResult {
    const distance = this.calculateDistance(options.origin, options.destination);
    const duration = distance / 13.89; // ~50 km/h average

    return {
      distance,
      duration,
      geometry: {
        type: "LineString",
        coordinates: [
          [options.origin.longitude, options.origin.latitude],
          [options.destination.longitude, options.destination.latitude],
        ],
      },
      legs: [{
        distance,
        duration,
        steps: [
          {
            instruction: `Head toward ${options.destination.latitude > options.origin.latitude ? "north" : "south"}`,
            distance: distance * 0.3,
            duration: duration * 0.3,
            geometry: { type: "Point", coordinates: [options.origin.longitude, options.origin.latitude] },
          },
          {
            instruction: "Continue straight",
            distance: distance * 0.4,
            duration: duration * 0.4,
            geometry: { type: "Point", coordinates: [] },
          },
          {
            instruction: "Arrive at destination",
            distance: distance * 0.3,
            duration: duration * 0.3,
            geometry: { type: "Point", coordinates: [options.destination.longitude, options.destination.latitude] },
          },
        ],
      }],
    };
  }

  private calculateDistance(origin: GeoCoordinate, destination: GeoCoordinate): number {
    const R = 6371000; // Earth radius in meters
    const lat1 = origin.latitude * Math.PI / 180;
    const lat2 = destination.latitude * Math.PI / 180;
    const deltaLat = (destination.latitude - origin.latitude) * Math.PI / 180;
    const deltaLon = (destination.longitude - origin.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // 3D terrain and buildings (gods-eye-view integration)
  async add3DTerrain(sourceUrl: string, options?: { exaggeration?: number }): Promise<void> {
    // In a real implementation, this would add a raster-dem source
    this.addDataSource({
      id: `terrain-${ulid()}`,
      type: "raster-dem",
      url: sourceUrl,
      tileSize: 256,
      minZoom: 0,
      maxZoom: 14,
    });
  }

  async add3DBuildings(sourceUrl: string, options?: { extrusionProperty?: string }): Promise<void> {
    // Add 3D buildings layer
    this.addLayer({
      id: `buildings-${ulid()}`,
      name: "3D Buildings",
      type: "3d",
      source: `buildings-${ulid()}`,
      style: {
        type: "fill-extrusion",
        source: `buildings-${ulid()}`,
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.8,
        },
      },
      visible: true,
      opacity: 1,
      minZoom: 14,
      maxZoom: 22,
    });
  }

  // Satellite imagery
  async addSatelliteImagery(sourceUrl: string, options?: { attribution?: string }): Promise<void> {
    this.addDataSource({
      id: `satellite-${ulid()}`,
      type: "raster",
      url: sourceUrl,
      tileSize: 256,
      minZoom: 0,
      maxZoom: 20,
      attribution: options?.attribution,
    });

    this.addLayer({
      id: `satellite-${ulid()}`,
      name: "Satellite Imagery",
      type: "raster",
      source: `satellite-${ulid()}`,
      style: {
        type: "raster",
        source: `satellite-${ulid()}`,
        paint: {
          "raster-opacity": 1,
        },
      },
      visible: true,
      opacity: 1,
      minZoom: 0,
      maxZoom: 20,
    });
  }

  // Export/Import
  exportState(): string {
    return JSON.stringify({
      viewState: this.viewState,
      layers: Array.from(this.layers.values()),
      dataSources: Array.from(this.dataSources.values()),
      config: this.config,
    }, null, 2);
  }

  async importState(json: string): Promise<void> {
    const state = JSON.parse(json);
    this.viewState = state.viewState;
    this.config = { ...this.config, ...state.config };
    this.layers.clear();
    for (const layer of state.layers) {
      this.layers.set(layer.id, layer);
    }
    this.dataSources.clear();
    for (const source of state.dataSources) {
      this.dataSources.set(source.id, source);
    }
    this.emit("stateImported", state);
  }

  // Utility methods
  getBounds(): GeoBounds | undefined {
    return this.viewState.bounds;
  }

  setBounds(bounds: GeoBounds): void {
    this.viewState.bounds = bounds;
    this.emit("boundsChanged", bounds);
  }

  fitBounds(bounds: GeoBounds, padding?: number): void {
    // Calculate center and zoom to fit bounds
    const center: GeoCoordinate = {
      latitude: (bounds.north + bounds.south) / 2,
      longitude: (bounds.east + bounds.west) / 2,
    };
    // Simplified zoom calculation
    const latDiff = bounds.north - bounds.south;
    const lonDiff = bounds.east - bounds.west;
    const zoom = Math.log2(360 / Math.max(latDiff, lonDiff)) - 1;
    
    this.flyTo(center, Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom)));
  }
}

export const geospatialEngine = new GeospatialEngine();