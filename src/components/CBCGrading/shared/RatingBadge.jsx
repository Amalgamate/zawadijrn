/**
 * Rating Badge Component
 * Displays CBC rubric ratings with colors, icons, and points
 */

import React from 'react';

const RatingBadge = ({ 
  detailedRating, 
  points, 
  percentage, 
  showLabel = false,
  size = 'md' 
}) => {
  // Rating configuration
  const ratingConfig = {
    EE1: { 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: '⭐',
      label: 'Outstanding',
      range: '90-100%'
    },
    EE2: { 
      color: 'bg-green-100 text-green-700 border-green-300',
      icon: '⭐',
      label: 'Very High',
      range: '75-89%'
    },
    ME1: { 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: '✅',
      label: 'High Average',
      range: '58-74%'
    },
    ME2: { 
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: '✅',
      label: 'Average',
      range: '41-57%'
    },
    AE1: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '⚠️',
      label: 'Low Average',
      range: '31-40%'
    },
    AE2: { 
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: '⚠️',
      label: 'Below Average',
      range: '21-30%'
    },
    BE1: { 
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '❌',
      label: 'Low',
      range: '11-20%'
    },
    BE2: { 
      color: 'bg-red-100 text-red-700 border-red-300',
      icon: '❌',
      label: 'Very Low',
      range: '1-10%'
    },
    // General ratings (4-level)
    EE: { 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: '⭐',
      label: 'Exceeds Expectations',
      range: '75-100%'
    },
    ME: { 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: '✅',
      label: 'Meets Expectations',
      range: '41-74%'
    },
    AE: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '⚠️',
      label: 'Approaches Expectations',
      range: '21-40%'
    },
    BE: { 
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '❌',
      label: 'Below Expectations',
      range: '1-20%'
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const rating = detailedRating || 'ME2'; // Default if not provided
  const config = ratingConfig[rating] || ratingConfig.ME2;

  return (
    <div className="inline-flex flex-col gap-1">
      {/* Main Badge */}
      <div className={`
        inline-flex items-center gap-2 
        rounded-full border-2
        font-semibold
        ${config.color}
        ${sizeClasses[size]}
      `}>
        <span>{config.icon}</span>
        <span className="font-bold">{rating}</span>
        {points && (
          <span className="text-xs opacity-75">({points} pts)</span>
        )}
        {percentage !== undefined && (
          <span className="text-xs opacity-75">{percentage}%</span>
        )}
      </div>

      {/* Label (optional) */}
      {showLabel && (
        <span className="text-xs text-gray-600 text-center">
          {config.label} {config.range}
        </span>
      )}
    </div>
  );
};

export default RatingBadge;
