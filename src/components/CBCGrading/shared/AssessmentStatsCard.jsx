/**
 * AssessmentStatsCard Component
 * Reusable statistics display card for assessment metrics
 */

import React from 'react';

/**
 * Stats card for displaying assessment metrics
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Card label/title
 * @param {string|number} props.value - Main value to display
 * @param {string} props.subtitle - Optional subtitle
 * @param {string} props.color - Color theme (green, blue, yellow, red, purple)
 * @param {string} props.icon - Optional icon component or emoji
 * @param {boolean} props.highlight - Highlight the card
 * @returns {JSX.Element}
 */
export const AssessmentStatsCard = ({
  label,
  value,
  subtitle,
  color = 'blue',
  icon = null,
  highlight = false
}) => {
  const colorMap = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'text-green-700',
      value: 'text-green-800'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      label: 'text-blue-700',
      value: 'text-blue-800'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'text-yellow-700',
      value: 'text-yellow-800'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'text-red-700',
      value: 'text-red-800'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      label: 'text-purple-700',
      value: 'text-purple-800'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      label: 'text-gray-700',
      value: 'text-gray-800'
    }
  };

  const colors = colorMap[color] || colorMap.blue;
  const ringClass = highlight ? 'ring-2 ring-offset-2 ring-blue-500' : '';

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg p-4 ${ringClass} transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${colors.label}`}>{label}</p>
          <p className={`text-3xl font-bold ${colors.value} mt-1`}>{value}</p>
          {subtitle && (
            <p className={`text-xs ${colors.label} mt-2 opacity-75`}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-3xl ml-4">
            {typeof icon === 'string' ? icon : icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentStatsCard;
