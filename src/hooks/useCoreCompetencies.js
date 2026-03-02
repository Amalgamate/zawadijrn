import { useState, useCallback } from 'react';
import { authAPI } from '../services/api';

export const useCoreCompetencies = (initialData = null) => {
  const [formData, setFormData] = useState({
    studentId: initialData?.studentId || '',
    studentName: initialData?.studentName || '',
    grade: initialData?.grade || '',
    term: initialData?.term || '',
    academicYear: initialData?.academicYear || '',
    assessmentDate: initialData?.assessmentDate || new Date().toISOString().split('T')[0],
    competencies: [
      {
        id: 1,
        name: 'Communication and Collaboration',
        descriptor: 'Ability to express ideas clearly and work effectively with others',
        rating: '',
        evidence: '',
        teacherComment: ''
      },
      {
        id: 2,
        name: 'Critical Thinking and Problem Solving',
        descriptor: 'Ability to analyze situations and develop creative solutions',
        rating: '',
        evidence: '',
        teacherComment: ''
      },
      {
        id: 3,
        name: 'Creativity and Imagination',
        descriptor: 'Demonstrates original thinking and innovative approaches',
        rating: '',
        evidence: '',
        teacherComment: ''
      },
      {
        id: 4,
        name: 'Citizenship',
        descriptor: 'Shows respect, responsibility, and engagement in community',
        rating: '',
        evidence: '',
        teacherComment: ''
      },
      {
        id: 5,
        name: 'Digital Literacy',
        descriptor: 'Effective and responsible use of technology and digital tools',
        rating: '',
        evidence: '',
        teacherComment: ''
      },
      {
        id: 6,
        name: 'Learning to Learn',
        descriptor: 'Self-direction, reflection, and continuous improvement',
        rating: '',
        evidence: '',
        teacherComment: ''
      }
    ],
    overallComment: initialData?.overallComment || '',
    nextSteps: initialData?.nextSteps || ''
  });

  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success | error
  const [loading, setLoading] = useState(false);

  const ratingScale = [
    { value: 'EE', label: 'Exceeds Expectations', color: 'bg-green-100 border-green-300' },
    { value: 'ME', label: 'Meets Expectations', color: 'bg-blue-100 border-blue-300' },
    { value: 'AP', label: 'Approaching Expectations', color: 'bg-yellow-100 border-yellow-300' },
    { value: 'BE', label: 'Below Expectations', color: 'bg-red-100 border-red-300' }
  ];

  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  const academicYears = ['2023/2024', '2024/2025', '2025/2026'];

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleCompetencyChange = useCallback((id, field, value) => {
    setFormData(prev => ({
      ...prev,
      competencies: prev.competencies.map(comp =>
        comp.id === id ? { ...comp, [field]: value } : comp
      )
    }));
    // Clear error
    if (errors[`competency_${id}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`competency_${id}_${field}`];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.studentId?.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.studentName?.trim()) newErrors.studentName = 'Student name is required';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.term) newErrors.term = 'Term is required';
    if (!formData.academicYear) newErrors.academicYear = 'Academic year is required';

    // Check competencies
    formData.competencies.forEach(comp => {
      if (!comp.rating) {
        newErrors[`competency_${comp.id}_rating`] = 'Rating is required';
      }
      if (!comp.evidence?.trim()) {
        newErrors[`competency_${comp.id}_evidence`] = 'Evidence is required';
      }
    });

    if (!formData.overallComment?.trim()) newErrors.overallComment = 'Overall comment is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      studentId: '',
      studentName: '',
      grade: '',
      term: '',
      academicYear: '',
      assessmentDate: new Date().toISOString().split('T')[0],
      competencies: formData.competencies.map(c => ({
        ...c,
        rating: '',
        evidence: '',
        teacherComment: ''
      })),
      overallComment: '',
      nextSteps: ''
    });
    setErrors({});
    setSaveStatus('idle');
  }, [formData.competencies]);

  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!validateForm()) {
      setSaveStatus('error');
      console.error('Form validation failed:', Object.keys(errors));
      return null;
    }

    setSaveStatus('saving');
    setLoading(true);

    try {
      console.log('📤 Saving core competencies assessment:', formData);
      const response = await authAPI.post('/assessments/core-competencies', {
        ...formData
      });

      setSaveStatus('success');
      setLoading(false);
      console.log('✅ Assessment saved successfully');
      
      // Reset after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      return response.data;
    } catch (error) {
      console.error('💥 Save error:', error);
      setErrors({ submit: error.message || 'Failed to save assessment' });
      setSaveStatus('error');
      setLoading(false);
      return null;
    }
  }, [formData, validateForm, errors]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    saveStatus,
    setSaveStatus,
    loading,
    setLoading,
    ratingScale,
    grades,
    terms,
    academicYears,
    handleInputChange,
    handleCompetencyChange,
    validateForm,
    handleSubmit,
    resetForm
  };
};
