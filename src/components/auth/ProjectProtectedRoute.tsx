import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProjectAuthStore } from '@/stores/projectAuthStore';
import { ProjectAuth } from './ProjectAuth';

interface ProjectProtectedRouteProps {
  children: React.ReactNode;
}

export const ProjectProtectedRoute: React.FC<ProjectProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, checkAuth, authenticate, setRedirectUrl, redirectUrl } = useProjectAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // ページアクセス時に認証状態をチェック
    const isAuthed = checkAuth();
    
    // 認証されていない場合、現在のURLを保存
    if (!isAuthed) {
      setRedirectUrl(location.pathname + location.search);
    }
  }, [checkAuth, location.pathname, location.search, setRedirectUrl]);

  // 認証されていない場合は認証画面を表示
  if (!isAuthenticated) {
    return (
      <ProjectAuth 
        onAuthenticated={() => {
          authenticate();
          // 認証成功後、保存されたURLまたはホームにリダイレクト
          const targetUrl = redirectUrl || '/cases';
          setRedirectUrl(null);
          navigate(targetUrl, { replace: true });
        }} 
      />
    );
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>;
};