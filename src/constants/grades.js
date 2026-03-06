/**
 * Grades Constants
 * Single source of truth for grade definitions across the application
 */

export const GRADES = [
    { value: 'CRECHE', label: 'Crèche' },
    { value: 'PLAYGROUP', label: 'Playgroup' },
    { value: 'RECEPTION', label: 'Reception' },
    { value: 'TRANSITION', label: 'Transition' },
    { value: 'PP1', label: 'PP1' },
    { value: 'PP2', label: 'PP2' },
    { value: 'GRADE_1', label: 'Grade 1' },
    { value: 'GRADE_2', label: 'Grade 2' },
    { value: 'GRADE_3', label: 'Grade 3' },
    { value: 'GRADE_4', label: 'Grade 4' },
    { value: 'GRADE_5', label: 'Grade 5' },
    { value: 'GRADE_6', label: 'Grade 6' },
    { value: 'GRADE_7', label: 'Grade 7' },
    { value: 'GRADE_8', label: 'Grade 8' },
    { value: 'GRADE_9', label: 'Grade 9' },
    { value: 'GRADE_10', label: 'Grade 10' },
    { value: 'GRADE_11', label: 'Grade 11' },
    { value: 'GRADE_12', label: 'Grade 12' }
];

export const LEARNING_AREA_GRADES = GRADES;

/**
 * Get grade label by value
 * @param {string} value - Grade value (e.g., 'GRADE_1')
 * @returns {string} Grade label (e.g., 'Grade 1')
 */
export const getGradeLabel = (value) => {
    const grade = GRADES.find(g => g.value === value);
    return grade ? grade.label : value?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase());
};

export default GRADES;
