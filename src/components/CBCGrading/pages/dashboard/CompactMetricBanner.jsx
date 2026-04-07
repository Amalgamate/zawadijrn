/**
 * Compact Metric Banner Component
 * Display metrics in a horizontal gradient banner to save vertical space
 * Premium styling with hover effects and smooth animations
 */

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const getThemeStyles = (theme, index) => {
  const themes = ['primary', 'info', 'warning', 'success'];
  const activeTheme = theme || themes[index % themes.length];

  const palettes = {
    primary: {
      card: 'bg-[var(--brand-purple)] text-white border border-white/10',
      iconBox: 'bg-white/10 border border-white/20',
      icon: 'text-white/90',
      title: 'text-white/70',
      value: 'text-white',
      trendUp: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      trendDown: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      subtitle: 'text-white/60'
    },
    info: {
      card: 'bg-[var(--brand-teal)] text-white border border-white/10',
      iconBox: 'bg-white/10 border border-white/20',
      icon: 'text-white/90',
      title: 'text-white/70',
      value: 'text-white',
      trendUp: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      trendDown: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      subtitle: 'text-white/60'
    },
    warning: {
      card: 'bg-rose-600 text-white border border-white/10',
      iconBox: 'bg-white/10 border border-white/20',
      icon: 'text-white/90',
      title: 'text-white/70',
      value: 'text-white',
      trendUp: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      trendDown: 'bg-rose-900/40 text-rose-200 border border-rose-900/50',
      subtitle: 'text-white/60'
    },
    success: {
      card: 'bg-emerald-600 text-white border border-white/10',
      iconBox: 'bg-white/10 border border-white/20',
      icon: 'text-white/90',
      title: 'text-white/70',
      value: 'text-white',
      trendUp: 'bg-emerald-900/40 text-emerald-200 border border-emerald-900/50',
      trendDown: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      subtitle: 'text-white/60'
    }
  };

  return palettes[activeTheme] || palettes.primary;
};

const CompactMetricBanner = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const styles = getThemeStyles(metric.colorTheme, index);
        
        return (
          <div
            key={index}
            onClick={() => metric.onClick && metric.onClick()}
            className={`group relative overflow-hidden flex items-center p-4 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300 ${styles.card} ${metric.onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)]' : ''}`}
          >
            {/* Background Glow FX */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
            
            {/* Icon container */}
            <div className={`flex-shrink-0 p-3 mr-4 rounded-xl transition-colors duration-300 flex items-center justify-center ${styles.iconBox}`}>
              <Icon size={20} className={`${styles.icon} opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-300 transform`} />
            </div>

            {/* Content Container */}
            <div className="flex flex-col flex-1 min-w-0 z-10">
              <p className={`text-[11px] font-black uppercase tracking-widest leading-none mb-2 truncate ${styles.title}`}>
                {metric.title}
              </p>

              <div className="flex items-center gap-2 mb-1">
                <span className={`text-2xl font-black leading-none ${styles.value}`}>
                  {metric.value}
                </span>

                {/* Trend indicator */}
                {metric.trendValue && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${metric.trend === 'up' ? styles.trendUp : styles.trendDown}`}>
                    {metric.trend === 'up' ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
                    {metric.trendValue}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              {metric.subtitle && (
                <div className={`text-[10px] font-semibold truncate ${styles.subtitle}`}>
                  {metric.subtitle}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CompactMetricBanner;

