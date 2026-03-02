/**
 * Loading Spinner Component
 * Display loading state
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'medium',
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  const spinnerSize = {
    small: 16,
    medium: 32,
    large: 48
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <RefreshCw 
        size={spinnerSize[size]} 
        className="text-blue-600 animate-spin" 
      />
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
