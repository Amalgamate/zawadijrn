/**
 * Grade/Stream Structure Data
 * Complete school structure with all grade levels
 * Updated to match database enums and per-grade tracking
 */

export const gradeStructure = [
  // EARLY YEARS EDUCATION (EYE)
  {
    id: 1,
    name: 'Playgroup',
    code: 'PLAYGROUP',
    learningArea: 'Pre-Primary',
    ageRange: '3-4 years',
    capacity: 20,
    active: true,
    curriculum: 'Play-based'
  },
  {
    id: 2,
    name: 'Pre-Primary 1',
    code: 'PP1',
    learningArea: 'Pre-Primary',
    ageRange: '4-5 years',
    capacity: 30,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 3,
    name: 'Pre-Primary 2',
    code: 'PP2',
    learningArea: 'Pre-Primary',
    ageRange: '5-6 years',
    capacity: 30,
    active: true,
    curriculum: 'CBC'
  },

  // PRIMARY SCHOOL
  {
    id: 4,
    name: 'Grade 1',
    code: 'GRADE_1',
    learningArea: 'Lower Primary',
    ageRange: '6-7 years',
    capacity: 35,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 5,
    name: 'Grade 2',
    code: 'GRADE_2',
    learningArea: 'Lower Primary',
    ageRange: '7-8 years',
    capacity: 35,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 6,
    name: 'Grade 3',
    code: 'GRADE_3',
    learningArea: 'Lower Primary',
    ageRange: '8-9 years',
    capacity: 40,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 7,
    name: 'Grade 4',
    code: 'GRADE_4',
    learningArea: 'Upper Primary',
    ageRange: '9-10 years',
    capacity: 40,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 8,
    name: 'Grade 5',
    code: 'GRADE_5',
    learningArea: 'Upper Primary',
    ageRange: '10-11 years',
    capacity: 40,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 9,
    name: 'Grade 6',
    code: 'GRADE_6',
    learningArea: 'Upper Primary',
    ageRange: '11-12 years',
    capacity: 40,
    active: true,
    curriculum: 'CBC'
  },

  // JUNIOR SCHOOL (Grades 7-9)
  {
    id: 10,
    name: 'Grade 7',
    code: 'GRADE_7',
    learningArea: 'Junior School',
    ageRange: '12-13 years',
    capacity: 45,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 11,
    name: 'Grade 8',
    code: 'GRADE_8',
    learningArea: 'Junior School',
    ageRange: '13-14 years',
    capacity: 45,
    active: true,
    curriculum: 'CBC'
  },
  {
    id: 12,
    name: 'Grade 9',
    code: 'GRADE_9',
    learningArea: 'Junior School',
    ageRange: '14-15 years',
    capacity: 45,
    active: true,
    curriculum: 'CBC'
  }
];

export const getGradeByCode = (code) => {
  return gradeStructure.find(grade => grade.code === code) || null;
};

export const getGradeByName = (gradeName) => {
  return gradeStructure.find(grade => grade.name === gradeName) || null;
};

export const getGradesByLearningArea = (learningArea) => {
  return gradeStructure.filter(grade => grade.learningArea === learningArea);
};

export const getNextGrade = (currentGradeCode) => {
  const current = gradeStructure.find(g => g.code === currentGradeCode || g.name === currentGradeCode);
  if (!current) return null;

  const next = gradeStructure.find(g => g.id === current.id + 1);
  return next ? next.code : null;
};

export const getLearningAreaCategories = () => {
  return [...new Set(gradeStructure.map(grade => grade.learningArea))];
};

export const gradeExists = (gradeCode) => {
  return gradeStructure.some(grade => grade.code === gradeCode || grade.name === gradeCode);
};
