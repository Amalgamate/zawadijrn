/**
 * AppGrid — renders apps grouped by category.
 * Delegates all state management to the parent (AppsPage) via props.
 */

import React from 'react';
import AppCard from './AppCard';

const CATEGORY_ORDER = ['Core', 'Academics', 'Finance', 'Communication', 'HR', 'Reports'];

export default function AppGrid({
  appsByCategory,
  categories,
  isSuperAdmin,
  toggling,
  onToggle,
  onSetMandatory,
  onSetVisibility,
}) {
  // Sort categories: known order first, then any extras alphabetically
  const sorted = [
    ...CATEGORY_ORDER.filter(c => categories.includes(c)),
    ...categories.filter(c => !CATEGORY_ORDER.includes(c)).sort(),
  ];

  return (
    <div className="space-y-8">
      {sorted.map(category => (
        <section key={category}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(appsByCategory[category] ?? []).map(app => (
              <AppCard
                key={app.slug}
                app={app}
                isSuperAdmin={isSuperAdmin}
                toggling={toggling}
                onToggle={onToggle}
                onSetMandatory={onSetMandatory}
                onSetVisibility={onSetVisibility}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
