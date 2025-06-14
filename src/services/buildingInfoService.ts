import { GeoPoint } from 'firebase/firestore';
import { 
  BuildingInfo, 
  BuildingSearchOptions, 
  BuildingInfoResponse 
} from '@/types/buildingInfo';
import { config } from '@/config/environment';

class BuildingInfoService {
  private mockData: BuildingInfo[] = [
    {
      id: 'building-1',
      name: '東京駅',
      type: 'station',
      address: '東京都千代田区丸の内1丁目',
      floors: 3,
      basement: 4,
      elevators: [
        {
          id: 'elv-1',
          location: '丸の内中央口',
          capacity: 20,
          maxWeight: 1350,
          floors: [-4, -3, -2, -1, 1, 2, 3],
          isAccessible: true,
          status: 'working'
        },
        {
          id: 'elv-2',
          location: '八重洲中央口',
          capacity: 15,
          maxWeight: 1000,
          floors: [-2, -1, 1, 2],
          isAccessible: true,
          status: 'working'
        }
      ],
      staircases: [
        {
          id: 'stair-1',
          location: '丸の内北口階段',
          type: 'normal',
          floors: [-1, 1, 2],
          width: 'wide'
        },
        {
          id: 'stair-2',
          location: '八重洲南口階段',
          type: 'normal',
          floors: [-1, 1],
          width: 'standard'
        }
      ],
      exits: [
        {
          id: 'exit-1',
          name: '丸の内中央口',
          type: 'main',
          floor: 1,
          direction: '西側',
          isAccessible: true,
          nearbyLandmarks: ['皇居', '丸ビル']
        },
        {
          id: 'exit-2',
          name: '八重洲中央口',
          type: 'main',
          floor: 1,
          direction: '東側',
          isAccessible: true,
          nearbyLandmarks: ['大丸東京店', 'グランルーフ']
        },
        {
          id: 'exit-3',
          name: '丸の内北口',
          type: 'main',
          floor: 1,
          direction: '北西',
          isAccessible: true,
          nearbyLandmarks: ['KITTE', '東京中央郵便局']
        }
      ],
      accessibility: {
        wheelchairAccessible: true,
        elevatorToAllFloors: true,
        accessibleParking: false,
        accessibleRestrooms: true,
        guidanceForVisuallyImpaired: true
      },
      emergencyContact: '03-3212-2345',
      location: this.createMockGeoPoint(35.6812, 139.7671),
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'building-2',
      name: '新宿パークタワー',
      type: 'office',
      address: '東京都新宿区西新宿3丁目7-1',
      floors: 52,
      basement: 3,
      elevators: [
        {
          id: 'elv-3',
          location: '低層用エレベーター',
          capacity: 20,
          maxWeight: 1350,
          floors: [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          isAccessible: true,
          status: 'working'
        },
        {
          id: 'elv-4',
          location: '高層用エレベーター',
          capacity: 20,
          maxWeight: 1350,
          floors: [1, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
          isAccessible: true,
          status: 'working'
        },
        {
          id: 'elv-5',
          location: '非常用エレベーター',
          capacity: 17,
          maxWeight: 1150,
          floors: [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
          isAccessible: true,
          status: 'working'
        }
      ],
      staircases: [
        {
          id: 'stair-3',
          location: '北側非常階段',
          type: 'emergency',
          floors: [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
          width: 'standard'
        },
        {
          id: 'stair-4',
          location: '南側非常階段',
          type: 'emergency',
          floors: [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
          width: 'standard'
        }
      ],
      exits: [
        {
          id: 'exit-4',
          name: 'メインエントランス',
          type: 'main',
          floor: 1,
          direction: '南側',
          isAccessible: true,
          nearbyLandmarks: ['新宿中央公園', 'ハイアットリージェンシー東京']
        },
        {
          id: 'exit-5',
          name: '北側出口',
          type: 'emergency',
          floor: 1,
          direction: '北側',
          isAccessible: false
        }
      ],
      accessibility: {
        wheelchairAccessible: true,
        elevatorToAllFloors: true,
        accessibleParking: true,
        accessibleRestrooms: true,
        guidanceForVisuallyImpaired: false
      },
      emergencyContact: '03-5322-1234',
      location: this.createMockGeoPoint(35.6879, 139.6917),
      lastUpdated: new Date('2024-02-01')
    },
    {
      id: 'building-3',
      name: '渋谷スカイ',
      type: 'shopping',
      address: '東京都渋谷区渋谷2丁目24-12',
      floors: 14,
      basement: 2,
      elevators: [
        {
          id: 'elv-6',
          location: '中央エレベーター',
          capacity: 24,
          maxWeight: 1600,
          floors: [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
          isAccessible: true,
          status: 'working'
        }
      ],
      staircases: [
        {
          id: 'stair-5',
          location: 'エスカレーター',
          type: 'escalator',
          floors: [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
          width: 'wide'
        }
      ],
      exits: [
        {
          id: 'exit-6',
          name: 'JR渋谷駅直結',
          type: 'main',
          floor: 2,
          direction: '東側',
          isAccessible: true,
          nearbyLandmarks: ['渋谷駅', 'ハチ公']
        }
      ],
      accessibility: {
        wheelchairAccessible: true,
        elevatorToAllFloors: true,
        accessibleParking: false,
        accessibleRestrooms: true,
        guidanceForVisuallyImpaired: true
      },
      location: this.createMockGeoPoint(35.6580, 139.7016),
      lastUpdated: new Date('2024-01-20')
    }
  ];

  private createMockGeoPoint(latitude: number, longitude: number): GeoPoint {
    return {
      latitude,
      longitude,
      isEqual: (other: GeoPoint) => 
        Math.abs(latitude - other.latitude) < 0.0001 && 
        Math.abs(longitude - other.longitude) < 0.0001
    } as GeoPoint;
  }

  private calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371000; // 地球の半径（メートル）
    const lat1Rad = (point1.latitude * Math.PI) / 180;
    const lat2Rad = (point2.latitude * Math.PI) / 180;
    const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLonRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async getBuildingInfoByLocation(
    location: GeoPoint, 
    options: BuildingSearchOptions = {}
  ): Promise<BuildingInfoResponse> {
    console.log('Building service: Getting building info for location', location);
    
    try {
      if (config.demoMode) {
        return this.getMockBuildingInfo(location, options);
      }

      // 本番環境では外部APIを呼び出し
      // TODO: Google Places API等の実装
      return {
        building: null,
        confidence: 0
      };
    } catch (error) {
      console.error('Failed to get building info:', error);
      return {
        building: null,
        confidence: 0
      };
    }
  }

  private getMockBuildingInfo(
    location: GeoPoint, 
    options: BuildingSearchOptions
  ): BuildingInfoResponse {
    const radius = options.radius || 100; // デフォルト100メートル
    
    let closestBuilding: BuildingInfo | null = null;
    let minDistance = Infinity;

    for (const building of this.mockData) {
      const distance = this.calculateDistance(location, building.location);
      
      if (distance <= radius && distance < minDistance) {
        // 建物種別フィルターのチェック
        if (options.buildingTypes && !options.buildingTypes.includes(building.type)) {
          continue;
        }
        
        // バリアフリー要件のチェック
        if (options.requireAccessibility && !building.accessibility.wheelchairAccessible) {
          continue;
        }
        
        closestBuilding = building;
        minDistance = distance;
      }
    }

    return {
      building: closestBuilding,
      distance: closestBuilding ? minDistance : undefined,
      confidence: closestBuilding ? Math.max(0.1, 1 - (minDistance / radius)) : 0
    };
  }

  async searchBuildings(query: string): Promise<BuildingInfo[]> {
    console.log('Building service: Searching buildings with query', query);
    
    try {
      if (config.demoMode) {
        return this.mockData.filter(building => 
          building.name.toLowerCase().includes(query.toLowerCase()) ||
          building.address.toLowerCase().includes(query.toLowerCase())
        );
      }

      // 本番環境では外部APIを呼び出し
      return [];
    } catch (error) {
      console.error('Failed to search buildings:', error);
      return [];
    }
  }

  async updateBuildingInfo(buildingId: string, info: Partial<BuildingInfo>): Promise<void> {
    console.log('Building service: Updating building info', buildingId, info);
    
    try {
      if (config.demoMode) {
        const index = this.mockData.findIndex(building => building.id === buildingId);
        if (index !== -1) {
          this.mockData[index] = { ...this.mockData[index], ...info };
        }
        return;
      }

      // 本番環境では外部APIを呼び出し
      // TODO: Firebase/API実装
    } catch (error) {
      console.error('Failed to update building info:', error);
      throw error;
    }
  }
}

export const buildingInfoService = new BuildingInfoService();