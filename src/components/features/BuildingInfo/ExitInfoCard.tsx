import React from 'react';
import { ExitInfo } from '@/types/buildingInfo';

interface ExitInfoCardProps {
  exit: ExitInfo;
}

export const ExitInfoCard: React.FC<ExitInfoCardProps> = ({ exit }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'main':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      case 'emergency':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'service':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
        );
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'main':
        return 'メイン出入口';
      case 'emergency':
        return '非常口';
      case 'service':
        return 'サービス出入口';
      default:
        return '出入口';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'main':
        return 'text-blue-600 bg-blue-50';
      case 'emergency':
        return 'text-red-600 bg-red-50';
      case 'service':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFloor = (floor: number): string => {
    if (floor === 0) return 'G階';
    if (floor < 0) return `B${Math.abs(floor)}階`;
    return `${floor}階`;
  };

  return (
    <div className="bg-gray-50 rounded p-3 text-xs">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <div className="font-medium text-gray-900">{exit.name}</div>
            {exit.isAccessible && (
              <div className="flex items-center text-blue-600">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>バリアフリー</span>
              </div>
            )}
          </div>
          
          <div className="text-gray-600">
            {formatFloor(exit.floor)} | {exit.direction}
          </div>
        </div>
        
        <div className={`flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeColor(exit.type)}`}>
          {getTypeIcon(exit.type)}
          <span className="ml-1">{getTypeText(exit.type)}</span>
        </div>
      </div>
      
      {exit.nearbyLandmarks && exit.nearbyLandmarks.length > 0 && (
        <div className="mt-2 p-2 bg-green-50 rounded">
          <div className="text-green-700">
            <span className="font-medium">近くの目印:</span> {exit.nearbyLandmarks.join(', ')}
          </div>
        </div>
      )}
      
      {exit.type === 'emergency' && (
        <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
          <div className="flex items-center text-xs">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            緊急時専用出入口
          </div>
        </div>
      )}
      
      {exit.type === 'main' && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
          <div className="flex items-center text-xs">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            患者搬送推奨ルート
          </div>
        </div>
      )}
    </div>
  );
};