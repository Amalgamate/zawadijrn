import React from 'react';

const pageTitles = {
  'library-catalog': 'Book Catalog',
  'library-circulation': 'Borrow / Return Tracking',
  'library-fees': 'Late Fee Automation',
  'library-inventory': 'Inventory Reports',
  'library-members': 'Member Management'
};

const pageDescriptions = {
  'library-catalog': 'Manage books, authors, and library holdings across the school.',
  'library-circulation': 'Track loans, returns, renewals, and overdue items.',
  'library-fees': 'Process library fines, payments, and fee balances.',
  'library-inventory': 'View inventory summaries for books and library resources.',
  'library-members': 'Manage library memberships, roles, and access.',
};

const LibraryManager = ({ currentPage }) => {
  const title = pageTitles[currentPage] || 'Library Management';
  const description = pageDescriptions[currentPage] || 'Access the school library management tools and reports.';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm text-slate-600 max-w-2xl">{description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Library Features</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>Book cataloging and copies management</li>
            <li>Library member registration and status tracking</li>
            <li>Loan, return, and renewal processing</li>
            <li>Fine calculation and payment recording</li>
            <li>Library statistics and overdue reporting</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Status</h2>
          <p className="mt-3 text-slate-700">The library management module is now active in the sidebar. Select any library section to begin using the available backend services.</p>
        </div>
      </div>
    </div>
  );
};

export default LibraryManager;
