# 実装ガイド・開発手順書
## ドクターカー・オールインワンアプリケーション

### 1. 概要

本ドキュメントは、開発者が実際にアプリケーションを実装する際の具体的な手順、環境構築、コーディング規約、ベストプラクティスを提供します。

### 2. 開発環境構築

#### 2.1. 必要なソフトウェア

| ソフトウェア | バージョン | 用途 |
|-------------|-----------|------|
| Node.js | 18.x以上 | 開発環境 |
| npm | 9.x以上 | パッケージ管理 |
| Git | 2.x以上 | バージョン管理 |
| VS Code | 最新版 | 推奨エディタ |

#### 2.2. プロジェクト初期化

```bash
# 1. プロジェクトディレクトリ作成
mkdir doctorcar-app
cd doctorcar-app

# 2. Vite + React + TypeScript プロジェクト作成
npm create vite@latest . -- --template react-ts

# 3. 依存関係インストール
npm install

# 4. 追加パッケージインストール
npm install firebase zustand leaflet
npm install -D @types/leaflet tailwindcss postcss autoprefixer
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier

# 5. Tailwind CSS 初期化
npx tailwindcss init -p
```

#### 2.3. プロジェクト構造作成

```bash
# ディレクトリ構造作成
mkdir -p src/{components/{common,auth,cases,vitals,messages,maps,layout},pages,hooks,services,stores,types,utils,constants}
mkdir -p public/assets
mkdir -p docs
```

#### 2.4. 環境設定ファイル

**`.env.local`**
```env
# Firebase設定
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# アプリケーション設定
VITE_APP_NAME=Doctor Car App
VITE_APP_VERSION=1.0.0
VITE_LOCATION_UPDATE_INTERVAL=10000
```

**`tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#2563eb',    // 医療用青
          secondary: '#7c3aed',  // 医療用紫
          danger: '#dc2626',     // 緊急用赤
          success: '#16a34a',    // 成功用緑
          warning: '#d97706',    // 警告用オレンジ
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
```

### 3. 実装手順

#### 3.1. Phase 1: 基盤構築 (1-2日)

##### Step 1: Firebase 設定

