import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStoreInitialization } from '@/stores';
import { ProtectedRoute, ProjectProtectedRoute } from '@/components/auth';
import { ErrorBoundary } from '@/components/common';
import { LoginPage } from '@/pages/LoginPage';

// ページコンポーネントの静的インポート
import { CaseListPage } from './pages/CaseListPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CreateCasePage } from './pages/CreateCasePage';
import { RegistryFormPage } from './pages/RegistryFormPage';
import { RegistryListPage } from './pages/RegistryListPage';
import { RouteOptimizationPage } from './pages/RouteOptimizationPage';

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

  // GitHub Pages用のbasename設定
  const basename = process.env.NODE_ENV === 'production' ? '/doctorcar-app' : '';
  
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/cases"
              element={
                <ProjectProtectedRoute>
                  <ProtectedRoute>
                    <CaseListPage />
                  </ProtectedRoute>
                </ProjectProtectedRoute>
              }
            />
            <Route
              path="/cases/create"
              element={
                <ProjectProtectedRoute>
                  <ProtectedRoute>
                    <CreateCasePage />
                  </ProtectedRoute>
                </ProjectProtectedRoute>
              }
            />
            <Route
              path="/cases/:caseId"
              element={
                <ProjectProtectedRoute>
                  <ProtectedRoute>
                    <CaseDetailPage />
                  </ProtectedRoute>
                </ProjectProtectedRoute>
              }
            />
            <Route
              path="/cases/:caseId/registry"
              element={
                <ProjectProtectedRoute>
                  <ProtectedRoute>
                    <RegistryFormPage />
                  </ProtectedRoute>
                </ProjectProtectedRoute>
              }
            />
            <Route
              path="/registries"
              element={
                <ProjectProtectedRoute>
                  <ProtectedRoute>
                    <RegistryListPage />
                  </ProtectedRoute>
                </ProjectProtectedRoute>
              }
            />
            <Route
              path="/route-optimization"
              element={
                <ProjectProtectedRoute>
                  <ProtectedRoute>
                    <RouteOptimizationPage />
                  </ProtectedRoute>
                </ProjectProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/cases" replace />} />
            <Route path="*" element={<Navigate to="/cases" replace />} />
          </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;