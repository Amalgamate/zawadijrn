/**
 * Status Badge Component
 * Display colored status badges
 */

import React from 'react';
import { getStatusColor } from '../utils/constants';

const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const colorClass = getStatusColor(status);

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass} ${className}`}>
      {status === 'DROPPED_OUT' ? 'Archived' : status}
    </span>
  );
};

export default StatusBadge;
