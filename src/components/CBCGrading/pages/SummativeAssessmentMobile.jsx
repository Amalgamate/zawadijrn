import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Save, Loader, ArrowLeft, Check, ChevronRight, AlertCircle, BookOpen, Search
} from 'lucide-react';
import { assessmentAPI, classAPI, learnerAPI } from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { useTeacherWorkload } from '../hooks/useTeacherWorkload';
import { useAssessmentSetup } from '../hooks/useAssessmentSetup';
import { useLearningAreas } from '../hooks/useLearningAreas';
import EmptyState from '../shared/EmptyState';
import { useSchoolData } from '../../../contexts/SchoolDataContext';
import { getLearningAreasByGrade } from '../../../constants/learningAreas';
import { useInstitutionLabels } from '../../../hooks/useInstitutionLabels';
import { cn } from '../../../utils/cn';

const SummativeAssessmentMobile = ({ learners, initialTestId, onBack, brandingSettings, embedded }) => {
  const { showSuccess, showError } = useNotifications();
  const labels = useInstitutionLabels();
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
        return status === 'PUBLISHED' || t.published === true;
      });

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
      let area = t.learningArea;
      if (!area && t.title) {
        const match = t.title.match(/\((.*?)\)$/);
        if (match) area = match[1].trim();
      }
      if (area) areas.add(area);
    });

    if (setup.selectedGrade) {
      const officialAreas = getLearningAreasByGrade(setup.selectedGrade);
      officialAreas.forEach((area) => areas.add(area));
    }

    return Array.from(areas).sort();
  }, [filteredTestsBySelection, setup.selectedGrade]);

  const filteredLearningAreasByWorkload = availableLearningAreas;

  // Filter tests by learning area
  const finalTests = useMemo(() => {
    if (!selectedLearningArea) return [];

    const normalize = (val) => String(val || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '').trim();
    const normalizedSelected = normalize(selectedLearningArea);

    return filteredTestsBySelection.filter(t => {
      let area = t.learningArea;
      if (!area && t.title) {
        const match = t.title.match(/\((.*?)\)$/);
        if (match) area = match[1].trim();
      }
      return normalize(area) === normalizedSelected;
    });
  }, [filteredTestsBySelection, selectedLearningArea]);

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

  const selectedTest = useMemo(() => tests.find(t => String(t.id) === String(selectedTestId)), [selectedTestId, tests]);

  useEffect(() => {
    if (selectedTest) {
      let testArea = selectedTest.learningArea;
      if (!testArea && selectedTest.title) {
        const match = selectedTest.title.match(/\((.*?)\)$/);
        if (match) testArea = match[1].trim();
      }
      if (testArea && testArea !== selectedLearningArea) {
        setSelectedLearningArea(testArea);
      }
    }
  }, [selectedTest?.id, selectedTest?.learningArea, selectedTest?.title, selectedLearningArea]);

  // Load existing marks from database
  const loadExistingMarks = useCallback(async () => {
    if (!selectedTest?.id) return;
    setMarks({});
    setSavedMarks(new Set());

    try {
      const response = await assessmentAPI.getTestResults(selectedTest.id);
      const results = response?.data || response || [];

      if (Array.isArray(results) && results.length > 0) {
        const loadedMarks = {};
        const savedLearnerIds = new Set();
        results.forEach(result => {
          loadedMarks[result.learnerId] = result.marksObtained;
          savedLearnerIds.add(result.learnerId);
        });
        setMarks(loadedMarks);
        setSavedMarks(savedLearnerIds);
      }
    } catch (error) {
      console.error('Error loading existing marks:', error);
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
      const params = {
        grade: selectedTest.grade,
        status: 'ACTIVE',
        limit: 1000
      };
      if (setup.selectedStream) params.stream = setup.selectedStream;

      const response = await learnerAPI.getAll(params);
      const learnersData = response.data || response || [];
      setFetchedLearners(Array.isArray(learnersData) ? learnersData : []);
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

  const handleMarkChange = (learnerId, value) => {
    setMarks(prev => ({ ...prev, [learnerId]: value === '' ? '' : value }));
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    try {
      const resultsToSave = Object.entries(marks)
        .filter(([_, mark]) => mark !== null && mark !== undefined && mark !== '')
        .map(([learnerId, mark]) => ({
          testId: selectedTestId,
          learnerId,
          marksObtained: parseFloat(mark),
          percentage: (parseFloat(mark) / (selectedTest?.totalMarks || 100)) * 100
        }));

      if (resultsToSave.length === 0) {
        showError('No marks to save');
        setSaving(false);
        return;
      }

      const response = await assessmentAPI.recordBulkResults({
        testId: selectedTestId,
        results: resultsToSave.map(r => ({
          learnerId: r.learnerId,
          marksObtained: r.marksObtained
        }))
      });

      const isSuccess = response && (response.success === true || response.data || response.message === 'saved' || !response.error);

      if (isSuccess) {
        const newSavedMarks = new Set(savedMarks);
        resultsToSave.forEach(r => newSavedMarks.add(r.learnerId));
        setSavedMarks(newSavedMarks);
        showSuccess(`✅ ${resultsToSave.length} mark(s) synced!`);
      } else {
        showError(`❌ ${response?.message || 'Sync failed.'}`);
      }
    } catch (error) {
      showError(`❌ Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToSidebar = () => {
    setMarks({});
    setSavedMarks(new Set());
    if (onBack) onBack();
    else window.history.back();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[100]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--brand-purple)]/20 border-t-[var(--brand-purple)] rounded-full animate-spin" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Initializing Assessment...</p>
        </div>
      </div>
    );
  }

  // STEP 1: SETUP
  if (step === 1) {
    return (
      <div className="fixed inset-0 flex flex-col bg-white z-[100] font-sans">
        <div className="bg-white border-b border-gray-100 px-5 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
               onClick={handleBackToSidebar}
               className="p-2.5 hover:bg-gray-100 rounded-2xl active:scale-95 transition-all"
            >
              <ArrowLeft size={22} className="text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight leading-none">Record Marks</h1>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">Assessment Setup</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-40">
           {/* Term Select */}
          <div className="space-y-4">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] ml-1">Period & Timeline</label>
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5">
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 ml-1">Academic {labels.term}</label>
                  <select
                    value={setup.selectedTerm}
                    onChange={(e) => setup.setSelectedTerm(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl text-base font-semibold focus:bg-white focus:border-[var(--brand-purple)] transition-all outline-none"
                  >
                    {availableTerms.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
               </div>
            </div>
          </div>

          {/* Target Select */}
          <div className="space-y-4">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] ml-1">Class & {labels.subject}</label>
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5">
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 ml-1">Target {labels.grade}</label>
                  <select
                    value={setup.selectedGrade}
                    onChange={(e) => setup.setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl text-base font-semibold focus:bg-white focus:border-[var(--brand-purple)] transition-all outline-none"
                  >
                    <option value="">Select Classes</option>
                    {filteredGrades.map(g => (
                      <option key={g} value={g}>{g.replace('_', ' ')}</option>
                    ))}
                  </select>
               </div>

               {filteredLearningAreasByWorkload.length > 0 && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 ml-1">Active {labels.subject}</label>
                    <select
                      value={selectedLearningArea}
                      onChange={(e) => setSelectedLearningArea(e.target.value)}
                      className="w-full px-4 py-4 bg-gray-50 border-transparent rounded-2xl text-base font-semibold focus:bg-white focus:border-[var(--brand-teal)] transition-all outline-none"
                    >
                      <option value="">Select subject</option>
                      {filteredLearningAreasByWorkload.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                 </div>
               )}
            </div>
          </div>

          {/* Test Select */}
          {selectedLearningArea && finalTests.length > 0 && (
            <div className="space-y-4">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] ml-1">Available Assessments</label>
              <div className="space-y-3">
                {finalTests.map(test => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedTestId(test.id)}
                    className={cn(
                      "w-full p-5 rounded-3xl border-2 transition-all text-left flex items-center justify-between group",
                      selectedTestId === test.id
                        ? "border-[var(--brand-purple)] bg-purple-50/30 shadow-xl shadow-purple-50"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div>
                      <p className={cn(
                        "font-semibold text-base leading-tight",
                        selectedTestId === test.id ? "text-[var(--brand-purple)]" : "text-gray-900"
                      )}>{test.title}</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em] mt-1">{test.totalMarks} Maximum Marks</p>
                    </div>
                    {selectedTestId === test.id ? (
                       <div className="w-8 h-8 rounded-full bg-[var(--brand-purple)] text-white flex items-center justify-center shadow-lg shadow-purple-100">
                          <Check size={18} strokeWidth={3} />
                       </div>
                    ) : (
                       <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedLearningArea && finalTests.length === 0 && (
            <div className="py-12 px-6 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
               <AlertCircle size={40} className="mx-auto text-gray-300 mb-4" />
               <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-1">No Tests Published</h3>
               <p className="text-xs text-gray-400 font-medium leading-relaxed">We couldn\'t find any assessment tests for this subject in the system.</p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
          <button
            onClick={() => {
              if (!selectedTestId || !setup.selectedGrade) {
                showError('Review selection required');
                return;
              }
              setStep(2);
            }}
            disabled={!selectedTestId || !setup.selectedGrade}
            className="w-full py-5 bg-[var(--brand-purple)] text-white font-semibold rounded-2xl hover:brightness-110 disabled:opacity-30 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] shadow-xl shadow-purple-100"
          >
            Enter Scores Board
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: GRADING BOARD
  if (step === 2 && selectedTest) {
    return (
      <div className="fixed inset-0 flex flex-col bg-white z-[100] font-sans">
        <div className="bg-[var(--brand-purple)] text-white flex-shrink-0 pt-8 pb-6 px-5 rounded-b-[2.5rem] shadow-2xl shadow-purple-100">
          <div className="flex items-center justify-between mb-6">
            <button
               onClick={() => {
                  setMarks({});
                  setSavedMarks(new Set());
                  setStep(1);
               }}
               className="p-2.5 hover:bg-white/20 rounded-2xl active:scale-90 transition-all"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex-1 min-w-0 mx-4">
              <h1 className="font-semibold text-lg truncate leading-none">{selectedTest?.title}</h1>
              <p className="text-[10px] font-medium opacity-70 uppercase tracking-widest mt-1.5">{setup.selectedGrade} • {selectedLearningArea}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
               <span className="text-xs font-semibold">{selectedTest?.totalMarks}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-1">
               <span>Marking Progress</span>
               <span>{assessmentProgress.assessed} of {assessmentProgress.total}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${assessmentProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white pt-6 px-5 space-y-4 flex-1 overflow-y-auto pb-40">
           {fetchedLearners.length > 5 && (
            <div className="relative mb-6">
               <input
                type="text"
                placeholder="Search scholar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-50 transition-all outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
          )}

          {loadingLearners ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-10 h-10 border-4 border-purple-50 border-t-purple-500 rounded-full animate-spin" />
               <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Loading Rosters...</p>
            </div>
          ) : (filteredLearners || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
               <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center">
                  <AlertCircle size={32} className="text-gray-200" />
               </div>
               <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase">No Matches Found</h3>
                  <p className="text-xs text-gray-400 mt-2 max-w-[200px] font-medium mx-auto">Try adjusting your filters or check the class list.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
               {filteredLearners.map((learner, idx) => {
                  const learnerId = learner.id || learner._id;
                  const marked = marks[learnerId];
                  const isMarked = marked !== null && marked !== undefined && marked !== '';
                  const isSaved = savedMarks.has(learnerId);

                  return (
                    <div
                      key={learnerId}
                      className={cn(
                        "p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between gap-4",
                        isSaved ? "bg-emerald-50/30 border-emerald-100" :
                        isMarked ? "bg-white border-[var(--brand-purple)] ring-4 ring-purple-50" :
                        "bg-white border-gray-100"
                      )}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-4">
                         <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-semibold shadow-inner",
                            isSaved ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                         )}>
                            {idx + 1}
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                              {learner.firstName} {learner.lastName || ''}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">
                               {isSaved ? "Verified Record" : learner.admissionNumber || "N/A"}
                            </p>
                         </div>
                      </div>

                      <div className="relative w-20">
                         <input
                            type="number"
                            inputMode="decimal"
                            value={marks[learnerId] ?? ''}
                            onChange={(e) => handleMarkChange(learnerId, e.target.value)}
                            disabled={isSaved}
                            placeholder="--"
                            className={cn(
                               "w-full py-3 text-center text-lg font-semibold border-2 rounded-2xl transition-all focus:outline-none",
                               isSaved ? "bg-white border-emerald-500 text-emerald-600" :
                               isMarked ? "bg-white border-[var(--brand-purple)] text-[var(--brand-purple)]" :
                               "bg-gray-50 border-transparent text-gray-400 focus:bg-white focus:border-purple-200"
                            )}
                         />
                         {isSaved && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-lg animate-in zoom-in duration-500">
                               <Check size={14} strokeWidth={4} />
                            </div>
                         )}
                      </div>
                    </div>
                  );
               })}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 flex flex-col gap-3">
           {(() => {
              const unsavedCount = Object.entries(marks)
                .filter(([learnerId, mark]) => {
                  const isSaved = savedMarks.has(learnerId);
                  return !isSaved && mark !== null && mark !== undefined && mark !== '';
                }).length;

              return (
                <>
                  <button
                    onClick={handleSaveMarks}
                    disabled={saving || unsavedCount === 0}
                    className={cn(
                        "w-full py-5 font-semibold rounded-2xl transition-all flex items-center justify-center gap-3 text-white text-xs uppercase tracking-[0.2em] shadow-xl shadow-teal-100",
                        unsavedCount === 0 ? "bg-gray-200 shadow-none text-gray-400" : "bg-[var(--brand-teal)] hover:brightness-110 active:scale-95"
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>Syncing Board...</span>
                      </>
                    ) : unsavedCount === 0 ? (
                      <>
                        <Check size={18} strokeWidth={3} />
                        <span>Work Finalized</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Unsaved {unsavedCount} Marks</span>
                      </>
                    )}
                  </button>

                   {assessmentProgress.assessed > 0 && (
                    <p className="text-[10px] text-center font-semibold uppercase tracking-[0.1em] text-gray-300">
                      {assessmentProgress.percentage}% Global Accuracy Score
                    </p>
                  )}
                </>
              );
            })()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-[100]">
      <EmptyState message="Invalid Assessment State" />
    </div>
  );
};

export default SummativeAssessmentMobile;
