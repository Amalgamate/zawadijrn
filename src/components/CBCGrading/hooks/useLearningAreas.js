/**
 * useLearningAreas Hook
 * Provides intelligent learning areas selection based on grade
 * Automatically filters and updates learning areas when grade changes
 */

import { useState, useCallback, useMemo } from 'react';
import {
  getLearningAreasByGrade,
  getGroupedLearningAreas,
  isValidLearningAreaForGrade
} from '../../../constants/learningAreas';

/**
 * Custom hook for managing learning areas selection
 * Handles dynamic learning area filtering based on selected grade
 * 
 * @param {string} selectedGrade - Currently selected grade
 * @param {Object} options - Configuration options
 * @param {boolean} options.grouped - Return grouped learning areas (default: false)
 * @returns {Object} Learning areas state and handlers
 */
export const useLearningAreas = (selectedGrade = '', options = {}) => {
  const { grouped = false } = options;

  // Selected learning area state
  const [selectedLearningArea, setSelectedLearningArea] = useState('');

  // Get available learning areas for the selected grade
  const availableLearningAreas = useMemo(() => {
    if (!selectedGrade) return [];

    if (grouped) {
      return getGroupedLearningAreas(selectedGrade);
    }

    return getLearningAreasByGrade(selectedGrade);
  }, [selectedGrade, grouped]);

  // Get available learning areas as flat array (even if grouped)
  const flatLearningAreas = useMemo(() => {
    if (!selectedGrade) return [];
    return getLearningAreasByGrade(selectedGrade);
  }, [selectedGrade]);

  // Reset learning area when grade changes
  const handleGradeChange = useCallback((newGrade) => {
    // Clear previous selection to force new selection
    setSelectedLearningArea('');
  }, []);

  // Select learning area
  const selectLearningArea = useCallback((area) => {
    // Validate if the area is valid for current grade
    if (selectedGrade && !isValidLearningAreaForGrade(selectedGrade, area)) {
      console.warn(`Learning area "${area}" is not valid for grade "${selectedGrade}"`);
      return;
    }
    setSelectedLearningArea(area);
  }, [selectedGrade]);

  // Get flat list of areas for dropdown/list displays
  const getAreasForDisplay = useCallback(() => {
    return flatLearningAreas;
  }, [flatLearningAreas]);

  // Get grouped areas for organized display
  const getGroupedAreasForDisplay = useCallback(() => {
    return getGroupedLearningAreas(selectedGrade || '');
  }, [selectedGrade]);

  // Check if learning area is selected
  const isAreaSelected = useCallback(() => {
    return selectedLearningArea !== '';
  }, [selectedLearningArea]);

  // Get the selected learning area object (with metadata if available)
  const getSelectedAreaInfo = useCallback(() => {
    if (!selectedLearningArea) return null;

    return {
      area: selectedLearningArea,
      grade: selectedGrade,
      isValid: isValidLearningAreaForGrade(selectedGrade, selectedLearningArea)
    };
  }, [selectedLearningArea, selectedGrade]);

  // Filter another list by compatible learning areas
  const filterByLearningArea = useCallback((items, areaField = 'learningArea') => {
    if (!selectedLearningArea) return items;

    const normalizedSelected = selectedLearningArea.toLowerCase().trim();

    return items.filter(item => {
      const value = item[areaField];
      if (!value) return false;
      return String(value).toLowerCase().trim() === normalizedSelected;
    });
  }, [selectedLearningArea]);

  return {
    // State
    selectedLearningArea,
    availableLearningAreas,
    flatLearningAreas,

    // Setters
    selectLearningArea,
    setSelectedLearningArea,
    handleGradeChange,

    // Utilities
    getAreasForDisplay,
    getGroupedAreasForDisplay,
    isAreaSelected,
    getSelectedAreaInfo,
    filterByLearningArea,
    hasAreas: flatLearningAreas.length > 0,
    areaCount: flatLearningAreas.length
  };
};

export default useLearningAreas;
