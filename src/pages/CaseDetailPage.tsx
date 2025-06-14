import React, { useEffect, useRef, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useCaseStore, useAuthStore } from '@/stores';
import { LoadingSpinner, Button } from '@/components/common';
import { CASE_STATUS } from '@/constants';
import { MapComponent, VitalSignsComponent, ChatComponent, TreatmentComponent, LocationTracker } from '@/components/features';

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { currentCase, loading, error, loadCurrentCase, startObservingCase, stopObservingCase, updateStatus } = useCaseStore();
  const { userInfo } = useAuthStore();
  const isMountedRef = useRef(true);
  const [activeTab, setActiveTab] = useState<'vitals' | 'treatments'>('vitals');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // ステータス更新処理
  const handleStatusUpdate = async (newStatus: string) => {
    if (!caseId) return;
    
    try {
      await updateStatus(caseId, newStatus as any);
    } catch (error) {
      console.error('Status update failed:', error);
      alert('ステータス更新に失敗しました');
    }
  };
  
  // 次のステータスを取得
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case CASE_STATUS.DISPATCHED:
        return { status: CASE_STATUS.ON_SCENE, label: '現場到着' };
      case CASE_STATUS.ON_SCENE:
        return { status: CASE_STATUS.TRANSPORTING, label: '搬送開始' };
      case CASE_STATUS.TRANSPORTING:
        return { status: CASE_STATUS.COMPLETED, label: '搬送完了' };
      default:
        return null;
    }
  };
  
  // 現在地更新ハンドラー
  const handleLocationUpdate = (location: { latitude: number; longitude: number }) => {
    setCurrentLocation(location);
  };
  
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!caseId) return;
    
    const loadData = async () => {
      try {
        if (isMountedRef.current) {
          await loadCurrentCase(caseId);
          if (isMountedRef.current) {
            startObservingCase(caseId);
          }
        }
      } catch (error) {
        console.error('Failed to load case:', error);
      }
    };
    
    loadData();
    
    return () => {
      isMountedRef.current = false;
      try {
        stopObservingCase();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, [caseId]);
  
  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  if (!caseId) {
    return <Navigate to="/cases" replace />;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              isMountedRef.current = false;
              try {
                stopObservingCase();
              } catch (error) {
                console.error('Stop observing error:', error);
              }
              
              // ナビゲーションを少し遅延
              setTimeout(() => {
                try {
                  navigate('/cases');
                } catch (error) {
                  console.error('Navigation error:', error);
                  window.location.href = '/cases';
                }
              }, 100);
            }}
            className="bg-medical-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            事案一覧に戻る
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentCase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">事案が見つかりません</h1>
          <p className="text-gray-600 mb-6">指定された事案は存在しないか、アクセス権限がありません。</p>
          <button 
            onClick={() => {
              isMountedRef.current = false;
              try {
                stopObservingCase();
              } catch (error) {
                console.error('Stop observing error:', error);
              }
              
              // ナビゲーションを少し遅延
              setTimeout(() => {
                try {
                  navigate('/cases');
                } catch (error) {
                  console.error('Navigation error:', error);
                  window.location.href = '/cases';
                }
              }, 100);
            }}
            className="bg-medical-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            事案一覧に戻る
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  isMountedRef.current = false;
                  try {
                    stopObservingCase();
                  } catch (error) {
                    console.error('Stop observing error:', error);
                  }
                  
                  // ナビゲーションを少し遅延
                  setTimeout(() => {
                    try {
                      navigate('/cases');
                    } catch (error) {
                      console.error('Navigation error:', error);
                      window.location.href = '/cases';
                    }
                  }, 100);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{currentCase.caseName}</h1>
                <p className="text-sm text-gray-500">
                  ステータス: {currentCase.status} | 担当: {currentCase.teamId}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {(() => {
                const nextStatus = getNextStatus(currentCase.status);
                return nextStatus ? (
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(nextStatus.status)}
                  >
                    {nextStatus.label}
                  </Button>
                ) : null;
              })()}
              
              <div className="text-sm text-gray-700">
                <span className="font-medium">{userInfo?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* マップエリア */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">位置情報</h3>
              <div className="h-64">
                <MapComponent
                  sceneLocation={currentCase.sceneLocation}
                  hospitalLocation={currentCase.hospitalLocation}
                  currentLocation={currentLocation || undefined}
                />
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full mr-1"></div>
                    <span>現場</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
                    <span>搬送先病院</span>
                  </div>
                  {currentLocation && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
                      <span>現在地</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 位置追跡 */}
              <div className="mt-4">
                <LocationTracker onLocationUpdate={handleLocationUpdate} />
              </div>
            </div>
            
            {/* 患者情報エリア */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">患者情報</h3>
              
              {currentCase.patientInfo.name && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500">氏名: </span>
                  <span className="text-sm text-gray-900">{currentCase.patientInfo.name}</span>
                </div>
              )}
              
              {currentCase.patientInfo.age && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500">年齢: </span>
                  <span className="text-sm text-gray-900">{currentCase.patientInfo.age}歳</span>
                </div>
              )}
              
              {currentCase.patientInfo.gender && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500">性別: </span>
                  <span className="text-sm text-gray-900">
                    {currentCase.patientInfo.gender === 'male' ? '男性' : 
                     currentCase.patientInfo.gender === 'female' ? '女性' : 'その他'}
                  </span>
                </div>
              )}
              
              {/* タブナビゲーション */}
              <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('vitals')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'vitals'
                        ? 'border-medical-primary text-medical-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    バイタル
                  </button>
                  <button
                    onClick={() => setActiveTab('treatments')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'treatments'
                        ? 'border-medical-primary text-medical-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    処置記録
                  </button>
                </nav>
              </div>

              {/* タブコンテンツ */}
              <div className="mt-4">
                {activeTab === 'vitals' ? (
                  <VitalSignsComponent caseId={caseId!} />
                ) : (
                  <TreatmentComponent caseId={caseId!} />
                )}
              </div>
            </div>
          </div>
          
          {/* チャットエリア */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">コミュニケーション</h3>
            <div className="h-64">
              <ChatComponent caseId={caseId!} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};