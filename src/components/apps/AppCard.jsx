/**
 * AppCard — single app tile with a toggle switch.
 *
 * States:
 *  - Active     : green toggle, full opacity
 *  - Inactive   : grey toggle, dimmed
 *  - Mandatory  : lock icon, toggle disabled (school admin cannot change)
 *  - Super admin: also sees the mandatory + visibility controls
 */

import React from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AppCard({
  app,
  isSuperAdmin,
  toggling,
  onToggle,
  onSetMandatory,
  onSetVisibility,
}) {
  const {
    slug,
    name,
    description,
    icon,
    isActive,
    isMandatory,
    isVisible,
  } = app;

  const isToggling  = toggling[slug] ?? false;
  const canToggle   = isSuperAdmin || !isMandatory;

  const handleToggle = () => {
    if (!canToggle || isToggling) return;
    onToggle(slug);
  };

  return (
    <div
      className={`
        relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200
        ${isActive
          ? 'border-purple-200 bg-white shadow-sm'
          : 'border-gray-100 bg-gray-50 opacity-70'}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        {/* Icon + name */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0 leading-none">{icon || '📦'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm leading-tight truncate">{name}</p>
            {isMandatory && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium mt-0.5">
                <Lock size={10} />
                Mandatory
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`${isActive ? 'Disable' : 'Enable'} ${name}`}
          disabled={!canToggle || isToggling}
          onClick={handleToggle}
          className={`
            relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none
            focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
            ${isActive ? 'bg-purple-600' : 'bg-gray-300'}
            ${(!canToggle || isToggling) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `}
        >
          {isToggling ? (
            <Loader2
              size={12}
              className="absolute inset-0 m-auto animate-spin text-white"
            />
          ) : (
            <span
              className={`
                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                ${isActive ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          )}
        </button>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{description}</p>
      )}

      {/* Super admin controls */}
      {isSuperAdmin && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          {/* Mandatory lock toggle */}
          <button
            type="button"
            onClick={() => onSetMandatory(slug, !isMandatory)}
            title={isMandatory ? 'Unlock (allow school admin to toggle)' : 'Lock as mandatory'}
            className={`
              inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors
              ${isMandatory
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
            `}
          >
            <Lock size={11} />
            {isMandatory ? 'Mandatory' : 'Lock'}
          </button>

          {/* Visibility toggle */}
          <button
            type="button"
            onClick={() => onSetVisibility(slug, !isVisible)}
            title={isVisible ? 'Hide from school admin' : 'Show to school admin'}
            className={`
              inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors
              ${!isVisible
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
            `}
          >
            {isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
            {isVisible ? 'Visible' : 'Hidden'}
          </button>
        </div>
      )}
    </div>
  );
}
