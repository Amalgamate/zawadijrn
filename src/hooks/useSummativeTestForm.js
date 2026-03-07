import { useState, useEffect, useCallback } from 'react';
import { assessmentAPI, gradingAPI, configAPI, classAPI } from '../services/api';
import { getLearningAreasByGrade } from '../constants/learningAreas';
import { useSchoolData } from '../contexts/SchoolDataContext';

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
  const { grades, classes, loading: schoolDataLoading } = useSchoolData();
  const [scales, setScales] = useState([]);
  const [terms, setTerms] = useState([]);
  const [allLearningAreas, setAllLearningAreas] = useState([]);
  const [availableLearningAreas, setAvailableLearningAreas] = useState([]);
  const [loadingScales, setLoadingScales] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  // Effect to set terms from classes
  useEffect(() => {
    if (!schoolDataLoading && classes?.length > 0) {
      const uniqueTerms = [...new Set(classes.map(c => c.term || 'TERM_1'))].filter(Boolean);
      if (uniqueTerms.length > 0) {
        setTerms(uniqueTerms.map(term => ({
          value: term,
          label: term.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })));
      } else {
        setTerms([
          { value: 'TERM_1', label: 'Term 1' },
          { value: 'TERM_2', label: 'Term 2' },
          { value: 'TERM_3', label: 'Term 3' }
        ]);
      }
    } else if (!schoolDataLoading) {
      setTerms([
        { value: 'TERM_1', label: 'Term 1' },
        { value: 'TERM_2', label: 'Term 2' },
        { value: 'TERM_3', label: 'Term 3' }
      ]);
    }
  }, [classes, schoolDataLoading]);

  const loadLearningAreas = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const schoolId = user?.school?.id || user?.schoolId || localStorage.getItem('currentSchoolId');

      if (!schoolId) return;

      const response = await configAPI.getLearningAreas(schoolId);
      const areasData = response?.data || response;
      setAllLearningAreas(Array.isArray(areasData) ? areasData : []);
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

      const response = await gradingAPI.getSystems(schoolId);
      const systemsData = response?.data || response;
      setScales(Array.isArray(systemsData) ? systemsData : []);
    } catch (error) {
      console.error('❌ Error loading scales:', error);
      setScales([]);
    } finally {
      setLoadingScales(false);
    }
  }, []);

  useEffect(() => {
    loadScales();
    loadLearningAreas();
  }, [loadScales, loadLearningAreas]);

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
    loading: loadingScales || schoolDataLoading,
    loadingScales,
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
