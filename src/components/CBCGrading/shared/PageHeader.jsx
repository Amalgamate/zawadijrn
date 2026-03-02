/**
 * Page Header Component
 * Reusable page title and action area
 */

import React from 'react';

const PageHeader = ({ 
  title,
  subtitle,
  icon: Icon,
  actions,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Icon size={24} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
