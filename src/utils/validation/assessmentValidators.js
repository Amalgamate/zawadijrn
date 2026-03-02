/**
 * Assessment Validators
 * Centralized validation rules for all assessment types
 * Single source of truth for assessment validation logic
 */

/**
 * Validate assessment setup
 * @param {Object} data - Assessment data
 * @param {string} data.grade - Selected grade
 * @param {string} data.stream - Selected stream
 * @param {string} data.term - Selected term
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateAssessmentSetup = (data) => {
  const errors = [];

  if (!data.grade || !data.grade.trim()) {
    errors.push({
      field: 'grade',
      message: 'Grade is required'
    });
  }

  if (!data.stream || !data.stream.trim()) {
    errors.push({
      field: 'stream',
      message: 'Stream is required'
    });
  }

  if (!data.term || !data.term.trim()) {
    errors.push({
      field: 'term',
      message: 'Term is required'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate learner selection
 * @param {string} learnerId - Selected learner ID
 * @param {Object} learner - Learner object
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateLearnerSelection = (learnerId, learner) => {
  const errors = [];

  if (!learnerId || !learnerId.trim()) {
    errors.push({
      field: 'learner',
      message: 'Learner must be selected'
    });
    return { isValid: false, errors };
  }

  if (!learner) {
    errors.push({
      field: 'learner',
      message: 'Selected learner not found'
    });
    return { isValid: false, errors };
  }

  if (learner.status !== 'ACTIVE' && learner.status !== 'Active') {
    errors.push({
      field: 'learner',
      message: 'Can only assess active learners'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate ratings submission
 * @param {Object} ratings - Ratings object { key: value }
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateRatingsSubmission = (ratings) => {
  const errors = [];

  if (!ratings || Object.keys(ratings).length === 0) {
    errors.push({
      field: 'ratings',
      message: 'No ratings provided'
    });
    return { isValid: false, errors };
  }

  const emptyRatings = Object.entries(ratings)
    .filter(([, value]) => !value || value.trim() === '')
    .map(([key]) => key);

  if (emptyRatings.length > 0) {
    errors.push({
      field: 'ratings',
      message: `Missing ratings for: ${emptyRatings.join(', ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    emptyFields: emptyRatings
  };
};

/**
 * Validate formative assessment
 * @param {Object} data - Assessment data
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateFormativeAssessment = (data) => {
  const errors = [];

  // Setup validation
  const setupValidation = validateAssessmentSetup(data);
  if (!setupValidation.isValid) {
    errors.push(...setupValidation.errors);
  }

  // Learner validation
  if (!data.learnerId || !data.learnerId.trim()) {
    errors.push({
      field: 'learner',
      message: 'Learner selection is required'
    });
  }

  // Assessment title
  if (!data.assessmentTitle || !data.assessmentTitle.trim()) {
    errors.push({
      field: 'assessmentTitle',
      message: 'Assessment title is required'
    });
  }

  // Learning area
  if (!data.learningArea || !data.learningArea.trim()) {
    errors.push({
      field: 'learningArea',
      message: 'Learning area is required'
    });
  }

  // Ratings
  const ratingsValidation = validateRatingsSubmission(data.ratings || {});
  if (!ratingsValidation.isValid) {
    errors.push(...ratingsValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate summative test
 * @param {Object} data - Test data
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateSummativeTest = (data) => {
  const errors = [];

  if (!data.title || !data.title.trim()) {
    errors.push({
      field: 'title',
      message: 'Test title is required'
    });
  }

  if (!data.grade || !data.grade.trim()) {
    errors.push({
      field: 'grade',
      message: 'Grade is required'
    });
  }

  if (!data.term || !data.term.trim()) {
    errors.push({
      field: 'term',
      message: 'Term is required'
    });
  }

  if (!data.totalMarks || data.totalMarks <= 0) {
    errors.push({
      field: 'totalMarks',
      message: 'Total marks must be greater than 0'
    });
  }

  if (data.passMarks && data.passMarks < 0) {
    errors.push({
      field: 'passMarks',
      message: 'Pass marks cannot be negative'
    });
  }

  if (data.passMarks && data.passMarks > data.totalMarks) {
    errors.push({
      field: 'passMarks',
      message: 'Pass marks cannot exceed total marks'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate test results
 * @param {Object} results - Results object { learnerId: marks }
 * @param {number} totalMarks - Total marks for the test
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateTestResults = (results, totalMarks) => {
  const errors = [];

  if (!results || Object.keys(results).length === 0) {
    errors.push({
      field: 'results',
      message: 'No results provided'
    });
    return { isValid: false, errors };
  }

  const invalidResults = [];
  Object.entries(results).forEach(([learnerId, marks]) => {
    if (marks === null || marks === undefined || marks === '') {
      return; // Skip empty entries
    }

    const marksNum = Number(marks);
    if (isNaN(marksNum)) {
      invalidResults.push(`Invalid marks for learner ${learnerId}`);
    } else if (marksNum < 0) {
      invalidResults.push(`Negative marks for learner ${learnerId}`);
    } else if (marksNum > totalMarks) {
      invalidResults.push(`Marks exceed total (${marksNum}/${totalMarks})`);
    }
  });

  if (invalidResults.length > 0) {
    errors.push({
      field: 'results',
      message: `Invalid results: ${invalidResults.join('; ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    invalidResults
  };
};

/**
 * Validate competencies assessment
 * @param {Object} data - Assessment data
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateCompetenciesAssessment = (data) => {
  const errors = [];

  // Setup validation
  const setupValidation = validateAssessmentSetup(data);
  if (!setupValidation.isValid) {
    errors.push(...setupValidation.errors);
  }

  // Learner validation
  if (!data.learnerId || !data.learnerId.trim()) {
    errors.push({
      field: 'learner',
      message: 'Learner selection is required'
    });
  }

  // Ratings validation
  const competencies = data.competencies || {};
  const requiredCompetencies = [
    'communication',
    'criticalThinking',
    'creativity',
    'collaboration',
    'citizenship',
    'learningToLearn'
  ];

  const missingRatings = requiredCompetencies.filter(
    comp => !competencies[comp] || competencies[comp].trim() === ''
  );

  if (missingRatings.length > 0) {
    errors.push({
      field: 'competencies',
      message: `Missing ratings for: ${missingRatings.join(', ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate values assessment
 * @param {Object} data - Assessment data
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateValuesAssessment = (data) => {
  const errors = [];

  // Setup validation
  const setupValidation = validateAssessmentSetup(data);
  if (!setupValidation.isValid) {
    errors.push(...setupValidation.errors);
  }

  // Learner validation
  if (!data.learnerId || !data.learnerId.trim()) {
    errors.push({
      field: 'learner',
      message: 'Learner selection is required'
    });
  }

  // Ratings validation
  const values = data.values || {};
  const requiredValues = ['love', 'responsibility', 'respect', 'unity', 'peace', 'patriotism', 'integrity'];

  const missingRatings = requiredValues.filter(
    val => !values[val] || values[val].trim() === ''
  );

  if (missingRatings.length > 0) {
    errors.push({
      field: 'values',
      message: `Missing ratings for: ${missingRatings.join(', ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generic validator for any assessment
 * @param {Object} data - Assessment data
 * @param {string} type - Assessment type (formative, summative, competencies, values)
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateAssessment = (data, type = 'formative') => {
  const validators = {
    formative: validateFormativeAssessment,
    summative: validateSummativeTest,
    competencies: validateCompetenciesAssessment,
    values: validateValuesAssessment
  };

  const validator = validators[type];
  if (!validator) {
    return {
      isValid: false,
      errors: [{ field: 'type', message: `Unknown assessment type: ${type}` }]
    };
  }

  return validator(data);
};

/**
 * Format validation errors for display
 * @param {Array} errors - Error array
 * @returns {string} Formatted error message
 */
export const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return '';
  }

  return errors.map(err => err.message || err).join('\n');
};

export default {
  validateAssessmentSetup,
  validateLearnerSelection,
  validateRatingsSubmission,
  validateFormativeAssessment,
  validateSummativeTest,
  validateTestResults,
  validateCompetenciesAssessment,
  validateValuesAssessment,
  validateAssessment,
  formatValidationErrors
};
