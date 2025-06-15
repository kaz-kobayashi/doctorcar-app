import { AppUser, Case } from '@/types';

// モック用のGeoPointオブジェクト
const createMockGeoPoint = (latitude: number, longitude: number) => ({
  latitude,
  longitude,
  isEqual: (other: any) => other.latitude === latitude && other.longitude === longitude,
  toJSON: () => ({ latitude, longitude })
});

// モック用のTimestampオブジェクト
const createMockTimestamp = (date: Date) => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000
});

// デモ用ユーザーデータ
export const DEMO_USERS: Record<string, AppUser> = {
  'doctor-001': {
    uid: 'doctor-001',
    name: '山田 太郎',
    role: 'doctor_car',
    team: '東京科学大学病院ドクターカー',
    email: 'doctor@demo.com'
  },
  'hospital-001': {
    uid: 'hospital-001',
    name: '佐藤 花子',
    role: 'hospital',
    team: '東京科学大学病院',
    email: 'hospital@demo.com'
  }
};

// デモ用事案データ (35.701835,139.763417から6km範囲内)
export const DEMO_CASES: Case[] = [
  {
    id: 'case-001',
    caseName: '2024-12-14 新宿駅南口 交通外傷',
    status: 'on_scene',
    teamId: 'doctor-001',
    patientInfo: {
      age: 45,
      gender: 'male',
      name: '田中 一郎'
    },
    sceneLocation: createMockGeoPoint(35.689487, 139.691706), // 新宿駅 (~2.5km)
    hospitalLocation: createMockGeoPoint(35.699374, 139.762881), // 慶應義塾大学病院 (~1km)
    createdAt: createMockTimestamp(new Date('2024-12-14T10:00:00Z')) as any,
    updatedAt: createMockTimestamp(new Date('2024-12-14T10:30:00Z')) as any
  },
  {
    id: 'case-002',
    caseName: '2024-12-13 信濃町駅前 心肺停止',
    status: 'completed',
    teamId: 'doctor-001',
    patientInfo: {
      age: 67,
      gender: 'female',
      name: '鈴木 恵子'
    },
    sceneLocation: createMockGeoPoint(35.687846, 139.719947), // 信濃町駅 (~4km)
    hospitalLocation: createMockGeoPoint(35.699374, 139.762881), // 慶應義塾大学病院
    createdAt: createMockTimestamp(new Date('2024-12-13T14:00:00Z')) as any,
    updatedAt: createMockTimestamp(new Date('2024-12-13T16:45:00Z')) as any
  },
  {
    id: 'case-003',
    caseName: '2024-12-14 四谷三丁目 意識不明',
    status: 'dispatched',
    teamId: 'doctor-001',
    patientInfo: {
      age: 28,
      gender: 'male'
    },
    sceneLocation: createMockGeoPoint(35.686611, 139.728694), // 四谷三丁目駅 (~3.5km)
    hospitalLocation: createMockGeoPoint(35.699374, 139.762881), // 慶應義塾大学病院
    createdAt: createMockTimestamp(new Date('2024-12-14T11:00:00Z')) as any,
    updatedAt: createMockTimestamp(new Date('2024-12-14T11:00:00Z')) as any
  },
  {
    id: 'case-004',
    caseName: '2024-12-14 曙橋駅 転落事故',
    status: 'on_scene',
    teamId: 'doctor-001',
    patientInfo: {
      age: 52,
      gender: 'female',
      name: '高橋 美奈子'
    },
    sceneLocation: createMockGeoPoint(35.694611, 139.738028), // 曙橋駅 (~2.5km)
    hospitalLocation: createMockGeoPoint(35.699374, 139.762881), // 慶應義塾大学病院
    createdAt: createMockTimestamp(new Date('2024-12-14T12:00:00Z')) as any,
    updatedAt: createMockTimestamp(new Date('2024-12-14T12:15:00Z')) as any
  }
];

// デモモード用のローカルストレージキー
const STORAGE_KEYS = {
  CURRENT_USER: 'demo_current_user',
  CASES: 'demo_cases'
};

// ローカルストレージ操作
export const demoStorage = {
  setCurrentUser: (user: AppUser | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
  
  getCurrentUser: (): AppUser | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },
  
  setCases: (cases: Case[]) => {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  },
  
  getCases: (): Case[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.CASES);
    if (stored) {
      const cases = JSON.parse(stored);
      // Timestampオブジェクトを復元
      return cases.map((case_: any) => ({
        ...case_,
        createdAt: createMockTimestamp(new Date(case_.createdAt.seconds * 1000)),
        updatedAt: createMockTimestamp(new Date(case_.updatedAt.seconds * 1000)),
        sceneLocation: createMockGeoPoint(case_.sceneLocation.latitude, case_.sceneLocation.longitude),
        hospitalLocation: createMockGeoPoint(case_.hospitalLocation.latitude, case_.hospitalLocation.longitude)
      }));
    }
    // 初回はデモデータを設定
    demoStorage.setCases(DEMO_CASES);
    return DEMO_CASES;
  }
};

// デモ用認証サービス
export const demoAuthService = {
  login: async (email: string, password: string): Promise<AppUser> => {
    // デモ用認証（簡易実装）
    const user = Object.values(DEMO_USERS).find(u => u.email === email);
    if (!user || password !== 'demo123456') {
      throw new Error('ログイン情報が正しくありません');
    }
    
    demoStorage.setCurrentUser(user);
    return user;
  },
  
  logout: async (): Promise<void> => {
    demoStorage.setCurrentUser(null);
  },
  
  getCurrentUser: (): AppUser | null => {
    return demoStorage.getCurrentUser();
  },
  
  loginAsDoctorCarMember: async (): Promise<AppUser> => {
    const user = DEMO_USERS['doctor-001'];
    demoStorage.setCurrentUser(user);
    return user;
  },
  
  loginAsHospitalStaff: async (): Promise<AppUser> => {
    const user = DEMO_USERS['hospital-001'];
    demoStorage.setCurrentUser(user);
    return user;
  }
};

// デモ用事案サービス
export const demoCaseService = {
  getAllCases: async (): Promise<Case[]> => {
    // 少し遅延を入れてリアルなAPIコールを模擬
    await new Promise(resolve => setTimeout(resolve, 500));
    return demoStorage.getCases();
  },
  
  getCaseById: async (caseId: string): Promise<Case | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const cases = demoStorage.getCases();
    return cases.find(c => c.id === caseId) || null;
  },
  
  updateCaseStatus: async (caseId: string, status: Case['status']): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const cases = demoStorage.getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
      cases[caseIndex] = {
        ...cases[caseIndex],
        status,
        updatedAt: createMockTimestamp(new Date()) as any
      };
      demoStorage.setCases(cases);
    }
  }
};