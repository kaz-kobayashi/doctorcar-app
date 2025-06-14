import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStoreInitialization } from '@/stores';
import { ProtectedRoute } from '@/components/auth';
import { ErrorBoundary } from '@/components/common';
import { LoginPage } from '@/pages/LoginPage';

// ページコンポーネントの動的インポート（Code Splitting）
const CaseListPage = React.lazy(() => 
  import('./pages/CaseListPage').then(module => ({ default: module.CaseListPage }))
);

const CaseDetailPage = React.lazy(() => 
  import('./pages/CaseDetailPage').then(module => ({ default: module.CaseDetailPage }))
);

const CreateCasePage = React.lazy(() => 
  import('./pages/CreateCasePage').then(module => ({ default: module.CreateCasePage }))
);

// 未承認ページ
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
      <p className="text-gray-600 mb-6">このページにアクセスする権限がありません。</p>
      <button 
        onClick={() => window.history.back()}
        className="bg-medical-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        戻る
      </button>
    </div>
  </div>
);

function App() {
  const { initialize } = useStoreInitialization();
  
  useEffect(() => {
    console.log('App: initializing stores');
    try {
      const cleanup = initialize();
      return cleanup;
    } catch (error) {
      console.error('App initialization error:', error);
      throw error;
    }
  }, []); // 依存配列を空にして一度だけ実行
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <React.Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary"></div>
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/cases"
              element={
                <ProtectedRoute>
                  <CaseListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/create"
              element={
                <ProtectedRoute>
                  <CreateCasePage />
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
            <Route path="*" element={<Navigate to="/cases" replace />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;