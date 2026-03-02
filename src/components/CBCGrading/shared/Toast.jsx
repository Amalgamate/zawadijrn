/**
 * Toast Notification Component
 * Display temporary notification messages
 */

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ show, message, type = 'success', onClose, duration = 3000 }) => {
  if (!show) return null;

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      icon: CheckCircle,
      ringColor: 'ring-green-500'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      icon: XCircle,
      ringColor: 'ring-red-500'
    },
    warning: {
      bg: 'bg-gradient-to-r from-orange-500 to-amber-600',
      icon: AlertCircle,
      ringColor: 'ring-orange-500'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      icon: Info,
      ringColor: 'ring-blue-500'
    }
  };

  const config = styles[type] || styles.success;
  const Icon = config.icon;

  return (
    <div className={`fixed bottom-6 right-6 max-w-md px-6 py-4 rounded-xl shadow-2xl transition ${config.bg} text-white z-50 animate-slide-up ring-4 ${config.ringColor} ring-opacity-50`}>
      <div className="flex items-start gap-3">
        <Icon size={24} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-medium text-sm leading-relaxed">{message}</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 hover:opacity-80 transition text-white text-xl leading-none flex-shrink-0"
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
