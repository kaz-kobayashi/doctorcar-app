import React from 'react';
import { ElevatorInfo } from '@/types/buildingInfo';

interface ElevatorInfoCardProps {
  elevator: ElevatorInfo;
}

export const ElevatorInfoCard: React.FC<ElevatorInfoCardProps> = ({ elevator }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'working':
        return 'text-green-600 bg-green-50';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-50';
      case 'unknown':
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'working':
        return '稼働中';
      case 'maintenance':
        return 'メンテナンス中';
      case 'unknown':
      default:
        return '状況不明';
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
          <div className="font-medium text-gray-900">{elevator.location}</div>
          <div className="text-gray-600 mt-1">
            定員: {elevator.capacity}人 | 最大: {elevator.maxWeight}kg
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {elevator.isAccessible && (
            <div className="flex items-center text-blue-600">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>車椅子対応</span>
            </div>
          )}
          
          {elevator.status && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(elevator.status)}`}>
              {getStatusText(elevator.status)}
            </span>
          )}
        </div>
      </div>
      
      <div className="text-gray-600">
        <span className="font-medium">停止階:</span> {formatFloors(elevator.floors)}
      </div>
    </div>
  );
};