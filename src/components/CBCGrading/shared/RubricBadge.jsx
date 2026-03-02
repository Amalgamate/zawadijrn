/**
 * Rubric Badge Component
 * Display CBC performance level badges
 */

import React from 'react';
import { performanceScale } from '../utils/performanceScale';

const RubricBadge = ({ level, percentage, showPercentage = true, className = '' }) => {
  if (!level) return null;

  const rubric = performanceScale.find(scale => scale.level === level);
  if (!rubric) return null;

  return (
    <span 
      className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${className}`}
      style={{ 
        backgroundColor: rubric.bgColor,
        color: rubric.color 
      }}
    >
      <span>{rubric.level}</span>
      {showPercentage && percentage !== undefined && (
        <span>({percentage}%)</span>
      )}
    </span>
  );
};

export default RubricBadge;
