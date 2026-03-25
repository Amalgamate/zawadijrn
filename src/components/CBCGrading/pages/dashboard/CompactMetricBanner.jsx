/**
 * Compact Metric Banner Component
 * Display metrics in a horizontal gradient banner to save vertical space
 * Premium styling with hover effects and smooth animations
 */

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const CompactMetricBanner = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            onClick={() => metric.onClick && metric.onClick()}
            className={`group flex items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-purple/40 hover:shadow-md transition-all duration-300 ${metric.onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
          >
            {/* Icon container */}
            <div className="flex-shrink-0 p-2.5 mr-3.5 bg-brand-purple/5 group-hover:bg-brand-purple/10 border border-brand-purple/10 rounded-lg transition-colors duration-300">
              <Icon size={18} className="text-brand-purple opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content Container */}
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">
                {metric.title}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-800 leading-none">
                  {metric.value}
                </span>

                {/* Trend indicator */}
                {metric.trendValue && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${metric.trend === 'up'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                    {metric.trend === 'up' ? <ArrowUp size={8} strokeWidth={3} /> : <ArrowDown size={8} strokeWidth={3} />}
                    {metric.trendValue}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              {metric.subtitle && (
                <p className="text-[9px] text-slate-500 font-semibold mt-1 truncate">
                  {metric.subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CompactMetricBanner;

