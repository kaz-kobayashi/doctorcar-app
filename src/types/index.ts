import { Timestamp, GeoPoint } from 'firebase/firestore';

// ユーザー関連（Firebaseのユーザーと区別するためAppUserとする）
export interface AppUser {
  uid: string;
  name: string;
  role: 'doctor_car' | 'hospital';
  team: string;
  email: string;
}

// 事案関連
export interface Case {
  id: string;
  caseName: string;
  status: 'dispatched' | 'on_scene' | 'transporting' | 'completed'; // 出動中 | 現場活動中 | 搬送中 | 完了
  teamId: string;
  patientInfo: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    name?: string;
    buildingInfo?: {
      buildingName: string;
      floor: number;
      description?: string;
      accessNotes?: string;
    };
  };
  sceneLocation: GeoPoint;
  hospitalLocation: GeoPoint;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// バイタルサイン関連
export interface VitalSign {
  id: string;
  timestamp: Timestamp;
  hr: number;
  bp_s: number;
  bp_d: number;
  spo2: number;
  recordedBy: string;
  caseId: string;
}

// 処置関連
export interface Treatment {
  id: string;
  timestamp: Timestamp;
  name: string;
  details: string;
  recordedBy: string;
  caseId: string;
}

// メッセージ関連
export interface Message {
  id: string;
  timestamp: Timestamp;
  senderId: string;
  senderName: string;
  text: string;
  caseId: string;
  messageType: 'text' | 'preset';
}

// 位置情報関連
export interface LocationRecord {
  id: string;
  timestamp: Timestamp;
  geoPoint: GeoPoint;
  userId: string;
  caseId: string;
  accuracy?: number;
}

// エラー関連
export enum ErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 建物情報関連
export * from './buildingInfo';

// レジストリ関連
export * from './registry';

// ルート最適化関連
export * from './route';