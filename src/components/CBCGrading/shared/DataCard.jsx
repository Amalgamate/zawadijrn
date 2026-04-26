import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * DataCard Component
 * A premium, mobile-first card for displaying list items.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Leading icon or avatar
 * @param {string} props.title - Primary text
 * @param {string} props.subtitle - Secondary text
 * @param {React.ReactNode} props.badges - Array of badges or status components
 * @param {React.ReactNode} props.actions - Action buttons (circular icons)
 * @param {Object} props.stats - Key-value pairs for quick metrics
 * @param {Function} props.onClick - Card click handler
 * @param {string} props.className - Additional classes
 */
const DataCard = ({
  icon,
  title,
  subtitle,
  badges,
  actions,
  stats,
  onClick,
  className
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white p-5 rounded-[2rem] border-2 border-gray-100 transition-all active:scale-[0.98] cursor-pointer",
        "shadow-lg shadow-gray-200/20 hover:border-brand-purple/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Leading Icon/Avatar */}
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Indicators */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {badges}
          {!actions && onClick && <ChevronRight size={18} className="text-gray-300" />}
        </div>
      </div>

      {/* Stats Row */}
      {stats && Object.keys(stats).length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
          {Object.entries(stats).map(([label, value]) => (
            <div key={label} className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
              <span className="text-xs font-semibold text-gray-700 truncate">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Actions Row */}
      {actions && (
        <div className="mt-5 flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default DataCard;
