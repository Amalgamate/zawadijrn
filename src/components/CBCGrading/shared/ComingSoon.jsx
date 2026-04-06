/**
 * ComingSoon.jsx
 * Generic placeholder for Secondary & Tertiary modules that are not yet built.
 * Accepts optional `title` and `description` props so every nav item can have
 * its own label while sharing one component.
 */

import React from 'react';
import { Clock, Rocket } from 'lucide-react';

const ComingSoon = ({
  title = 'Coming Soon',
  description = 'This module is currently under development and will be available in a future update.',
  badge = null,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Outer card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-10 text-center max-w-md w-full">

        {/* Icon ring */}
        <div className="w-20 h-20 rounded-full bg-[var(--brand-purple)]/10 flex items-center justify-center mx-auto mb-6">
          <Rocket size={36} className="text-[var(--brand-purple)]" />
        </div>

        {/* Optional badge (e.g. "Secondary" / "Tertiary") */}
        {badge && (
          <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[var(--brand-purple)]/10 text-[var(--brand-purple)]">
            {badge}
          </span>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>

        <p className="text-gray-500 text-sm leading-relaxed mb-8">{description}</p>

        {/* ETA note */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Clock size={14} />
          <span>Check back in the next release</span>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
