import { 
  RouteRequest, 
  RouteOptimizationResult, 
  OptimizedRoute, 
  RouteSegment, 
  RoutePoint,
  TrafficData,
  RouteUpdate,
  RoutePerformance
} from '@/types/route';
import { xroadService } from './xroadService';
import { roadNetworkService } from './roadNetworkService';
import { config } from '@/config/environment';

class RouteOptimizationService {
  private activeRoutes: Map<string, OptimizedRoute> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Main route optimization function
   */
  async optimizeRoute(request: RouteRequest): Promise<RouteOptimizationResult> {
    const requestId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Step 1: Get current traffic data around the route area
      const trafficData = await this.getRouteAreaTrafficData(request.origin, request.destination);
      
      // Step 2: Get multiple route options from DRM-PF API
      const routeOptions = await this.getRouteOptionsFromAPI(request);

      // Step 3: Analyze each route with traffic data
      const optimizedRoutes = await this.analyzeRoutesWithTraffic(routeOptions, trafficData);

      // Step 4: Select recommended route based on preference
      const recommendedRoute = this.selectRecommendedRoute(optimizedRoutes, request.routePreference);

      // Step 5: Calculate estimated arrival time
      const estimatedArrivalTime = this.calculateEstimatedArrivalTime(
        recommendedRoute, 
        request.departureTime || new Date()
      );

      const result: RouteOptimizationResult = {
        requestId,
        routes: optimizedRoutes,
        recommendedRoute,
        trafficUpdateTime: new Date(),
        estimatedArrivalTime,
        alternativeRoutesCount: optimizedRoutes.length - 1
      };

      // Store active route for real-time updates
      this.activeRoutes.set(requestId, recommendedRoute);

      return result;
    } catch (error) {
      console.error('Route optimization failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time route monitoring
   */
  startRouteMonitoring(
    routeId: string, 
    callback: (update: RouteUpdate) => void,
    intervalMinutes: number = 5
  ): void {
    // Clear existing interval if any
    this.stopRouteMonitoring(routeId);

    const interval = setInterval(async () => {
      try {
        const route = this.activeRoutes.get(routeId);
        if (!route) {
          this.stopRouteMonitoring(routeId);
          return;
        }

        const update = await this.checkRouteUpdates(route);
        if (update) {
          callback(update);
        }
      } catch (error) {
        console.error('Route monitoring error:', error);
      }
    }, intervalMinutes * 60 * 1000);

    this.updateIntervals.set(routeId, interval);
  }

  /**
   * Stop route monitoring
   */
  stopRouteMonitoring(routeId: string): void {
    const interval = this.updateIntervals.get(routeId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(routeId);
    }
    this.activeRoutes.delete(routeId);
  }

  /**
   * Get traffic data for the route area
   */
  private async getRouteAreaTrafficData(origin: RoutePoint, destination: RoutePoint): Promise<TrafficData> {
    if (config.demoMode) {
      // Create mock traffic data for demo
      const bounds = this.calculateRouteBounds(origin, destination, 5); // 5km buffer
      return xroadService.createMockTrafficData(bounds);
    }

    try {
      // Get traffic data around both origin and destination
      const [originTraffic, destTraffic] = await Promise.all([
        xroadService.getTrafficDataAroundPoint(origin, 3),
        xroadService.getTrafficDataAroundPoint(destination, 3)
      ]);

      // Merge traffic data
      return {
        type: 'FeatureCollection',
        features: [...originTraffic.features, ...destTraffic.features]
      };
    } catch (error) {
      console.warn('Failed to get real traffic data, using mock data:', error);
      const bounds = this.calculateRouteBounds(origin, destination, 5);
      return xroadService.createMockTrafficData(bounds);
    }
  }

  /**
   * Get route options using OSMnx-like road network routing
   */
  private async getRouteOptionsFromAPI(request: RouteRequest): Promise<any[]> {
    console.log('🚗 Starting OSMnx-style route search from:', request.origin, 'to:', request.destination);
    
    return await this.generateRoadBasedRoutes(request);
  }

  /**
   * Generate road-based routes using OSMnx-like methodology
   */
  private async generateRoadBasedRoutes(request: RouteRequest): Promise<any[]> {
    const routes: any[] = [];
    const { origin, destination } = request;

    console.log('🛣️ Starting OSMnx-style routing from:', origin, 'to:', destination);

    // Priority 1: Use OSRM API for real road routing (most reliable)
    console.log('🔄 Trying OSRM API for real road-based routing...');
    const osrmRoutes = await this.tryExternalRoutingAPIs(origin, destination);
    if (osrmRoutes.length > 0) {
      console.log(`✅ OSRM API routing successful: ${osrmRoutes.length} routes`);
      return osrmRoutes;
    }

    // Priority 2: Use OpenStreetMap road network routing (OSMnx-like)
    try {
      console.log('🗺️ Attempting OSMnx-style road network routing...');
      const bounds = this.calculateRouteBounds(origin, destination, 3); // 3km buffer for better performance
      const roadNetwork = await roadNetworkService.getRoadNetwork(bounds);
      
      if (roadNetwork.nodes.size > 10) { // Only proceed if we have sufficient network data
        console.log(`📊 Loaded OSM road network: ${roadNetwork.nodes.size} nodes, ${roadNetwork.edges.size} edges`);
        
        // Find multiple path types like OSMnx does
        const pathfindingOptions = [
          { preference: 'time' as const, name: '最速ルート（OSM道路網）', description: 'Time-optimized shortest path' },
          { preference: 'distance' as const, name: '最短距離ルート（OSM道路網）', description: 'Distance-optimized shortest path' }
        ];

        for (let i = 0; i < pathfindingOptions.length; i++) {
          const option = pathfindingOptions[i];
          
          try {
            const roadPath = await roadNetworkService.findPath(
              roadNetwork, 
              origin, 
              destination, 
              option.preference
            );

            if (roadPath && roadPath.coordinates.length > 2) {
              console.log(`✅ Found ${option.preference} path: ${roadPath.coordinates.length} points, ${Math.round(roadPath.totalDistance)}m`);
              
              const route = {
                id: `osmnx_route_${i}`,
                name: option.name,
                points: roadPath.coordinates,
                distance: roadPath.totalDistance,
                baseTime: roadPath.estimatedTime,
                links: roadPath.edges.map(edge => ({
                  linkId: edge.id,
                  distance: edge.distance,
                  roadType: edge.roadType,
                  maxSpeed: edge.maxSpeed
                })),
                routingMethod: 'osmnx_style',
                pathDescription: option.description
              };
              routes.push(route);
            }
          } catch (error) {
            console.warn(`⚠️ OSMnx pathfinding failed for ${option.preference}:`, error);
          }
        }

        // If we got OSM network routes, return them
        if (routes.length > 0) {
          console.log(`📍 Generated ${routes.length} OSMnx-style network routes`);
          return routes;
        }
      } else {
        console.warn('⚠️ Insufficient OSM road network data for area');
      }
    } catch (error) {
      console.warn('⚠️ OSMnx-style road network routing failed:', error);
    }

    // Priority 3: Enhanced road estimation as final fallback
    console.log('🔄 All network methods failed, creating enhanced road estimates...');
    const enhancedRoutes = this.generateMultipleEstimatedRoutes(origin, destination);
    routes.push(...enhancedRoutes);

    console.log(`📍 Generated ${routes.length} total routes using fallback methods`);
    return routes;
  }

  /**
   * Try external routing APIs as fallback
   */
  private async tryExternalRoutingAPIs(origin: RoutePoint, destination: RoutePoint): Promise<any[]> {
    const routes: any[] = [];
    
    // Try multiple routing methods in priority order
    const routingMethods = [
      { method: 'osrm', profile: 'driving' },
      { method: 'graphhopper', profile: 'car' },
      { method: 'estimated', profile: 'urban' }
    ];

    for (const { method, profile } of routingMethods) {
      try {
        let roadRoute = null;
        
        if (method === 'osrm') {
          roadRoute = await this.getOSRMRoute(origin, destination, profile);
        } else if (method === 'graphhopper') {
          roadRoute = await this.getGraphHopperRoute(origin, destination, profile);
        } else if (method === 'estimated') {
          roadRoute = this.generateEstimatedRoadRoute(origin, destination);
        }
        
        if (roadRoute && roadRoute.coordinates.length > 2) {
          console.log(`✅ ${method.toUpperCase()} route successful:`, roadRoute.coordinates.length, 'points');
          
          // Generate route variations
          const routeTypes = [
            { name: `最速ルート（${method === 'estimated' ? '道路推定' : 'API'}）`, factor: 1.0 },
            { name: `高速道路優先（${method === 'estimated' ? '道路推定' : 'API'}）`, factor: 0.9 },
            { name: `一般道優先（${method === 'estimated' ? '道路推定' : 'API'}）`, factor: 1.1 }
          ];

          routeTypes.forEach((type, index) => {
            const route = {
              id: `${method}_route_${index}`,
              name: type.name,
              points: roadRoute.coordinates,
              distance: roadRoute.distance * type.factor,
              baseTime: roadRoute.duration * type.factor,
              links: [],
              routingMethod: method
            };
            routes.push(route);
          });
          
          break; // Found working method
        }
      } catch (error) {
        console.warn(`⚠️ ${method.toUpperCase()} routing failed:`, error);
        continue;
      }
    }

    return routes;
  }

  /**
   * Analyze routes with traffic data
   */
  private async analyzeRoutesWithTraffic(routeOptions: any[], trafficData: TrafficData): Promise<OptimizedRoute[]> {
    const optimizedRoutes: OptimizedRoute[] = [];

    for (let i = 0; i < routeOptions.length; i++) {
      const route = routeOptions[i];
      
      // Calculate traffic impact on route
      const trafficAnalysis = this.analyzeTrafficImpact(route.points, trafficData);
      
      // Calculate segments with traffic-adjusted times
      const segments = this.calculateRouteSegments(route.points, trafficAnalysis);
      
      const optimizedRoute: OptimizedRoute = {
        id: route.id,
        name: route.name || `Route ${i + 1}`,
        segments,
        totalDistance: route.distance,
        totalTime: route.baseTime,
        estimatedTimeWithTraffic: segments.reduce((sum, seg) => sum + seg.estimatedTime, 0),
        trafficDelayFactor: trafficAnalysis.delayFactor,
        coordinates: route.points,
        routeType: this.determineRouteType(trafficAnalysis),
        confidence: trafficAnalysis.confidence
      };

      optimizedRoutes.push(optimizedRoute);
    }

    return optimizedRoutes;
  }

  /**
   * Analyze traffic impact on route points
   */
  private analyzeTrafficImpact(routePoints: RoutePoint[], trafficData: TrafficData) {
    let totalDelayFactor = 0;
    let confidenceSum = 0;
    let analyzeablePoints = 0;

    routePoints.forEach(point => {
      const trafficDensity = xroadService.calculateTrafficDensity(trafficData, point, 1000);
      
      if (trafficDensity > 0) {
        // Convert traffic density to delay factor (higher traffic = more delay)
        const localDelayFactor = 1 + (trafficDensity / 100) * 0.5; // Max 50% delay
        totalDelayFactor += localDelayFactor;
        confidenceSum += 0.8; // High confidence when we have traffic data
        analyzeablePoints++;
      } else {
        totalDelayFactor += 1.0; // No delay factor if no traffic data
        confidenceSum += 0.3; // Low confidence without traffic data
        analyzeablePoints++;
      }
    });

    return {
      delayFactor: analyzeablePoints > 0 ? totalDelayFactor / analyzeablePoints : 1.0,
      confidence: analyzeablePoints > 0 ? confidenceSum / analyzeablePoints : 0.5,
      trafficPoints: analyzeablePoints
    };
  }

  /**
   * Calculate route segments with traffic considerations
   */
  private calculateRouteSegments(routePoints: RoutePoint[], trafficAnalysis: any): RouteSegment[] {
    const segments: RouteSegment[] = [];

    for (let i = 0; i < routePoints.length - 1; i++) {
      const start = routePoints[i];
      const end = routePoints[i + 1];
      
      const distance = this.calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);
      const baseTime = distance / 15; // 15 m/s base speed
      const adjustedTime = baseTime * trafficAnalysis.delayFactor;

      segments.push({
        startPoint: start,
        endPoint: end,
        distance,
        estimatedTime: adjustedTime,
        trafficLevel: this.categorizeTrafficLevel(trafficAnalysis.delayFactor),
        roadType: this.determineRoadType(distance)
      });
    }

    return segments;
  }

  /**
   * Select recommended route based on preference
   */
  private selectRecommendedRoute(routes: OptimizedRoute[], preference: string): OptimizedRoute {
    switch (preference) {
      case 'fastest':
        return routes.reduce((best, current) => 
          current.estimatedTimeWithTraffic < best.estimatedTimeWithTraffic ? current : best
        );
      
      case 'most_stable':
        return routes.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
      
      case 'shortest':
        return routes.reduce((best, current) => 
          current.totalDistance < best.totalDistance ? current : best
        );
      
      default:
        // Default to fastest
        return routes.reduce((best, current) => 
          current.estimatedTimeWithTraffic < best.estimatedTimeWithTraffic ? current : best
        );
    }
  }

  /**
   * Check for route updates
   */
  private async checkRouteUpdates(route: OptimizedRoute): Promise<RouteUpdate | null> {
    try {
      // Get fresh traffic data
      const trafficData = await this.getRouteAreaTrafficData(
        route.coordinates[0], 
        route.coordinates[route.coordinates.length - 1]
      );

      // Re-analyze route with new traffic data
      const newAnalysis = this.analyzeTrafficImpact(route.coordinates, trafficData);
      const newEstimatedTime = route.totalTime * newAnalysis.delayFactor;

      // Check if there's a significant change (>10% difference)
      const timeDifference = Math.abs(newEstimatedTime - route.estimatedTimeWithTraffic);
      const changePercentage = timeDifference / route.estimatedTimeWithTraffic;

      if (changePercentage > 0.1) {
        const update: RouteUpdate = {
          routeId: route.id,
          updateTime: new Date(),
          newEstimatedTime,
          trafficIncidents: [], // TODO: Implement incident detection
          severityLevel: changePercentage > 0.3 ? 'critical' : changePercentage > 0.2 ? 'warning' : 'info'
        };

        return update;
      }

      return null;
    } catch (error) {
      console.error('Route update check failed:', error);
      return null;
    }
  }

  /**
   * Utility functions
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateRouteBounds(origin: RoutePoint, destination: RoutePoint, bufferKm: number) {
    const latBuffer = bufferKm / 111.0;
    const lonBuffer = bufferKm / (111.0 * Math.abs(Math.cos(origin.latitude * Math.PI / 180)));

    return {
      west: Math.min(origin.longitude, destination.longitude) - lonBuffer,
      south: Math.min(origin.latitude, destination.latitude) - latBuffer,
      east: Math.max(origin.longitude, destination.longitude) + lonBuffer,
      north: Math.max(origin.latitude, destination.latitude) + latBuffer
    };
  }

  /**
   * Get route from routing service for real road-based routing
   */
  private async getOSRMRoute(origin: RoutePoint, destination: RoutePoint, profile: string = 'driving'): Promise<{
    coordinates: RoutePoint[];
    distance: number;
    duration: number;
  } | null> {
    try {
      console.log(`🗺️ Attempting OSRM route from [${origin.latitude}, ${origin.longitude}] to [${destination.latitude}, ${destination.longitude}]`);
      
      // Try public OSRM server
      const osrmUrl = 'https://router.project-osrm.org/route/v1/driving';
      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const url = `${osrmUrl}/${coordinates}?overview=full&geometries=geojson`;
      
      console.log('🔍 OSRM request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OSRM response received:', data);
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const geometry = route.geometry;
          
          if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
            const coordinates = geometry.coordinates.map(([lon, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lon
            }));

            console.log(`✅ OSRM route successful: ${coordinates.length} points, ${Math.round(route.distance)}m, ${Math.round(route.duration)}s`);
            
            return {
              coordinates,
              distance: route.distance,
              duration: route.duration
            };
          }
        }
      } else {
        console.warn('⚠️ OSRM API error:', response.status, response.statusText);
      }
      
