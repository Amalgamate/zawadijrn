/**
 * Academic Terms Constants
 * Single source of truth for term definitions across the application
 */

export const TERMS = [
  { value: 'TERM_1', label: 'Term 1' },
  { value: 'TERM_2', label: 'Term 2' },
  { value: 'TERM_3', label: 'Term 3' }
];

export const TERM_VALUES = {
  TERM_1: 'TERM_1',
  TERM_2: 'TERM_2',
  TERM_3: 'TERM_3'
};

/**
 * Get term label by value
 * @param {string} value - Term value (e.g., 'TERM_1')
 * @returns {string} Term label (e.g., 'Term 1')
 */
export const getTermLabel = (value) => {
  const term = TERMS.find(t => t.value === value);
  return term ? term.label : value;
};

/**
 * Get all term values
 * @returns {string[]} Array of term values
 */
export const getTermValues = () => TERMS.map(t => t.value);

/**
 * Get all term labels
 * @returns {string[]} Array of term labels
 */
export const getTermLabels = () => TERMS.map(t => t.label);

export default TERMS;
