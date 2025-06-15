import React, { useState, useEffect } from 'react';
import { Button, Input, LoadingSpinner } from '@/components/common';
import { RouteRequest } from '@/types/route';
import { useRouteOptimization, useRouteAnalytics } from '@/hooks/useRouteOptimization';
import { HospitalSelector } from '@/components/features';
import { EmergencyHospital } from '@/data/emergencyHospitals';

interface RouteOptimizationComponentProps {
  currentLocation?: { latitude: number; longitude: number };
  sceneLocation?: { latitude: number; longitude: number };
  onRouteSelected?: (route: any) => void;
  onNavigationStart?: (route: any) => void;
  onHospitalSelected?: (hospital: EmergencyHospital) => void;
  className?: string;
}

export const RouteOptimizationComponent: React.FC<RouteOptimizationComponentProps> = ({
  currentLocation,
  sceneLocation,
  onRouteSelected,
  onNavigationStart,
  onHospitalSelected,
  className = ''
}) => {
  const [routeRequest, setRouteRequest] = useState<Partial<RouteRequest>>({
    routePreference: 'fastest',
    vehicleType: 'emergency'
  });
  const [selectedHospital, setSelectedHospital] = useState<EmergencyHospital | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [originType, setOriginType] = useState<'current' | 'scene'>('current');

  const {
    isOptimizing,
    optimizationResult,
    currentRoute,
    routeUpdates,
    error,
    optimizeRoute,
    selectRoute,
    startMonitoring,
    // stopMonitoring - available if needed
    clearError,
    getETA,
    getTimeSaved,
    getTrafficLevel
  } = useRouteOptimization({
    autoUpdate: true,
    updateInterval: 3,
    onRouteUpdate: (update) => {
      console.log('Route update received:', update);
    }
  });

  const { analytics } = useRouteAnalytics();

  // Auto-populate origin based on selected type
  useEffect(() => {
    console.log('Origin type changed:', originType);
    console.log('Current location:', currentLocation);
    console.log('Scene location:', sceneLocation);
    
    // Auto-switch to current location if scene is selected but not available
    if (originType === 'scene' && !sceneLocation && currentLocation) {
      console.log('Scene location not available, switching to current location');
      setOriginType('current');
      return;
    }
    
    const updateOrigin = () => {
      if (originType === 'current' && currentLocation) {
        console.log('Setting origin to current location');
        setRouteRequest(prev => ({
          ...prev,
          origin: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            name: "現在地"
          }
        }));
      } else if (originType === 'scene' && sceneLocation) {
        console.log('Setting origin to scene location');
        setRouteRequest(prev => ({
          ...prev,
          origin: {
            latitude: sceneLocation.latitude,
            longitude: sceneLocation.longitude,
            name: "現場（患者位置）"
          }
        }));
      } else {
        console.log('Cannot set origin - missing location data for type:', originType);
      }
    };
    
    updateOrigin();
  }, [originType, currentLocation, sceneLocation]);

  // Update destination when hospital is selected
  useEffect(() => {
    if (selectedHospital) {
      setRouteRequest(prev => ({
        ...prev,
        destination: {
          latitude: selectedHospital.latitude,
          longitude: selectedHospital.longitude,
          name: selectedHospital.name
        }
      }));
      // Notify parent component
      onHospitalSelected?.(selectedHospital);
    }
  }, [selectedHospital, onHospitalSelected]);

  const handleOptimizeRoute = async () => {
    if (!routeRequest.origin || !routeRequest.destination) {
      alert('出発地と目的地を設定してください');
      return;
    }

    const request: RouteRequest = {
      origin: routeRequest.origin,
      destination: routeRequest.destination,
      routePreference: routeRequest.routePreference || 'fastest',
      departureTime: new Date(),
      vehicleType: 'emergency'
    };

    await optimizeRoute(request);
  };

  const handleRouteSelect = (routeId: string) => {
    selectRoute(routeId);
    const selectedRoute = optimizationResult?.routes.find(r => r.id === routeId);
    if (selectedRoute) {
      onRouteSelected?.(selectedRoute);
    }
  };

  const handleStartNavigation = () => {
    if (currentRoute) {
      onNavigationStart?.(currentRoute);
      startMonitoring();
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

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const getTrafficLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'congested': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRouteTypeIcon = (type: string): string => {
    switch (type) {
      case 'fastest': return '⚡';
      case 'most_stable': return '🎯';
      case 'shortest': return '📏';
      default: return '🚗';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ルート最適化</h2>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            📊 分析
          </Button>
          {currentRoute && (
            <Button
              size="sm"
              onClick={handleStartNavigation}
              className="bg-blue-600 text-white"
            >
              🧭 ナビ開始
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={clearError}>
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Route Request Form */}
      <div className="space-y-6 mb-6">
        {/* 出発地セクション */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            📍 出発地
          </label>
          
          {/* Origin Type Selection */}
          <div className="mb-4">
            <div className="flex space-x-4">
              <label className={`flex items-center cursor-pointer ${!currentLocation ? 'opacity-50' : ''}`}>
                <input
                  type="radio"
                  name="originType"
                  value="current"
                  checked={originType === 'current'}
                  onChange={() => setOriginType('current')}
                  disabled={!currentLocation}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  現在地 {!currentLocation && '(取得中...)'}
                </span>
              </label>
              <label className={`flex items-center cursor-pointer ${!sceneLocation ? 'opacity-50' : ''}`}>
                <input
                  type="radio"
                  name="originType"
                  value="scene"
                  checked={originType === 'scene'}
                  onChange={() => setOriginType('scene')}
                  disabled={!sceneLocation}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  現場（患者位置） {!sceneLocation && '(データなし)'}
                </span>
              </label>
            </div>
          </div>
          
          <Input
            type="text"
            value={
              routeRequest.origin?.name 
                ? `${routeRequest.origin.name} (${routeRequest.origin.latitude.toFixed(4)}, ${routeRequest.origin.longitude.toFixed(4)})`
                : originType === 'current' 
                  ? '現在地を取得中...' 
                  : '現場位置を取得中...'
            }
            placeholder="位置を設定中..."
            readOnly
            className="bg-white border-gray-300"
          />
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-1 text-xs text-gray-500">
              デバッグ: 選択={originType}, 現在地={currentLocation ? '有' : '無'}, 現場={sceneLocation ? '有' : '無'}
            </div>
          )}
        </div>
        
        {/* 搬送先病院セクション */}
        <div className="bg-blue-50 rounded-lg p-4">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            🏥 搬送先病院
          </label>
          <HospitalSelector
            currentLocation={currentLocation}
            selectedHospital={selectedHospital || undefined}
            onHospitalSelect={setSelectedHospital}
          />
        </div>

        {/* ルート優先度セクション */}
        <div className="bg-green-50 rounded-lg p-4">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            ⚡ ルート優先度
          </label>
          <select
            value={routeRequest.routePreference}
            onChange={(e) => setRouteRequest(prev => ({
              ...prev,
              routePreference: e.target.value as any
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="fastest">⚡ 最速ルート（時間を最優先）</option>
            <option value="most_stable">🎯 最安定ルート（遅延リスクを最小化）</option>
            <option value="shortest">📏 最短距離ルート</option>
          </select>
          <p className="mt-2 text-sm text-gray-600">
            {routeRequest.routePreference === 'fastest' && '交通状況を考慮した最も早い到着時間のルートを優先します。'}
            {routeRequest.routePreference === 'most_stable' && '交通量の変動が少なく、予定通りの到着が期待できるルートを優先します。'}
            {routeRequest.routePreference === 'shortest' && '距離が最も短いルートを優先します。'}
          </p>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          onClick={handleOptimizeRoute}
          disabled={isOptimizing || !routeRequest.origin || !routeRequest.destination || !selectedHospital}
          className="bg-green-600 text-white px-6 py-2"
        >
          {isOptimizing ? <LoadingSpinner size="sm" /> : '🔍 ルート最適化'}
        </Button>
        
        {!selectedHospital && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            搬送先病院を選択してください
          </p>
        )}
      </div>

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="space-y-6">
          {/* Current Route Summary */}
          {currentRoute && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-blue-900">
                  {getRouteTypeIcon(currentRoute.routeType)} {currentRoute.name}
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTrafficLevelColor(getTrafficLevel() || 'low')}`}>
                  {getTrafficLevel() === 'low' && '🟢 渋滞少'}
                  {getTrafficLevel() === 'medium' && '🟡 やや混雑'}
                  {getTrafficLevel() === 'high' && '🟠 混雑'}
                  {getTrafficLevel() === 'congested' && '🔴 渋滞'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">距離:</span>
                  <div className="font-medium">{formatDistance(currentRoute.totalDistance)}</div>
                </div>
                <div>
                  <span className="text-gray-600">所要時間:</span>
                  <div className="font-medium">{formatTime(currentRoute.estimatedTimeWithTraffic)}</div>
                </div>
                <div>
                  <span className="text-gray-600">到着予定:</span>
                  <div className="font-medium">{getETA()?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || '--:--'}</div>
                </div>
                <div>
                  <span className="text-gray-600">短縮時間:</span>
                  <div className="font-medium text-green-600">
                    {getTimeSaved() > 0 ? `+${formatTime(getTimeSaved())}` : '基準ルート'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Route Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">ルート選択肢</h3>
            <div className="space-y-3">
              {optimizationResult.routes.map((route) => (
                <div
                  key={route.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    currentRoute?.id === route.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRouteSelect(route.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRouteTypeIcon(route.routeType)}</span>
                      <span className="font-medium">{route.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        route.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                        route.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        信頼度 {Math.round(route.confidence * 100)}%
                      </span>
                    </div>
                    {currentRoute?.id === route.id && (
                      <span className="text-blue-600 text-sm">✓ 選択中</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>距離: {formatDistance(route.totalDistance)}</div>
                    <div>時間: {formatTime(route.estimatedTimeWithTraffic)}</div>
                    <div>遅延率: ×{route.trafficDelayFactor.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Updates */}
          {routeUpdates.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">リアルタイム更新</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {routeUpdates.map((update, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      update.severityLevel === 'critical' ? 'bg-red-50 border border-red-200' :
                      update.severityLevel === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {update.severityLevel === 'critical' ? '🚨' :
                           update.severityLevel === 'warning' ? '⚠️' : 'ℹ️'}
                          {' '}所要時間更新: {formatTime(update.newEstimatedTime)}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {update.updateTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📊 ルート分析</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">予測精度</div>
              <div className="text-xl font-semibold">{Math.round(analytics.averageAccuracy * 100)}%</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">最適化回数</div>
              <div className="text-xl font-semibold">{analytics.totalRoutesOptimized}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">短縮時間</div>
              <div className="text-xl font-semibold text-green-600">{formatTime(analytics.timeSaved)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">効率的時間帯</div>
              <div className="text-xl font-semibold">{analytics.mostEfficientTimeSlots[0]?.hour || '--'}時</div>
            </div>
          </div>

          {/* Efficient Time Slots */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">効率的な時間帯</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {analytics.mostEfficientTimeSlots.map((slot: any, index: number) => (
                <div key={index} className="bg-green-50 rounded p-2 text-sm">
                  <div className="font-medium">{slot.hour}:00-{slot.hour + 1}:00</div>
                  <div className="text-gray-600">
                    {slot.averageSpeed.toFixed(0)}km/h, 信頼度{Math.round(slot.reliability * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOptimizing && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">交通データを取得してルートを最適化中...</span>
        </div>
      )}
    </div>
  );
};