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
    const validation = validateAssessment(assessmentData);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

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
      const learnerMark = assessment.marks?.find(mark => mark.learnerId === learnerId);
      if (!learnerMark) return false;

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
      return (assessment.learnerMark.score / assessment.totalMarks) * 100;
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

    const byStrand = {};
    learnerAssessments.forEach(assessment => {
      if (!byStrand[assessment.strand]) {
        byStrand[assessment.strand] = [];
      }
      const percentage = (assessment.learnerMark.score / assessment.totalMarks) * 100;
      byStrand[assessment.strand].push({ percentage });
    });

    const strandStats = {};
    Object.entries(byStrand).forEach(([strand, assessments]) => {
      strandStats[strand] = calculateStrandPerformance(assessments);
    });

    return strandStats;
  }, [getLearnerAssessments]);

  /**
   * Get learner's rubric distribution across all 8 detailed levels.
   *
   * The rubric stored per-mark is the detailed 8-level code (detailedRating).
   * A 4-level summary rollup is also returned for convenience.
   *
   * @param {number} learnerId - Learner ID
   * @param {Object} filters - Optional filters
   * @returns {{ detailed: Object, summary: Object }}
   */
  const getLearnerRubricDistribution = useCallback((learnerId, filters = {}) => {
    const learnerAssessments = getLearnerAssessments(learnerId, filters);

    const detailed = { EE1: 0, EE2: 0, ME1: 0, ME2: 0, AE1: 0, AE2: 0, BE1: 0, BE2: 0 };
    const summary  = { EE: 0, ME: 0, AE: 0, BE: 0 };

    const parentOf = (code) => {
      if (!code) return null;
      if (code.startsWith('EE')) return 'EE';
      if (code.startsWith('ME')) return 'ME';
      if (code.startsWith('AE')) return 'AE';
      if (code.startsWith('BE')) return 'BE';
      return null;
    };

    learnerAssessments.forEach(assessment => {
      // Prefer detailedRating; fall back to rubric for legacy records
      const code = assessment.learnerMark.detailedRating || assessment.learnerMark.rubric;
      if (!code) return;

      if (Object.prototype.hasOwnProperty.call(detailed, code)) {
        detailed[code]++;
      }

      const parent = parentOf(code);
      if (parent) summary[parent]++;
    });

    return { detailed, summary };
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
