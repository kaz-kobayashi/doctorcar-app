import { buildingInfoService } from '../buildingInfoService';
import { GeoPoint } from 'firebase/firestore';
import { BuildingSearchOptions } from '@/types/buildingInfo';

// Mock GeoPoint factory
const createMockGeoPoint = (latitude: number, longitude: number): GeoPoint => ({
  latitude,
  longitude,
  isEqual: (other: GeoPoint) => 
    Math.abs(latitude - other.latitude) < 0.0001 && 
    Math.abs(longitude - other.longitude) < 0.0001
} as GeoPoint);

describe('BuildingInfoService', () => {
  beforeEach(() => {
    // デモモードを有効にする
    jest.mock('@/config', () => ({
      config: { demoMode: true }
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBuildingInfoByLocation', () => {
    it('東京駅の近くで建物情報を正しく取得できる', async () => {
      // 東京駅の座標
      const tokyoStationLocation = createMockGeoPoint(35.6812, 139.7671);
      
      const result = await buildingInfoService.getBuildingInfoByLocation(tokyoStationLocation);
      
      expect(result.building).not.toBeNull();
      expect(result.building?.name).toBe('東京駅');
      expect(result.building?.type).toBe('station');
      expect(result.distance).toBeLessThan(100);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('新宿パークタワーの近くで建物情報を正しく取得できる', async () => {
      // 新宿パークタワーの座標
      const shinjukuParkTowerLocation = createMockGeoPoint(35.6879, 139.6917);
      
      const result = await buildingInfoService.getBuildingInfoByLocation(shinjukuParkTowerLocation);
      
      expect(result.building).not.toBeNull();
      expect(result.building?.name).toBe('新宿パークタワー');
      expect(result.building?.type).toBe('office');
      expect(result.distance).toBeLessThan(100);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('建物が存在しない場所ではnullを返す', async () => {
      // 海上の座標
      const oceanLocation = createMockGeoPoint(35.0, 140.0);
      
      const result = await buildingInfoService.getBuildingInfoByLocation(oceanLocation);
      
      expect(result.building).toBeNull();
      expect(result.distance).toBeUndefined();
      expect(result.confidence).toBe(0);
    });

    it('検索半径オプションが正しく動作する', async () => {
      // 東京駅から少し離れた座標
      const nearTokyoStationLocation = createMockGeoPoint(35.6820, 139.7680);
      const options: BuildingSearchOptions = { radius: 50 };
      
      const result = await buildingInfoService.getBuildingInfoByLocation(nearTokyoStationLocation, options);
      
      // 50メートル以内に建物がないはず
      expect(result.building).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('建物種別フィルターが正しく動作する', async () => {
      // 東京駅の座標だが、officeタイプのみを検索
      const tokyoStationLocation = createMockGeoPoint(35.6812, 139.7671);
      const options: BuildingSearchOptions = { buildingTypes: ['office'] };
      
      const result = await buildingInfoService.getBuildingInfoByLocation(tokyoStationLocation, options);
      
      // 駅は除外されるはず
      expect(result.building).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('バリアフリー要件フィルターが正しく動作する', async () => {
      // 東京駅の座標でバリアフリー必須
      const tokyoStationLocation = createMockGeoPoint(35.6812, 139.7671);
      const options: BuildingSearchOptions = { requireAccessibility: true };
      
      const result = await buildingInfoService.getBuildingInfoByLocation(tokyoStationLocation, options);
      
      expect(result.building).not.toBeNull();
      expect(result.building?.accessibility.wheelchairAccessible).toBe(true);
    });
  });

  describe('searchBuildings', () => {
    it('建物名による検索が正しく動作する', async () => {
      const results = await buildingInfoService.searchBuildings('東京駅');
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('東京駅');
    });

    it('部分文字列による検索が正しく動作する', async () => {
      const results = await buildingInfoService.searchBuildings('新宿');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(building => building.name.includes('新宿'))).toBe(true);
    });

    it('住所による検索が正しく動作する', async () => {
      const results = await buildingInfoService.searchBuildings('千代田区');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(building => building.address.includes('千代田区'))).toBe(true);
    });

    it('大文字小文字を区別しない検索が正しく動作する', async () => {
      const results = await buildingInfoService.searchBuildings('TOKYO');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(building => building.name.toLowerCase().includes('tokyo'))).toBe(true);
    });

    it('存在しない建物名で空の配列を返す', async () => {
      const results = await buildingInfoService.searchBuildings('存在しない建物');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('updateBuildingInfo', () => {
    it('建物情報の更新が正しく動作する', async () => {
      const buildingId = 'building-1';
      const updateInfo = { emergencyContact: '03-1234-5678' };
      
      await expect(buildingInfoService.updateBuildingInfo(buildingId, updateInfo))
        .resolves.not.toThrow();
    });

    it('存在しない建物IDでもエラーにならない', async () => {
      const buildingId = 'non-existent-building';
      const updateInfo = { emergencyContact: '03-1234-5678' };
      
      await expect(buildingInfoService.updateBuildingInfo(buildingId, updateInfo))
        .resolves.not.toThrow();
    });
  });

  describe('建物情報の構造検証', () => {
    it('東京駅の建物情報が正しい構造を持っている', async () => {
      const tokyoStationLocation = createMockGeoPoint(35.6812, 139.7671);
      const result = await buildingInfoService.getBuildingInfoByLocation(tokyoStationLocation);
      
      const building = result.building!;
      
      // 基本情報の検証
      expect(building.id).toBe('building-1');
      expect(building.name).toBe('東京駅');
      expect(building.type).toBe('station');
      expect(building.address).toContain('東京都千代田区');
      expect(building.floors).toBe(3);
      expect(building.basement).toBe(4);
      
      // エレベーター情報の検証
      expect(building.elevators).toHaveLength(2);
      expect(building.elevators[0]).toHaveProperty('id');
      expect(building.elevators[0]).toHaveProperty('location');
      expect(building.elevators[0]).toHaveProperty('capacity');
      expect(building.elevators[0]).toHaveProperty('maxWeight');
      expect(building.elevators[0]).toHaveProperty('floors');
      expect(building.elevators[0]).toHaveProperty('isAccessible');
      expect(building.elevators[0]).toHaveProperty('status');
      
      // 階段情報の検証
      expect(building.staircases).toHaveLength(2);
      expect(building.staircases[0]).toHaveProperty('id');
      expect(building.staircases[0]).toHaveProperty('location');
      expect(building.staircases[0]).toHaveProperty('type');
      expect(building.staircases[0]).toHaveProperty('floors');
      expect(building.staircases[0]).toHaveProperty('width');
      
      // 出口情報の検証
      expect(building.exits).toHaveLength(3);
      expect(building.exits[0]).toHaveProperty('id');
      expect(building.exits[0]).toHaveProperty('name');
      expect(building.exits[0]).toHaveProperty('type');
      expect(building.exits[0]).toHaveProperty('floor');
      expect(building.exits[0]).toHaveProperty('direction');
      expect(building.exits[0]).toHaveProperty('isAccessible');
      
      // アクセシビリティ情報の検証
      expect(building.accessibility).toHaveProperty('wheelchairAccessible');
      expect(building.accessibility).toHaveProperty('elevatorToAllFloors');
      expect(building.accessibility).toHaveProperty('accessibleParking');
      expect(building.accessibility).toHaveProperty('accessibleRestrooms');
      expect(building.accessibility).toHaveProperty('guidanceForVisuallyImpaired');
      
      // その他の情報
      expect(building.emergencyContact).toBeTruthy();
      expect(building.location).toHaveProperty('latitude');
      expect(building.location).toHaveProperty('longitude');
      expect(building.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('距離計算の検証', () => {
    it('近い位置で小さな距離を返す', async () => {
      // 東京駅から数メートル離れた位置
      const nearLocation = createMockGeoPoint(35.6813, 139.7672);
      
      const result = await buildingInfoService.getBuildingInfoByLocation(nearLocation);
      
      expect(result.building).not.toBeNull();
      expect(result.distance).toBeLessThan(50);
    });

    it('遠い位置で大きな距離を返すか、建物を見つけられない', async () => {
      // 東京駅から1km離れた位置
      const farLocation = createMockGeoPoint(35.6900, 139.7800);
      
      const result = await buildingInfoService.getBuildingInfoByLocation(farLocation);
      
      if (result.building) {
        expect(result.distance).toBeGreaterThan(1000);
      } else {
        expect(result.building).toBeNull();
      }
    });
  });
});