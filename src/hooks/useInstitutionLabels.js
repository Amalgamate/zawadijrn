import { useAuth } from './useAuth';

/**
 * useInstitutionLabels - Dynamic terminology based on institution type.
 * Returns the correct labels for entities like students, teachers, classes, and subjects.
 */
export const useInstitutionLabels = () => {
  const { user } = useAuth();
  const type = user?.institutionType || 'PRIMARY_CBC';

  const labels = {
    PRIMARY_CBC: {
      student: 'Scholar',
      students: 'Scholars',
      learners: 'Learners',
      teacher: 'Tutor',
      teachers: 'Tutors',
      class: 'Class',
      classes: 'Classes',
      subject: 'Learning Area',
  subjects: 'Learner Analytics',
      grade: 'Grade',
      grades: 'Grades',
      term: 'Term',
      report: 'Termly Report',
      dashboard: 'CBC Dashboard'
    },
    SECONDARY: {
      student: 'Student',
      students: 'Students',
      learners: 'Students',
      teacher: 'Teacher',
      teachers: 'Teachers',
      class: 'Form Group',
      classes: 'Form Groups',
      subject: 'Subject',
      subjects: 'Subjects',
      grade: 'Form',
      grades: 'Forms',
      term: 'Term',
      report: 'End-of-Term Report',
      dashboard: 'Secondary Dashboard'
    },
    TERTIARY: {
      student: 'Student',
      students: 'Students',
      learners: 'Students',
      teacher: 'Lecturer',
      teachers: 'Lecturers',
      class: 'Cohort',
      classes: 'Cohorts',
      subject: 'Unit',
      subjects: 'Units',
      grade: 'Year',
      grades: 'Years',
      term: 'Semester',
      report: 'Semester Transcript',
      dashboard: 'Tertiary Portal'
    }
  };

  return labels[type] || labels.PRIMARY_CBC;
};
