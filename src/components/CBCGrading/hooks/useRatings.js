/**
 * useRatings Hook
 * Consolidates rating state management for assessments
 * Handles: rating selection, validation, batch updates
 */

import { useState, useCallback, useMemo } from 'react';
import { CBC_RATINGS, getRatingByValue } from '../../../constants/ratings';

/**
 * Custom hook for managing assessment ratings
 * 
 * @param {Object} initialRatings - Initial rating values
 * @param {Object} options - Configuration options
 * @param {string} options.defaultRating - Default rating value (default: 'ME1')
 * @returns {Object} Rating state and handlers
 */
export const useRatings = (initialRatings = {}, options = {}) => {
  const { defaultRating = 'ME1' } = options;

  // Rating state
  const [ratings, setRatings] = useState(initialRatings);
  const [comments, setComments] = useState({});

  // Set a single rating
  const setRating = useCallback((key, value) => {
    setRatings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Set multiple ratings at once
  const setRatings_ = useCallback((newRatings) => {
    setRatings(prev => ({
      ...prev,
      ...newRatings
    }));
  }, []);

  // Set comment for a rating
  const setComment = useCallback((key, comment) => {
    setComments(prev => ({
      ...prev,
      [key]: comment
    }));
  }, []);

  // Get rating details
  const getRatingDetails = useCallback((ratingValue) => {
    return getRatingByValue(ratingValue);
  }, []);

  // Get all ratings with their details
  const getRatingsWithDetails = useCallback(() => {
    return Object.entries(ratings).map(([key, value]) => ({
      key,
      value,
      details: getRatingDetails(value),
      comment: comments[key] || ''
    }));
  }, [ratings, comments, getRatingDetails]);

  // Reset ratings
  const resetRatings = useCallback(() => {
    setRatings(initialRatings);
    setComments({});
  }, [initialRatings]);

  // Get rating count by value
  const getRatingCount = useCallback((ratingValue) => {
    return Object.values(ratings).filter(r => r === ratingValue).length;
  }, [ratings]);

  // Get rating distribution (count by category)
  const getRatingDistribution = useCallback(() => {
    const distribution = {
      'Exceeding': 0,
      'Meeting': 0,
      'Approaching': 0,
      'Below': 0
    };

    Object.values(ratings).forEach(ratingValue => {
      const details = getRatingDetails(ratingValue);
      if (details && details.category) {
        distribution[details.category]++;
      }
    });

    return distribution;
  }, [ratings, getRatingDetails]);

  // Check if all ratings are set
  const areAllRatingsSet = useCallback(() => {
    return Object.values(ratings).every(r => r !== null && r !== undefined && r !== '');
  }, [ratings]);

  // Get ratings statistics
  const getStatistics = useMemo(() => {
    const dist = getRatingDistribution();
    const total = Object.values(ratings).length;
    return {
      total,
      filled: Object.values(ratings).filter(r => r).length,
      distribution: dist,
      percentage: total > 0 ? Math.round((Object.values(ratings).filter(r => r).length / total) * 100) : 0
    };
  }, [ratings, getRatingDistribution]);

  return {
    // State
    ratings,
    comments,
    availableRatings: CBC_RATINGS,
    defaultRating,

    // Setters
    setRating,
    setRatings: setRatings_,
    setComment,

    // Utilities
    getRatingDetails,
    getRatingsWithDetails,
    getRatingCount,
    getRatingDistribution,
    resetRatings,
    areAllRatingsSet,
    getStatistics,
    hasComments: Object.values(comments).some(c => c && c.trim().length > 0)
  };
};

export default useRatings;
