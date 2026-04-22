import React from 'react';
import { Construction } from 'lucide-react';

const LMSPlaceholder = ({ title, description }) => {
  return (
    <div className="flex-1 p-6 flex items-center justify-center bg-gray-50/50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-brand-purple/10 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction size={40} />
        </div>
        <h1 className="text-2xl font-medium text-gray-800 mb-3">{title}</h1>
        <p className="text-gray-500 mb-8">
          {description || "This module is currently under active development. Check back soon for exciting new features!"}
        </p>
        <button className="bg-brand-purple text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-800 transition-colors">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default LMSPlaceholder;
