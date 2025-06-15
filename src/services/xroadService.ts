import { TrafficData, DrmPfRouteRequest, DrmPfRouteResponse, RoutePoint } from '@/types/route';

// xROAD API configuration
const XROAD_CONFIG = {
  TRAFFIC_API: {
    baseUrl: 'https://api.jartic-open-traffic.org/geoserver',
    username: 'traffic',
    password: 'traffic'
  },
  DRM_PF_API: {
    baseUrl: 'https://pf.drm.jp',
    authEndpoint: '/api/0/auth',
    routeEndpoint: '/api/9/route'
  }
};

class XRoadService {
  private drmPfToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Get real-time traffic data from JARTIC API for a specific area
   */
  async getTrafficData(
    bounds: {
      west: number;
      south: number;
      east: number;
      north: number;
    },
    timeOffset: number = 30 // minutes ago (due to 20-30min delay in data)
  ): Promise<TrafficData> {
    try {
      // Calculate the time code for traffic data (format: YYYYMMDDHHMM)
      const targetTime = new Date();
      targetTime.setMinutes(targetTime.getMinutes() - timeOffset);
      
      // Adjust for JST (UTC+9)
      const jstTime = new Date(targetTime.getTime() + (9 * 60 * 60 * 1000));
      const timeCode = this.formatTimeCode(jstTime);

      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: 't_travospublic_measure_5m',
        srsName: 'EPSG:4326',
        outputFormat: 'application/json',
        exceptions: 'application/json',
        cql_filter: `時間コード=${timeCode} AND 道路種別=3 AND BBOX(ジオメトリ,${bounds.west},${bounds.south},${bounds.east},${bounds.north},'EPSG:4326')`
      });

