# API・関数定義仕様書
## ドクターカー・オールインワンアプリケーション

### 1. 概要

本ドキュメントは、Firebase SDK を使用した API 関数の詳細仕様を定義します。
主要な機能として、認証、データベース操作、リアルタイム通信、位置情報管理を含みます。

### 2. 認証関連 API

#### 2.1. Authentication Service

```typescript
// src/services/authService.ts

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';

/**
 * ユーザーログイン
 * @param email - ユーザーのメールアドレス
 * @param password - パスワード
 * @returns Promise<UserCredential>
 */
export const loginUser = async (
  email: string, 
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * ユーザーログアウト
 * @returns Promise<void>
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * 認証状態の監視
 * @param callback - 認証状態変更時のコールバック関数
 * @returns Unsubscribe function
 */
export const observeAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * デモ用ログイン - ドクターカー隊員
 * @returns Promise<User>
 */
export const loginAsDoctorCarMember = async (): Promise<User> => {
  return loginUser('doctor@demo.com', 'demo123456');
};

/**
 * デモ用ログイン - 病院スタッフ
 * @returns Promise<User>
 */
export const loginAsHospitalStaff = async (): Promise<User> => {
  return loginUser('hospital@demo.com', 'demo123456');
};
```

### 3. ユーザー管理 API

#### 3.1. User Service

```typescript
// src/services/userService.ts

import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  name: string;
  role: 'doctor_car' | 'hospital';
  team: string;
  email: string;
}

/**
 * ユーザー情報取得
 * @param uid - ユーザーID
 * @returns Promise<AppUser | null>
 */
export const getUserInfo = async (uid: string): Promise<AppUser | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AppUser;
  }
  return null;
};

/**
 * ユーザー情報更新
 * @param user - ユーザー情報
 * @returns Promise<void>
 */
export const updateUserInfo = async (user: AppUser): Promise<void> => {
  const docRef = doc(db, 'users', user.uid);
  await setDoc(docRef, user, { merge: true });
};
```

### 4. 事案管理 API

#### 4.1. Case Service

```typescript
// src/services/caseService.ts

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
  GeoPoint
} from 'firebase/firestore';

export interface Case {
  id: string;
  caseName: string;
  status: 'dispatched' | 'on_scene' | 'transporting' | 'completed'; // 出動中 | 現場活動中 | 搬送中 | 完了
  teamId: string;
  patientInfo: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    name?: string;
  };
  sceneLocation: GeoPoint;
  hospitalLocation: GeoPoint;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 全事案取得
 * @returns Promise<Case[]>
 */
export const getAllCases = async (): Promise<Case[]> => {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Case));
};

/**
 * 特定事案取得
 * @param caseId - 事案ID
 * @returns Promise<Case | null>
 */
export const getCaseById = async (caseId: string): Promise<Case | null> => {
  const docRef = doc(db, 'cases', caseId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Case;
  }
  return null;
};

/**
 * 事案リアルタイム監視
 * @param caseId - 事案ID
 * @param callback - データ変更時のコールバック
 * @returns Unsubscribe function
 */
export const observeCase = (
  caseId: string,
  callback: (case: Case | null) => void
): (() => void) => {
  const docRef = doc(db, 'cases', caseId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      } as Case);
    } else {
      callback(null);
    }
  });
};

/**
 * 事案ステータス更新
 * @param caseId - 事案ID
 * @param status - 新しいステータス
 * @returns Promise<void>
 */
export const updateCaseStatus = async (
  caseId: string, 
  status: Case['status']
): Promise<void> => {
  const docRef = doc(db, 'cases', caseId);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now()
  });
};

/**
 * 新規事案作成
 * @param caseData - 事案データ
 * @returns Promise<string> - 作成された事案ID
 */
export const createCase = async (caseData: Omit<Case, 'id'>): Promise<string> => {
  const casesRef = collection(db, 'cases');
  const docRef = await addDoc(casesRef, {
    ...caseData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};
```

### 5. バイタルサイン管理 API

#### 5.1. Vitals Service

