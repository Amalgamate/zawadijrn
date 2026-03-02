/**
 * Compact Metric Banner Component
 * Display metrics in a horizontal gradient banner to save vertical space
 * Premium styling with hover effects and smooth animations
 */

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const CompactMetricBanner = ({ metrics, gradientFrom = 'from-brand-purple', gradientVia = 'via-purple-500', gradientTo = 'to-pink-500' }) => {
  return (
    <div className={`bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo} rounded-xl p-6 shadow-lg overflow-hidden relative`}>
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

      {/* Metric items */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              onClick={() => metric.onClick && metric.onClick()}
              className={`group flex flex-col items-start transition-all duration-300 hover:scale-105 ${metric.onClick ? 'cursor-pointer' : ''}`}
            >
              {/* Icon container */}
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 mb-2">
                <Icon size={20} className="text-white group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Metric value */}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black text-white">
                  {metric.value}
                </span>
                {metric.trendValue && (
                  <span className={`flex items-center text-xs font-bold ${metric.trend === 'up'
                      ? 'text-emerald-200'
                      : 'text-rose-200'
                    }`}>
                    {metric.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {metric.trendValue}
                  </span>
                )}
              </div>

              {/* Metric label */}
              <p className="text-xs font-semibold text-white/80 mt-1 uppercase tracking-tight line-clamp-2">
                {metric.title}
              </p>

              {/* Subtitle */}
              {metric.subtitle && (
                <p className="text-[10px] text-white/60 mt-0.5 line-clamp-1">
                  {metric.subtitle}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompactMetricBanner;
