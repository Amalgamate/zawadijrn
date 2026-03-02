/**
 * Date and Time Helper Functions
 * Utilities for date formatting and manipulation
 */

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format date for HTML5 date input (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string or empty string if invalid
 */
export const toInputDate = (date) => {
  if (!date || date === 'N/A' || date === 'null' || date === 'undefined') return '';

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    // Use ISO string and take the date part
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

/**
 * Format date with day name
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date with weekday
 */
export const formatDateWithDay = (date) => {
  return formatDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time
 * @param {string|Date} date - Date/time to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format datetime
 * @param {string|Date} date - Date/time to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get current time in HH:MM AM/PM format
 * @returns {string} Current time
 */
export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get current datetime in ISO format
 * @returns {string} Current datetime
 */
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

/**
 * Calculate age from date of birth
 * @param {string|Date} dob - Date of birth
 * @returns {number} Age in years
 */
export const calculateAge = (dob) => {
  if (!dob) return 0;

  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;

  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return checkDate.toDateString() === today.toDateString();
};

/**
 * Check if date is in past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in past
 */
export const isPastDate = (date) => {
  if (!date) return false;

  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return checkDate < today;
};

/**
 * Check if date is in future
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in future
 */
export const isFutureDate = (date) => {
  if (!date) return false;

  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return checkDate > today;
};

/**
 * Get academic year from date
 * @param {string|Date} date - Date
 * @returns {string} Academic year (e.g., "2025/2026")
 */
export const getAcademicYear = (date = new Date()) => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const year = checkDate.getFullYear();
  const month = checkDate.getMonth();

  // Academic year starts in January in Kenya
  if (month >= 0 && month < 12) {
    return `${year}`;
  }

  return `${year}`;
};

/**
 * Get term from date
 * @param {string|Date} date - Date
 * @returns {string} Term (Term 1, Term 2, or Term 3)
 */
export const getTermFromDate = (date = new Date()) => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const month = checkDate.getMonth(); // 0-11

  // Term 1: January - April (months 0-3)
  if (month >= 0 && month <= 3) return 'Term 1';

  // Term 2: May - August (months 4-7)
  if (month >= 4 && month <= 7) return 'Term 2';

  // Term 3: September - December (months 8-11)
  return 'Term 3';
};

/**
 * Get school days between two dates (excludes weekends)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of school days
 */
export const getSchoolDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(date);
};

/**
 * Add days to date
 * @param {string|Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const result = typeof date === 'string' ? new Date(date) : new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Subtract days from date
 * @param {string|Date} date - Starting date
 * @param {number} days - Number of days to subtract
 * @returns {Date} New date
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days);
};
