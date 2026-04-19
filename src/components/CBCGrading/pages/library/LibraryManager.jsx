import React, { lazy } from 'react';

const BookCatalog       = lazy(() => import('./BookCatalog'));
const CirculationDesk   = lazy(() => import('./CirculationDesk'));
const LateFeeAutomation = lazy(() => import('./LateFeeAutomation'));
const InventoryReports  = lazy(() => import('./InventoryReports'));
const MemberManagement  = lazy(() => import('./MemberManagement'));

const Placeholder = ({ title, description }) => (
  <div className="p-6 space-y-6">
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm text-slate-500">{description}</p>
    </div>
    <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-2xl p-8 text-center">
      <p className="text-sm text-brand-purple/60 font-medium">This section is being built — coming soon.</p>
    </div>
  </div>
);

const LibraryManager = ({ currentPage }) => {
  switch (currentPage) {
    case 'library-catalog':
      return <BookCatalog />;
    case 'library-circulation':
      return <CirculationDesk />;
    case 'library-fees':
      return <LateFeeAutomation />;
    case 'library-inventory':
      return <InventoryReports />;
    case 'library-members':
      return <MemberManagement />;
    default:
      return <Placeholder title="Library Management" description="Select a section from the menu above." />;
  }
};

export default LibraryManager;
