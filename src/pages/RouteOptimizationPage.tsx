import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, LoadingSpinner } from '@/components/common';
import { RouteOptimizationComponent } from '@/components/features/RouteOptimization';
import { useRouteAnalytics } from '@/hooks/useRouteOptimization';
import { RoutePoint } from '@/types/route';

export const RouteOptimizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { analytics, isLoading: analyticsLoading, refreshAnalytics } = useRouteAnalytics();
  
  const [origin, setOrigin] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);

  // Parse URL parameters for preset locations
  useEffect(() => {
    const originLat = searchParams.get('originLat');
    const originLon = searchParams.get('originLon');
    const originName = searchParams.get('originName');
    const destLat = searchParams.get('destLat');
    const destLon = searchParams.get('destLon');
    const destName = searchParams.get('destName');

    if (originLat && originLon) {
      setOrigin({
        latitude: parseFloat(originLat),
        longitude: parseFloat(originLon),
        name: originName || '出発地'
      });
    }

    if (destLat && destLon) {
      setDestination({
        latitude: parseFloat(destLat),
        longitude: parseFloat(destLon),
        name: destName || '目的地'
      });
    }
  }, [searchParams]);

  const handleLocationSet = (type: 'origin' | 'destination') => {
    // In a real implementation, this would open a map picker
    // For now, we'll use the Tokyo location from the xroad conversation
    const tokyoLocation = {
      latitude: 35.701835,
      longitude: 139.763417,
      name: type === 'origin' ? '東京ドクターカー基地' : '東京医科歯科大学病院'
    };

    if (type === 'origin') {
      setOrigin(tokyoLocation);
    } else {
      setDestination(tokyoLocation);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}時間${remainingMinutes}分`;
    }
    return `${minutes}分`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/cases')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">xROAD ルート最適化</h1>
                <p className="text-sm text-gray-500">
                  リアルタイム交通データによる最適ルート検索
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={refreshAnalytics}
                disabled={analyticsLoading}
              >
                📊 分析更新
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* 位置設定セクション */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">位置設定</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 出発地設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出発地
                </label>
                {origin ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-900">{origin.name}</div>
                        <div className="text-sm text-green-600">
                          {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOrigin(null)}
                      >
                        変更
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleLocationSet('origin')}
                    className="w-full border-dashed border-2 border-gray-300 text-gray-600"
                    variant="outline"
                  >
                    📍 出発地を設定
                  </Button>
                )}
              </div>

              {/* 目的地設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目的地
                </label>
                {destination ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">{destination.name}</div>
                        <div className="text-sm text-blue-600">
                          {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDestination(null)}
                      >
                        変更
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleLocationSet('destination')}
                    className="w-full border-dashed border-2 border-gray-300 text-gray-600"
                    variant="outline"
                  >
                    🏥 目的地を設定
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ルート最適化コンポーネント */}
          <RouteOptimizationComponent
            currentLocation={origin ? { latitude: origin.latitude, longitude: origin.longitude } : undefined}
            onRouteSelected={(route) => {
              console.log('Route selected:', route);
            }}
            onNavigationStart={(route) => {
              console.log('Navigation started:', route);
              alert('ナビゲーションアプリに連携しました');
            }}
            className="mb-6"
          />

          {/* 分析ダッシュボード */}
          {analytics && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">xROAD活用実績</h2>
              
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">ルート最適化</div>
                  <div className="text-2xl font-bold">{analytics.totalRoutesOptimized}</div>
                  <div className="text-sm opacity-90">回実行</div>
                </div>
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">予測精度</div>
                  <div className="text-2xl font-bold">{Math.round(analytics.averageAccuracy * 100)}%</div>
                  <div className="text-sm opacity-90">平均精度</div>
                </div>
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">時間短縮</div>
                  <div className="text-2xl font-bold">{formatTime(analytics.timeSaved)}</div>
                  <div className="text-sm opacity-90">累計短縮</div>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">最適時間帯</div>
                  <div className="text-2xl font-bold">{analytics.mostEfficientTimeSlots[0]?.hour || '--'}時</div>
                  <div className="text-sm opacity-90">最効率</div>
                </div>
              </div>

              {/* 時間帯別効率性 */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-gray-800 mb-4">時間帯別効率性</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analytics.mostEfficientTimeSlots.map((slot: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900">
                        {slot.hour}:00-{slot.hour + 1}:00
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        平均速度: {slot.averageSpeed.toFixed(0)}km/h
                      </div>
                      <div className="text-xs text-gray-600">
                        信頼度: {Math.round(slot.reliability * 100)}%
                      </div>
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${slot.reliability * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* xROAD API情報 */}
              <div className="border-t pt-6">
                <h3 className="text-md font-medium text-gray-800 mb-4">xROAD API統合状況</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">JARTIC交通量API</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        🟢 接続中
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">DRM-PF ルート検索</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        🟢 接続中
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">リアルタイム更新</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        🔄 5分間隔
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium mb-1">対象エリア</div>
                      <div>東京都心部 6km × 6km</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium mb-1">交通量観測点</div>
                      <div>約2,600地点（直轄国道）</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium mb-1">データ更新</div>
                      <div>5分値（20分遅延）</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analyticsLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">分析データを読み込み中...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};