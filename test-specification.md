# テスト仕様書
## ドクターカー・オールインワンアプリケーション

### 1. 概要

本ドキュメントは、アプリケーションの品質保証のためのテスト戦略、テストケース、実行手順を定義します。
単体テスト、統合テスト、E2Eテスト、パフォーマンステストを含む包括的なテスト仕様を提供します。

### 2. テスト戦略

#### 2.1. テストピラミッド

```
    /\
   /  \         E2E Tests (10%)
  /____\        - シナリオテスト
 /      \       - ユーザージャーニーテスト
/__      __\    Integration Tests (20%)
\  \    /  /    - API統合テスト
 \  \  /  /     - コンポーネント統合テスト
  \  \/  /      
   \____/       Unit Tests (70%)
                - 関数テスト
                - コンポーネントテスト
                - ストアテスト
```

#### 2.2. テスト方針

| テスト種別 | 目的 | カバレッジ目標 | ツール |
|-----------|------|---------------|-------|
| 単体テスト | 個別機能の動作確認 | 90%以上 | Jest, React Testing Library |
| 統合テスト | モジュール間連携確認 | 80%以上 | Jest, MSW |
| E2Eテスト | ユーザーシナリオ確認 | 主要フロー100% | Playwright |
| 視覚回帰テスト | UI変更の検出 | 全画面 | Storybook, Chromatic |

### 3. テスト環境構築

#### 3.1. 必要なパッケージ

```bash
# テスト関連依存関係
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jest jest-environment-jsdom @types/jest
npm install -D msw
npm install -D @playwright/test
npm install -D @storybook/react @storybook/addon-essentials
```

#### 3.2. Jest設定

**`jest.config.js`**
```javascript
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};
```

#### 3.3. テストセットアップ

**`src/test/setup.ts`**
```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW セットアップ
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Firebase モック
jest.mock('../config/firebase', () => ({
  auth: {},
  db: {},
}));

// Geolocation API モック
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn((success) =>
      success({
        coords: {
          latitude: 35.658, 
          longitude: 139.701,
          accuracy: 10
        }
      })
    ),
  },
});
```

#### 3.4. モックサーバー設定

**`src/test/mocks/server.ts`**
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**`src/test/mocks/handlers.ts`**
```typescript
import { rest } from 'msw';

export const handlers = [
  // Firebase Auth モック
  rest.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', (req, res, ctx) => {
    return res(
      ctx.json({
        idToken: 'mock-id-token',
        email: 'test@example.com',
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
        localId: 'mock-user-id'
      })
    );
  }),
  
  // その他のAPIモック
];
```

### 4. 単体テスト仕様

#### 4.1. コンポーネントテスト

##### 4.1.1. Button コンポーネント

**`src/components/common/__tests__/Button.test.tsx`**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  test('正常にレンダリングされること', () => {
    render(<Button>テストボタン</Button>);
    expect(screen.getByText('テストボタン')).toBeInTheDocument();
  });
  
  test('クリックイベントが発火すること', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>クリック</Button>);
    
    fireEvent.click(screen.getByText('クリック'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('disabled状態で動作すること', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>無効ボタン</Button>);
    
    fireEvent.click(screen.getByText('無効ボタン'));
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByText('無効ボタン')).toBeDisabled();
  });
  
  test('loading状態で動作すること', () => {
    render(<Button loading>ローディング</Button>);
    expect(screen.getByText('ローディング')).toBeDisabled();
  });
  
  test('各バリアントが正しいクラスを持つこと', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

##### 4.1.2. VitalSignForm コンポーネント

**`src/components/vitals/__tests__/VitalSignForm.test.tsx`**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VitalSignForm } from '../VitalSignForm';

