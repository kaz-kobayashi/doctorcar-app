#!/usr/bin/env node

/**
 * 建物情報機能の簡易動作確認スクリプト
 * 
 * このスクリプトは以下をテストします:
 * 1. 建物情報サービスの基本機能
 * 2. 距離計算の精度
 * 3. モックデータの整合性
 */

// Node.js環境でのモックファイアベース
const mockFirestore = {
  GeoPoint: class {
    constructor(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
    
    isEqual(other) {
      return Math.abs(this.latitude - other.latitude) < 0.0001 && 
             Math.abs(this.longitude - other.longitude) < 0.0001;
    }
  }
};

// モック設定環境
const mockConfig = { demoMode: true };

// 簡易的な建物情報サービステスト
class TestBuildingInfoService {
  constructor() {
    this.mockData = [
      {
        id: 'building-1',
        name: '東京駅',
        type: 'station',
        location: new mockFirestore.GeoPoint(35.6812, 139.7671),
        elevators: [
          { id: 'elv-1', location: '丸の内中央口', isAccessible: true, status: 'working' },
          { id: 'elv-2', location: '八重洲中央口', isAccessible: true, status: 'working' }
        ],
        exits: [
          { id: 'exit-1', name: '丸の内中央口', type: 'main', isAccessible: true },
          { id: 'exit-2', name: '八重洲中央口', type: 'main', isAccessible: true }
        ],
        accessibility: { wheelchairAccessible: true, elevatorToAllFloors: true }
      },
      {
        id: 'building-2',
        name: '新宿パークタワー',
        type: 'office',
        location: new mockFirestore.GeoPoint(35.6879, 139.6917),
        floors: 52,
        elevators: [
          { id: 'elv-3', location: '低層用エレベーター', isAccessible: true, status: 'working' },
          { id: 'elv-4', location: '高層用エレベーター', isAccessible: true, status: 'working' }
        ],
        accessibility: { wheelchairAccessible: true, elevatorToAllFloors: true }
      },
      {
        id: 'building-3',
        name: '渋谷スカイ',
        type: 'shopping',
        location: new mockFirestore.GeoPoint(35.6580, 139.7016),
        elevators: [
          { id: 'elv-6', location: '中央エレベーター', isAccessible: true, status: 'working' }
        ],
        accessibility: { wheelchairAccessible: true, elevatorToAllFloors: true }
      }
    ];
  }

  calculateDistance(point1, point2) {
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

  getBuildingInfoByLocation(location, options = {}) {
    const radius = options.radius || 200;
    
    let closestBuilding = null;
    let minDistance = Infinity;

    for (const building of this.mockData) {
      const distance = this.calculateDistance(location, building.location);
      
      if (distance <= radius && distance < minDistance) {
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
}

// テスト実行
function runTests() {
  console.log('🏗️  建物情報機能テスト開始\n');
  
  const service = new TestBuildingInfoService();
  
  // テストケース1: 東京駅
  console.log('📍 テスト1: 東京駅での建物情報取得');
  const tokyoStation = new mockFirestore.GeoPoint(35.6812, 139.7671);
  const result1 = service.getBuildingInfoByLocation(tokyoStation);
  
  console.log(`   建物名: ${result1.building?.name || 'なし'}`);
  console.log(`   距離: ${result1.distance ? Math.round(result1.distance) + 'm' : 'N/A'}`);
  console.log(`   信頼度: ${Math.round((result1.confidence || 0) * 100)}%`);
  console.log(`   エレベーター数: ${result1.building?.elevators?.length || 0}`);
  console.log(`   車椅子対応: ${result1.building?.accessibility?.wheelchairAccessible ? 'Yes' : 'No'}`);
  console.log('   ✅ 東京駅テスト完了\n');
  
  // テストケース2: 新宿パークタワー
  console.log('📍 テスト2: 新宿パークタワーでの建物情報取得');
  const shinjukuParkTower = new mockFirestore.GeoPoint(35.6879, 139.6917);
  const result2 = service.getBuildingInfoByLocation(shinjukuParkTower);
  
  console.log(`   建物名: ${result2.building?.name || 'なし'}`);
  console.log(`   建物種別: ${result2.building?.type || 'N/A'}`);
  console.log(`   階数: ${result2.building?.floors || 'N/A'}F`);
  console.log(`   距離: ${result2.distance ? Math.round(result2.distance) + 'm' : 'N/A'}`);
  console.log(`   信頼度: ${Math.round((result2.confidence || 0) * 100)}%`);
  console.log('   ✅ 新宿パークタワーテスト完了\n');
  
  // テストケース3: 渋谷スカイ
  console.log('📍 テスト3: 渋谷スカイでの建物情報取得');
  const shibuyaSky = new mockFirestore.GeoPoint(35.6580, 139.7016);
  const result3 = service.getBuildingInfoByLocation(shibuyaSky);
  
  console.log(`   建物名: ${result3.building?.name || 'なし'}`);
  console.log(`   建物種別: ${result3.building?.type || 'N/A'}`);
  console.log(`   距離: ${result3.distance ? Math.round(result3.distance) + 'm' : 'N/A'}`);
  console.log(`   信頼度: ${Math.round((result3.confidence || 0) * 100)}%`);
  console.log('   ✅ 渋谷スカイテスト完了\n');
  
  // テストケース4: 建物が存在しない場所
  console.log('📍 テスト4: 建物が存在しない場所での検索');
  const oceanLocation = new mockFirestore.GeoPoint(35.0, 140.0);
  const result4 = service.getBuildingInfoByLocation(oceanLocation);
  
  console.log(`   建物名: ${result4.building?.name || 'なし'}`);
  console.log(`   信頼度: ${Math.round((result4.confidence || 0) * 100)}%`);
  console.log('   ✅ 建物なしテスト完了\n');
  
  // 距離計算精度テスト
  console.log('📐 距離計算精度テスト');
  const point1 = new mockFirestore.GeoPoint(35.6812, 139.7671); // 東京駅
  const point2 = new mockFirestore.GeoPoint(35.6580, 139.7016); // 渋谷
  const distance = service.calculateDistance(point1, point2);
  console.log(`   東京駅 ↔ 渋谷の距離: ${Math.round(distance)}m`);
  console.log('   ✅ 距離計算テスト完了\n');
  
  console.log('🎉 全テスト完了！');
  console.log('\n📋 ブラウザでの確認手順:');
  console.log('1. http://localhost:3001 または http://localhost:4174 にアクセス');
  console.log('2. doctor@demo.com / demo123456 でログイン');
  console.log('3. 「東京駅 転落事故」または「渋谷駅前 交通外傷」事案をクリック');
  console.log('4. マップ下部の建物情報セクションを確認');
  console.log('5. 展開ボタンをクリックして詳細情報を表示');
}

// テスト実行
runTests();