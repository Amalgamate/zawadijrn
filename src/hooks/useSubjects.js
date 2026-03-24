
import { useEffect } from 'react';
import useSubjectStore from '../store/useSubjectStore';

export const useSubjects = (grade = null) => {
  const { subjects, loading, error, fetchSubjects, getSubjectsByGrade } = useSubjectStore();

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const gradeSubjects = grade ? getSubjectsByGrade(grade) : subjects;

  return {
    subjects: gradeSubjects,
    allSubjects: subjects,
    loading,
    error,
    refreshSubjects: () => fetchSubjects(true)
  };
};

export default useSubjects;