describe('VitalSignForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('フォームが正常にレンダリングされること', () => {
    render(
      <VitalSignForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    
    expect(screen.getByLabelText(/心拍数/)).toBeInTheDocument();
    expect(screen.getByLabelText(/収縮期血圧/)).toBeInTheDocument();
    expect(screen.getByLabelText(/拡張期血圧/)).toBeInTheDocument();
    expect(screen.getByLabelText(/酸素飽和度/)).toBeInTheDocument();
  });
  
  test('有効な値で送信が成功すること', async () => {
    const user = userEvent.setup();
    render(
      <VitalSignForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    
    await user.type(screen.getByLabelText(/心拍数/), '90');
    await user.type(screen.getByLabelText(/収縮期血圧/), '120');
    await user.type(screen.getByLabelText(/拡張期血圧/), '80');
    await user.type(screen.getByLabelText(/酸素飽和度/), '98');
    
    await user.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        hr: 90,
        bp_s: 120,
        bp_d: 80,
        spo2: 98,
        recordedBy: expect.any(String)
      });
    });
  });
  
  test('無効な値でバリデーションエラーが表示されること', async () => {
    const user = userEvent.setup();
    render(
      <VitalSignForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    
    await user.type(screen.getByLabelText(/心拍数/), '300'); // 範囲外
    await user.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(screen.getByText(/心拍数は40-200の範囲で入力してください/)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
  
  test('キャンセルボタンが動作すること', async () => {
    const user = userEvent.setup();
    render(
      <VitalSignForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    
    await user.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
```

#### 4.2. ストアテスト

##### 4.2.1. AuthStore テスト

**`src/stores/__tests__/authStore.test.ts`**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

// Firebase サービスのモック
jest.mock('../../services/authService', () => ({
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  observeAuthState: jest.fn(),
}));

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: null,
      userInfo: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });
  
  test('初期状態が正しいこと', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  test('ログイン成功時の状態変更', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    const mockUserInfo = { uid: 'test-uid', name: 'Test User', role: 'doctor_car' };
    
    const { loginUser, getUserInfo } = await import('../../services/authService');
    (loginUser as jest.Mock).mockResolvedValue(mockUser);
    (getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
    
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.userInfo).toEqual(mockUserInfo);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });
  
  test('ログイン失敗時のエラーハンドリング', async () => {
    const { loginUser } = await import('../../services/authService');
    (loginUser as jest.Mock).mockRejectedValue(new Error('Login failed'));
    
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong-password');
      } catch (error) {
        // エラーは期待される
      }
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });
});
```

#### 4.3. サービス関数テスト

##### 4.3.1. VitalsService テスト

**`src/services/__tests__/vitalsService.test.ts`**
```typescript
import { addVitalSign, getVitalSigns } from '../vitalsService';
import { db } from '../../config/firebase';

// Firestore モック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
}));

describe('VitalsService', () => {
  test('バイタルサイン追加が正常に動作すること', async () => {
    const { addDoc } = await import('firebase/firestore');
    (addDoc as jest.Mock).mockResolvedValue({ id: 'test-vital-id' });
    
    const vitalData = {
      hr: 90,
      bp_s: 120,
      bp_d: 80,
      spo2: 98,
      recordedBy: 'Test User'
    };
    
    const result = await addVitalSign('test-case-id', vitalData);
    
    expect(result).toBe('test-vital-id');
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining(vitalData)
    );
  });
  
  test('バイタルサイン取得が正常に動作すること', async () => {
    const mockVitals = [
      { id: '1', hr: 90, bp_s: 120, bp_d: 80, spo2: 98 },
      { id: '2', hr: 95, bp_s: 125, bp_d: 85, spo2: 97 }
    ];
    
    const { getDocs } = await import('firebase/firestore');
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockVitals.map(vital => ({
        id: vital.id,
        data: () => vital
      }))
    });
    
    const result = await getVitalSigns('test-case-id');
    
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject(mockVitals[0]);
  });
});
```

### 5. 統合テスト仕様

#### 5.1. コンポーネント統合テスト

##### 5.1.1. ログインフロー統合テスト

**`src/__tests__/integration/auth.integration.test.tsx`**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Authentication Integration', () => {
  test('正常ログインフローが動作すること', async () => {
    const user = userEvent.setup();
    
    // Firebase Auth モックの設定
    const { loginUser } = await import('../../services/authService');
    (loginUser as jest.Mock).mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com'
    });
    
    renderWithRouter(<LoginPage />);
    
    // ログインフォーム入力
    await user.type(screen.getByLabelText(/メールアドレス/), 'test@example.com');
    await user.type(screen.getByLabelText(/パスワード/), 'password123');
    await user.click(screen.getByText('ログイン'));
    
    // 成功時の確認
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
  
  test('デモログインが動作すること', async () => {
    const user = userEvent.setup();
    
    const { loginAsDoctorCarMember } = await import('../../services/authService');
    (loginAsDoctorCarMember as jest.Mock).mockResolvedValue({
      uid: 'demo-doctor-uid',
      email: 'doctor@demo.com'
    });
    
    renderWithRouter(<LoginPage />);
    
    await user.click(screen.getByText('ドクターカー隊員でログイン'));
    
    await waitFor(() => {
      expect(loginAsDoctorCarMember).toHaveBeenCalled();
    });
  });
});
```

#### 5.2. ストア統合テスト

##### 5.2.1. リアルタイムデータ同期テスト

**`src/__tests__/integration/realtime.integration.test.tsx`**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCaseStore, useVitalStore } from '../../stores';

describe('Real-time Data Synchronization', () => {
  test('事案データのリアルタイム更新が動作すること', async () => {
    const mockCase = {
      id: 'test-case',
      caseName: 'Test Case',
      status: 'on_scene',
      // ... その他のプロパティ
    };
    
    // Firestore リスナーのモック
    let listenerCallback: (data: any) => void;
    const { observeCase } = await import('../../services/caseService');
    (observeCase as jest.Mock).mockImplementation((caseId, callback) => {
      listenerCallback = callback;
      return jest.fn(); // unsubscribe function
    });
    
    const { result } = renderHook(() => useCaseStore());
    
    // リアルタイム監視開始
    act(() => {
      result.current.subscribeToCase('test-case');
    });
    
    // データ変更をシミュレート
    act(() => {
      listenerCallback(mockCase);
    });
    
    expect(result.current.currentCase).toEqual(mockCase);
  });
});
```

### 6. E2Eテスト仕様

#### 6.1. Playwright設定

**`playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 6.2. E2Eテストケース

##### 6.2.1. ユーザーログインフロー

**`e2e/auth.spec.ts`**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('ユーザーがログインできること', async ({ page }) => {
    await page.goto('/login');
    
    // ページタイトル確認
    await expect(page).toHaveTitle(/D-Call App/);
    
    // ログインフォーム入力
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // ログイン成功後の画面遷移確認
    await expect(page).toHaveURL('/cases');
    await expect(page.locator('[data-testid="case-list"]')).toBeVisible();
  });
  
  test('デモログインが動作すること', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('[data-testid="demo-doctor-login"]');
    
    await expect(page).toHaveURL('/cases');
    await expect(page.locator('[data-testid="user-role"]')).toContainText('ドクターカー隊員');
  });
});
```

##### 6.2.2. 事案詳細フロー

**`e2e/case-detail.spec.ts`**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Case Detail Flow', () => {
  test.beforeEach(async ({ page }) => {
    // デモログインしてから事案詳細に移動
    await page.goto('/login');
    await page.click('[data-testid="demo-doctor-login"]');
    await page.waitForURL('/cases');
    await page.click('[data-testid="case-item"]:first-child');
  });
  
  test('事案詳細画面が正常に表示されること', async ({ page }) => {
    await expect(page.locator('[data-testid="case-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="map-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="vitals-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-area"]')).toBeVisible();
  });
  
  test('バイタルサイン入力ができること', async ({ page }) => {
    // バイタル入力ボタンクリック
    await page.click('[data-testid="add-vital-button"]');
    
    // モーダルが開く
    await expect(page.locator('[data-testid="vital-form-modal"]')).toBeVisible();
    
    // バイタルデータ入力
    await page.fill('[data-testid="hr-input"]', '90');
    await page.fill('[data-testid="bp-s-input"]', '120');
    await page.fill('[data-testid="bp-d-input"]', '80');
    await page.fill('[data-testid="spo2-input"]', '98');
    
    // 保存
    await page.click('[data-testid="save-vital-button"]');
    
    // モーダルが閉じる
    await expect(page.locator('[data-testid="vital-form-modal"]')).not.toBeVisible();
    
    // タイムラインに新しいデータが追加される
    await expect(page.locator('[data-testid="vital-item"]').first()).toContainText('90');
  });
  
  test('チャットメッセージ送信ができること', async ({ page }) => {
    const testMessage = 'テストメッセージです';
    
    // メッセージ入力
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-message-button"]');
    
    // メッセージが表示される
    await expect(page.locator('[data-testid="message-bubble"]').last()).toContainText(testMessage);
    
    // 入力欄がクリアされる
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue('');
  });
});
```

### 7. パフォーマンステスト

#### 7.1. Lighthouse CI設定

**`.lighthouserc.js`**
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173/login', 'http://localhost:5173/cases'],
      startServerCommand: 'npm run preview',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

#### 7.2. バンドルサイズテスト

**`scripts/bundle-size-test.js`**
```javascript
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');
const maxSizes = {
  'index.js': 500 * 1024, // 500KB
  'index.css': 50 * 1024,  // 50KB
};

function checkBundleSize() {
  const files = fs.readdirSync(path.join(distPath, 'assets'));
  
  for (const file of files) {
    const filePath = path.join(distPath, 'assets', file);
    const stats = fs.statSync(filePath);
    
    const extension = path.extname(file);
    const baseType = extension === '.js' ? 'index.js' : 'index.css';
    
    if (maxSizes[baseType] && stats.size > maxSizes[baseType]) {
      console.error(`❌ ${file} is too large: ${stats.size} bytes (max: ${maxSizes[baseType]} bytes)`);
      process.exit(1);
    } else {
      console.log(`✅ ${file}: ${stats.size} bytes`);
    }
  }
}

checkBundleSize();
```

### 8. テスト実行手順

#### 8.1. 開発時テスト

```bash
# 単体テスト (watch mode)
npm run test:watch

# カバレッジ付き単体テスト
npm run test:coverage

# 特定のテストファイル実行
npm test -- Button.test.tsx

# 特定のテストケース実行
npm test -- --testNamePattern="バイタルサイン"
```

#### 8.2. CI/CDパイプライン

```bash
# 全テスト実行
npm run test:ci

# E2Eテスト実行
npm run test:e2e

# パフォーマンステスト
npm run test:lighthouse

# バンドルサイズチェック
npm run test:bundle-size
```

#### 8.3. テストレポート

**`package.json`**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:lighthouse": "lhci autorun",
    "test:bundle-size": "node scripts/bundle-size-test.js"
  }
}
```

### 9. 品質ゲート

#### 9.1. マージ前チェックリスト

- [ ] 全単体テストが通過
- [ ] カバレッジが80%以上
- [ ] 統合テストが通過
- [ ] 主要E2Eテストが通過
- [ ] Lighthouseスコアが基準値以上
- [ ] バンドルサイズが制限内
- [ ] TypeScriptエラーなし
- [ ] ESLintエラーなし

#### 9.2. リリース前チェックリスト

- [ ] 全E2Eテストが通過
- [ ] 複数ブラウザでの動作確認
- [ ] モバイルデバイスでの動作確認
- [ ] パフォーマンステスト通過
- [ ] セキュリティテスト通過
- [ ] アクセシビリティテスト通過

### 10. 継続的改善

#### 10.1. テストメトリクス監視

- テスト実行時間の監視
- テストの安定性（flakyテストの特定）
- カバレッジの推移
- バグ検出率

#### 10.2. テスト改善サイクル

1. **週次レビュー**: テスト結果とメトリクスの確認
2. **月次改善**: flakyテストの修正とテスト追加
3. **四半期評価**: テスト戦略の見直しと改善計画

この包括的なテスト仕様により、高品質で信頼性の高いアプリケーションの継続的な開発・デプロイを実現できます。