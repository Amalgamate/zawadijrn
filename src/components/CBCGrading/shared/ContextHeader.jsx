/**
 * ContextHeader Component
 * Reusable header for selecting assessment context
 * Displays: Grade, Stream, Term dropdowns in a compact header
 */

import React from 'react';
import { Filter } from 'lucide-react';

/**
 * Compact context selection header
 * 
 * @param {Object} props - Component props
 * @param {string} props.selectedGrade - Current grade value
 * @param {Function} props.onGradeChange - Grade change handler
 * @param {Array} props.availableGrades - List of available grades
 * @param {string} props.selectedStream - Current stream value
 * @param {Function} props.onStreamChange - Stream change handler
 * @param {Array} props.availableStreams - List of available streams (optional)
 * @param {string} props.selectedTerm - Current term value
 * @param {Function} props.onTermChange - Term change handler
 * @param {Array} props.availableTerms - List of available terms
 * @param {string} props.title - Header title
 * @param {boolean} props.compact - Use compact layout (default: false)
 * @returns {JSX.Element}
 */
export const ContextHeader = ({
  selectedGrade,
  onGradeChange,
  availableGrades = [],
  selectedStream = '',
  onStreamChange,
  availableStreams = ['A', 'B', 'C'],
  selectedTerm,
  onTermChange,
  availableTerms = [],
  title = 'Assessment Context',
  compact = false
}) => {
  const gridClass = compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-4';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-blue-600" />
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>

      <div className={`grid ${gridClass} gap-4`}>
        {/* Grade Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Grade
          </label>
          <select
            value={selectedGrade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">-- Select Grade --</option>
            {availableGrades.map(grade => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        {/* Stream Selection */}
        {selectedStream !== undefined && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stream
            </label>
            <select
              value={selectedStream}
              onChange={(e) => onStreamChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">-- Select Stream --</option>
              {availableStreams.map(stream => (
                <option key={stream} value={stream}>
                  Stream {stream}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Term Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => onTermChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">-- Select Term --</option>
            {availableTerms.map(term => (
              <option key={term.value} value={term.value}>
                {term.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ContextHeader;