      // 2. Try GraphHopper API as fallback
      const graphhopperRoute = await this.getGraphHopperRoute(origin, destination, profile);
      if (graphhopperRoute) {
        console.log('✅ GraphHopper route found with', graphhopperRoute.coordinates.length, 'points');
        return graphhopperRoute;
      }
      
      // 3. Try our enhanced road estimation
      const estimatedRoute = this.generateEstimatedRoadRoute(origin, destination);
      if (estimatedRoute) {
        console.log('📍 Using estimated road route with', estimatedRoute.coordinates.length, 'points');
        return estimatedRoute;
      }
      
      console.warn('⚠️ All routing methods failed');
      return null;
      
    } catch (error) {
      console.error('❌ Route service error:', error);
      return null;
    }
  }


  /**
   * Try GraphHopper Routing API
   */
  private async getGraphHopperRoute(origin: RoutePoint, destination: RoutePoint, profile: string): Promise<{
    coordinates: RoutePoint[];
    distance: number;
    duration: number;
  } | null> {
    try {
      console.log('Trying GraphHopper API...');
      
      // GraphHopper public instance (limited usage)
      const graphhopperUrl = 'https://graphhopper.com/api/1/route';
      const params = new URLSearchParams();
      params.append('point', `${origin.latitude},${origin.longitude}`);
      params.append('point', `${destination.latitude},${destination.longitude}`);
      params.append('vehicle', 'car');
      params.append('locale', 'ja');
      params.append('instructions', 'false');
      params.append('calc_points', 'true');
      params.append('debug', 'false');
      params.append('elevation', 'false');
      params.append('points_encoded', 'false');
      
      console.log(`GraphHopper API for ${profile} profile`);

      const response = await fetch(`${graphhopperUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('GraphHopper response:', data);
        
        if (data.paths && data.paths.length > 0) {
          const path = data.paths[0];
          const coordinates = path.points.coordinates.map((coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0]
          }));

          return {
            coordinates,
            distance: path.distance,
            duration: path.time / 1000 // Convert from milliseconds to seconds
          };
        }
      } else {
        const errorText = await response.text();
        console.error('GraphHopper API error:', response.status, errorText);
      }
      
    } catch (error) {
      console.warn('GraphHopper failed:', error);
    }
    
    return null;
  }

  /**
   * Generate estimated road route using road network approximation
   */
  private generateEstimatedRoadRoute(origin: RoutePoint, destination: RoutePoint): {
    coordinates: RoutePoint[];
    distance: number;
    duration: number;
  } | null {
    try {
      console.log('Generating estimated road route...');
      
      // Use the enhanced road points generation for better road-following
      const coordinates = this.generateEnhancedRoadPoints(origin, destination, 'balanced');
      
      // Calculate the distance following the generated path
      let totalDistance = 0;
      for (let i = 0; i < coordinates.length - 1; i++) {
        totalDistance += this.calculateDistance(
          coordinates[i].latitude, coordinates[i].longitude,
          coordinates[i + 1].latitude, coordinates[i + 1].longitude
        );
      }
      
      // Estimate duration (average 25 km/h in urban Tokyo)
      const duration = totalDistance / (25 * 1000 / 3600); // 25 km/h in m/s
      
      return {
        coordinates,
        distance: totalDistance,
        duration: duration
      };
      
    } catch (error) {
      console.error('Estimated route generation failed:', error);
      return null;
    }
  }

  /**
   * Generate multiple estimated road routes with different characteristics
   */
  private generateMultipleEstimatedRoutes(origin: RoutePoint, destination: RoutePoint): any[] {
    const routes: any[] = [];
    
    // Calculate base metrics
    const directDistance = this.calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );
    
    // Route variations with different road patterns
    const routeVariations = [
      {
        name: '最速推定ルート（幹線道路優先）',
        distanceFactor: 1.3,
        speedFactor: 1.1, // Higher speed on main roads
        pathStyle: 'arterial'
      },
      {
        name: '安定推定ルート（バランス重視）',
        distanceFactor: 1.4,
        speedFactor: 1.0,
        pathStyle: 'balanced'
      },
      {
        name: '迂回推定ルート（渋滞回避）',
        distanceFactor: 1.6,
        speedFactor: 0.9,
        pathStyle: 'alternative'
      }
    ];
    
    routeVariations.forEach((variation, index) => {
      const estimatedPoints = this.generateEnhancedRoadPoints(origin, destination, variation.pathStyle);
      const routeDistance = directDistance * variation.distanceFactor;
      const baseSpeed = 25; // 25 km/h average urban speed
      const adjustedSpeed = baseSpeed * variation.speedFactor;
      const duration = (routeDistance / 1000) / adjustedSpeed * 3600; // Convert to seconds
      
      routes.push({
        id: `estimated_route_${index}`,
        name: variation.name,
        points: estimatedPoints,
        distance: routeDistance,
        baseTime: duration,
        links: [],
        routingMethod: 'enhanced_estimation'
      });
    });
    
    return routes;
  }

  /**
   * Generate enhanced road points following realistic road patterns
   */
  private generateEnhancedRoadPoints(origin: RoutePoint, destination: RoutePoint, pathStyle: string): RoutePoint[] {
    const points: RoutePoint[] = [origin];
    
    const directDistance = this.calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );
    
    // Generate many more points for smoother road-like curves
    const basePoints = Math.max(20, Math.floor(directDistance / 200)); // 1 point per 200m for smoother curves
    const numPoints = basePoints;
    
    // Create waypoints that follow realistic road patterns
    const waypoints = this.generateRoadWaypoints(origin, destination, pathStyle);
    
    // Generate smooth curve through waypoints
    for (let i = 1; i < numPoints; i++) {
      const progress = i / numPoints;
      
      // Find which waypoint segment we're in
      const segmentIndex = Math.floor(progress * (waypoints.length - 1));
      const segmentProgress = (progress * (waypoints.length - 1)) - segmentIndex;
      
      if (segmentIndex >= waypoints.length - 1) {
        break;
      }
      
      const startWaypoint = waypoints[segmentIndex];
      const endWaypoint = waypoints[segmentIndex + 1];
      
      // Use bezier curve for smooth interpolation
      const point = this.bezierInterpolation(
        startWaypoint, 
        endWaypoint, 
        segmentProgress
      );
      
      points.push(point);
    }
    
    points.push(destination);
    return points;
  }

  /**
   * Generate realistic road waypoints
   */
  private generateRoadWaypoints(origin: RoutePoint, destination: RoutePoint, pathStyle: string): RoutePoint[] {
    const waypoints: RoutePoint[] = [origin];
    
    const deltaLat = destination.latitude - origin.latitude;
    const deltaLon = destination.longitude - origin.longitude;
    
    // Create intermediate waypoints based on Tokyo road patterns
    const numWaypoints = Math.max(3, Math.floor(Math.abs(deltaLat) + Math.abs(deltaLon)) * 500); // More waypoints for longer distances
    
    for (let i = 1; i < numWaypoints; i++) {
      const progress = i / numWaypoints;
      
      // Base position
      let lat = origin.latitude + deltaLat * progress;
      let lon = origin.longitude + deltaLon * progress;
      
      // Apply road pattern deviations
      switch (pathStyle) {
        case 'arterial':
          // Follow major road patterns - prefer straight segments with turns at intersections
          if (progress < 0.3) {
            // Initial segment - follow major north-south road
            lon = origin.longitude + deltaLon * 0.1;
            lat = origin.latitude + deltaLat * progress / 0.3 * 0.7;
          } else if (progress < 0.7) {
            // Middle segment - east-west major road
            lat = origin.latitude + deltaLat * 0.7;
            lon = origin.longitude + deltaLon * (progress - 0.3) / 0.4 * 0.8;
          } else {
            // Final approach
            lat = origin.latitude + deltaLat * (0.7 + (progress - 0.7) / 0.3 * 0.3);
            lon = origin.longitude + deltaLon * (0.8 + (progress - 0.7) / 0.3 * 0.2);
          }
          break;
          
        case 'alternative':
          // Curved route avoiding main roads
          const curve1 = Math.sin(progress * Math.PI) * 0.003;
          const curve2 = Math.cos(progress * Math.PI * 1.5) * 0.002;
          lat += curve1;
          lon += curve2;
          break;
          
        case 'balanced':
        default:
          // Moderate road following with gentle curves
          const gentle1 = Math.sin(progress * Math.PI * 0.8) * 0.001;
          const gentle2 = Math.cos(progress * Math.PI * 0.6) * 0.0008;
          lat += gentle1;
          lon += gentle2;
          break;
      }
      
      waypoints.push({ latitude: lat, longitude: lon });
    }
    
    waypoints.push(destination);
    return waypoints;
  }

  /**
   * Bezier curve interpolation for smooth road curves
   */
  private bezierInterpolation(start: RoutePoint, end: RoutePoint, t: number): RoutePoint {
    // Create control points for bezier curve
    const deltaLat = end.latitude - start.latitude;
    const deltaLon = end.longitude - start.longitude;
    
    // Control points create gentle curves
    const control1 = {
      latitude: start.latitude + deltaLat * 0.3 + deltaLon * 0.1,
      longitude: start.longitude + deltaLon * 0.3 - deltaLat * 0.1
    };
    
    const control2 = {
      latitude: start.latitude + deltaLat * 0.7 - deltaLon * 0.1,
      longitude: start.longitude + deltaLon * 0.7 + deltaLat * 0.1
    };
    
    // Cubic bezier curve calculation
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    const lat = uuu * start.latitude + 
                3 * uu * t * control1.latitude + 
                3 * u * tt * control2.latitude + 
                ttt * end.latitude;
                
    const lon = uuu * start.longitude + 
                3 * uu * t * control1.longitude + 
                3 * u * tt * control2.longitude + 
                ttt * end.longitude;
    
    return { latitude: lat, longitude: lon };
  }


  private categorizeTrafficLevel(delayFactor: number): 'low' | 'medium' | 'high' | 'congested' {
    if (delayFactor < 1.1) return 'low';
    if (delayFactor < 1.3) return 'medium';
    if (delayFactor < 1.6) return 'high';
    return 'congested';
  }

  private determineRoadType(segmentDistance: number): 'highway' | 'arterial' | 'local' {
    if (segmentDistance > 5000) return 'highway';
    if (segmentDistance > 1000) return 'arterial';
    return 'local';
  }

  private determineRouteType(trafficAnalysis: any): 'fastest' | 'most_stable' | 'shortest' {
    if (trafficAnalysis.confidence > 0.8) return 'most_stable';
    if (trafficAnalysis.delayFactor < 1.2) return 'fastest';
    return 'shortest';
  }

  private calculateEstimatedArrivalTime(route: OptimizedRoute, departureTime: Date): Date {
    const arrivalTime = new Date(departureTime);
    arrivalTime.setSeconds(arrivalTime.getSeconds() + route.estimatedTimeWithTraffic);
    return arrivalTime;
  }

  /**
   * Save route performance data for analytics
   */
  async saveRoutePerformance(performance: RoutePerformance): Promise<void> {
    try {
      // In demo mode, save to localStorage
      if (config.demoMode) {
        const existing = localStorage.getItem('routePerformance') || '[]';
        const performances = JSON.parse(existing);
        performances.push(performance);
        localStorage.setItem('routePerformance', JSON.stringify(performances));
      } else {
        // TODO: Save to Firebase/database
        console.log('Route performance saved:', performance);
      }
    } catch (error) {
      console.error('Failed to save route performance:', error);
    }
  }

  /**
   * Get route analytics
   */
  async getRouteAnalytics(): Promise<any> {
    try {
      if (config.demoMode) {
        const stored = localStorage.getItem('routePerformance') || '[]';
        const performances = JSON.parse(stored);
        
        if (performances.length === 0) {
          return this.generateMockAnalytics();
        }

        // Calculate analytics from stored data
        const totalRoutes = performances.length;
        const avgAccuracy = performances.reduce((sum: number, p: RoutePerformance) => sum + p.accuracy, 0) / totalRoutes;
        const totalTimeSaved = performances.reduce((sum: number, p: RoutePerformance) => sum + Math.max(0, p.plannedTime - p.actualTime), 0);

        return {
          averageAccuracy: avgAccuracy,
          totalRoutesOptimized: totalRoutes,
          timeSaved: totalTimeSaved,
          mostEfficientTimeSlots: this.calculateEfficientTimeSlots(performances),
          problematicAreas: []
        };
      }
      
      return this.generateMockAnalytics();
    } catch (error) {
      console.error('Failed to get route analytics:', error);
      return this.generateMockAnalytics();
    }
  }

  private generateMockAnalytics() {
    return {
      averageAccuracy: 0.85,
      totalRoutesOptimized: 47,
      timeSaved: 1420, // seconds
      mostEfficientTimeSlots: [
        { hour: 6, averageSpeed: 45, reliability: 0.9 },
        { hour: 10, averageSpeed: 40, reliability: 0.85 },
        { hour: 14, averageSpeed: 38, reliability: 0.8 },
        { hour: 22, averageSpeed: 50, reliability: 0.95 }
      ],
      problematicAreas: [
        { location: { latitude: 35.6762, longitude: 139.6503 }, frequency: 12, averageDelay: 180 },
        { location: { latitude: 35.7028, longitude: 139.7753 }, frequency: 8, averageDelay: 120 }
      ]
    };
  }

  private calculateEfficientTimeSlots(performances: RoutePerformance[]) {
    const hourlyData = new Map();
    
    performances.forEach(p => {
      const hour = new Date(p.completedAt).getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { speeds: [], accuracies: [] });
      }
      
      const speed = (p.plannedTime > 0) ? (1000 / p.plannedTime) * 3.6 : 30; // Rough speed calculation
      hourlyData.get(hour).speeds.push(speed);
      hourlyData.get(hour).accuracies.push(p.accuracy);
    });
    
    const result = [];
    for (const [hour, data] of hourlyData.entries()) {
      const avgSpeed = data.speeds.reduce((a: number, b: number) => a + b, 0) / data.speeds.length;
      const reliability = data.accuracies.reduce((a: number, b: number) => a + b, 0) / data.accuracies.length;
      result.push({ hour, averageSpeed: avgSpeed, reliability });
    }
    
    return result.sort((a, b) => b.reliability - a.reliability).slice(0, 4);
  }
}

export const routeOptimizationService = new RouteOptimizationService();