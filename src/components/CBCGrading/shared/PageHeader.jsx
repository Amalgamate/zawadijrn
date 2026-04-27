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
    <div className={`surface-panel mb-6 p-6 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="surface-icon-accent">
              <Icon size={22} className="text-brand-purple" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
