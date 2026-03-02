import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Check, User, Hash, GraduationCap } from 'lucide-react';

/**
 * SmartLearnerSearch Component
 * 
 * An intelligent, content-aware search component for selecting learners.
 * Searches across name, admission number, and grade.
 * 
 * @param {Array} learners - List of learner objects
 * @param {string} selectedLearnerId - Currently selected learner ID
 * @param {Function} onSelect - Callback when a learner is selected (returns learner ID)
 * @param {string} placeholder - Input placeholder text
 * @param {boolean} disabled - Whether the input is disabled
 * @param {string} className - Additional CSS classes
 */
const SmartLearnerSearch = ({ 
  learners = [], 
  selectedLearnerId, 
  onSelect, 
  placeholder = "Search learner by name, adm no...", 
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Find selected learner object for display
  const selectedLearner = useMemo(() => 
    learners.find(l => l.id === selectedLearnerId), 
    [learners, selectedLearnerId]
  );

  // Initialize search term with selected learner's name on mount/update
  useEffect(() => {
    if (selectedLearner && !isOpen) {
      const admNo = selectedLearner.admissionNumber || selectedLearner.admNo || '';
      setSearchTerm(`${selectedLearner.firstName} ${selectedLearner.lastName} (${admNo})`);
    } else if (!selectedLearner && !isOpen) {
      setSearchTerm('');
    }
  }, [selectedLearner, isOpen]);

  // Filter learners based on search term
  const filteredLearners = useMemo(() => {
    if (!searchTerm) return learners.slice(0, 50); // Return first 50 if no search
    
    // If search term matches the selected learner exactly, return all (or relevant)
    if (selectedLearner) {
       const selectedAdmNo = selectedLearner.admissionNumber || selectedLearner.admNo || '';
       if (searchTerm === `${selectedLearner.firstName} ${selectedLearner.lastName} (${selectedAdmNo})`) {
         return learners.slice(0, 50);
       }
    }

    const lowerTerm = searchTerm.toLowerCase();
    return learners.filter(learner => {
      const fullName = `${learner.firstName} ${learner.lastName}`.toLowerCase();
      const admNo = (learner.admissionNumber || learner.admNo || '').toString().toLowerCase();
      const grade = (learner.grade || '').toString().toLowerCase();
      
      return (
        fullName.includes(lowerTerm) ||
        admNo.includes(lowerTerm) ||
        grade.includes(lowerTerm)
      );
    }).slice(0, 50); // Limit results for performance
  }, [learners, searchTerm, selectedLearner]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search term to selected learner if any, otherwise clear
        if (selectedLearner) {
          const admNo = selectedLearner.admissionNumber || selectedLearner.admNo || '';
          setSearchTerm(`${selectedLearner.firstName} ${selectedLearner.lastName} (${admNo})`);
        } else {
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedLearner]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && listRef.current.children[highlightedIndex]) {
      listRef.current.children[highlightedIndex].scrollIntoView({
        block: 'nearest',
      });
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
    if (e.target.value === '') {
      onSelect('');
    }
  };

  const handleSelect = (learner) => {
    onSelect(learner.id);
    const admNo = learner.admissionNumber || learner.admNo || '';
    setSearchTerm(`${learner.firstName} ${learner.lastName} (${admNo})`);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredLearners.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && filteredLearners[highlightedIndex]) {
          handleSelect(filteredLearners[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        if (selectedLearner) {
          const admNo = selectedLearner.admissionNumber || selectedLearner.admNo || '';
          setSearchTerm(`${selectedLearner.firstName} ${selectedLearner.lastName} (${admNo})`);
        } else {
          setSearchTerm('');
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onSelect('');
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Learner
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className={`w-full pl-10 pr-10 py-2 border-2 ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200`}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        {searchTerm && !disabled && (
          <button
            onClick={clearSelection}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto" ref={listRef}>
          {filteredLearners.length > 0 ? (
            <ul className="py-1">
              {filteredLearners.map((learner, index) => {
                const isSelected = learner.id === selectedLearnerId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={learner.id}
                    onClick={() => handleSelect(learner)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center justify-between
                      ${isHighlighted ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      ${isSelected ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                      `}>
                        {learner.firstName.charAt(0)}{learner.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {learner.firstName} {learner.lastName}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Hash size={12} />
                            {learner.admissionNumber || learner.admNo}
                          </span>
                          {learner.grade && (
                            <span className="flex items-center gap-1">
                              <GraduationCap size={12} />
                              {learner.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No learners found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartLearnerSearch;
