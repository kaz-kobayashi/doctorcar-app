import React from 'react';
import { StaircaseInfo } from '@/types/buildingInfo';

interface StaircaseInfoCardProps {
  staircase: StaircaseInfo;
}

export const StaircaseInfoCard: React.FC<StaircaseInfoCardProps> = ({ staircase }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'escalator':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        );
      case 'emergency':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'escalator':
        return 'エスカレーター';
      case 'emergency':
        return '非常階段';
      default:
        return '一般階段';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'escalator':
        return 'text-blue-600';
      case 'emergency':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getWidthText = (width: string) => {
    switch (width) {
      case 'narrow':
        return '狭い';
      case 'wide':
        return '広い';
      default:
        return '標準';
    }
  };

  const getWidthColor = (width: string) => {
    switch (width) {
      case 'narrow':
        return 'text-red-600';
      case 'wide':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFloors = (floors: number[]): string => {
    const sorted = [...floors].sort((a, b) => a - b);
    const groups: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        if (start === end) {
          groups.push(start === 0 ? 'G' : start < 0 ? `B${Math.abs(start)}` : `${start}`);
        } else {
          const startStr = start === 0 ? 'G' : start < 0 ? `B${Math.abs(start)}` : `${start}`;
          const endStr = end === 0 ? 'G' : end < 0 ? `B${Math.abs(end)}` : `${end}`;
          groups.push(`${startStr}-${endStr}`);
        }
        start = sorted[i];
        end = sorted[i];
      }
    }

    if (start === end) {
      groups.push(start === 0 ? 'G' : start < 0 ? `B${Math.abs(start)}` : `${start}`);
    } else {
      const startStr = start === 0 ? 'G' : start < 0 ? `B${Math.abs(start)}` : `${start}`;
      const endStr = end === 0 ? 'G' : end < 0 ? `B${Math.abs(end)}` : `${end}`;
      groups.push(`${startStr}-${endStr}`);
    }

    return groups.join(', ') + 'F';
  };

  return (
    <div className="bg-gray-50 rounded p-3 text-xs">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{staircase.location}</div>
          <div className="text-gray-600 mt-1">
            接続階: {formatFloors(staircase.floors)}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center ${getTypeColor(staircase.type)}`}>
            {getTypeIcon(staircase.type)}
            <span className="ml-1">{getTypeText(staircase.type)}</span>
          </div>
          
          <div className={`${getWidthColor(staircase.width)}`}>
            幅: {getWidthText(staircase.width)}
          </div>
        </div>
      </div>
      
      {staircase.type === 'emergency' && (
        <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
          <div className="flex items-center text-xs">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            緊急時専用
          </div>
        </div>
      )}
      
      {staircase.type === 'escalator' && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
          <div className="flex items-center text-xs">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            ストレッチャー移送時は利用不可
          </div>
        </div>
      )}
    </div>
  );
};