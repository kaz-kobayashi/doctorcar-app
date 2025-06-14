import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common';
import { useGeolocation } from '@/hooks/useGeolocation';

interface LocationTrackerProps {
  className?: string;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({
  className = '',
  onLocationUpdate
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const { location, error, loading, getCurrentPosition } = useGeolocation({
    watch: isTracking,
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  });

  useEffect(() => {
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  }, [location, onLocationUpdate]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const refreshLocation = () => {
    getCurrentPosition();
  };

  const formatCoordinate = (value: number) => {
    return value.toFixed(6);
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('ja-JP');
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-sm font-medium text-gray-900">現在地追跡</h4>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={refreshLocation}
            disabled={loading}
          >
            更新
          </Button>
          <Button
            size="sm"
            variant={isTracking ? "danger" : "primary"}
            onClick={toggleTracking}
          >
            {isTracking ? '停止' : '開始'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-600 mb-2">
          位置情報を取得中...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 mb-2">
          エラー: {error}
        </div>
      )}

      {location && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">緯度:</span>
              <div className="font-mono">{formatCoordinate(location.latitude)}</div>
            </div>
            <div>
              <span className="text-gray-600">経度:</span>
              <div className="font-mono">{formatCoordinate(location.longitude)}</div>
            </div>
          </div>
          
          {location.accuracy && (
            <div className="text-xs text-gray-500">
              精度: ±{Math.round(location.accuracy)}m
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            最終更新: {formatTime()}
          </div>
          
          {isTracking && (
            <div className="flex items-center text-xs text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
              追跡中
            </div>
          )}
        </div>
      )}

      {!location && !loading && !error && (
        <div className="text-sm text-gray-500 text-center py-4">
          位置情報を取得してください
        </div>
      )}
    </div>
  );
};