/**
 * Official CBC Learning Area Mapping (Per Grade)
 * Source: MoE / KICD Guidelines
 * This is the Single Source of Truth for Grade-Based auto-generation.
 */

export const OFFICIAL_CBC_MAPPING = {
  'PLAYGROUP': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
  'PP1': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
  'PP2': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
  'GRADE_1': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
  'GRADE_2': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
  'GRADE_3': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
  'GRADE_4': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
  'GRADE_5': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
  'GRADE_6': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
  'GRADE_7': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports'],
  'GRADE_8': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports'],
  'GRADE_9': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports'],
};

/**
 * Returns learning areas for a specific grade
 * Robust against case variations and underscores/spaces
 */
export const getLearningAreasByGrade = (grade) => {
  if (!grade) return [];
  
  // Normalize grade name (e.g., "Grade 1" -> "GRADE_1", "Playgroup" -> "PLAYGROUP")
  const normalizedGrade = String(grade)
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();
    
  return OFFICIAL_CBC_MAPPING[normalizedGrade] || [];
};

/**
 * Returns grouped learning areas for UI display (grouped by Grade)
 */
export const getGroupedLearningAreas = (grade) => {
  return {
    [grade]: OFFICIAL_CBC_MAPPING[grade] || []
  };
};

/**
 * Fallback for legacy components
 */
export const getAllLearningAreas = () => {
  const all = new Set();
  Object.values(OFFICIAL_CBC_MAPPING).forEach(areas => {
    areas.forEach(area => all.add(area));
  });
  return Array.from(all);
};

/**
 * Validates if a learning area is official for a given grade
 */
export const isValidLearningAreaForGrade = (grade, learningArea) => {
  const areas = OFFICIAL_CBC_MAPPING[grade] || [];
  return areas.includes(learningArea);
};

const learningAreasExport = {
  OFFICIAL_CBC_MAPPING,
  getLearningAreasByGrade,
  getAllLearningAreas,
  isValidLearningAreaForGrade,
  getGroupedLearningAreas
};

export default learningAreasExport;