```typescript
// src/services/vitalsService.ts

import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface VitalSign {
  id: string;
  timestamp: Timestamp;
  hr: number;        // 心拍数
  bp_s: number;      // 収縮期血圧
  bp_d: number;      // 拡張期血圧
  spo2: number;      // 酸素飽和度
  recordedBy: string; // 記録者ID
  caseId: string;
}

/**
 * バイタルサイン追加
 * @param caseId - 事案ID
 * @param vitals - バイタルデータ
 * @returns Promise<string> - 追加されたドキュメントID
 */
export const addVitalSign = async (
  caseId: string,
  vitals: Omit<VitalSign, 'id' | 'timestamp' | 'caseId'>
): Promise<string> => {
  const vitalsRef = collection(db, 'cases', caseId, 'vitals');
  const docRef = await addDoc(vitalsRef, {
    ...vitals,
    timestamp: Timestamp.now(),
    caseId
  });
  return docRef.id;
};

/**
 * バイタルサイン履歴取得
 * @param caseId - 事案ID
 * @returns Promise<VitalSign[]>
 */
export const getVitalSigns = async (caseId: string): Promise<VitalSign[]> => {
  const vitalsRef = collection(db, 'cases', caseId, 'vitals');
  const q = query(vitalsRef, orderBy('timestamp', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as VitalSign));
};

/**
 * バイタルサインリアルタイム監視
 * @param caseId - 事案ID
 * @param callback - データ変更時のコールバック
 * @returns Unsubscribe function
 */
export const observeVitalSigns = (
  caseId: string,
  callback: (vitals: VitalSign[]) => void
): (() => void) => {
  const vitalsRef = collection(db, 'cases', caseId, 'vitals');
  const q = query(vitalsRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const vitals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as VitalSign));
    callback(vitals);
  });
};
```

### 6. 処置記録管理 API

#### 6.1. Treatment Service

```typescript
// src/services/treatmentService.ts

export interface Treatment {
  id: string;
  timestamp: Timestamp;
  name: string;       // 処置名
  details: string;    // 詳細
  recordedBy: string; // 記録者ID
  caseId: string;
}

/**
 * 処置記録追加
 * @param caseId - 事案ID
 * @param treatment - 処置データ
 * @returns Promise<string>
 */
export const addTreatment = async (
  caseId: string,
  treatment: Omit<Treatment, 'id' | 'timestamp' | 'caseId'>
): Promise<string> => {
  const treatmentsRef = collection(db, 'cases', caseId, 'treatments');
  const docRef = await addDoc(treatmentsRef, {
    ...treatment,
    timestamp: Timestamp.now(),
    caseId
  });
  return docRef.id;
};

/**
 * 処置記録履歴取得
 * @param caseId - 事案ID
 * @returns Promise<Treatment[]>
 */
export const getTreatments = async (caseId: string): Promise<Treatment[]> => {
  const treatmentsRef = collection(db, 'cases', caseId, 'treatments');
  const q = query(treatmentsRef, orderBy('timestamp', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Treatment));
};

/**
 * 処置記録リアルタイム監視
 * @param caseId - 事案ID
 * @param callback - データ変更時のコールバック
 * @returns Unsubscribe function
 */
export const observeTreatments = (
  caseId: string,
  callback: (treatments: Treatment[]) => void
): (() => void) => {
  const treatmentsRef = collection(db, 'cases', caseId, 'treatments');
  const q = query(treatmentsRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const treatments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Treatment));
    callback(treatments);
  });
};
```

### 7. 位置情報管理 API

#### 7.1. Location Service

```typescript
// src/services/locationService.ts

export interface LocationRecord {
  id: string;
  timestamp: Timestamp;
  geoPoint: GeoPoint;
  userId: string;
  caseId: string;
  accuracy?: number;  // GPS精度
}

/**
 * 位置情報追加
 * @param caseId - 事案ID
 * @param location - 位置情報
 * @returns Promise<string>
 */
export const addLocation = async (
  caseId: string,
  location: Omit<LocationRecord, 'id' | 'timestamp' | 'caseId'>
): Promise<string> => {
  const locationsRef = collection(db, 'cases', caseId, 'locations');
  const docRef = await addDoc(locationsRef, {
    ...location,
    timestamp: Timestamp.now(),
    caseId
  });
  return docRef.id;
};

/**
 * 最新位置情報取得
 * @param caseId - 事案ID
 * @param userId - ユーザーID
 * @returns Promise<LocationRecord | null>
 */
export const getLatestLocation = async (
  caseId: string,
  userId: string
): Promise<LocationRecord | null> => {
  const locationsRef = collection(db, 'cases', caseId, 'locations');
  const q = query(
    locationsRef, 
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as LocationRecord;
  }
  return null;
};

/**
 * 位置情報リアルタイム監視
 * @param caseId - 事案ID
 * @param callback - データ変更時のコールバック
 * @returns Unsubscribe function
 */
export const observeLocations = (
  caseId: string,
  callback: (locations: LocationRecord[]) => void
): (() => void) => {
  const locationsRef = collection(db, 'cases', caseId, 'locations');
  const q = query(locationsRef, orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const locations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LocationRecord));
    callback(locations);
  });
};
```

