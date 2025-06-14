# コンポーネント設計仕様書
## ドクターカー・オールインワンアプリケーション

### 1. 概要

本ドキュメントは、React + TypeScript で構築するUIコンポーネントの詳細設計を定義します。
各コンポーネントの責務、Props、State、動作仕様を明確化し、実装の指針を提供します。

### 2. アーキテクチャ概要

```
src/
├── components/
│   ├── common/           # 共通コンポーネント
│   ├── layout/           # レイアウト関連
│   ├── auth/             # 認証関連
│   ├── cases/            # 事案管理関連
│   ├── vitals/           # バイタルサイン関連
│   ├── messages/         # メッセージ関連
│   └── maps/             # 地図関連
├── pages/                # ページコンポーネント
├── hooks/                # カスタムフック
├── services/             # API関連
├── stores/               # 状態管理
├── types/                # 型定義
├── utils/                # ユーティリティ
└── constants/            # 定数
```

### 3. 共通コンポーネント

#### 3.1. Button Component

```typescript
// src/components/common/Button.tsx

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

/**
 * 汎用ボタンコンポーネント
 * 
 * 機能:
 * - バリアント別スタイリング（primary, secondary, danger, success）
 * - サイズ別スタイリング（sm, md, lg）
 * - ローディング状態表示
 * - アイコン表示対応
 * - 無効状態対応
 * 
 * 使用場面:
 * - フォーム送信
 * - アクション実行
 * - ナビゲーション
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${
        (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"/>
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
```

#### 3.2. Input Component

```typescript
// src/components/common/Input.tsx

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * 汎用入力コンポーネント
 * 
 * 機能:
 * - ラベル表示
 * - バリデーションエラー表示
 * - ヘルプテキスト表示
 * - 各種input type対応
 * - アイコン表示
 * 
 * 使用場面:
 * - フォーム入力
 * - 検索フィールド
 * - データ入力
 */
export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  error,
  helperText,
  icon,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">{icon}</span>
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full rounded-md border-gray-300 shadow-sm
            focus:border-blue-500 focus:ring-blue-500
            sm:text-sm
            ${icon ? 'pl-10' : 'pl-3'}
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          `}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
```

#### 3.3. Modal Component

```typescript
// src/components/common/Modal.tsx

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  footer?: React.ReactNode;
}

/**
 * モーダルコンポーネント
 * 
 * 機能:
 * - オーバーレイ表示
 * - サイズ指定
 * - タイトル表示
 * - フッター表示
 * - 閉じるボタン
 * - ESCキーで閉じる
 * 
 * 使用場面:
 * - バイタル入力
 * - 処置入力
 * - 確認ダイアログ
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  footer
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closable, onClose]);
  
  if (!isOpen) return null;
  
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={closable ? onClose : undefined}
        />
        <div className={`relative w-full ${sizeStyles[size]} bg-white rounded-lg shadow-xl`}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {closable && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
          {footer && (
            <div className="flex items-center justify-end p-6 border-t bg-gray-50 rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 4. 認証関連コンポーネント

#### 4.1. LoginForm Component

```typescript
// src/components/auth/LoginForm.tsx

export interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onDemoLogin: (role: 'doctor_car' | 'hospital') => Promise<void>;
  loading?: boolean;
  error?: string;
}

/**
 * ログインフォームコンポーネント
 * 
 * 機能:
 * - メール・パスワード入力
 * - バリデーション
 * - デモログインボタン
 * - エラー表示
 * - ローディング状態
 * 
 * 使用場面:
 * - ログイン画面
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onDemoLogin,
  loading = false,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setValidationError('メールアドレスを入力してください');
      return false;
    }
    if (!password.trim()) {
      setValidationError('パスワードを入力してください');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('有効なメールアドレスを入力してください');
      return false;
    }
    setValidationError('');
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await onLogin(email, password);
    } catch (err) {
      // エラーは親コンポーネントで処理
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">D-Call App</h1>
        <p className="text-gray-600 mt-2">ドクターカー・オールインワンアプリ</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="メールアドレス"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="example@hospital.com"
          required
          disabled={loading}
        />
        
        <Input
          label="パスワード"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="パスワードを入力"
          required
          disabled={loading}
        />
        
        {(error || validationError) && (
          <div className="text-red-600 text-sm text-center">
            {error || validationError}
          </div>
        )}
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
        >
          ログイン
        </Button>
      </form>
      
      <div className="mt-6 space-y-2">
        <div className="text-center text-sm text-gray-500 mb-3">
          デモ用ログイン
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => onDemoLogin('doctor_car')}
          disabled={loading}
          className="w-full"
        >
          ドクターカー隊員でログイン
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => onDemoLogin('hospital')}
          disabled={loading}
          className="w-full"
        >
          病院スタッフでログイン
        </Button>
      </div>
    </div>
  );
};
```

### 5. 事案管理関連コンポーネント

#### 5.1. CaseList Component

```typescript
// src/components/cases/CaseList.tsx

export interface CaseListProps {
  cases: Case[];
  onCaseSelect: (caseId: string) => void;
  loading?: boolean;
  error?: string;
}

/**
 * 事案一覧コンポーネント
 * 
 * 機能:
 * - 事案一覧表示
 * - ステータス表示
 * - 事案選択
 * - ローディング状態
 * - エラー表示
 * 
 * 使用場面:
 * - 事案一覧画面
 */
