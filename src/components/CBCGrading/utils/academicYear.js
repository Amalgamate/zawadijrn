/**
 * Academic Year Utilities
 * Helper functions for managing academic year
 */

/**
 * Get current academic year based on date
 * Kenya CBC academic year typically runs January - December (calendar year)
 * 
 * @returns {number} Current academic year
 */
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  
  // For Kenya CBC: Academic year = Calendar year
  // Year starts in January and ends in December
  return year;
};

/**
 * Get academic year options for dropdown
 * Returns current year and 2 years on either side
 * 
 * @returns {Array} Array of year objects with value and label
 */
export const getAcademicYearOptions = () => {
  const currentYear = getCurrentAcademicYear();
  const years = [];
  for (let i = -10; i <= 10; i++) {
    const year = currentYear + i;
    years.push({
      value: year,
      label: year.toString()
    });
  }
  
  return years;
};

/**
 * Format academic year for display
 * 
 * @param {number} year - Academic year
 * @returns {string} Formatted year string
 */
export const formatAcademicYear = (year) => {
  return year?.toString() || 'N/A';
};

/**
 * Validate academic year
 * 
 * @param {number} year - Year to validate
 * @returns {boolean} True if valid
 */
export const isValidAcademicYear = (year) => {
  if (!year || typeof year !== 'number') return false;
  
  const currentYear = getCurrentAcademicYear();
  // Valid range: current year ± 10 years
  return year >= (currentYear - 10) && year <= (currentYear + 10);
};

const academicYearConfig = {
  getCurrentAcademicYear,
  getAcademicYearOptions,
  formatAcademicYear,
  isValidAcademicYear
};
export default academicYearConfig;
