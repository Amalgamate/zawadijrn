/**
 * Grading Colors Utility
 * Centralized color mapping for grade display across the application
 * Single source of truth for grade-to-color mappings
 */

/**
 * Color palette for grades
 */
export const GRADE_COLORS = {
  // Exceeding Expectations
  EE1: '#059669',  // Dark Green
  EE2: '#10b981',  // Light Green
  EE: '#22c55e',   // Default Green

  // Meeting Expectations
  ME1: '#2563eb',  // Dark Blue
  ME2: '#60a5fa',  // Light Blue
  ME: '#3b82f6',   // Default Blue

  // Approaching Expectations
  AE1: '#ca8a04',  // Dark Yellow
  AE2: '#eab308',  // Light Yellow
  AE: '#fbbf24',   // Default Yellow

  // Below Expectations
  BE1: '#ea580c',  // Dark Orange
  BE2: '#f97316',  // Light Orange
  BE: '#fb923c',   // Default Orange

  // Not Yet
  NY: '#dc2626',   // Red
  NY1: '#dc2626',  // Dark Red
  NY2: '#ef4444',  // Light Red

  // Legacy mappings
  EX: '#22c55e',   // Excellent (Green)
  VG: '#3b82f6',   // Very Good (Blue)
  G: '#fbbf24',    // Good (Yellow)
  F: '#f97316',    // Fair (Orange)
  P: '#dc2626'     // Poor (Red)
};

/**
 * Get color for a grade
 * Handles multiple grade formats and normalizes to hex color
 * 
 * @param {string|number} grade - Grade value (e.g., 'EE1', 'ME2', 'Exceeding', etc.)
 * @returns {string} Hex color code
 * 
 * @example
 * getGradeColor('EE1') // '#059669'
 * getGradeColor('EXCEEDING EXPECTATIONS 1') // '#059669'
 * getGradeColor('A') // '#22c55e'
 */
export const getGradeColor = (grade) => {
  if (!grade) return '#6b7280'; // Default gray

  const gradeUpper = String(grade).toUpperCase().trim();

  // Try exact match first
  if (GRADE_COLORS[gradeUpper]) {
    return GRADE_COLORS[gradeUpper];
  }

  // Pattern matching for full descriptive grades
  if (gradeUpper.includes('EXCEED')) {
    if (gradeUpper.includes('1')) return GRADE_COLORS.EE1;
    if (gradeUpper.includes('2')) return GRADE_COLORS.EE2;
    return GRADE_COLORS.EE;
  }

  if (gradeUpper.includes('MEET')) {
    if (gradeUpper.includes('1')) return GRADE_COLORS.ME1;
    if (gradeUpper.includes('2')) return GRADE_COLORS.ME2;
    return GRADE_COLORS.ME;
  }

  if (gradeUpper.includes('APPROACH')) {
    if (gradeUpper.includes('1')) return GRADE_COLORS.AE1;
    if (gradeUpper.includes('2')) return GRADE_COLORS.AE2;
    return GRADE_COLORS.AE;
  }

  if (gradeUpper.includes('BELOW')) {
    if (gradeUpper.includes('1')) return GRADE_COLORS.BE1;
    if (gradeUpper.includes('2')) return GRADE_COLORS.BE2;
    return GRADE_COLORS.BE;
  }

  if (gradeUpper.includes('NOT') || gradeUpper.includes('NY')) {
    return GRADE_COLORS.NY;
  }

  // Fallback for unknown grades
  return '#6b7280'; // Default gray
};

/**
 * Get grade description based on color/grade
 * @param {string} grade - Grade value
 * @returns {string} Description of the grade
 */
export const getGradeDescription = (grade) => {
  const gradeUpper = String(grade).toUpperCase().trim();

  const descriptions = {
    'EE1': 'Exceeding Expectations 1 - Outstanding',
    'EE2': 'Exceeding Expectations 2 - Very High',
    'EE': 'Exceeding Expectations',
    'ME1': 'Meeting Expectations 1 - High Average',
    'ME2': 'Meeting Expectations 2 - Average',
    'ME': 'Meeting Expectations',
    'AE1': 'Approaching Expectations 1 - Low Average',
    'AE2': 'Approaching Expectations 2 - Below Average',
    'AE': 'Approaching Expectations',
    'BE1': 'Below Expectations 1 - Low',
    'BE2': 'Below Expectations 2 - Very Low',
    'BE': 'Below Expectations',
    'NY': 'Not Yet',
    'EX': 'Excellent',
    'VG': 'Very Good',
    'G': 'Good',
    'F': 'Fair',
    'P': 'Poor'
  };

  return descriptions[gradeUpper] || grade;
};

/**
 * Get CSS class for grade styling (for Tailwind CSS)
 * @param {string} grade - Grade value
 * @returns {string} CSS class string
 */
export const getGradeCSSClass = (grade) => {
  const gradeUpper = String(grade).toUpperCase().trim();

  const classMap = {
    'EE1': 'bg-green-900 text-white',
    'EE2': 'bg-green-600 text-white',
    'EE': 'bg-green-500 text-white',
    'ME1': 'bg-blue-700 text-white',
    'ME2': 'bg-blue-500 text-white',
    'ME': 'bg-blue-400 text-white',
    'AE1': 'bg-yellow-700 text-black',
    'AE2': 'bg-yellow-500 text-black',
    'AE': 'bg-yellow-400 text-black',
    'BE1': 'bg-orange-700 text-white',
    'BE2': 'bg-orange-600 text-white',
    'BE': 'bg-orange-500 text-white',
    'NY': 'bg-red-600 text-white'
  };

  return classMap[gradeUpper] || 'bg-gray-400 text-white';
};


const gradeUtils = {
  getGradeColor,
  getGradeDescription,
  getGradeCSSClass,
  GRADE_COLORS
};

export default gradeUtils;

