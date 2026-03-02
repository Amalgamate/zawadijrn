/**
 * Search Filter Component
 * Combined search and filter controls
 */

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

const SearchFilter = ({ 
  searchValue,
  onSearchChange,
  filters = [],
  onReset,
  placeholder = 'Search...',
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Search Input */}
        <div className="md:col-span-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter, index) => (
          <div key={index} className={`md:col-span-${filter.span || 2}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {filter.label}
            </label>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {filter.options.map((option, optIndex) => (
                <option key={optIndex} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Reset Button */}
        {onReset && (
          <div className="md:col-span-2">
            <button
              onClick={onReset}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
