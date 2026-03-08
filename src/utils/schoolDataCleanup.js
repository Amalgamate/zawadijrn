/**
 * School Data Cleanup (Deprecated)
 * Stub utility for data cleanup (not used in current implementation)
 */

export const cleanupSchoolData = async () => {
  return null;
};

export const clearAllSchoolData = () => {
  const keysToRemove = [
    'cbc_current_page',
    'cbc_page_params',
    'cbc_expanded_sections',
    'cbc_last_school_id',
    'currentSchoolId'
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));

  // also specifically remove scroll positions
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('cbc_scroll_')) {
      localStorage.removeItem(key);
    }
  });

  return { cleared: keysToRemove.length, message: 'School data cleared' };
};

export default cleanupSchoolData;
