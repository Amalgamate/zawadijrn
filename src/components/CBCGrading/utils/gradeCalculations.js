/**
 * Grade Calculation Utilities
 * All functions related to grade calculations and statistics
 */

/**
 * Calculate average from array of scores
 * @param {Array} grades - Array of grade objects with score property
 * @returns {number} Average score
 */
export const calculateGradeAverage = (grades) => {
  if (!grades || grades.length === 0) return 0;
  const sum = grades.reduce((acc, grade) => acc + (grade.score || 0), 0);
  return Math.round((sum / grades.length) * 100) / 100;
};

/**
 * Calculate percentage from score and total
 * @param {number} score - Obtained score
 * @param {number} total - Total possible score
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (score, total) => {
  if (!total || total === 0) return 0;
  return Math.round((score / total) * 100);
};

/**
 * Calculate weighted average (60% formative + 40% summative)
 * @param {number} formativeAvg - Formative average
 * @param {number} summativeScore - Summative score
 * @returns {number} Weighted final grade
 */
export const calculateWeightedGrade = (formativeAvg, summativeScore) => {
  return Math.round((formativeAvg * 0.6) + (summativeScore * 0.4));
};

/**
 * Calculate class average
 * @param {Array} learnerScores - Array of learner score objects
 * @param {string} scoreKey - Key name for score (default: 'score')
 * @returns {number} Class average
 */
export const calculateClassAverage = (learnerScores, scoreKey = 'score') => {
  if (!learnerScores || learnerScores.length === 0) return 0;
  const sum = learnerScores.reduce((acc, learner) => acc + (learner[scoreKey] || 0), 0);
  return Math.round((sum / learnerScores.length) * 100) / 100;
};

/**
 * Calculate pass rate
 * @param {Array} learnerScores - Array of learner scores
 * @param {number} passMarks - Minimum passing score
 * @param {string} scoreKey - Key name for score (default: 'totalMarks')
 * @returns {number} Pass rate percentage (0-100)
 */
export const calculatePassRate = (learnerScores, passMarks, scoreKey = 'totalMarks') => {
  if (!learnerScores || learnerScores.length === 0) return 0;
  const passed = learnerScores.filter(learner => (learner[scoreKey] || 0) >= passMarks).length;
  return Math.round((passed / learnerScores.length) * 100);
};

/**
 * Find highest score
 * @param {Array} learnerScores - Array of learner scores
 * @param {string} scoreKey - Key name for score (default: 'score')
 * @returns {number} Highest score
 */
export const findHighestScore = (learnerScores, scoreKey = 'score') => {
  if (!learnerScores || learnerScores.length === 0) return 0;
  return Math.max(...learnerScores.map(learner => learner[scoreKey] || 0));
};

/**
 * Find lowest score
 * @param {Array} learnerScores - Array of learner scores
 * @param {string} scoreKey - Key name for score (default: 'score')
 * @returns {number} Lowest score
 */
export const findLowestScore = (learnerScores, scoreKey = 'score') => {
  if (!learnerScores || learnerScores.length === 0) return 0;
  return Math.min(...learnerScores.map(learner => learner[scoreKey] || 0));
};

/**
 * Calculate attendance percentage
 * @param {number} daysPresent - Number of days present
 * @param {number} totalDays - Total school days
 * @returns {number} Attendance percentage
 */
export const calculateAttendancePercentage = (daysPresent, totalDays) => {
  if (!totalDays || totalDays === 0) return 0;
  return Math.round((daysPresent / totalDays) * 100);
};

/**
 * Calculate strand performance
 * @param {Array} assessments - Array of assessments for a strand
 * @returns {Object} Performance statistics
 */
export const calculateStrandPerformance = (assessments) => {
  if (!assessments || assessments.length === 0) {
    return { average: 0, count: 0, highest: 0, lowest: 0 };
  }

  const scores = assessments.map(a => a.percentage || 0);
  const sum = scores.reduce((acc, score) => acc + score, 0);

  return {
    average: Math.round(sum / assessments.length),
    count: assessments.length,
    highest: Math.max(...scores),
    lowest: Math.min(...scores)
  };
};

/**
 * Determine performance trend
 * @param {Array} scores - Array of scores in chronological order
 * @returns {string} 'Improving', 'Declining', or 'Stable'
 */
export const determinePerformanceTrend = (scores) => {
  if (!scores || scores.length < 6) return 'Stable';

  const first3Avg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3Avg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;

  if (last3Avg > first3Avg + 5) return 'Improving';
  if (last3Avg < first3Avg - 5) return 'Declining';
  return 'Stable';
};

/**
 * Calculate grade distribution
 * @param {Array} learnerScores - Array of learner scores
 * @param {string} rubricKey - Key name for rubric (default: 'rubric')
 * @returns {Object} Count of each rubric level
 */
export const calculateGradeDistribution = (learnerScores, rubricKey = 'rubric') => {
  const distribution = {
    EE: 0,
    ME: 0,
    AE: 0,
    BE: 0,
    NY: 0
  };

  if (!learnerScores || learnerScores.length === 0) return distribution;

  learnerScores.forEach(learner => {
    const rubric = learner[rubricKey];
    if (distribution.hasOwnProperty(rubric)) {
      distribution[rubric]++;
    }
  });

  return distribution;
};

/**
 * Get class position/rank
 * @param {Array} learnerScores - Array of all learner scores
 * @param {number} learnerScore - Score of specific learner
 * @param {string} scoreKey - Key name for score (default: 'totalMarks')
 * @returns {number} Position (1-based)
 */
export const getClassPosition = (learnerScores, learnerScore, scoreKey = 'totalMarks') => {
  if (!learnerScores || learnerScores.length === 0) return 0;
  
  const sorted = [...learnerScores].sort((a, b) => 
    (b[scoreKey] || 0) - (a[scoreKey] || 0)
  );
  
  return sorted.findIndex(learner => learner[scoreKey] === learnerScore) + 1;
};

/**
 * Calculate section totals from exam sections
 * @param {Object} sections - Object with section scores
 * @returns {number} Total score from all sections
 */
export const calculateSectionTotal = (sections) => {
  if (!sections) return 0;
  return Object.values(sections).reduce((sum, score) => sum + (Number(score) || 0), 0);
};
