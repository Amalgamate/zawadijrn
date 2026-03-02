/**
 * RatingInput Component
 * Standardized rating selector for assessments
 * Handles: visual selection, color coding, descriptions
 */

import React, { useMemo } from 'react';
import { getRatingByValue } from '../../../constants/ratings';
import { getGradeColor, getGradeCSSClass } from '../../../utils/grading/colors';

/**
 * Rating input component with visual feedback
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current rating value
 * @param {Function} props.onChange - Change handler
 * @param {Array} props.options - Available rating options
 * @param {string} props.label - Field label
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.compact - Use compact layout (default: false)
 * @param {string} props.helpText - Help text below input
 * @returns {JSX.Element}
 */
export const RatingInput = ({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Select a rating',
  required = false,
  compact = false,
  helpText = '',
  disabled = false
}) => {
  // Get details for current value
  const currentRatingDetails = useMemo(() => {
    return value ? getRatingByValue(value) : null;
  }, [value]);

  const ratingColor = useMemo(() => {
    return value ? getGradeColor(value) : '#6b7280';
  }, [value]);

  const ratingCSSClass = useMemo(() => {
    return value ? getGradeCSSClass(value) : 'bg-gray-400 text-white';
  }, [value]);

  // Group options by category for better UX
  const groupedOptions = useMemo(() => {
    const groups = {
      'Exceeding': [],
      'Meeting': [],
      'Approaching': [],
      'Below': []
    };

    options.forEach(opt => {
      const details = getRatingByValue(opt.value || opt);
      if (details && details.category) {
        groups[details.category].push(opt);
      }
    });

    return groups;
  }, [options]);

  if (compact) {
    // Compact dropdown view
    return (
      <div>
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ color: value ? ratingColor : '#6b7280' }}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => {
            const optValue = opt.value || opt;
            const optLabel = opt.label || optValue;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>

        {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
      </div>
    );
  }

  // Full button grid view
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {Object.entries(groupedOptions).map(([category, opts]) => (
          opts.length > 0 && (
            <div key={category} className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">{category}</p>
              <div className="flex flex-wrap gap-2">
                {opts.map(opt => {
                  const optValue = opt.value || opt;
                  const optLabel = opt.label || optValue;
                  const details = getRatingByValue(optValue);
                  const isSelected = value === optValue;
                  const color = getGradeColor(optValue);

                  return (
                    <button
                      key={optValue}
                      onClick={() => onChange(optValue)}
                      disabled={disabled}
                      type="button"
                      className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                        isSelected
                          ? `${ratingCSSClass} ring-2 ring-offset-2`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={!isSelected ? { borderLeft: `4px solid ${color}` } : {}}
                      title={details ? details.description : optLabel}
                    >
                      {optLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>

      {currentRatingDetails && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900">{currentRatingDetails.label}</p>
          <p className="text-xs text-blue-700 mt-1">{currentRatingDetails.description}</p>
        </div>
      )}

      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  );
};

export default RatingInput;
