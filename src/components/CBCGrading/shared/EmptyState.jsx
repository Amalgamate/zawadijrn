/**
 * Empty State Component
 * Display when no data is available
 */

import React from 'react';

const EmptyState = ({ 
  icon: Icon,
  iconSize = 48,
  title = 'No Data',
  message = 'No items to display',
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-12 text-center ${className}`}>
      <div className="max-w-md mx-auto">
        {Icon && (
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon size={iconSize} className="text-gray-400" />
          </div>
        )}
        
        <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {actionText && onAction && (
          <button 
            onClick={onAction}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
