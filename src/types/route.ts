// Route optimization types for xROAD API integration

// xROAD Traffic API response types
export interface TrafficMeasurement {
  観測点コード: string;
  時間コード: string;
  道路種別: number;
  上り小型交通量: number;
  上り大型交通量: number;
  下り小型交通量: number;
  下り大型交通量: number;
  ジオメトリ: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface TrafficData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: TrafficMeasurement;
    geometry: TrafficMeasurement['ジオメトリ'];
  }>;
}

// Route calculation types
export interface RoutePoint {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteSegment {
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  distance: number; // meters
  estimatedTime: number; // seconds
  trafficLevel: 'low' | 'medium' | 'high' | 'congested';
  roadType: 'highway' | 'arterial' | 'local';
}

export interface OptimizedRoute {
  id: string;
  name: string;
  segments: RouteSegment[];
  totalDistance: number; // meters
  totalTime: number; // seconds
  estimatedTimeWithTraffic: number; // seconds
  trafficDelayFactor: number; // multiplier (1.0 = no delay, 2.0 = double time)
  coordinates: RoutePoint[];
  routeType: 'fastest' | 'most_stable' | 'shortest';
  confidence: number; // 0-1 (reliability of time estimate)
}

export interface RouteRequest {
  origin: RoutePoint;
  destination: RoutePoint;
  departureTime?: Date;
  routePreference: 'fastest' | 'most_stable' | 'shortest' | 'all';
  avoidTolls?: boolean;
  vehicleType?: 'emergency' | 'standard';
}

export interface RouteOptimizationResult {
  requestId: string;
  routes: OptimizedRoute[];
  recommendedRoute: OptimizedRoute;
  trafficUpdateTime: Date;
  estimatedArrivalTime: Date;
  alternativeRoutesCount: number;
}

// DRM-PF API types
export interface DrmPfRouteRequest {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  searchType?: 'time' | 'distance';
  routeCount?: number;
}

export interface DrmPfRouteResponse {
  routes: Array<{
    routeId: string;
    totalDistance: number;
    totalTime: number;
    points: Array<{
      lat: number;
      lon: number;
      linkId?: string;
    }>;
    links: Array<{
      linkId: string;
      distance: number;
      freeFlowTime: number;
      roadClass: string;
    }>;
  }>;
}

// Real-time route updates
export interface RouteUpdate {
  routeId: string;
  updateTime: Date;
  newEstimatedTime: number;
  trafficIncidents: TrafficIncident[];
  alternativeRecommendation?: OptimizedRoute;
  severityLevel: 'info' | 'warning' | 'critical';
}

export interface TrafficIncident {
  id: string;
  type: 'accident' | 'construction' | 'congestion' | 'weather';
  location: RoutePoint;
  severity: 'low' | 'medium' | 'high';
  description: string;
  expectedDuration?: number; // minutes
  affectedLinks: string[];
}

// Route history and analytics
export interface RoutePerformance {
  routeId: string;
  caseId: string;
  plannedTime: number;
  actualTime: number;
  accuracy: number; // planned vs actual time accuracy (0-1)
  trafficConditions: 'light' | 'moderate' | 'heavy';
  completedAt: Date;
  deviations: Array<{
    timestamp: Date;
    reason: string;
    timeImpact: number;
  }>;
}

export interface RouteAnalytics {
  averageAccuracy: number;
  totalRoutesOptimized: number;
  timeSaved: number; // total seconds saved vs default routes
  mostEfficientTimeSlots: Array<{
    hour: number;
    averageSpeed: number;
    reliability: number;
  }>;
  problematicAreas: Array<{
    location: RoutePoint;
    frequency: number;
    averageDelay: number;
  }>;
}