### 8. メッセージ・チャット API

#### 8.1. Message Service

```typescript
// src/services/messageService.ts

export interface Message {
  id: string;
  timestamp: Timestamp;
  senderId: string;
  senderName: string;
  text: string;
  caseId: string;
  messageType: 'text' | 'preset'; // テキスト or 定型文
}

/**
 * メッセージ送信
 * @param caseId - 事案ID
 * @param message - メッセージデータ
 * @returns Promise<string>
 */
export const sendMessage = async (
  caseId: string,
  message: Omit<Message, 'id' | 'timestamp' | 'caseId'>
): Promise<string> => {
  const messagesRef = collection(db, 'cases', caseId, 'messages');
  const docRef = await addDoc(messagesRef, {
    ...message,
    timestamp: Timestamp.now(),
    caseId
  });
  return docRef.id;
};

/**
 * メッセージ履歴取得
 * @param caseId - 事案ID
 * @returns Promise<Message[]>
 */
export const getMessages = async (caseId: string): Promise<Message[]> => {
  const messagesRef = collection(db, 'cases', caseId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Message));
};

/**
 * メッセージリアルタイム監視
 * @param caseId - 事案ID
 * @param callback - データ変更時のコールバック
 * @returns Unsubscribe function
 */
export const observeMessages = (
  caseId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'cases', caseId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });
};

/**
 * 定型文メッセージ一覧
 */
export const PRESET_MESSAGES = {
  DOCTOR_CAR: [
    '現場到着しました',
    '患者搬送準備完了',
    '病院へ向かいます',
    '到着予定時刻をお知らせします',
    '追加の医療資源が必要です'
  ],
  HOSPITAL: [
    '受け入れ準備完了',
    'CT室準備済み',
    '手術室待機中',
    '血液検査準備済み',
    '専門医に連絡済み'
  ]
};
```

### 9. ユーティリティ関数

#### 9.1. Date/Time Utilities

```typescript
// src/utils/dateUtils.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Timestampを日本語形式に変換
 * @param timestamp - Firebase Timestamp
 * @returns string - 'YYYY年MM月DD日 HH:mm'
 */
export const formatTimestamp = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 時間差を計算（分単位）
 * @param start - 開始時刻
 * @param end - 終了時刻
 * @returns number - 分数
 */
export const getTimeDiffInMinutes = (start: Timestamp, end: Timestamp): number => {
  const diff = end.toMillis() - start.toMillis();
  return Math.floor(diff / (1000 * 60));
};
```

#### 9.2. Location Utilities

```typescript
// src/utils/locationUtils.ts

import { GeoPoint } from 'firebase/firestore';

/**
 * 2点間の距離を計算（km）
 * @param point1 - 地点1
 * @param point2 - 地点2
 * @returns number - 距離（km）
 */
export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
  const R = 6371; // 地球の半径（km）
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 現在位置取得
 * @returns Promise<GeolocationPosition>
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};
```

### 10. エラーハンドリング

#### 10.1. Error Types

```typescript
// src/types/errors.ts

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

/**
 * Firebase エラーを AppError に変換
 * @param error - Firebase エラー
 * @returns AppError
 */
export const handleFirebaseError = (error: any): AppError => {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new AppError(ErrorCode.AUTH_FAILED, 'ログイン情報が正しくありません');
    case 'permission-denied':
      return new AppError(ErrorCode.PERMISSION_DENIED, 'アクセス権限がありません');
    case 'unavailable':
      return new AppError(ErrorCode.NETWORK_ERROR, 'ネットワークエラーが発生しました');
    default:
      return new AppError(ErrorCode.NETWORK_ERROR, 'システムエラーが発生しました', error);
  }
};
```

### 11. 定数定義

```typescript
// src/constants/index.ts

export const CASE_STATUS = {
  DISPATCHED: 'dispatched',      // 出動中
  ON_SCENE: 'on_scene',         // 現場活動中
  TRANSPORTING: 'transporting', // 搬送中
  COMPLETED: 'completed'        // 完了
} as const;

export const USER_ROLES = {
  DOCTOR_CAR: 'doctor_car',
  HOSPITAL: 'hospital'
} as const;

export const VITAL_RANGES = {
  HR: { min: 40, max: 200 },
  BP_S: { min: 70, max: 250 },
  BP_D: { min: 40, max: 150 },
  SPO2: { min: 70, max: 100 }
} as const;

export const LOCATION_UPDATE_INTERVAL = 10000; // 10秒
export const MESSAGE_PAGINATION_SIZE = 50;
```