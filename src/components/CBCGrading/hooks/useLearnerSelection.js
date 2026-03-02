/**
 * useLearnerSelection Hook
 * Consolidates learner filtering and selection logic
 * Handles: filtering by grade/stream/status, search, selection
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for learner selection and filtering
 * 
 * @param {Array} learners - Full list of learners
 * @param {Object} filters - Filter criteria
 * @param {string} filters.grade - Grade to filter by
 * @param {string} filters.stream - Stream to filter by
 * @param {string} filters.status - Status to filter by (default: 'ACTIVE')
 * @returns {Object} Filtered learners, selection state, and handlers
 */
export const useLearnerSelection = (
  learners = [],
  filters = {}
) => {
  const {
    grade = '',
    stream = '',
    status = ['ACTIVE', 'Active']
  } = filters;

  // Selection state
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter learners based on criteria
  const filteredLearners = useMemo(() => {
    if (!Array.isArray(learners)) return [];

    let filtered = learners;

    // Filter by status
    if (status.length > 0) {
      filtered = filtered.filter(l => {
        const learnerStatus = Array.isArray(status) ? status : [status];
        return learnerStatus.includes(l.status);
      });
    }

    // Filter by grade
    if (grade) {
      filtered = filtered.filter(l => l.grade === grade);
    }

    // Filter by stream
    if (stream) {
      filtered = filtered.filter(l => l.stream === stream);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        const admNo = (l.admissionNumber || l.admNo || '').toLowerCase();
        return fullName.includes(query) || admNo.includes(query);
      });
    }

    return filtered;
  }, [learners, grade, stream, status, searchQuery]);

  // Get selected learner object
  const selectedLearner = useMemo(() => {
    return filteredLearners.find(l => l.id === selectedLearnerId);
  }, [filteredLearners, selectedLearnerId]);

  // Select learner
  const selectLearner = useCallback((learnerId) => {
    setSelectedLearnerId(learnerId);
  }, []);

  // Search learners
  const search = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedLearnerId('');
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Get learner by ID
  const getLearnerById = useCallback((id) => {
    return learners.find(l => l.id === id);
  }, [learners]);

  return {
    // State
    selectedLearnerId,
    selectedLearner,
    searchQuery,
    filteredLearners,

    // Setters
    selectLearner,
    setSelectedLearnerId,
    search,
    setSearchQuery,

    // Utilities
    clearSelection,
    clearSearch,
    getLearnerById,
    count: filteredLearners.length,
    isSelected: !!selectedLearnerId
  };
};

export default useLearnerSelection;
