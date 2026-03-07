/**
 * SummativeAssessment Mobile Variant - Redesigned
 * Mobile App-like Experience optimized for score recording
 * - Smart filtering based on teacher's assigned classes/subjects
 * - Single-screen streamlined workflow
 * - Large touch targets and fast entry
 * - Auto-selects teacher's class/subject
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Save, Loader, ArrowLeft, Check, ChevronRight, AlertCircle, BookOpen
} from 'lucide-react';
import { assessmentAPI, classAPI, learnerAPI } from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { useTeacherWorkload } from '../hooks/useTeacherWorkload';
import { useAssessmentSetup } from '../hooks/useAssessmentSetup';
import { useLearningAreas } from '../hooks/useLearningAreas';
import EmptyState from '../shared/EmptyState';
import { useSchoolData } from '../../../contexts/SchoolDataContext';
import { getLearningAreasByGrade } from '../../../constants/learningAreas';

const SummativeAssessmentMobile = ({ learners, initialTestId, onBack, brandingSettings }) => {
  const { showSuccess, showError } = useNotifications();
  const setup = useAssessmentSetup({ defaultTerm: 'TERM_1' });
  const teacherWorkload = useTeacherWorkload();
  const learningAreasMgr = useLearningAreas(setup.selectedGrade);

  // State
  const [step, setStep] = useState(initialTestId ? 2 : 1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || '');
  const [marks, setMarks] = useState({});
  const [savedMarks, setSavedMarks] = useState(new Set()); // Track which marks have been saved
  const [fetchedLearners, setFetchedLearners] = useState([]);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const { grades: availableGrades, classes, loading: schoolDataLoading } = useSchoolData();
  const [availableTerms, setAvailableTerms] = useState([]);
  const [selectedLearningArea, setSelectedLearningArea] = useState('');

  // Fetch Tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assessmentAPI.getTests({});
      let testsData = [];
      if (response?.data && Array.isArray(response.data)) {
        testsData = response.data;
      } else if (Array.isArray(response)) {
        testsData = response;
      }
      const activeTests = testsData.filter(t => {
        const status = (t.status || '').toUpperCase();
        return ['PUBLISHED', 'APPROVED'].includes(status) || t.published === true;
      });

      // Debug: Log all test learning areas
      console.log('📋 All Tests by Grade:',
        activeTests.reduce((acc, t) => {
          const gradeKey = t.grade || 'UNKNOWN';
          if (!acc[gradeKey]) acc[gradeKey] = [];
          acc[gradeKey].push({ title: t.title, learningArea: t.learningArea });
          return acc;
        }, {})
      );

      setTests(activeTests);
    } catch (error) {
      console.error('Error loading tests:', error);
      showError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load Terms (from context classes)
  const loadOptions = useCallback(() => {
    if (!schoolDataLoading && classes?.length > 0) {
      const uniqueTerms = [...new Set(classes.map(c => c.term))].filter(Boolean).sort();
      setAvailableTerms(uniqueTerms.length > 0 ? uniqueTerms : ['TERM_1', 'TERM_2', 'TERM_3']);
    } else if (!schoolDataLoading) {
      setAvailableTerms(['TERM_1', 'TERM_2', 'TERM_3']);
    }
  }, [classes, schoolDataLoading]);

  useEffect(() => {
    fetchTests();
    loadOptions();
  }, [fetchTests, loadOptions]);

  // ===== FILTERED DATA BASED ON TEACHER WORKLOAD =====

  // Filter tests by grade and term
  const filteredTestsBySelection = useMemo(() =>
    tests.filter(t => {
      if (setup.selectedGrade) {
        const normalizedGrade = setup.selectedGrade.replace(/\s+/g, '_').toUpperCase();
        const testGrade = (t.grade || '').replace(/\s+/g, '_').toUpperCase();
        if (testGrade !== normalizedGrade) return false;
      }
      if (setup.selectedTerm) {
        const normalizedTerm = setup.selectedTerm.toUpperCase().trim();
        const testTerm = (t.term || '').toUpperCase().trim();
        if (testTerm !== normalizedTerm) return false;
      }
      return true;
    }),
    [tests, setup.selectedGrade, setup.selectedTerm]
  );

  // Collect learning areas from tests
  const availableLearningAreas = useMemo(() => {
    const areas = new Set();
    filteredTestsBySelection.forEach(t => {
      // Try to get learning area from field first
      let area = t.learningArea;

      // If not available, try to extract from title (e.g., "Test Title (Learning Area)")
      if (!area && t.title) {
        const match = t.title.match(/\((.*?)\)$/);
        if (match) {
          area = match[1].trim();
        }
      }

      if (area) areas.add(area);
    });

    // Unified source: include canonical learning areas by selected grade
    if (setup.selectedGrade) {
      const officialAreas = getLearningAreasByGrade(setup.selectedGrade);
      officialAreas.forEach((area) => areas.add(area));
    }

    const result = Array.from(areas).sort();
    console.log(`🎓 Learning Areas for Grade ${setup.selectedGrade}:`, result);
    return result;
  }, [filteredTestsBySelection, setup.selectedGrade]);

  // Show ALL available learning areas (not filtered by teacher workload)
  // Teachers can grade any subject, not just assigned ones
  const filteredLearningAreasByWorkload = availableLearningAreas;

  // Log available subjects for debugging
  useEffect(() => {
    console.log(`📋 Available Subjects for Grade ${setup.selectedGrade}:`, filteredLearningAreasByWorkload);
    console.log(`   Currently Selected: "${selectedLearningArea}"`);
  }, [filteredLearningAreasByWorkload, setup.selectedGrade, selectedLearningArea]);

  // Filter tests by learning area
  const finalTests = useMemo(() => {
    if (!selectedLearningArea) return [];

    const normalize = (val) => String(val || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '').trim();
    const normalizedSelected = normalize(selectedLearningArea);

    const results = filteredTestsBySelection.filter(t => {
      // Get learning area from field or extract from title
      let area = t.learningArea;
      if (!area && t.title) {
        const match = t.title.match(/\((.*?)\)$/);
        if (match) {
          area = match[1].trim();
        }
      }

      const testArea = normalize(area);
      return testArea === normalizedSelected;
    });

    const testList = filteredTestsBySelection.map(t => {
      let area = t.learningArea;
      if (!area && t.title) {
        const match = t.title.match(/\((.*?)\)$/);
        if (match) {
          area = match[1].trim();
        }
      }
      return {
        title: t.title,
        area: area,
        normalized: normalize(area),
        matches: normalize(area) === normalizedSelected
      };
    });

    console.log(`🧪 Filter Tests by Area: "${selectedLearningArea}" (normalized: "${normalizedSelected}")`);
    console.log('   Tests:', testList);
    console.log(`   Matched ${results.length} tests`);

    return results;
  }, [filteredTestsBySelection, selectedLearningArea]);

  // Filter grades by teacher's assigned grades
  const filteredGrades = useMemo(() => {
    const gradesFromTests = [...new Set(
      tests
        .map((test) => String(test?.grade || '').trim())
        .filter(Boolean)
        .map((grade) => grade.replace(/\s+/g, '_').toUpperCase())
    )];

    const mergedGrades = [...new Set([...(availableGrades || []), ...gradesFromTests])];

    if (!teacherWorkload.isTeacher) return mergedGrades;
    return mergedGrades.filter(g => teacherWorkload.assignedGrades.includes(g));
  }, [availableGrades, tests, teacherWorkload.isTeacher, teacherWorkload.assignedGrades]);

  // ===== AUTO-SELECTION FOR TEACHERS =====

  // Auto-prefill Grade for teachers
  useEffect(() => {
    if (teacherWorkload.isTeacher && !teacherWorkload.loading && step === 1) {
      if (!setup.selectedGrade && teacherWorkload.primaryGrade) {
        setup.setSelectedGrade(teacherWorkload.primaryGrade);
      }
    }
  }, [teacherWorkload.isTeacher, teacherWorkload.loading, teacherWorkload.primaryGrade, setup, step]);

  // Auto-select Learning Area if only one available
  useEffect(() => {
    if (teacherWorkload.isTeacher && filteredLearningAreasByWorkload.length === 1 && !selectedLearningArea && step === 1) {
      setSelectedLearningArea(filteredLearningAreasByWorkload[0]);
    }
  }, [teacherWorkload.isTeacher, filteredLearningAreasByWorkload, selectedLearningArea, step]);

  // Auto-select Test if only one available
  useEffect(() => {
    if (teacherWorkload.isTeacher && finalTests.length === 1 && !selectedTestId && step === 1) {
      setSelectedTestId(finalTests[0].id);
    }
  }, [teacherWorkload.isTeacher, finalTests, selectedTestId, step]);

  // Get selected test
  const selectedTest = useMemo(() => tests.find(t => String(t.id) === String(selectedTestId)), [selectedTestId, tests]);

  // Update selectedLearningArea to match the test's learning area
  useEffect(() => {
    if (selectedTest) {
      let testArea = selectedTest.learningArea;

      // Fallback: extract from title if not in field
      if (!testArea && selectedTest.title) {
        const match = selectedTest.title.match(/\((.*?)\)$/);
        if (match) {
          testArea = match[1].trim();
        }
      }

      if (testArea && testArea !== selectedLearningArea) {
        console.log(`📝 Updated learning area to match test: "${testArea}"`);
        setSelectedLearningArea(testArea);
      }
    }
  }, [selectedTest?.id, selectedTest?.learningArea, selectedTest?.title, selectedLearningArea]);

  // Load existing marks from database when entering step 2
  const loadExistingMarks = useCallback(async () => {
    if (!selectedTest?.id) return;

    // Clear previous marks first when loading for a new test
    setMarks({});
    setSavedMarks(new Set());

    try {
      console.log(`📥 Loading existing marks for test ${selectedTest.id}...`);
      const response = await assessmentAPI.getTestResults(selectedTest.id);
      console.log('📤 Test Results Response:', response);

      const results = response?.data || response || [];

      if (Array.isArray(results) && results.length > 0) {
        // Load marks into state
        const loadedMarks = {};
        const savedLearnerIds = new Set();

        results.forEach(result => {
          loadedMarks[result.learnerId] = result.marksObtained;
          savedLearnerIds.add(result.learnerId);
        });

        setMarks(loadedMarks);
        setSavedMarks(savedLearnerIds);
        console.log(`✅ Loaded ${results.length} existing marks for this test`);
      } else {
        console.log(`ℹ️  No existing marks found for this test (fresh assessment)`);
      }
    } catch (error) {
      console.error('Error loading existing marks:', error);
      // Reset to empty state on error
      setMarks({});
      setSavedMarks(new Set());
    }
  }, [selectedTest?.id]);

  useEffect(() => {
    if (step === 2 && selectedTest?.id) {
      loadExistingMarks();
    }
  }, [step, selectedTest?.id, loadExistingMarks]);

  const fetchLearners = useCallback(async () => {
    if (!selectedTest?.id || !selectedTest?.grade) return;
    setLoadingLearners(true);
    try {
      // Fetch learners for the selected Grade and Stream (from the test)
      const params = {
        grade: selectedTest.grade,
        status: 'ACTIVE',
        limit: 1000 // Get all for the class
      };

      if (setup.selectedStream) {
        params.stream = setup.selectedStream;
      }

      const response = await learnerAPI.getAll(params);
      const learnersData = response.data || response || [];
      setFetchedLearners(Array.isArray(learnersData) ? learnersData : []);
      console.log(`✓ Loaded ${learnersData.length} learners for ${selectedTest.grade}`);
    } catch (error) {
      console.error('Error fetching learners:', error);
      showError('Failed to load learners');
      setFetchedLearners([]);
    } finally {
      setLoadingLearners(false);
    }
  }, [selectedTest?.id, selectedTest?.grade, setup.selectedStream, showError]);

  useEffect(() => {
    if (step === 2 && selectedTest?.id) {
      fetchLearners();
    }
  }, [step, selectedTest, fetchLearners]);

  // Assessment Progress
  const assessmentProgress = useMemo(() => {
    const totalLearners = (fetchedLearners || []).length;
    const assessedCount = Object.keys(marks).filter(learnerId => {
      const mark = marks[learnerId];
      return mark !== null && mark !== undefined && mark !== '';
    }).length;
    const percentage = totalLearners > 0 ? Math.round((assessedCount / totalLearners) * 100) : 0;
    const isComplete = assessedCount === totalLearners && totalLearners > 0;
    return { assessed: assessedCount, total: totalLearners, percentage, isComplete };
  }, [marks, fetchedLearners]);

  // Filter learners by search query
  const filteredLearners = useMemo(() => {
    let result = fetchedLearners;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.firstName + ' ' + l.lastName).toLowerCase().includes(query) ||
        (l.admissionNumber || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [fetchedLearners, searchQuery]);

  // Handle mark change
  const handleMarkChange = (learnerId, value) => {
    setMarks(prev => ({
      ...prev,
      [learnerId]: value === '' ? '' : value
    }));
  };

  // Save marks
  const handleSaveMarks = async () => {
    setSaving(true);
    try {
      // Collect all marks to save
      const resultsToSave = Object.entries(marks)
        .filter(([_, mark]) => mark !== null && mark !== undefined && mark !== '')
        .map(([learnerId, mark]) => ({
          testId: selectedTestId,
          learnerId,
          marksObtained: parseFloat(mark),
          percentage: (parseFloat(mark) / (selectedTest?.totalMarks || 100)) * 100
        }));

      if (resultsToSave.length === 0) {
        showError('No new marks to save. All entered marks already saved.');
        setSaving(false);
        return;
      }

      console.log(`🔄 Saving ${resultsToSave.length} marks...`, resultsToSave);

      // Save results using bulk API (always use bulk)
      // Format: { testId, results: [{ learnerId, marksObtained }, ...] }
      const response = await assessmentAPI.recordBulkResults({
        testId: selectedTestId,
        results: resultsToSave.map(r => ({
          learnerId: r.learnerId,
          marksObtained: r.marksObtained
        }))
      });

      console.log('📊 Save API Response:', response);

      // Check if response indicates success (API may return different formats)
      const isSuccess = response && (response.success === true || response.data || response.message === 'saved' || !response.error);

      if (isSuccess) {
        // Mark these learners as saved
        const newSavedMarks = new Set(savedMarks);
        resultsToSave.forEach(r => newSavedMarks.add(r.learnerId));
        setSavedMarks(newSavedMarks);

        showSuccess(`✅ ${resultsToSave.length} mark(s) saved successfully!`);
        console.log(`✅ Successfully saved ${resultsToSave.length} marks`);

        // Don't clear marks - keep them visible with checkmarks
        // User can continue entering more marks or navigate back voluntarily
      } else {
        const errorMsg = response?.message || 'Failed to save marks. Please try again.';
        showError(`❌ ${errorMsg}`);
        console.error('Save failed:', response);
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      const errorMsg = error.message || 'Network error. Please check your connection.';
      showError(`❌ Failed to save: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle back - navigate away from full-screen
  const handleBackToSidebar = () => {
    // Clear marks when going back to start fresh
    setMarks({});
    setSavedMarks(new Set());

    // This will trigger a page navigation back to dashboard in the parent system
    if (onBack) {
      onBack();
    } else {
      // Fallback: dispatch custom event or use window history
      window.history.back();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader size={32} className="animate-spin text-teal-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // STEP 1: SETUP - Mobile App Style
  if (step === 1) {
    return (
      <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-slate-50 to-white">
        {/* Premium Header */}
        <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToSidebar}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">Summative Assessment</h1>
              <p className="text-xs text-slate-500 font-medium">Quick Setup</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
          {/* Grade Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
              📚 Grade <span className="text-red-500">*</span>
            </label>
            <select
              value={setup.selectedGrade}
              onChange={(e) => setup.setSelectedGrade(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base font-medium focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 focus:outline-none"
            >
              <option value="">Select your grade</option>
              {filteredGrades.map(g => (
                <option key={g} value={g}>{g.replace('_', ' ')}</option>
              ))}
            </select>
            {filteredGrades.length === 1 && setup.selectedGrade === filteredGrades[0] && (
              <p className="text-xs text-brand-teal mt-2">✓ Auto-selected based on your assignment</p>
            )}
          </div>

          {/* Term Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
              📅 Term <span className="text-red-500">*</span>
            </label>
            <select
              value={setup.selectedTerm}
              onChange={(e) => setup.setSelectedTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base font-medium focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 focus:outline-none"
            >
              {availableTerms.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Learning Area Card */}
          {filteredLearningAreasByWorkload.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                <BookOpen size={14} className="inline mr-1" />
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLearningArea}
                onChange={(e) => {
                  console.log(`📝 Subject changed from "${selectedLearningArea}" to "${e.target.value}"`);
                  setSelectedLearningArea(e.target.value);
                }}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base font-medium focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 focus:outline-none"
              >
                <option value="">Select subject</option>
                {filteredLearningAreasByWorkload.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {filteredLearningAreasByWorkload.length === 1 && selectedLearningArea === filteredLearningAreasByWorkload[0] && (
                <p className="text-xs text-brand-teal mt-2">✓ Only subject assigned to you</p>
              )}
            </div>
          )}

          {/* Test Selection Card */}
          {selectedLearningArea && finalTests.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                ✋ Select Test <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {finalTests.map(test => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedTestId(test.id)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${selectedTestId === test.id
                        ? 'border-brand-teal bg-brand-teal/5'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <p className="font-bold text-sm">{test.title}</p>
                    <p className="text-xs text-slate-500">{test.totalMarks} marks</p>
                  </button>
                ))}
              </div>
              {finalTests.length === 1 && selectedTestId === finalTests[0].id && (
                <p className="text-xs text-brand-teal mt-2">✓ Only test available</p>
              )}
            </div>
          )}

          {/* No Tests Message */}
          {selectedLearningArea && finalTests.length === 0 && (
            <EmptyState
              icon={AlertCircle}
              title="No Tests Available"
              message={`No published tests found for ${selectedLearningArea} in ${setup.selectedGrade}`}
            />
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 space-y-2 shadow-lg">
          <button
            onClick={() => {
              if (!selectedTestId || !setup.selectedGrade) {
                showError('Please select Grade, Term, Subject, and Test');
                return;
              }
              setStep(2);
            }}
            disabled={!selectedTestId || !setup.selectedGrade}
            className="w-full py-3 bg-gradient-to-r from-brand-teal to-teal-500 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Start Grading →
          </button>
          <button
            onClick={handleBackToSidebar}
            className="w-full py-2 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: GRADING - Mobile App Optimized
  if (step === 2 && selectedTest) {
    return (
      <div className="fixed inset-0 flex flex-col bg-slate-50">
        {/* Sticky Header - Score Progress */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-brand-teal to-teal-500 text-white shadow-lg">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  setMarks({});
                  setSavedMarks(new Set());
                  setStep(1);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 min-w-0 mx-3">
                <p className="font-black text-sm truncate">{selectedTest?.title}</p>
                <p className="text-xs opacity-90">{setup.selectedGrade} • {selectedLearningArea}</p>
              </div>
              {assessmentProgress.isComplete && (
                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                  <Check size={16} />
                  <span className="text-xs font-bold">Done</span>
                </div>
              )}
            </div>

            {/* Progress Circle */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold opacity-90">Progress</div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${assessmentProgress.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold min-w-fit">{assessmentProgress.assessed}/{assessmentProgress.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {fetchedLearners.length > 5 && (
          <div className="bg-white border-b border-slate-200 p-3 sticky top-24 z-10">
            <input
              type="text"
              placeholder="🔍 Find learner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:border-brand-teal focus:outline-none"
            />
          </div>
        )}

        {/* Learner Score Cards - Streamlined */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-32 space-y-2">
          {loadingLearners ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader size={32} className="animate-spin text-brand-teal mb-2" />
              <p className="text-sm text-slate-500">Loading learners...</p>
            </div>
          ) : (filteredLearners || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <AlertCircle size={40} className="text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">No Learners Found</p>
              <p className="text-sm text-slate-500 text-center mt-2">
                {fetchedLearners.length === 0
                  ? 'No learners in this class. Check your class assignment.'
                  : 'No results match your search.'}
              </p>
            </div>
          ) : (
            (filteredLearners || []).map((learner, idx) => {
              const learnerId = learner.id || learner._id;
              const marked = marks[learnerId];
              const isMarked = marked !== null && marked !== undefined && marked !== '';
              const isSaved = savedMarks.has(learnerId);

              return (
                <div
                  key={learnerId}
                  className={`bg-white rounded-xl p-4 border-2 transition-all transform ${isSaved
                      ? 'border-green-400 bg-green-50/30 shadow-sm'
                      : isMarked
                        ? 'border-brand-teal bg-brand-teal/3 shadow-sm'
                        : 'border-slate-200 shadow-xs hover:shadow-sm'
                    }`}
                >
                  {/* Learner Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-xs font-bold text-brand-teal">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-sm">
                            {learner.firstName} {learner.lastName || ''}
                          </p>
                          <p className="text-xs text-slate-500">{learner.admissionNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    {isSaved ? (
                      <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-full shadow-sm">
                        <Check size={16} className="fill-white" />
                        <span className="text-xs font-black">SAVED</span>
                      </div>
                    ) : isMarked && (
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        <AlertCircle size={14} />
                        <span className="text-xs font-bold">Unsaved</span>
                      </div>
                    )}
                  </div>

                  {/* Score Input - Large & Touch-Friendly */}
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Tap to enter mark"
                    value={marks[learnerId] ?? ''}
                    onChange={(e) => handleMarkChange(learnerId, e.target.value)}
                    disabled={isSaved}
                    className={`w-full px-4 py-3 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-colors ${isSaved
                        ? 'border-green-400 bg-green-100/50 text-green-700 cursor-not-allowed opacity-75'
                        : isMarked
                          ? 'border-brand-teal bg-white text-brand-teal'
                          : 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-brand-teal'
                      }`}
                    max={selectedTest?.totalMarks || 100}
                    autoComplete="off"
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 pb-6 shadow-xl">
          <div className="space-y-2">
            {/* Calculate unsaved marks */}
            {(() => {
              const unsavedCount = Object.entries(marks)
                .filter(([learnerId, mark]) => {
                  const isSaved = savedMarks.has(learnerId);
                  return !isSaved && mark !== null && mark !== undefined && mark !== '';
                }).length;

              return (
                <>
                  {/* Main Save Button */}
                  <button
                    onClick={handleSaveMarks}
                    disabled={saving || unsavedCount === 0}
                    className={`w-full py-4 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-white text-sm ${unsavedCount === 0
                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-brand-teal to-teal-500 hover:shadow-lg active:scale-95'
                      }`}
                  >
                    {saving ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Saving {unsavedCount} mark(s)...
                      </>
                    ) : unsavedCount === 0 ? (
                      <>
                        <Check size={18} />
                        All Saved
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save {unsavedCount} Unsaved Mark{unsavedCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>

                  {/* Status Line */}
                  {assessmentProgress.assessed > 0 && (
                    <p className="text-xs text-center text-slate-500 font-medium">
                      {savedMarks.size} saved • {unsavedCount} unsaved • {assessmentProgress.total - assessmentProgress.assessed} remaining
                    </p>
                  )}

                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setMarks({});
                      setSavedMarks(new Set());
                      setStep(1);
                    }}
                    className="w-full py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Back to Setup
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here if component structure is correct
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <EmptyState message="Invalid state" />
    </div>
  );
};

export default SummativeAssessmentMobile;
