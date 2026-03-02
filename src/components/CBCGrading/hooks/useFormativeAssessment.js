/**
 * useFormativeAssessment Hook
 * Manage formative (continuous) assessment data
 */

import { useState, useCallback, useMemo } from 'react';
import { validateAssessment } from '../utils/validators';
import { calculateStrandPerformance } from '../utils/gradeCalculations';

export const useFormativeAssessment = (initialAssessments = []) => {
  const [formativeAssessments, setFormativeAssessments] = useState(initialAssessments);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loading] = useState(false);
  const [error] = useState(null);

  /**
   * Add a new formative assessment
   * @param {Object} assessmentData - Assessment data
   * @returns {Object} Result with success flag and data/errors
   */
  const addAssessment = useCallback((assessmentData) => {
    // Validate assessment data
    const validation = validateAssessment(assessmentData);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Create new assessment with ID and timestamp
    const newAssessment = {
      ...assessmentData,
      id: Date.now(),
      enteredAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setFormativeAssessments(prev => [...prev, newAssessment]);
    return { success: true, data: newAssessment };
  }, []);

  /**
   * Update an existing assessment
   * @param {number} assessmentId - ID of assessment to update
   * @param {Object} updates - Fields to update
   * @returns {Object} Result with success flag
   */
  const updateAssessment = useCallback((assessmentId, updates) => {
    setFormativeAssessments(prev => 
      prev.map(assessment => 
        assessment.id === assessmentId 
          ? { ...assessment, ...updates, updatedAt: new Date().toISOString() }
          : assessment
      )
    );
    return { success: true };
  }, []);

  /**
   * Delete an assessment
   * @param {number} assessmentId - ID of assessment to delete
   * @returns {Object} Result with success flag
   */
  const deleteAssessment = useCallback((assessmentId) => {
    setFormativeAssessments(prev => prev.filter(assessment => assessment.id !== assessmentId));
    if (selectedAssessment?.id === assessmentId) {
      setSelectedAssessment(null);
    }
    return { success: true };
  }, [selectedAssessment]);

  /**
   * Get assessment by ID
   * @param {number} assessmentId - ID of assessment
   * @returns {Object|null} Assessment object or null
   */
  const getAssessmentById = useCallback((assessmentId) => {
    return formativeAssessments.find(assessment => assessment.id === assessmentId) || null;
  }, [formativeAssessments]);

  /**
   * Get assessments for a specific learner
   * @param {number} learnerId - Learner ID
   * @param {Object} filters - Optional filters (learningArea, term, etc.)
   * @returns {Array} Array of assessments
   */
  const getLearnerAssessments = useCallback((learnerId, filters = {}) => {
    return formativeAssessments.filter(assessment => {
      // Check if learner has a mark in this assessment
      const learnerMark = assessment.marks?.find(mark => mark.learnerId === learnerId);
      if (!learnerMark) return false;

      // Apply filters
      const matchesArea = !filters.learningArea || filters.learningArea === 'all' || 
                         assessment.learningArea === filters.learningArea;
      const matchesTerm = !filters.term || assessment.term === filters.term;
      const matchesGrade = !filters.grade || assessment.grade === filters.grade;

      return matchesArea && matchesTerm && matchesGrade;
    }).map(assessment => ({
      ...assessment,
      learnerMark: assessment.marks.find(mark => mark.learnerId === learnerId)
    }));
  }, [formativeAssessments]);

  /**
   * Get assessments by class
   * @param {string} grade - Grade name
   * @param {string} stream - Stream letter
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of assessments
   */
  const getClassAssessments = useCallback((grade, stream, filters = {}) => {
    return formativeAssessments.filter(assessment => {
      const matchesGrade = assessment.grade === grade;
      const matchesStream = !stream || assessment.stream === stream;
      const matchesArea = !filters.learningArea || filters.learningArea === 'all' || 
                         assessment.learningArea === filters.learningArea;
      const matchesTerm = !filters.term || assessment.term === filters.term;

      return matchesGrade && matchesStream && matchesArea && matchesTerm;
    });
  }, [formativeAssessments]);

  /**
   * Calculate learner's formative average
   * @param {number} learnerId - Learner ID
   * @param {Object} filters - Optional filters (learningArea, term)
   * @returns {number} Average score percentage
   */
  const calculateLearnerAverage = useCallback((learnerId, filters = {}) => {
    const learnerAssessments = getLearnerAssessments(learnerId, filters);
    
    if (learnerAssessments.length === 0) return 0;

    const scores = learnerAssessments.map(assessment => {
      const percentage = (assessment.learnerMark.score / assessment.totalMarks) * 100;
      return percentage;
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [getLearnerAssessments]);

  /**
   * Calculate learner's performance by strand
   * @param {number} learnerId - Learner ID
   * @param {string} learningArea - Learning area name
   * @returns {Object} Performance by strand
   */
  const calculateStrandPerformanceByLearner = useCallback((learnerId, learningArea) => {
    const learnerAssessments = getLearnerAssessments(learnerId, { learningArea });
    
    // Group by strand
    const byStrand = {};
    learnerAssessments.forEach(assessment => {
      if (!byStrand[assessment.strand]) {
        byStrand[assessment.strand] = [];
      }
      const percentage = (assessment.learnerMark.score / assessment.totalMarks) * 100;
      byStrand[assessment.strand].push({ percentage });
    });

    // Calculate stats for each strand
    const strandStats = {};
    Object.entries(byStrand).forEach(([strand, assessments]) => {
      strandStats[strand] = calculateStrandPerformance(assessments);
    });

    return strandStats;
  }, [getLearnerAssessments]);

  /**
   * Get learner's rubric distribution
   * @param {number} learnerId - Learner ID
   * @param {Object} filters - Optional filters
   * @returns {Object} Count of each rubric level
   */
  const getLearnerRubricDistribution = useCallback((learnerId, filters = {}) => {
    const learnerAssessments = getLearnerAssessments(learnerId, filters);
    
    const distribution = { EE: 0, ME: 0, AE: 0, BE: 0, NY: 0 };
    
    learnerAssessments.forEach(assessment => {
      const rubric = assessment.learnerMark.rubric;
      if (distribution.hasOwnProperty(rubric)) {
        distribution[rubric]++;
      }
    });

    return distribution;
  }, [getLearnerAssessments]);

  /**
   * Search assessments
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered assessments
   */
  const searchAssessments = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return formativeAssessments;
    }

    const term = searchTerm.toLowerCase();
    return formativeAssessments.filter(assessment => 
      assessment.learningArea?.toLowerCase().includes(term) ||
      assessment.strand?.toLowerCase().includes(term) ||
      assessment.subStrand?.toLowerCase().includes(term) ||
      assessment.learningOutcome?.toLowerCase().includes(term) ||
      assessment.type?.toLowerCase().includes(term)
    );
  }, [formativeAssessments]);

  /**
   * Filter assessments
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered assessments
   */
  const filterAssessments = useCallback((filters) => {
    return formativeAssessments.filter(assessment => {
      const matchesGrade = !filters.grade || filters.grade === 'all' || assessment.grade === filters.grade;
      const matchesStream = !filters.stream || filters.stream === 'all' || assessment.stream === filters.stream;
      const matchesArea = !filters.learningArea || filters.learningArea === 'all' || 
                         assessment.learningArea === filters.learningArea;
      const matchesTerm = !filters.term || assessment.term === filters.term;
      const matchesType = !filters.type || filters.type === 'all' || assessment.type === filters.type;

      return matchesGrade && matchesStream && matchesArea && matchesTerm && matchesType;
    });
  }, [formativeAssessments]);

  // Computed values
  const totalAssessments = useMemo(() => 
    formativeAssessments.length,
    [formativeAssessments]
  );

  const assessmentsByArea = useMemo(() => {
    const grouped = {};
    formativeAssessments.forEach(assessment => {
      if (!grouped[assessment.learningArea]) {
        grouped[assessment.learningArea] = [];
      }
      grouped[assessment.learningArea].push(assessment);
    });
    return grouped;
  }, [formativeAssessments]);

  const assessmentsByTerm = useMemo(() => {
    const grouped = {};
    formativeAssessments.forEach(assessment => {
      if (!grouped[assessment.term]) {
        grouped[assessment.term] = [];
      }
      grouped[assessment.term].push(assessment);
    });
    return grouped;
  }, [formativeAssessments]);

  return {
    // State
    formativeAssessments,
    selectedAssessment,
    loading,
    error,
    totalAssessments,
    assessmentsByArea,
    assessmentsByTerm,

    // Setters
    setFormativeAssessments,
    setSelectedAssessment,

    // Actions
    addAssessment,
    updateAssessment,
    deleteAssessment,
    getAssessmentById,
    getLearnerAssessments,
    getClassAssessments,
    calculateLearnerAverage,
    calculateStrandPerformanceByLearner,
    getLearnerRubricDistribution,
    searchAssessments,
    filterAssessments
  };
};
