import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCaseStore, useAuthStore } from '@/stores';
import { useProjectAuthStore } from '@/stores/projectAuthStore';
import { Button, LoadingSpinner } from '@/components/common';
import { CASE_STATUS } from '@/constants';

// 日付表示のヘルパー関数
const formatDate = (timestamp: any): string => {
  try {
    // Timestampオブジェクトの場合
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('ja-JP');
    }
    // 通常のDateオブジェクトまたは文字列の場合
    if (timestamp) {
      // secondsフィールドがある場合（モックタイムスタンプ）
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('ja-JP');
      }
      return new Date(timestamp).toLocaleDateString('ja-JP');
    }
    return '日付不明';
  } catch (error) {
    console.error('Date formatting error:', error);
    return '日付不明';
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    [CASE_STATUS.DISPATCHED]: { 
      label: '出動中', 
      className: 'badge badge-warning' 
    },
    [CASE_STATUS.ON_SCENE]: { 
      label: '現場活動中', 
      className: 'badge badge-info' 
    },
    [CASE_STATUS.TRANSPORTING]: { 
      label: '搬送中', 
      className: 'badge badge-warning' 
    },
    [CASE_STATUS.COMPLETED]: { 
      label: '完了', 
      className: 'badge badge-success' 
    }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'badge' };
  
  return (
    <span className={config.className}>
      {config.label}
    </span>
  );
};

export const CaseListPage: React.FC = () => {
  const { cases, loading, error, loadCases } = useCaseStore();
  const { userInfo, logout } = useAuthStore();
  const { logout: projectLogout } = useProjectAuthStore();

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleLogout = async () => {
    await logout();
  };

  const handleProjectLogout = () => {
    projectLogout();
    // ページをリロードして認証画面に戻る
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-medical-primary rounded-full flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Doctor Car App</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{userInfo?.name}</span>
                <span className="text-gray-500 ml-2">({userInfo?.team})</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                ログアウト
              </Button>
              <Button variant="outline" size="sm" onClick={handleProjectLogout} className="text-red-600 border-red-300 hover:bg-red-50">
                システム終了
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">事案一覧</h2>
              <p className="mt-1 text-sm text-gray-600">
                現在の出動事案と過去の記録を確認できます
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/route-optimization"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                🚗 xROAD ルート最適化
              </Link>
              <Link
                to="/registries"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                レジストリ一覧
              </Link>
              <Link
                to="/cases/create"
                className="bg-medical-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                新規事案作成
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {cases.length === 0 ? (
                  <li className="px-6 py-12 text-center">
                    <p className="text-gray-500">事案がありません</p>
                  </li>
                ) : (
                  cases.map((case_) => (
                    <li key={case_.id}>
                      <Link
                        to={`/cases/${case_.id}`}
                        className="block hover:bg-gray-50 px-6 py-4 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-medium text-gray-900 truncate">
                                {case_.caseName}
                              </p>
                              {getStatusBadge(case_.status)}
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>チーム: {case_.teamId}</span>
                              
                              {case_.patientInfo.age && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>患者: {case_.patientInfo.age}歳 {case_.patientInfo.gender === 'male' ? '男性' : case_.patientInfo.gender === 'female' ? '女性' : ''}</span>
                                </>
                              )}
                              
                              <span className="mx-2">•</span>
                              <span>{formatDate(case_.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="ml-2 flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};