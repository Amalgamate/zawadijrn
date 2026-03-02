/**
 * Stats Card Component
 * Display statistics in a card
 */

import React from 'react';

const StatsCard = ({ 
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  className = ''
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const gradient = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-md hover:shadow-lg transition ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && <Icon size={32} className="opacity-90" />}
        <span className="text-4xl font-bold">{value}</span>
      </div>
      
      <div>
        <p className="text-white text-opacity-90 font-semibold">{title}</p>
        {subtitle && (
          <p className="text-white text-opacity-75 text-sm mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className="text-white text-opacity-90 text-xs mt-2 font-medium">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
