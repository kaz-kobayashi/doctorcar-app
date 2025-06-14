import React from 'react';
import { AccessibilityInfo } from '@/types/buildingInfo';

interface AccessibilityBadgeProps {
  accessibility: AccessibilityInfo;
  className?: string;
}

export const AccessibilityBadge: React.FC<AccessibilityBadgeProps> = ({ 
  accessibility, 
  className = '' 
}) => {
  const getAccessibilityScore = (): number => {
    let score = 0;
    if (accessibility.wheelchairAccessible) score++;
    if (accessibility.elevatorToAllFloors) score++;
    if (accessibility.accessibleParking) score++;
    if (accessibility.accessibleRestrooms) score++;
    if (accessibility.guidanceForVisuallyImpaired) score++;
    return score;
  };

  const score = getAccessibilityScore();
  const maxScore = 5;

  const getBadgeColor = (): string => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 0.4) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getBadgeText = (): string => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return 'バリアフリー対応';
    if (percentage >= 0.6) return '一部バリアフリー';
    if (percentage >= 0.4) return '限定的対応';
    return '要注意';
  };

  const getIcon = (): JSX.Element => {
    if (accessibility.wheelchairAccessible) {
      return (
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor()} ${className}`}>
      {getIcon()}
      <span className="ml-1">{getBadgeText()}</span>
      <span className="ml-1 opacity-75">({score}/{maxScore})</span>
    </div>
  );
};