import { RoutePoint } from '@/types/route';

// Road network node and edge types
export interface RoadNode {
  id: string;
  latitude: number;
  longitude: number;
  type: 'intersection' | 'endpoint' | 'waypoint';
}

export interface RoadEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number; // meters
  maxSpeed: number; // km/h
  roadType: 'highway' | 'primary' | 'secondary' | 'tertiary' | 'residential';
  wayType: 'motorway' | 'trunk' | 'primary' | 'secondary' | 'tertiary' | 'unclassified' | 'residential';
  coordinates: RoutePoint[]; // Detailed geometry of the road segment
  oneWay: boolean;
  tollRoad: boolean;
}

export interface RoadNetwork {
  nodes: Map<string, RoadNode>;
  edges: Map<string, RoadEdge>;
  nodeEdges: Map<string, string[]>; // Node ID -> Edge IDs
}

export interface RoadPath {
  nodes: RoadNode[];
  edges: RoadEdge[];
  totalDistance: number;
  estimatedTime: number;
  coordinates: RoutePoint[];
}

class RoadNetworkService {
  private networkCache: Map<string, RoadNetwork> = new Map();
  private pathfindingCache: Map<string, RoadPath> = new Map();

  /**
   * Get road network data for a specific area using OpenStreetMap Overpass API (OSMnx-style)
   */
  async getRoadNetwork(bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  }): Promise<RoadNetwork> {
    const cacheKey = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
    
    if (this.networkCache.has(cacheKey)) {
      console.log('📋 Using cached road network data');
      return this.networkCache.get(cacheKey)!;
    }

    try {
      console.log('🌐 Fetching OSM road network data for area:', bounds);
      
      // Simplified Overpass API query optimized for routing
      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["highway"~"^(primary|secondary|tertiary|unclassified|residential)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
          way["highway"~"^(trunk|motorway)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        (._;>;);
        out geom;
      `;

      console.log('🔍 Querying Overpass API...');
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const response = await fetch(overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) {
        console.warn(`⚠️ Overpass API error: ${response.status} ${response.statusText}`);
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Received OSM data, parsing network...');
      
      const network = this.parseOverpassData(data);
      
      if (network.nodes.size > 0 && network.edges.size > 0) {
        this.networkCache.set(cacheKey, network);
        console.log(`✅ Loaded OSM road network: ${network.nodes.size} nodes, ${network.edges.size} edges`);
        return network;
      } else {
        console.warn('⚠️ Empty network from Overpass API, using mock network');
        throw new Error('Empty network data received');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch road network from Overpass API:', error);
      console.log('🔄 Generating mock road network as fallback...');
      return this.generateMockNetwork(bounds);
    }
  }

  /**
   * Parse OpenStreetMap Overpass API response into road network
   */
  private parseOverpassData(data: any): RoadNetwork {
    const nodes = new Map<string, RoadNode>();
    const edges = new Map<string, RoadEdge>();
    const nodeEdges = new Map<string, string[]>();

    // First pass: collect all nodes
    data.elements
      .filter((element: any) => element.type === 'node')
      .forEach((nodeData: any) => {
        const node: RoadNode = {
          id: nodeData.id.toString(),
          latitude: nodeData.lat,
          longitude: nodeData.lon,
          type: 'waypoint'
        };
        nodes.set(node.id, node);
      });

    // Second pass: create edges from ways
    data.elements
      .filter((element: any) => element.type === 'way' && element.tags?.highway)
      .forEach((wayData: any) => {
        const roadType = this.classifyRoadType(wayData.tags.highway);
        const maxSpeed = this.getMaxSpeed(wayData.tags.highway, wayData.tags.maxspeed);
        const oneWay = wayData.tags.oneway === 'yes';
        const tollRoad = wayData.tags.toll === 'yes';

        // Create coordinates from geometry
        const coordinates: RoutePoint[] = wayData.geometry?.map((point: any) => ({
          latitude: point.lat,
          longitude: point.lon
        })) || [];

        if (coordinates.length < 2) return;

        // Calculate distance
        let distance = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
          distance += this.calculateDistance(
            coordinates[i].latitude, coordinates[i].longitude,
            coordinates[i + 1].latitude, coordinates[i + 1].longitude
          );
        }

        const edgeId = `way_${wayData.id}`;
        const fromNodeId = wayData.nodes[0].toString();
        const toNodeId = wayData.nodes[wayData.nodes.length - 1].toString();

        const edge: RoadEdge = {
          id: edgeId,
          fromNodeId,
          toNodeId,
          distance,
          maxSpeed,
          roadType,
          wayType: wayData.tags.highway,
          coordinates,
          oneWay,
          tollRoad
        };

        edges.set(edgeId, edge);

        // Update node-edge mapping
        [fromNodeId, toNodeId].forEach(nodeId => {
          if (!nodeEdges.has(nodeId)) {
            nodeEdges.set(nodeId, []);
          }
          nodeEdges.get(nodeId)!.push(edgeId);
        });

        // Mark intersection nodes
        if (nodeEdges.get(fromNodeId)!.length > 1 && nodes.has(fromNodeId)) {
          const node = nodes.get(fromNodeId)!;
          node.type = 'intersection';
        }
        if (nodeEdges.get(toNodeId)!.length > 1 && nodes.has(toNodeId)) {
          const node = nodes.get(toNodeId)!;
          node.type = 'intersection';
        }
      });

    return { nodes, edges, nodeEdges };
  }

  /**
   * Find shortest path using Dijkstra's algorithm
   */
  async findPath(
    network: RoadNetwork,
    start: RoutePoint,
    end: RoutePoint,
    preference: 'distance' | 'time' = 'time'
  ): Promise<RoadPath | null> {
    const cacheKey = `${start.latitude},${start.longitude}-${end.latitude},${end.longitude}-${preference}`;
    
    if (this.pathfindingCache.has(cacheKey)) {
      return this.pathfindingCache.get(cacheKey)!;
    }

    try {
      // Find nearest nodes to start and end points
      const startNode = this.findNearestNode(network, start);
      const endNode = this.findNearestNode(network, end);

      if (!startNode || !endNode) {
        console.warn('Could not find nearest nodes for pathfinding');
        return null;
      }

      console.log(`Pathfinding from node ${startNode.id} to ${endNode.id}`);

      const path = this.dijkstraPath(network, startNode, endNode, preference);
      
      if (path) {
        this.pathfindingCache.set(cacheKey, path);
      }
      
      return path;
      
    } catch (error) {
      console.error('Pathfinding failed:', error);
      return null;
    }
  }

  /**
   * Dijkstra's algorithm implementation
   */
  private dijkstraPath(
    network: RoadNetwork,
    startNode: RoadNode,
    endNode: RoadNode,
    preference: 'distance' | 'time'
  ): RoadPath | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; edgeId: string } | null>();
    const unvisited = new Set<string>();

    // Initialize
    network.nodes.forEach((_node, nodeId) => {
      distances.set(nodeId, nodeId === startNode.id ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNodeId: string = '';
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          currentNodeId = nodeId;
        }
      }

      if (!currentNodeId || minDistance === Infinity) break;
      
      unvisited.delete(currentNodeId);

      if (currentNodeId === endNode.id) {
        // Reconstruct path
        return this.reconstructPath(network, previous, startNode, endNode);
      }

      // Check neighbors
      const edgeIds = network.nodeEdges.get(currentNodeId) || [];
      for (const edgeId of edgeIds) {
        const edge = network.edges.get(edgeId)!;
        const neighborId = edge.fromNodeId === currentNodeId ? edge.toNodeId : edge.fromNodeId;
        
        if (!unvisited.has(neighborId)) continue;

        // Skip if one-way and wrong direction
        if (edge.oneWay && edge.toNodeId === currentNodeId) continue;

        const weight = preference === 'distance' 
          ? edge.distance 
          : edge.distance / (edge.maxSpeed * 1000 / 3600); // time in seconds

        const altDistance = distances.get(currentNodeId)! + weight;
        
        if (altDistance < distances.get(neighborId)!) {
          distances.set(neighborId, altDistance);
          previous.set(neighborId, { nodeId: currentNodeId, edgeId });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Reconstruct path from Dijkstra results
   */
  private reconstructPath(
    network: RoadNetwork,
    previous: Map<string, { nodeId: string; edgeId: string } | null>,
    _startNode: RoadNode,
    endNode: RoadNode
  ): RoadPath {
    const pathNodes: RoadNode[] = [];
    const pathEdges: RoadEdge[] = [];
    const coordinates: RoutePoint[] = [];
    
    let currentNodeId: string | null = endNode.id;
    
    while (currentNodeId) {
      const node = network.nodes.get(currentNodeId)!;
      pathNodes.unshift(node);
      
      const prev = previous.get(currentNodeId);
      if (prev) {
        const edge = network.edges.get(prev.edgeId)!;
        pathEdges.unshift(edge);
        
        // Add edge coordinates (in correct direction)
        const edgeCoords = edge.fromNodeId === prev.nodeId 
          ? edge.coordinates 
          : [...edge.coordinates].reverse();
        
        if (coordinates.length === 0) {
          coordinates.push(...edgeCoords);
        } else {
          coordinates.push(...edgeCoords.slice(1)); // Skip first point to avoid duplication
        }
      }
      
      currentNodeId = prev?.nodeId || null;
    }

    const totalDistance = pathEdges.reduce((sum, edge) => sum + edge.distance, 0);
    const estimatedTime = pathEdges.reduce((sum, edge) => {
      const speed = edge.maxSpeed * 1000 / 3600; // m/s
      return sum + edge.distance / speed;
    }, 0);

    return {
      nodes: pathNodes,
      edges: pathEdges,
      totalDistance,
      estimatedTime,
      coordinates
    };
  }

  /**
   * Find nearest network node to a given point
   */
  private findNearestNode(network: RoadNetwork, point: RoutePoint): RoadNode | null {
    let nearestNode: RoadNode | null = null;
    let minDistance = Infinity;

    network.nodes.forEach(node => {
      const distance = this.calculateDistance(
        point.latitude, point.longitude,
        node.latitude, node.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    });

    return nearestNode;
  }

  /**
   * Classify road type from OSM highway tag
   */
  private classifyRoadType(highway: string): RoadEdge['roadType'] {
    const typeMap: { [key: string]: RoadEdge['roadType'] } = {
      'motorway': 'highway',
      'trunk': 'highway',
      'primary': 'primary',
      'secondary': 'secondary',
      'tertiary': 'tertiary',
      'unclassified': 'tertiary',
      'residential': 'residential'
    };

    return typeMap[highway] || 'residential';
  }

  /**
   * Get max speed for road type
   */
  private getMaxSpeed(highway: string, maxspeed?: string): number {
    if (maxspeed) {
      const speed = parseInt(maxspeed);
      if (!isNaN(speed)) return speed;
    }

    const defaultSpeeds: { [key: string]: number } = {
      'motorway': 100,
      'trunk': 80,
      'primary': 60,
      'secondary': 50,
      'tertiary': 40,
      'unclassified': 30,
      'residential': 30
    };

    return defaultSpeeds[highway] || 30;
  }

  /**
   * Calculate distance between two points
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
   * Generate mock network for demo/fallback
   */
  private generateMockNetwork(bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  }): RoadNetwork {
    const nodes = new Map<string, RoadNode>();
    const edges = new Map<string, RoadEdge>();
    const nodeEdges = new Map<string, string[]>();

    // Create a simple grid network for Tokyo area
    const gridSize = 0.005; // ~500m
    let nodeIdCounter = 1;
    let edgeIdCounter = 1;

    // Generate grid nodes
    for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
      for (let lon = bounds.west; lon <= bounds.east; lon += gridSize) {
        const nodeId = `node_${nodeIdCounter++}`;
        nodes.set(nodeId, {
          id: nodeId,
          latitude: lat,
          longitude: lon,
          type: 'intersection'
        });
      }
    }

    // Connect adjacent nodes with edges
    const nodeArray = Array.from(nodes.values());
    nodeArray.forEach(currentNode => {
      // Find nearby nodes within grid distance
      const nearbyNodes = nodeArray.filter(other => {
        if (other.id === currentNode.id) return false;
        const distance = this.calculateDistance(
          currentNode.latitude, currentNode.longitude,
          other.latitude, other.longitude
        );
        return distance < 600; // Connect nodes within 600m
      });

      nearbyNodes.forEach(neighbor => {
        const edgeId = `edge_${edgeIdCounter++}`;
        const distance = this.calculateDistance(
          currentNode.latitude, currentNode.longitude,
          neighbor.latitude, neighbor.longitude
        );

        const edge: RoadEdge = {
          id: edgeId,
          fromNodeId: currentNode.id,
          toNodeId: neighbor.id,
          distance,
          maxSpeed: 40,
          roadType: 'secondary',
          wayType: 'secondary',
          coordinates: [
            { latitude: currentNode.latitude, longitude: currentNode.longitude },
            { latitude: neighbor.latitude, longitude: neighbor.longitude }
          ],
          oneWay: false,
          tollRoad: false
        };

        edges.set(edgeId, edge);

        // Update node-edge mapping
        [currentNode.id, neighbor.id].forEach(nodeId => {
          if (!nodeEdges.has(nodeId)) {
            nodeEdges.set(nodeId, []);
          }
          nodeEdges.get(nodeId)!.push(edgeId);
        });
      });
    });

    console.log(`Generated mock network: ${nodes.size} nodes, ${edges.size} edges`);
    return { nodes, edges, nodeEdges };
  }
}

export const roadNetworkService = new RoadNetworkService();