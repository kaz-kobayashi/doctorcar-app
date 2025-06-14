import { GeoPoint } from 'firebase/firestore';

export interface ElevatorInfo {
  id: string;
  location: string; // "東側", "中央", "西側" など
  capacity: number; // 定員
  maxWeight: number; // 最大積載量（kg）
  floors: number[]; // アクセス可能な階
  isAccessible: boolean; // 車椅子対応
  status?: 'working' | 'maintenance' | 'unknown'; // 稼働状況
}

export interface StaircaseInfo {
  id: string;
  location: string; // "北階段", "南階段", "非常階段" など
  type: 'normal' | 'emergency' | 'escalator'; // 階段の種類
  floors: number[]; // アクセス可能な階
  width: 'narrow' | 'standard' | 'wide'; // 幅
}

export interface ExitInfo {
  id: string;
  name: string; // "正面出口", "A出口", "北口" など
  type: 'main' | 'emergency' | 'service'; // 出口の種類
  floor: number; // 階層
  direction: string; // "北口", "A出口", "東側" など
  isAccessible: boolean; // バリアフリー対応
  nearbyLandmarks?: string[]; // 近くの目印
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean; // 車椅子対応
  elevatorToAllFloors: boolean; // 全階エレベーター対応
  accessibleParking: boolean; // 障害者用駐車場
  accessibleRestrooms: boolean; // 多目的トイレ
  guidanceForVisuallyImpaired: boolean; // 視覚障害者向け誘導
}

export interface BuildingInfo {
  id: string;
  name: string; // 建物名
  type: 'office' | 'hospital' | 'station' | 'shopping' | 'residential' | 'school' | 'other'; // 建物種別
  address: string; // 住所
  floors: number; // 地上階数
  basement?: number; // 地下階数
  elevators: ElevatorInfo[]; // エレベーター情報
  staircases: StaircaseInfo[]; // 階段情報
  exits: ExitInfo[]; // 出口情報
  accessibility: AccessibilityInfo; // アクセシビリティ情報
  emergencyContact?: string; // 緊急時連絡先
  location: GeoPoint; // 建物の位置
  lastUpdated?: Date; // 最終更新日時
}

export interface BuildingSearchOptions {
  radius?: number; // 検索半径（メートル）
  buildingTypes?: Array<BuildingInfo['type']>; // 建物種別フィルター
  requireAccessibility?: boolean; // バリアフリー対応必須
}

export interface BuildingInfoResponse {
  building: BuildingInfo | null;
  distance?: number; // 現場からの距離（メートル）
  confidence: number; // データの信頼度 (0-1)
}