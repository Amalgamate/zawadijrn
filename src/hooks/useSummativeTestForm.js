import { useState, useEffect, useCallback } from 'react';
import { assessmentAPI, gradingAPI, configAPI, classAPI } from '../services/api';
import { getLearningAreasByGrade } from '../constants/learningAreas';

const TEST_TYPES = [
  { value: 'OPENER', label: 'Opener' },
  { value: 'MIDTERM', label: 'Midterm' },
  { value: 'END_TERM', label: 'End Term' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'RANDOM', label: 'Random' }
];

const DEFAULT_FORM_DATA = {
  title: '',
  type: '',
  grade: '',
  term: 'TERM_1',
  learningArea: '',
  academicYear: new Date().getFullYear(),
  scaleId: '',
  testDate: new Date().toISOString().split('T')[0],
  totalMarks: 100,
  passMarks: 50,
  duration: 60,
  description: '',
  instructions: '',
  curriculum: 'CBC_AND_EXAM',
  weight: 100.0,
  status: JSON.parse(localStorage.getItem('user') || '{}')?.role === 'SUPER_ADMIN' ? 'APPROVED' : 'DRAFT'
};

export const useSummativeTestForm = () => {
  const [scales, setScales] = useState([]);
  const [grades, setGrades] = useState([]);
  const [terms, setTerms] = useState([]);
  const [allLearningAreas, setAllLearningAreas] = useState([]);
  const [availableLearningAreas, setAvailableLearningAreas] = useState([]);
  const [loadingScales, setLoadingScales] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  // Load grades, terms, scales, and learning areas on component mount
  const loadGrades = useCallback(async () => {
    setLoadingGrades(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const schoolId = user?.school?.id || user?.schoolId || localStorage.getItem('currentSchoolId');

      if (!schoolId) {
        setDefaultGradesAndTerms();
        return;
      }

      // Use concurrent fetching for classes and grade enum
      const [classesResponse, gradesResponse] = await Promise.all([
        classAPI.getAll({ schoolId }).catch(() => []),
        configAPI.getGrades().catch(() => [])
      ]);

      const classesData = classesResponse.data || classesResponse || [];
      const gradesData = gradesResponse.data || gradesResponse || [];

      // Extract grades from classes
      const usedGrades = [...new Set(classesData.map(c => c.grade))].filter(Boolean);

      // Define grade order
      const gradeOrder = [
        'CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP',
        'PP1', 'PP2',
        'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
        'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
      ];

      // Combine with system grades and sort by defined order
      const allGrades = [...new Set([...usedGrades, ...gradesData])]
        .filter(Boolean)
        .sort((a, b) => {
          const indexA = gradeOrder.indexOf(a);
          const indexB = gradeOrder.indexOf(b);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
        });

      if (allGrades.length > 0) {
        setGrades(allGrades);
      } else {
        setDefaultGrades();
      }

      // Terms Logic
      const uniqueTerms = [...new Set(classesData.map(c => c.term || 'TERM_1'))].filter(Boolean);

      if (uniqueTerms.length > 0) {
        setTerms(uniqueTerms.map(term => ({
          value: term,
          label: term.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })));
      } else {
        setDefaultTerms();
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      setDefaultGradesAndTerms();
    } finally {
      setLoadingGrades(false);
    }
  }, []);

  const loadLearningAreas = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const schoolId = user?.school?.id || user?.schoolId || localStorage.getItem('currentSchoolId');

      if (!schoolId) return;

      const data = await configAPI.getLearningAreas(schoolId);
      setAllLearningAreas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error loading learning areas:', error);
      setAllLearningAreas([]);
    }
  }, []);

  const loadScales = useCallback(async () => {
    setLoadingScales(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const schoolId = user?.school?.id || user?.schoolId || localStorage.getItem('currentSchoolId');

      if (!schoolId) return;

      const systems = await gradingAPI.getSystems(schoolId);
      setScales(Array.isArray(systems) ? systems : []);
    } catch (error) {
      console.error('❌ Error loading scales:', error);
      setScales([]);
    } finally {
      setLoadingScales(false);
    }
  }, []);

  useEffect(() => {
    loadGrades();
    loadScales();
    loadLearningAreas();
  }, [loadGrades, loadScales, loadLearningAreas]);

  // Update available learning areas when grade changes
  useEffect(() => {
    if (!formData.grade) {
      setAvailableLearningAreas([]);
      return;
    }

    // Filter learning areas that match the grade-based CBC mapping
    const officialAreas = getLearningAreasByGrade(formData.grade);

    // Attempt to match DB areas against the official list
    const filtered = allLearningAreas.filter(area =>
      officialAreas.includes(area.name)
    );

    // If we found official matches in the DB, show those. 
    // Otherwise, show the official list as virtual objects to allow creation.
    if (filtered.length > 0) {
      setAvailableLearningAreas(filtered);
    } else {
      setAvailableLearningAreas(officialAreas.map(name => ({ id: name, name })));
    }
  }, [formData.grade, allLearningAreas]);

  const setDefaultGrades = () => {
    setGrades([
      'CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP',
      'PP1', 'PP2',
      'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
      'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
    ]);
  };

  const setDefaultTerms = () => {
    setTerms([
      { value: 'TERM_1', label: 'Term 1' },
      { value: 'TERM_2', label: 'Term 2' },
      { value: 'TERM_3', label: 'Term 3' }
    ]);
  };

  const setDefaultGradesAndTerms = () => {
    setDefaultGrades();
    setDefaultTerms();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Test name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Test type is required';
    }
    if (!formData.grade) {
      newErrors.grade = 'Grade is required';
    }
    if (!formData.term) {
      newErrors.term = 'Academic term is required';
    }
    if (!formData.learningArea) {
      newErrors.learningArea = 'Learning Area is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSelectedScale = () => {
    if (!formData.scaleId) return null;
    return scales.find(s => s.id === formData.scaleId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSaveStatus('error');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${formData.title ? 'update' : 'create'} this test?`)) {
      return;
    }

    setSaving(true);
    setSaveStatus('');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const selectedScale = getSelectedScale();

      const testData = {
        ...formData,
        testType: formData.type,
        totalMarks: parseInt(formData.totalMarks),
        passMarks: parseInt(formData.passMarks),
        duration: parseInt(formData.duration) || null,
        createdBy: userId,
        published: false,
        active: true,
        status: user?.role === 'SUPER_ADMIN' ? 'APPROVED' : 'DRAFT',
        scaleId: selectedScale?.id || null,
        scaleName: selectedScale?.name || null
      };

      console.log('📤 Submitting test:', testData);
      console.log('📊 Selected scale:', selectedScale);

      const response = await assessmentAPI.createTest({ ...testData });
      const createdTest = response?.data || response;

      console.log('✅ Test created successfully:', createdTest);
      setSaveStatus('success');

      return createdTest;
    } catch (error) {
      console.error('❌ Error saving test:', error);
      setSaveStatus('error');
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.error || error.message || 'Failed to save test'
      }));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setErrors({});
  };

  return {
    // State
    formData,
    setFormData,
    scales,
    grades,
    terms,
    errors,
    saveStatus,
    loading: loadingScales || loadingGrades,
    loadingScales,
    loadingGrades,
    saving,
    availableLearningAreas,
    testTypes: TEST_TYPES,

    // Methods
    handleInputChange,
    handleSubmit,
    validateForm,
    resetForm,
    getSelectedScale
  };
};
