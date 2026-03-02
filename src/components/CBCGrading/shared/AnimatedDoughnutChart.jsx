/**
 * AnimatedDoughnutChart Component
 * Animated circular progress chart with percentage display
 */

import React, { useEffect, useState } from 'react';

const AnimatedDoughnutChart = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 10,
  color = '#3b82f6',
  label = '',
  sublabel = ''
}) => {
  const [progress, setProgress] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    // Animate the progress
    const timer = setTimeout(() => {
      if (progress < percentage) {
        setProgress(prev => Math.min(prev + 1, percentage));
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [progress, percentage]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{progress}%</span>
        </div>
      </div>
      
      {/* Labels */}
      {label && (
        <div className="mt-2 text-center">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        </div>
      )}
    </div>
  );
};

export default AnimatedDoughnutChart;