      const response = await fetch(`${XROAD_CONFIG.TRAFFIC_API.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${XROAD_CONFIG.TRAFFIC_API.username}:${XROAD_CONFIG.TRAFFIC_API.password}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Traffic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as TrafficData;
    } catch (error) {
      console.error('Failed to fetch traffic data:', error);
      throw error;
    }
  }

  /**
   * Get traffic data around a specific point
   */
  async getTrafficDataAroundPoint(
    center: RoutePoint,
    radiusKm: number = 3
  ): Promise<TrafficData> {
    // Convert radius to degrees (approximate)
    const latDegree = radiusKm / 111.0;
    const lonDegree = radiusKm / (111.0 * Math.abs(Math.cos(center.latitude * Math.PI / 180)));

    const bounds = {
      west: center.longitude - lonDegree,
      south: center.latitude - latDegree,
      east: center.longitude + lonDegree,
      north: center.latitude + latDegree
    };

    return this.getTrafficData(bounds);
  }

  /**
   * Authenticate with DRM-PF API and get access token
   */
  private async authenticateDrmPf(): Promise<string> {
    // Check if current token is still valid
    if (this.drmPfToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.drmPfToken!;
    }

    try {
      console.log('Authenticating with DRM-PF API...');
      
      const response = await fetch(`${XROAD_CONFIG.DRM_PF_API.baseUrl}${XROAD_CONFIG.DRM_PF_API.authEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // These would be your actual DRM-PF API credentials
          login_id: process.env.VITE_DRM_PF_LOGIN_ID || 'demo_login',
          password: process.env.VITE_DRM_PF_PASSWORD || 'demo_password'
        })
      });

      if (!response.ok) {
        throw new Error(`DRM-PF auth error: ${response.status} ${response.statusText}`);
      }

      const authData = await response.json();
      this.drmPfToken = authData.access_token;
      
      if (!this.drmPfToken) {
        throw new Error('No access token received from DRM-PF API');
      }
      
      // DRM-PF tokens are valid for 60 minutes
      this.tokenExpiry = new Date();
      this.tokenExpiry.setMinutes(this.tokenExpiry.getMinutes() + 60);

      console.log('✅ DRM-PF authentication successful');
      return this.drmPfToken!;
    } catch (error) {
      console.error('❌ DRM-PF authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get route options from DRM-PF API
   */
  async getRouteOptions(request: DrmPfRouteRequest): Promise<DrmPfRouteResponse> {
    try {
      console.log('🔍 Requesting DRM-PF route from:', request.startLat, request.startLon, 'to:', request.endLat, request.endLon);
      
      const token = await this.authenticateDrmPf();

      const params = new URLSearchParams({
        start_lat: request.startLat.toString(),
        start_lon: request.startLon.toString(),
        goal_lat: request.endLat.toString(),
        goal_lon: request.endLon.toString(),
        crs: 'EPSG:4326',
        // Optional parameters from xroad_extract_sample.py
        ...(request.searchType === 'time' && { optimize: 'time' }),
        ...(request.searchType === 'distance' && { optimize: 'distance' })
      });

      const response = await fetch(`${XROAD_CONFIG.DRM_PF_API.baseUrl}${XROAD_CONFIG.DRM_PF_API.routeEndpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DRM-PF route error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ DRM-PF route response received');
      
      // Transform DRM-PF response to our expected format
      return this.transformDrmPfResponse(data, request);
      
    } catch (error) {
      console.error('❌ Failed to get DRM-PF route options:', error);
      throw error;
    }
  }

  /**
   * Transform DRM-PF API response to our expected format
   */
  private transformDrmPfResponse(data: any, _request: DrmPfRouteRequest): DrmPfRouteResponse {
    try {
      // Extract GeoJSON from response
      const geoData = data.geo_data;
      
      if (!geoData || !geoData.coordinates) {
        throw new Error('No route geometry in DRM-PF response');
      }

      // Convert GeoJSON coordinates to our route points format
      const coordinates = geoData.type === 'LineString' 
        ? geoData.coordinates 
        : geoData.type === 'MultiLineString' 
          ? geoData.coordinates.flat() 
          : [];

      const points = coordinates.map(([lon, lat]: [number, number]) => ({
        lat,
        lon
      }));

      // Calculate distance and time estimates
      const totalDistance = this.calculateRouteDistance(points);
      const estimatedTime = totalDistance / (40 * 1000 / 3600); // Assume 40 km/h average

      // Create route response
      const route = {
        routeId: `drm_pf_${Date.now()}`,
        totalDistance,
        totalTime: estimatedTime,
        points,
        links: [] // DRM-PF doesn't provide link details in basic response
      };

      console.log(`📏 DRM-PF route: ${Math.round(totalDistance)}m, ${Math.round(estimatedTime)}s, ${points.length} points`);

      return {
        routes: [route]
      };
      
    } catch (error) {
      console.error('Failed to transform DRM-PF response:', error);
      throw error;
    }
  }

  /**
   * Calculate route distance from points
   */
  private calculateRouteDistance(points: Array<{lat: number, lon: number}>): number {
    let totalDistance = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistance(
        points[i].lat, points[i].lon,
        points[i + 1].lat, points[i + 1].lon
      );
    }
    
    return totalDistance;
  }

  /**
   * Calculate traffic density for a route segment
   */
  calculateTrafficDensity(trafficData: TrafficData, routePoint: RoutePoint, radius: number = 1000): number {
    let totalTraffic = 0;
    let pointCount = 0;

    trafficData.features.forEach(feature => {
      const [lon, lat] = feature.geometry.coordinates;
      const distance = this.calculateDistance(routePoint.latitude, routePoint.longitude, lat, lon);

      if (distance <= radius) {
        const props = feature.properties;
        const traffic = props.上り小型交通量 + props.上り大型交通量 + 
                       props.下り小型交通量 + props.下り大型交通量;
        totalTraffic += traffic;
        pointCount++;
      }
    });

    return pointCount > 0 ? totalTraffic / pointCount : 0;
  }

  /**
   * Format timestamp for JARTIC API time code
   */
  private formatTimeCode(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, '0'); // Round to 5-min intervals
    
    return `${year}${month}${day}${hour}${minute}`;
  }

  /**
   * Calculate distance between two points using Haversine formula
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

  /**
   * Create mock traffic data for demo mode
   */
  createMockTrafficData(bounds: { west: number; south: number; east: number; north: number }): TrafficData {
    const features = [];
    const gridSize = 0.01; // roughly 1km

    // Generate grid of mock traffic points
    for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
      for (let lon = bounds.west; lon <= bounds.east; lon += gridSize) {
        // Simulate varying traffic levels
        const baseTraffic = Math.random() * 100;
        const timeMultiplier = this.getTimeBasedTrafficMultiplier();
        
        features.push({
          type: 'Feature' as const,
          properties: {
            観測点コード: `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            時間コード: this.formatTimeCode(new Date()),
            道路種別: 3,
            上り小型交通量: Math.floor(baseTraffic * timeMultiplier * 0.7),
            上り大型交通量: Math.floor(baseTraffic * timeMultiplier * 0.1),
            下り小型交通量: Math.floor(baseTraffic * timeMultiplier * 0.7),
            下り大型交通量: Math.floor(baseTraffic * timeMultiplier * 0.1),
            ジオメトリ: {
              type: 'Point' as const,
              coordinates: [lon, lat] as [number, number]
            }
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [lon, lat] as [number, number]
          }
        });
      }
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Get traffic multiplier based on current time
   */
  private getTimeBasedTrafficMultiplier(): number {
    const hour = new Date().getHours();
    
    // Rush hour patterns
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 2.0; // Peak traffic
    } else if ((hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 20)) {
      return 1.5; // Heavy traffic
    } else if (hour >= 22 || hour <= 5) {
      return 0.3; // Light traffic
    } else {
      return 1.0; // Normal traffic
    }
  }
}

export const xroadService = new XRoadService();