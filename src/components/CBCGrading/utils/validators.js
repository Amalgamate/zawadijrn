/**
 * Validation Utilities
 * All validation functions for form inputs and data
 */

/**
 * Validate score input
 * @param {number|string} score - Score to validate
 * @param {number} maxScore - Maximum allowed score
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateScore = (score, maxScore = 100) => {
  const numScore = Number(score);
  
  if (score === '' || score === null || score === undefined) {
    return { valid: false, error: 'Score is required' };
  }
  
  if (isNaN(numScore)) {
    return { valid: false, error: 'Score must be a number' };
  }
  
  if (numScore < 0) {
    return { valid: false, error: 'Score cannot be negative' };
  }
  
  if (numScore > maxScore) {
    return { valid: false, error: `Score cannot exceed ${maxScore}` };
  }
  
  return { valid: true, value: numScore };
};

/**
 * Validate student/learner data
 * @param {Object} learner - Learner data object
 * @returns {Object} Validation result
 */
export const validateLearnerData = (learner) => {
  const errors = [];
  
  if (!learner.firstName || learner.firstName.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!learner.lastName || learner.lastName.trim() === '') {
    errors.push('Last name is required');
  }
  
  if (!learner.admNo || learner.admNo.trim() === '') {
    errors.push('Admission number is required');
  }
  
  if (!learner.grade) {
    errors.push('Grade level is required');
  }
  
  if (!learner.stream) {
    errors.push('Stream is required');
  }
  
  if (!learner.gender) {
    errors.push('Gender is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate teacher data
 * @param {Object} teacher - Teacher data object
 * @returns {Object} Validation result
 */
export const validateTeacherData = (teacher) => {
  const errors = [];
  
  if (!teacher.firstName || teacher.firstName.trim() === '') {
    errors.push('First name is required');
  }
  
  if (!teacher.lastName || teacher.lastName.trim() === '') {
    errors.push('Last name is required');
  }
  
  if (!teacher.employeeNo || teacher.employeeNo.trim() === '') {
    errors.push('Employee number is required');
  }
  
  if (!teacher.email || !validateEmail(teacher.email)) {
    errors.push('Valid email is required');
  }
  
  if (!teacher.phone || teacher.phone.trim() === '') {
    errors.push('Phone number is required');
  }
  
  if (!teacher.tscNumber || teacher.tscNumber.trim() === '') {
    errors.push('TSC number is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate parent/guardian data
 * @param {Object} parent - Parent data object
 * @returns {Object} Validation result
 */
export const validateParentData = (parent) => {
  const errors = [];
  
  if (!parent.name || parent.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!parent.phone || parent.phone.trim() === '') {
    errors.push('Phone number is required');
  }
  
  if (!parent.idNumber || parent.idNumber.trim() === '') {
    errors.push('ID number is required');
  }
  
  if (!parent.relationship) {
    errors.push('Relationship is required');
  }
  
  if (parent.email && !validateEmail(parent.email)) {
    errors.push('Valid email format required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Kenyan format)
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  // Accepts formats: +254712345678, 0712345678, 712345678
  const phoneRegex = /^(\+254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate ID number (Kenyan national ID)
 * @param {string} idNumber - ID number
 * @returns {boolean} True if valid
 */
export const validateIdNumber = (idNumber) => {
  if (!idNumber) return false;
  // Kenyan ID is typically 7-8 digits
  const idRegex = /^\d{7,8}$/;
  return idRegex.test(idNumber);
};

/**
 * Validate date is not in future
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {boolean} True if valid
 */
export const validatePastDate = (date) => {
  if (!date) return false;
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate <= today;
};

/**
 * Validate date is in future
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {boolean} True if valid
 */
export const validateFutureDate = (date) => {
  if (!date) return false;
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
};

/**
 * Validate assessment data
 * @param {Object} assessment - Assessment data
 * @returns {Object} Validation result
 */
export const validateAssessment = (assessment) => {
  const errors = [];
  
  if (!assessment.grade) {
    errors.push('Grade is required');
  }
  
  if (!assessment.stream) {
    errors.push('Stream is required');
  }
  
  if (!assessment.learningArea) {
    errors.push('Learning area is required');
  }
  
  if (!assessment.strand) {
    errors.push('Strand is required');
  }
  
  if (!assessment.subStrand) {
    errors.push('Sub-strand is required');
  }
  
  if (!assessment.learningOutcome) {
    errors.push('Learning outcome is required');
  }
  
  if (!assessment.date) {
    errors.push('Assessment date is required');
  }
  
  if (!assessment.totalMarks || assessment.totalMarks <= 0) {
    errors.push('Valid total marks is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate test/exam data
 * @param {Object} test - Test data
 * @returns {Object} Validation result
 */
export const validateTestData = (test) => {
  const errors = [];
  
  if (!test.name || test.name.trim() === '') {
    errors.push('Test name is required');
  }
  
  if (!test.grade) {
    errors.push('Grade is required');
  }
  
  if (!test.learningArea) {
    errors.push('Learning area is required');
  }
  
  if (!test.date) {
    errors.push('Test date is required');
  }
  
  if (!test.totalMarks || test.totalMarks <= 0) {
    errors.push('Valid total marks is required');
  }
  
  if (!test.passMarks || test.passMarks < 0) {
    errors.push('Valid pass marks is required');
  }
  
  if (test.passMarks > test.totalMarks) {
    errors.push('Pass marks cannot exceed total marks');
  }
  
  // Validate sections add up to total
  if (test.sections && test.sections.length > 0) {
    const sectionTotal = test.sections.reduce((sum, s) => sum + (s.marks || 0), 0);
    if (sectionTotal !== test.totalMarks) {
      errors.push(`Section marks (${sectionTotal}) must equal total marks (${test.totalMarks})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate required field
 * @param {any} value - Value to check
 * @param {string} fieldName - Name of field for error message
 * @returns {Object} Validation result
 */
export const validateRequired = (value, fieldName = 'This field') => {
  const isEmpty = value === null || 
                  value === undefined || 
                  value === '' || 
                  (typeof value === 'string' && value.trim() === '');
  
  return {
    valid: !isEmpty,
    error: isEmpty ? `${fieldName} is required` : null
  };
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export const validateNumberRange = (value, min, max, fieldName = 'Value') => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  
  if (num < min) {
    return { valid: false, error: `${fieldName} cannot be less than ${min}` };
  }
  
  if (num > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max}` };
  }
  
  return { valid: true, value: num };
};