export const CaseList: React.FC<CaseListProps> = ({
  cases,
  onCaseSelect,
  loading = false,
  error
}) => {
  const getStatusColor = (status: Case['status']) => {
    switch (status) {
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'on_scene': return 'bg-yellow-100 text-yellow-800';
      case 'transporting': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: Case['status']) => {
    switch (status) {
      case 'dispatched': return '出動中';
      case 'on_scene': return '現場活動中';
      case 'transporting': return '搬送中';
      case 'completed': return '完了';
      default: return '不明';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>エラーが発生しました: {error}</p>
      </div>
    );
  }
  
  if (cases.length === 0) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p>事案がありません</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {cases.map((case_) => (
        <div
          key={case_.id}
          onClick={() => onCaseSelect(case_.id)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {case_.caseName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                作成日時: {formatTimestamp(case_.createdAt)}
              </p>
              {case_.patientInfo && (
                <p className="text-sm text-gray-600 mt-1">
                  患者: {case_.patientInfo.age}歳 {case_.patientInfo.gender === 'male' ? '男性' : case_.patientInfo.gender === 'female' ? '女性' : ''}
                </p>
              )}
            </div>
            <div className="ml-4">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(case_.status)}`}>
                {getStatusText(case_.status)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### 5.2. CaseDetailHeader Component

```typescript
// src/components/cases/CaseDetailHeader.tsx

export interface CaseDetailHeaderProps {
  case: Case;
  onBack: () => void;
  onStatusChange?: (status: Case['status']) => void;
  userRole: 'doctor_car' | 'hospital';
}

/**
 * 事案詳細ヘッダーコンポーネント
 * 
 * 機能:
 * - 事案情報表示
 * - ステータス表示・変更
 * - 戻るボタン
 * - ユーザー役割に応じた表示制御
 * 
 * 使用場面:
 * - 事案詳細画面上部
 */
export const CaseDetailHeader: React.FC<CaseDetailHeaderProps> = ({
  case: caseData,
  onBack,
  onStatusChange,
  userRole
}) => {
  const getStatusColor = (status: Case['status']) => {
    switch (status) {
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'on_scene': return 'bg-yellow-100 text-yellow-800';
      case 'transporting': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getAvailableStatuses = () => {
    if (userRole === 'doctor_car') {
      switch (caseData.status) {
        case 'dispatched': return ['on_scene'];
        case 'on_scene': return ['transporting'];
        case 'transporting': return ['completed'];
        default: return [];
      }
    }
    return []; // 病院スタッフはステータス変更不可
  };
  
  const availableStatuses = getAvailableStatuses();
  
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
          >
            一覧へ
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {caseData.caseName}
            </h1>
            <p className="text-sm text-gray-500">
              ID: {caseData.id} | 作成: {formatTimestamp(caseData.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(caseData.status)}`}>
            {getStatusText(caseData.status)}
          </span>
          
          {availableStatuses.length > 0 && onStatusChange && (
            <select
              onChange={(e) => onStatusChange(e.target.value as Case['status'])}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
              defaultValue=""
            >
              <option value="" disabled>ステータス変更</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 6. バイタルサイン関連コンポーネント

#### 6.1. VitalSignsTimeline Component

```typescript
// src/components/vitals/VitalSignsTimeline.tsx

export interface VitalSignsTimelineProps {
  vitals: VitalSign[];
  treatments: Treatment[];
  onAddVital?: () => void;
  onAddTreatment?: () => void;
  userRole: 'doctor_car' | 'hospital';
  loading?: boolean;
}

/**
 * バイタルサイン・処置タイムラインコンポーネント
 * 
 * 機能:
 * - バイタルサインと処置の時系列表示
 * - データ追加ボタン（権限に応じて）
 * - リアルタイム更新対応
 * - データ可視化
 * 
 * 使用場面:
 * - 事案詳細画面の患者情報エリア
 */
export const VitalSignsTimeline: React.FC<VitalSignsTimelineProps> = ({
  vitals,
  treatments,
  onAddVital,
  onAddTreatment,
  userRole,
  loading = false
}) => {
  // バイタルと処置をマージして時系列ソート
  const timelineItems = useMemo(() => {
    const vitalItems = vitals.map(vital => ({
      type: 'vital' as const,
      timestamp: vital.timestamp,
      data: vital
    }));
    
    const treatmentItems = treatments.map(treatment => ({
      type: 'treatment' as const,
      timestamp: treatment.timestamp,
      data: treatment
    }));
    
    return [...vitalItems, ...treatmentItems]
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
  }, [vitals, treatments]);
  
  const canAddData = userRole === 'doctor_car';
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">患者情報タイムライン</h2>
          {canAddData && (
            <div className="space-x-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onAddVital}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                バイタル入力
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddTreatment}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                処置入力
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {!loading && timelineItems.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>データがありません</p>
            {canAddData && (
              <p className="text-sm mt-2">バイタルサインや処置を入力してください</p>
            )}
          </div>
        )}
        
        {!loading && timelineItems.length > 0 && (
          <div className="space-y-4">
            {timelineItems.map((item, index) => (
              <TimelineItem
                key={`${item.type}-${item.data.id}`}
                item={item}
                isLast={index === timelineItems.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// タイムラインアイテムコンポーネント
interface TimelineItemProps {
  item: {
    type: 'vital' | 'treatment';
    timestamp: Timestamp;
    data: VitalSign | Treatment;
  };
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ item, isLast }) => {
  const isVital = item.type === 'vital';
  const data = item.data;
  
  return (
    <div className="flex items-start space-x-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
        isVital ? 'bg-red-500' : 'bg-blue-500'
      }`}>
        {isVital ? '💓' : '🏥'}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900">
            {isVital ? 'バイタルサイン' : '処置'}
          </p>
          <p className="text-xs text-gray-500">
            {formatTimestamp(item.timestamp)}
          </p>
          <p className="text-xs text-gray-400">
            記録者: {data.recordedBy}
          </p>
        </div>
        
        <div className="mt-1">
          {isVital ? (
            <VitalSignDisplay vital={data as VitalSign} />
          ) : (
            <TreatmentDisplay treatment={data as Treatment} />
          )}
        </div>
      </div>
      
      {!isLast && (
        <div className="absolute left-4 mt-8 w-0.5 h-4 bg-gray-200" />
      )}
    </div>
  );
};

// バイタルサイン表示コンポーネント
const VitalSignDisplay: React.FC<{ vital: VitalSign }> = ({ vital }) => (
  <div className="grid grid-cols-2 gap-2 text-sm">
    <div>
      <span className="text-gray-600">心拍数:</span>
      <span className="ml-1 font-medium">{vital.hr} bpm</span>
    </div>
    <div>
      <span className="text-gray-600">血圧:</span>
      <span className="ml-1 font-medium">{vital.bp_s}/{vital.bp_d} mmHg</span>
    </div>
    <div className="col-span-2">
      <span className="text-gray-600">酸素飽和度:</span>
      <span className="ml-1 font-medium">{vital.spo2}%</span>
    </div>
  </div>
);

// 処置表示コンポーネント
const TreatmentDisplay: React.FC<{ treatment: Treatment }> = ({ treatment }) => (
  <div className="text-sm">
    <p className="font-medium text-gray-900">{treatment.name}</p>
    {treatment.details && (
      <p className="text-gray-600 mt-1">{treatment.details}</p>
    )}
  </div>
);
```

#### 6.2. VitalSignForm Component

```typescript
// src/components/vitals/VitalSignForm.tsx

export interface VitalSignFormProps {
  onSubmit: (vital: Omit<VitalSign, 'id' | 'timestamp' | 'caseId'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * バイタルサイン入力フォームコンポーネント
 * 
 * 機能:
 * - バイタルサイン入力
 * - バリデーション
 * - 送信処理
 * - 入力値の妥当性チェック
 * 
 * 使用場面:
 * - モーダル内でのバイタル入力
 */
export const VitalSignForm: React.FC<VitalSignFormProps> = ({
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    hr: '',
    bp_s: '',
    bp_d: '',
    spo2: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // 心拍数
    const hr = parseInt(formData.hr);
    if (!formData.hr || isNaN(hr)) {
      newErrors.hr = '心拍数を入力してください';
    } else if (hr < VITAL_RANGES.HR.min || hr > VITAL_RANGES.HR.max) {
      newErrors.hr = `心拍数は${VITAL_RANGES.HR.min}-${VITAL_RANGES.HR.max}の範囲で入力してください`;
    }
    
    // 収縮期血圧
    const bpS = parseInt(formData.bp_s);
    if (!formData.bp_s || isNaN(bpS)) {
      newErrors.bp_s = '収縮期血圧を入力してください';
    } else if (bpS < VITAL_RANGES.BP_S.min || bpS > VITAL_RANGES.BP_S.max) {
      newErrors.bp_s = `収縮期血圧は${VITAL_RANGES.BP_S.min}-${VITAL_RANGES.BP_S.max}の範囲で入力してください`;
    }
    
    // 拡張期血圧
    const bpD = parseInt(formData.bp_d);
    if (!formData.bp_d || isNaN(bpD)) {
      newErrors.bp_d = '拡張期血圧を入力してください';
    } else if (bpD < VITAL_RANGES.BP_D.min || bpD > VITAL_RANGES.BP_D.max) {
      newErrors.bp_d = `拡張期血圧は${VITAL_RANGES.BP_D.min}-${VITAL_RANGES.BP_D.max}の範囲で入力してください`;
    }
    
    // 酸素飽和度
    const spo2 = parseInt(formData.spo2);
    if (!formData.spo2 || isNaN(spo2)) {
      newErrors.spo2 = '酸素飽和度を入力してください';
    } else if (spo2 < VITAL_RANGES.SPO2.min || spo2 > VITAL_RANGES.SPO2.max) {
      newErrors.spo2 = `酸素飽和度は${VITAL_RANGES.SPO2.min}-${VITAL_RANGES.SPO2.max}の範囲で入力してください`;
    }
    
    // 血圧の妥当性チェック
    if (!newErrors.bp_s && !newErrors.bp_d && bpS <= bpD) {
      newErrors.bp_s = '収縮期血圧は拡張期血圧より高い値を入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await onSubmit({
        hr: parseInt(formData.hr),
        bp_s: parseInt(formData.bp_s),
        bp_d: parseInt(formData.bp_d),
        spo2: parseInt(formData.spo2),
        recordedBy: getCurrentUser()?.displayName || 'Unknown'
      });
    } catch (error) {
      console.error('バイタルサイン保存エラー:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="心拍数 (bpm)"
          type="number"
          value={formData.hr}
          onChange={(value) => setFormData(prev => ({ ...prev, hr: value }))}
          placeholder="90"
          required
          disabled={loading}
          error={errors.hr}
        />
        
        <Input
          label="酸素飽和度 (%)"
          type="number"
          value={formData.spo2}
          onChange={(value) => setFormData(prev => ({ ...prev, spo2: value }))}
          placeholder="98"
          required
          disabled={loading}
          error={errors.spo2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="収縮期血圧 (mmHg)"
          type="number"
          value={formData.bp_s}
          onChange={(value) => setFormData(prev => ({ ...prev, bp_s: value }))}
          placeholder="120"
          required
          disabled={loading}
          error={errors.bp_s}
        />
        
        <Input
          label="拡張期血圧 (mmHg)"
          type="number"
          value={formData.bp_d}
          onChange={(value) => setFormData(prev => ({ ...prev, bp_d: value }))}
          placeholder="80"
          required
          disabled={loading}
          error={errors.bp_d}
        />
      </div>
      
      <div className="flex items-center justify-end space-x-3 pt-4">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          保存
        </Button>
      </div>
    </form>
  );
};
```

### 7. 地図関連コンポーネント

#### 7.1. MapView Component

```typescript
// src/components/maps/MapView.tsx

export interface MapViewProps {
  caseData: Case;
  locations: LocationRecord[];
  className?: string;
}

/**
 * 地図表示コンポーネント
 * 
 * 機能:
 * - 現場・病院マーカー表示
 * - ドクターカー位置表示
 * - リアルタイム位置更新
 * - ルート表示
 * 
 * 使用場面:
 * - 事案詳細画面の地図エリア
 */
export const MapView: React.FC<MapViewProps> = ({
  caseData,
  locations,
  className = ''
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  
  // 地図初期化
  useEffect(() => {
    if (!mapRef.current) return;
    
    const newMap = L.map(mapRef.current).setView(
      [caseData.sceneLocation.latitude, caseData.sceneLocation.longitude],
      13
    );
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);
    
    setMap(newMap);
    
    return () => {
      newMap.remove();
    };
  }, [caseData.sceneLocation]);
  
  // マーカー管理
  useEffect(() => {
    if (!map) return;
    
    // 既存マーカーをクリア
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // 現場マーカー
    const sceneIcon = L.divIcon({
      html: '<div class="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">🚨</div>',
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    L.marker([caseData.sceneLocation.latitude, caseData.sceneLocation.longitude], {
      icon: sceneIcon
    }).addTo(map).bindPopup('現場');
    
    // 病院マーカー
    const hospitalIcon = L.divIcon({
      html: '<div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">🏥</div>',
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    L.marker([caseData.hospitalLocation.latitude, caseData.hospitalLocation.longitude], {
      icon: hospitalIcon
    }).addTo(map).bindPopup('病院');
    
    // 最新のドクターカー位置
    if (locations.length > 0) {
      const latestLocation = locations[0];
      const doctorCarIcon = L.divIcon({
        html: '<div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">🚑</div>',
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      L.marker([latestLocation.geoPoint.latitude, latestLocation.geoPoint.longitude], {
        icon: doctorCarIcon
      }).addTo(map).bindPopup('ドクターカー');
    }
    
    // 地図の表示範囲を調整
    const bounds = L.latLngBounds([
      [caseData.sceneLocation.latitude, caseData.sceneLocation.longitude],
      [caseData.hospitalLocation.latitude, caseData.hospitalLocation.longitude]
    ]);
    
    if (locations.length > 0) {
      bounds.extend([locations[0].geoPoint.latitude, locations[0].geoPoint.longitude]);
    }
    
    map.fitBounds(bounds, { padding: [20, 20] });
    
  }, [map, caseData, locations]);
  
  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">🚨</div>
          <span>現場</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">🏥</div>
          <span>病院</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">🚑</div>
          <span>ドクターカー</span>
        </div>
      </div>
      
      {locations.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-sm">
          <p className="font-medium">最新位置情報</p>
          <p className="text-gray-600">
            更新: {formatTimestamp(locations[0].timestamp)}
          </p>
          {locations[0].accuracy && (
            <p className="text-gray-500 text-xs">
              精度: ±{locations[0].accuracy}m
            </p>
          )}
        </div>
      )}
    </div>
  );
};
```

### 8. チャット関連コンポーネント

#### 8.1. ChatArea Component

```typescript
// src/components/messages/ChatArea.tsx

export interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  currentUserId: string;
  loading?: boolean;
}

/**
 * チャットエリアコンポーネント
 * 
 * 機能:
 * - メッセージ一覧表示
 * - メッセージ送信
 * - 定型文送信
 * - 自動スクロール
 * - リアルタイム更新
 * 
 * 使用場面:
 * - 事案詳細画面のチャットエリア
 */
export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  currentUserId,
  loading = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSendMessage(inputText.trim());
      setInputText('');
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePresetMessage = async (text: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSendMessage(text);
    } catch (error) {
      console.error('定型文送信エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">チャット</h2>
      </div>
      
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            <p>まだメッセージがありません</p>
            <p className="text-sm mt-1">チームとコミュニケーションを開始しましょう</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 定型文ボタン */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_MESSAGES.DOCTOR_CAR.slice(0, 3).map((preset) => (
            <Button
              key={preset}
              variant="secondary"
              size="sm"
              onClick={() => handlePresetMessage(preset)}
              disabled={isSubmitting}
              className="text-xs"
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>
      
      {/* メッセージ入力 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="メッセージを入力..."
            disabled={isSubmitting}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputText.trim() || isSubmitting}
            loading={isSubmitting}
          >
            送信
          </Button>
        </div>
      </form>
    </div>
  );
};

// メッセージバブルコンポーネント
interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-900'
      }`}>
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1 opacity-75">
            {message.senderName}
          </p>
        )}
        <p className="text-sm">{message.text}</p>
        <p className={`text-xs mt-1 ${
          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
};
```

### 9. ページコンポーネント

#### 9.1. LoginPage Component

```typescript
// src/pages/LoginPage.tsx

/**
 * ログインページコンポーネント
 * 
 * 機能:
 * - ログインフォーム表示
 * - 認証処理
 * - ログイン成功時のリダイレクト
 * - エラーハンドリング
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    
    try {
      await loginUser(email, password);
      navigate('/cases');
    } catch (err) {
      setError(handleFirebaseError(err).message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDemoLogin = async (role: 'doctor_car' | 'hospital') => {
    setLoading(true);
    setError('');
    
    try {
      if (role === 'doctor_car') {
        await loginAsDoctorCarMember();
      } else {
        await loginAsHospitalStaff();
      }
      navigate('/cases');
    } catch (err) {
      setError(handleFirebaseError(err).message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <LoginForm
          onLogin={handleLogin}
          onDemoLogin={handleDemoLogin}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};
```

### 10. カスタムフック

#### 10.1. useRealTimeCase Hook

```typescript
// src/hooks/useRealTimeCase.ts

/**
 * 事案のリアルタイム更新を管理するカスタムフック
 * 
 * 機能:
 * - 事案データのリアルタイム監視
 * - サブコレクションデータの取得
 * - エラーハンドリング
 * - クリーンアップ処理
 */
export const useRealTimeCase = (caseId: string) => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!caseId) return;
    
    const unsubscribes: (() => void)[] = [];
    
    // 事案データの監視
    const unsubscribeCase = observeCase(caseId, (case_) => {
      setCaseData(case_);
      setLoading(false);
    });
    unsubscribes.push(unsubscribeCase);
    
    // バイタルサインの監視
    const unsubscribeVitals = observeVitalSigns(caseId, setVitals);
    unsubscribes.push(unsubscribeVitals);
    
    // 処置記録の監視
    const unsubscribeTreatments = observeTreatments(caseId, setTreatments);
    unsubscribes.push(unsubscribeTreatments);
    
    // メッセージの監視
    const unsubscribeMessages = observeMessages(caseId, setMessages);
    unsubscribes.push(unsubscribeMessages);
    
    // 位置情報の監視
    const unsubscribeLocations = observeLocations(caseId, setLocations);
    unsubscribes.push(unsubscribeLocations);
    
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [caseId]);
  
  return {
    caseData,
    vitals,
    treatments,
    messages,
    locations,
    loading,
    error
  };
};
```

この設計仕様書により、実装者は各コンポーネントの責務、インターフェース、動作を明確に把握でき、効率的に開発を進めることができます。