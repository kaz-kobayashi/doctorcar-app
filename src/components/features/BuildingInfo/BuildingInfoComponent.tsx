import React, { useState, useEffect } from 'react';
import { GeoPoint } from 'firebase/firestore';
import { buildingInfoService } from '@/services/buildingInfoService';
import { BuildingInfoResponse } from '@/types/buildingInfo';
import { LoadingSpinner } from '@/components/common';
import { ElevatorInfoCard } from './ElevatorInfoCard';
import { StaircaseInfoCard } from './StaircaseInfoCard';
import { ExitInfoCard } from './ExitInfoCard';
import { AccessibilityBadge } from './AccessibilityBadge';

interface BuildingInfoComponentProps {
  location: GeoPoint;
  className?: string;
}

export const BuildingInfoComponent: React.FC<BuildingInfoComponentProps> = ({
  location,
  className = ''
}) => {
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadBuildingInfo();
  }, [location]);

  const loadBuildingInfo = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await buildingInfoService.getBuildingInfoByLocation(location, {
        radius: 200 // 200メートル以内で検索
      });
      
      setBuildingInfo(response);
    } catch (err) {
      console.error('Failed to load building info:', err);
      setError('建物情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600">建物情報を取得中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">建物情報</h4>
        </div>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!buildingInfo?.building) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">建物情報</h4>
        </div>
        <div className="text-sm text-gray-500">
          現場周辺に建物情報が見つかりませんでした
        </div>
      </div>
    );
  }

  const building = buildingInfo.building;

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900">{building.name}</h4>
            <AccessibilityBadge accessibility={building.accessibility} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {building.address}
          </div>
          {buildingInfo.distance && (
            <div className="text-xs text-gray-500">
              現場から{formatDistance(buildingInfo.distance)} 
              <span className={`ml-1 ${getConfidenceColor(buildingInfo.confidence)}`}>
                (信頼度: {Math.round(buildingInfo.confidence * 100)}%)
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg 
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 基本情報 */}
      <div className="grid grid-cols-2 gap-4 text-xs mb-4">
        <div>
          <span className="text-gray-500">建物種別:</span>
          <div className="font-medium">
            {building.type === 'office' && 'オフィスビル'}
            {building.type === 'hospital' && '病院'}
            {building.type === 'station' && '駅'}
            {building.type === 'shopping' && '商業施設'}
            {building.type === 'residential' && '住宅'}
            {building.type === 'school' && '学校'}
            {building.type === 'other' && 'その他'}
          </div>
        </div>
        <div>
          <span className="text-gray-500">階層:</span>
          <div className="font-medium">
            {building.basement ? `B${building.basement}F-` : ''}{building.floors}F
          </div>
        </div>
      </div>

      {/* 緊急時連絡先 */}
      {building.emergencyContact && (
        <div className="mb-4 p-2 bg-red-50 rounded text-xs">
          <span className="text-red-600 font-medium">緊急時連絡先:</span>
          <div className="text-red-800 font-mono">{building.emergencyContact}</div>
        </div>
      )}

      {/* 詳細情報（展開時のみ） */}
      {isExpanded && (
        <div className="space-y-4 border-t pt-4">
          {/* エレベーター情報 */}
          {building.elevators.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 mb-2">エレベーター</h5>
              <div className="space-y-2">
                {building.elevators.map((elevator) => (
                  <ElevatorInfoCard key={elevator.id} elevator={elevator} />
                ))}
              </div>
            </div>
          )}

          {/* 階段情報 */}
          {building.staircases.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 mb-2">階段・エスカレーター</h5>
              <div className="space-y-2">
                {building.staircases.map((staircase) => (
                  <StaircaseInfoCard key={staircase.id} staircase={staircase} />
                ))}
              </div>
            </div>
          )}

          {/* 出口情報 */}
          {building.exits.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-800 mb-2">出入口</h5>
              <div className="space-y-2">
                {building.exits.map((exit) => (
                  <ExitInfoCard key={exit.id} exit={exit} />
                ))}
              </div>
            </div>
          )}

          {/* 最終更新日 */}
          {building.lastUpdated && (
            <div className="text-xs text-gray-400 pt-2 border-t">
              最終更新: {building.lastUpdated.toLocaleDateString('ja-JP')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};