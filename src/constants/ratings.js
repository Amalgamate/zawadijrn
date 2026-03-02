/**
 * CBC Assessment Ratings Constants
 * Single source of truth for all rating scales across the application
 */

/**
 * 8-Level CBC Ratings Scale
 * Used for Formative, Summative, Competencies, and Values assessments
 */
export const CBC_RATINGS = [
  {
    value: 'EE1',
    label: 'EE1 - Outstanding (90-100%)',
    description: 'The learner has achieved the learning outcome perfectly and can apply the skill/content in novel situations',
    category: 'Exceeding',
    color: 'green',
    mark: 90,
    score: 8,
    range: [90, 100],
    hexColor: '#059669'
  },
  {
    value: 'EE2',
    label: 'EE2 - Very High (75-89%)',
    description: 'The learner has achieved the learning outcome very well and can apply the skill/content in most situations',
    category: 'Exceeding',
    color: 'green',
    mark: 75,
    score: 7,
    range: [75, 89],
    hexColor: '#10b981'
  },
  {
    value: 'ME1',
    label: 'ME1 - High Average (58-74%)',
    description: 'The learner has achieved the learning outcome and can apply the skill/content in most situations with some support',
    category: 'Meeting',
    color: 'blue',
    mark: 58,
    score: 6,
    range: [58, 74],
    hexColor: '#2563eb'
  },
  {
    value: 'ME2',
    label: 'ME2 - Average (41-57%)',
    description: 'The learner has achieved the learning outcome and can apply the skill/content in familiar situations with support',
    category: 'Meeting',
    color: 'blue',
    mark: 41,
    score: 5,
    range: [41, 57],
    hexColor: '#60a5fa'
  },
  {
    value: 'AE1',
    label: 'AE1 - Low Average (31-40%)',
    description: 'The learner has partially achieved the learning outcome and is beginning to apply the skill/content in familiar situations',
    category: 'Approaching',
    color: 'yellow',
    mark: 31,
    score: 4,
    range: [31, 40],
    hexColor: '#ca8a04'
  },
  {
    value: 'AE2',
    label: 'AE2 - Below Average (21-30%)',
    description: 'The learner has partially achieved the learning outcome and requires considerable support to apply the skill/content',
    category: 'Approaching',
    color: 'yellow',
    mark: 21,
    score: 3,
    range: [21, 30],
    hexColor: '#eab308'
  },
  {
    value: 'BE1',
    label: 'BE1 - Low (11-20%)',
    description: 'The learner has not achieved the learning outcome and requires substantial support to demonstrate the skill/content',
    category: 'Below',
    color: 'red',
    mark: 11,
    score: 2,
    range: [11, 20],
    hexColor: '#ea580c'
  },
  {
    value: 'BE2',
    label: 'BE2 - Very Low (1-10%)',
    description: 'The learner has not achieved the learning outcome and demonstrates minimal understanding of the skill/content',
    category: 'Below',
    color: 'red',
    mark: 1,
    score: 1,
    range: [1, 10],
    hexColor: '#f97316'
  }
];

/**
 * Short form ratings mapping
 */
export const SHORT_RATINGS = {
  'EE': CBC_RATINGS[0],
  'EE1': CBC_RATINGS[0],
  'EE2': CBC_RATINGS[1],
  'ME': CBC_RATINGS[2],
  'ME1': CBC_RATINGS[2],
  'ME2': CBC_RATINGS[3],
  'AE': CBC_RATINGS[4],
  'AE1': CBC_RATINGS[4],
  'AE2': CBC_RATINGS[5],
  'BE': CBC_RATINGS[6],
  'BE1': CBC_RATINGS[6],
  'BE2': CBC_RATINGS[7],
  'NY': CBC_RATINGS[7] // "Not Yet" maps to BE2
};

/**
 * Get rating by value
 * @param {string} value - Rating value (e.g., 'EE1')
 * @returns {Object|null} Rating object or null if not found
 */
export const getRatingByValue = (value) => {
  return CBC_RATINGS.find(r => r.value === value) || SHORT_RATINGS[value] || null;
};

/**
 * Get rating color by value
 * @param {string} value - Rating value
 * @returns {string} Hex color code
 */
export const getRatingColor = (value) => {
  const rating = getRatingByValue(value);
  return rating ? rating.hexColor : '#6b7280'; // Default gray
};

/**
 * Get rating category (Exceeding, Meeting, Approaching, Below)
 * @param {string} value - Rating value
 * @returns {string} Category name
 */
export const getRatingCategory = (value) => {
  const rating = getRatingByValue(value);
  return rating ? rating.category : 'Unknown';
};

/**
 * Get all rating values
 * @returns {string[]} Array of rating values
 */
export const getRatingValues = () => CBC_RATINGS.map(r => r.value);

/**
 * Get ratings by category
 * @param {string} category - Category (e.g., 'Exceeding')
 * @returns {Object[]} Ratings in that category
 */
export const getRatingsByCategory = (category) => {
  return CBC_RATINGS.filter(r => r.category === category);
};

export default CBC_RATINGS;