**`src/config/firebase.ts`**
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
```

##### Step 2: 型定義作成

**`src/types/index.ts`**
```typescript
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
```

##### Step 3: 定数定義

**`src/constants/index.ts`**
```typescript
export const CASE_STATUS = {
  DISPATCHED: 'dispatched',
  ON_SCENE: 'on_scene',
  TRANSPORTING: 'transporting',
  COMPLETED: 'completed'
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

export const LOCATION_UPDATE_INTERVAL = parseInt(
  import.meta.env.VITE_LOCATION_UPDATE_INTERVAL || '10000'
);

export const MESSAGE_PAGINATION_SIZE = 50;

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

#### 3.2. Phase 2: サービス層実装 (2-3日)

##### Step 4: Firebase サービス実装

設計書通りに以下のサービスを実装：
- `src/services/authService.ts`
- `src/services/userService.ts`
- `src/services/caseService.ts`
- `src/services/vitalsService.ts`
- `src/services/treatmentService.ts`
- `src/services/messageService.ts`
- `src/services/locationService.ts`

##### Step 5: ユーティリティ関数実装

**`src/utils/dateUtils.ts`**
```typescript
import { Timestamp } from 'firebase/firestore';

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

export const getTimeDiffInMinutes = (start: Timestamp, end: Timestamp): number => {
  const diff = end.toMillis() - start.toMillis();
  return Math.floor(diff / (1000 * 60));
};

export const formatTimeAgo = (timestamp: Timestamp): string => {
  const now = new Date();
  const date = timestamp.toDate();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
  return `${Math.floor(diffInSeconds / 86400)}日前`;
};
```

#### 3.3. Phase 3: 状態管理実装 (2-3日)

##### Step 6: Zustand ストア実装

設計書通りに以下のストアを実装：
- `src/stores/authStore.ts`
- `src/stores/caseStore.ts`
- `src/stores/vitalStore.ts`
- `src/stores/messageStore.ts`
- `src/stores/locationStore.ts`
- `src/stores/uiStore.ts`
- `src/stores/index.ts`

#### 3.4. Phase 4: 共通コンポーネント実装 (2-3日)

##### Step 7: 基本コンポーネント実装

設計書通りに以下の共通コンポーネントを実装：
- `src/components/common/Button.tsx`
- `src/components/common/Input.tsx`
- `src/components/common/Modal.tsx`
- `src/components/common/LoadingSpinner.tsx`
- `src/components/common/ErrorBoundary.tsx`

**`src/components/common/LoadingSpinner.tsx`**
```typescript
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-medical-primary ${sizeClasses[size]} ${className}`} />
  );
};
```

#### 3.5. Phase 5: 認証システム実装 (1-2日)

##### Step 8: 認証関連コンポーネント

**`src/components/auth/ProtectedRoute.tsx`**
```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'doctor_car' | 'hospital';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, userInfo, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userInfo?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
```

#### 3.6. Phase 6: ページコンポーネント実装 (3-4日)

##### Step 9: ページコンポーネント実装順序

1. **LoginPage** - 認証の基盤
2. **CaseListPage** - 事案一覧表示
3. **CaseDetailPage** - メイン機能画面

**`src/pages/CaseDetailPage.tsx`**
```typescript
import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useCaseDetailStoreInitialization } from '../stores';
import { useAuthStore, useCaseStore, useVitalStore, useMessageStore, useLocationStore } from '../stores';
import { CaseDetailHeader } from '../components/cases/CaseDetailHeader';
import { VitalSignsTimeline } from '../components/vitals/VitalSignsTimeline';
import { MapView } from '../components/maps/MapView';
import { ChatArea } from '../components/messages/ChatArea';

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { userInfo } = useAuthStore();
  const { currentCase } = useCaseStore();
  const { getVitalsForCase, getTreatmentsForCase } = useVitalStore();
  const { getMessagesForCase } = useMessageStore();
  const { getLocationsForCase } = useLocationStore();
  
  // ストア初期化
  useCaseDetailStoreInitialization(caseId!);
  
  if (!caseId) {
    return <Navigate to="/cases" replace />;
  }
  
  if (!currentCase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  const vitals = getVitalsForCase(caseId);
  const treatments = getTreatmentsForCase(caseId);
  const messages = getMessagesForCase(caseId);
  const locations = getLocationsForCase(caseId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <CaseDetailHeader
        case={currentCase}
        onBack={() => window.history.back()}
        userRole={userInfo?.role || 'hospital'}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(100vh-120px)]">
        {/* 左側: マップ */}
        <div className="space-y-6">
          <MapView
            caseData={currentCase}
            locations={locations}
            className="h-96 lg:h-full"
          />
        </div>
        
        {/* 右側: 患者情報とチャット */}
        <div className="space-y-6">
          <div className="h-1/2">
            <VitalSignsTimeline
              vitals={vitals}
              treatments={treatments}
              userRole={userInfo?.role || 'hospital'}
            />
          </div>
          
          <div className="h-1/2">
            <ChatArea
              messages={messages}
              currentUserId={userInfo?.uid || ''}
              onSendMessage={async (text) => {
                // メッセージ送信処理
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 3.7. Phase 7: ルーティング設定 (1日)

**`src/App.tsx`**
```typescript
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStoreInitialization } from './stores';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { CaseListPage } from './pages/CaseListPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import './App.css';

function App() {
  const { initialize } = useStoreInitialization();
  
  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <CaseListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:caseId"
            element={
              <ProtectedRoute>
                <CaseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/cases" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
```

### 4. 開発規約・ベストプラクティス

#### 4.1. コーディング規約

**ESLint設定 (`.eslintrc.cjs`)**
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // カスタムルール
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
}
```

**Prettier設定 (`.prettierrc`)**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### 4.2. コンポーネント作成規約

```typescript
// ✅ Good: 関数コンポーネント + TypeScript
interface ComponentProps {
  prop1: string;
  prop2?: number; // オプショナルは?を使用
  onAction: () => void; // イベントハンドラーはon〜
}

export const ComponentName: React.FC<ComponentProps> = ({
  prop1,
  prop2 = 0, // デフォルト値
  onAction
}) => {
  // ローカル状態
  const [localState, setLocalState] = useState<string>('');
  
  // グローバル状態
  const globalState = useStore(state => state.someValue);
  
  // 副作用
  useEffect(() => {
    // 処理
  }, []);
  
  // イベントハンドラー
  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);
  
  return (
    <div className="component-wrapper">
      {/* JSX */}
    </div>
  );
};
```

#### 4.3. 状態管理規約

```typescript
// ✅ Good: Zustand ストア作成パターン
interface StoreState {
  // State
  data: SomeType[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setData: (data: SomeType[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Async Actions
  loadData: () => Promise<void>;
  
  // Cleanup
  cleanup: () => void;
}

export const useStore = create<StoreState>()((set, get) => ({
  // Initial state
  data: [],
  loading: false,
  error: null,
  
  // Sync actions
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
  
  // Async actions
  loadData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchData();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  // Cleanup
  cleanup: () => {
    set({ data: [], loading: false, error: null });
  }
}));
```

#### 4.4. エラーハンドリング規約

```typescript
// ✅ Good: 一貫したエラーハンドリング
const handleAsyncOperation = async () => {
  try {
    setLoading(true);
    await someAsyncOperation();
    setSuccess(true);
  } catch (error) {
    if (error instanceof AppError) {
      setError(error.message);
    } else {
      setError('予期しないエラーが発生しました');
      console.error('Unexpected error:', error);
    }
  } finally {
    setLoading(false);
  }
};
```

### 5. デバッグ・開発ツール

#### 5.1. Firebase エミュレーター設定

**`firebase.json`**
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

#### 5.2. 開発用スクリプト

**`package.json`**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx}\"",
    "type-check": "tsc --noEmit",
    "emulator": "firebase emulators:start --only auth,firestore",
    "build:analyze": "npm run build && npx vite-bundle-analyzer dist/assets/*.js"
  }
}
```

### 6. デプロイメント手順

#### 6.1. 本番環境デプロイ

```bash
# 1. ビルド
npm run build

# 2. Firebase ホスティング初期化（初回のみ）
firebase init hosting

# 3. デプロイ
firebase deploy --only hosting

# 4. Firestore セキュリティルール デプロイ
firebase deploy --only firestore:rules
```

#### 6.2. 環境別設定

**`src/config/environment.ts`**
```typescript
const environments = {
  development: {
    apiUrl: 'http://localhost:3000',
    enableLogging: true,
    enableEmulator: true
  },
  production: {
    apiUrl: 'https://api.doctorcar.com',
    enableLogging: false,
    enableEmulator: false
  }
};

export const config = environments[import.meta.env.MODE as keyof typeof environments] || environments.development;
```

### 7. パフォーマンス最適化

#### 7.1. コード分割

```typescript
// ✅ Good: ページレベルでの遅延ローディング
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'));
const CaseListPage = lazy(() => import('./pages/CaseListPage'));

// App.tsx内で
<Suspense fallback={<LoadingSpinner size="lg" />}>
  <Routes>
    <Route path="/cases" element={<CaseListPage />} />
    <Route path="/cases/:caseId" element={<CaseDetailPage />} />
  </Routes>
</Suspense>
```

#### 7.2. メモ化

```typescript
// ✅ Good: 適切なメモ化
const ExpensiveComponent = memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return processComplexData(data);
  }, [data]);
  
  return <div>{/* render */}</div>;
});
```

### 8. テスト戦略

#### 8.1. 単体テスト

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../common/Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 8.2. 統合テスト

```typescript
// src/__tests__/auth.integration.test.tsx
import { renderWithProviders } from './test-utils';
import { LoginPage } from '../pages/LoginPage';

describe('Authentication Integration', () => {
  it('should login successfully with valid credentials', async () => {
    const { user } = renderWithProviders(<LoginPage />);
    
    // テスト実装
  });
});
```

この実装ガイドに従うことで、品質の高いアプリケーションを効率的に開発できます。