/**
 * CBC Performance Level Scale (Rubric System)
 * 
 * The Competency-Based Curriculum (CBC) uses a 5-level rubric system 
 * to assess learner performance across all learning areas.
 */

export const performanceScale = [
  {
    level: 'EE',
    name: 'Exceeding Expectations',
    scoreRange: { min: 90, max: 100 },
    color: '#22c55e',
    bgColor: '#dcfce7',
    description: 'Consistently demonstrates mastery beyond grade level',
    indicators: [
      'Solves problems independently with advanced strategies',
      'Makes connections across different strands',
      'Explains reasoning clearly and accurately',
      'Applies concepts to new situations',
      'Shows creativity and critical thinking'
    ]
  },
  {
    level: 'ME',
    name: 'Meeting Expectations',
    scoreRange: { min: 75, max: 89 },
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Demonstrates grade-level competencies with minimal support',
    indicators: [
      'Understands key concepts',
      'Applies learned skills correctly',
      'Works with some independence',
      'Shows consistent performance',
      'Completes tasks as expected'
    ]
  },
  {
    level: 'AE',
    name: 'Approaching Expectations',
    scoreRange: { min: 50, max: 74 },
    color: '#eab308',
    bgColor: '#fef9c3',
    description: 'Developing competencies, needs support',
    indicators: [
      'Grasps basic concepts with help',
      'Requires scaffolding for tasks',
      'Shows inconsistent performance',
      'Needs more practice',
      'Benefits from additional support'
    ]
  },
  {
    level: 'BE',
    name: 'Below Expectations',
    scoreRange: { min: 25, max: 49 },
    color: '#f97316',
    bgColor: '#ffedd5',
    description: 'Struggles with competencies, requires intervention',
    indicators: [
      'Difficulty understanding concepts',
      'Requires significant support',
      'Shows limited progress',
      'Needs intensive intervention',
      'Struggles with basic tasks'
    ]
  },
  {
    level: 'NY',
    name: 'Not Yet',
    scoreRange: { min: 0, max: 24 },
    color: '#ef4444',
    bgColor: '#fee2e2',
    description: 'Has not demonstrated understanding',
    indicators: [
      'Unable to complete tasks',
      'Lacks foundational knowledge',
      'Requires urgent intervention',
      'Needs alternative approaches',
      'Significant learning gaps'
    ]
  }
];

/**
 * Get rubric level from percentage score
 * @param {number} score - Percentage score (0-100)
 * @returns {Object} Rubric level object with level and color
 */
export const getRubricFromScore = (score) => {
  if (score >= 90) return { level: 'EE', color: '#22c55e' };
  if (score >= 75) return { level: 'ME', color: '#3b82f6' };
  if (score >= 50) return { level: 'AE', color: '#eab308' };
  if (score >= 25) return { level: 'BE', color: '#f97316' };
  return { level: 'NY', color: '#ef4444' };
};

/**
 * Get full rubric scale object from score
 * @param {number} score - Percentage score (0-100)
 * @returns {Object} Full performance scale object
 */
export const getFullRubricFromScore = (score) => {
  const rubric = getRubricFromScore(score);
  return performanceScale.find(scale => scale.level === rubric.level);
};

/**
 * Calculate weighted grade (60% formative, 40% summative)
 * @param {number} formative - Formative average
 * @param {number} summative - Summative score
 * @returns {number} Weighted final grade
 */
export const calculateWeightedGrade = (formative, summative) => {
  return Math.round((formative * 0.6) + (summative * 0.4));
};
