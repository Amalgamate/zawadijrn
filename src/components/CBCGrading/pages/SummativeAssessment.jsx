import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Save, Search, Loader, ArrowLeft, Printer, UploadCloud, Database, ChevronRight, FileSpreadsheet, Download, PlayCircle, Sparkles, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import VirtualizedTable from '../shared/VirtualizedTable';
import { assessmentAPI, gradingAPI, classAPI, configAPI, learnerAPI, aiAPI } from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';
import EmptyState from '../shared/EmptyState';
import { useAuth } from '../../../hooks/useAuth';
import { generatePDFWithLetterhead } from '../../../utils/simplePdfGenerator';
import BulkMarkImportModal from '../shared/BulkMarkImportModal';
import PDFPreviewModal from '../shared/PDFPreviewModal';
import { getGradeColor } from '../../../utils/grading/colors';
import { useAssessmentSetup } from '../hooks/useAssessmentSetup';
import { useLearningAreas } from '../hooks/useLearningAreas';
import { useTeacherWorkload } from '../hooks/useTeacherWorkload';
import { useSchoolData } from '../../../contexts/SchoolDataContext';
import { getLearningAreasByGrade } from '../../../constants/learningAreas';
import { getAcademicYearOptions, getCurrentAcademicYear } from '../utils/academicYear';

const SummativeAssessment = ({ learners, initialTestId, brandingSettings }) => {
  const { showSuccess, showError } = useNotifications();

  // Use centralized hooks for assessment state management
  const setup = useAssessmentSetup({
    defaultTerm: localStorage.getItem('cbc_summative_appliedTerm') || 'TERM_1',
    defaultGrade: localStorage.getItem('cbc_summative_appliedGrade') || '',
    defaultStream: localStorage.getItem('cbc_summative_appliedStream') || '',
    defaultAcademicYear: parseInt(localStorage.getItem('cbc_summative_appliedYear')) || getCurrentAcademicYear()
  });
  const learningAreasMgr = useLearningAreas(setup.selectedGrade);
  const teacherWorkload = useTeacherWorkload();

  // View State
  const [step, setStep] = useState(() => {
    if (initialTestId) return 2;
    const saved = localStorage.getItem('cbc_summative_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [loading, setLoading] = useState(true);

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [tests, setTests] = useState([]);
  const [selectedLearningArea, setSelectedLearningArea] = useState(() => localStorage.getItem('cbc_summative_appliedLearningArea') || '');
  const [selectedTestId, setSelectedTestId] = useState(() => localStorage.getItem('cbc_summative_appliedTestId') || '');
  const [marks, setMarks] = useState({});
  const [gradingScale, setGradingScale] = useState(null);
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const { grades: availableGrades } = useSchoolData();
  const [availableTerms, setAvailableTerms] = useState([]);
  const [availableStreams, setAvailableStreams] = useState([]);

  // Staged Filter State - Only apply when green button clicked
  const [stagedGrade, setStagedGrade] = useState(() => localStorage.getItem('cbc_summative_stagedGrade') || '');
  const [stagedStream, setStagedStream] = useState(() => localStorage.getItem('cbc_summative_stagedStream') || '');
  const [stagedTerm, setStagedTerm] = useState(() => localStorage.getItem('cbc_summative_stagedTerm') || '');
  const [stagedAcademicYear, setStagedAcademicYear] = useState(() => parseInt(localStorage.getItem('cbc_summative_stagedYear')) || getCurrentAcademicYear());
  const [stagedLearningArea, setStagedLearningArea] = useState(() => localStorage.getItem('cbc_summative_stagedLearningArea') || '');
  const [stagedTestId, setStagedTestId] = useState(() => localStorage.getItem('cbc_summative_stagedTestId') || '');

  // Persist staged filters and step
  useEffect(() => {
    localStorage.setItem('cbc_summative_stagedGrade', stagedGrade);
    localStorage.setItem('cbc_summative_stagedStream', stagedStream);
    localStorage.setItem('cbc_summative_stagedTerm', stagedTerm);
    localStorage.setItem('cbc_summative_stagedYear', stagedAcademicYear);
    localStorage.setItem('cbc_summative_stagedLearningArea', stagedLearningArea);
    localStorage.setItem('cbc_summative_stagedTestId', stagedTestId);
    if (!initialTestId) {
      localStorage.setItem('cbc_summative_step', step);
    }
  }, [stagedGrade, stagedStream, stagedTerm, stagedAcademicYear, stagedLearningArea, stagedTestId, step, initialTestId]);

  // Handler to apply filters when green button clicked
  const applyFilters = useCallback(() => {
    setup.updateGrade(stagedGrade);
    setup.updateStream(stagedStream);
    setup.updateTerm(stagedTerm);
    setup.updateAcademicYear(stagedAcademicYear);
    setSelectedLearningArea(stagedLearningArea);
    setSelectedTestId(stagedTestId);

    // Persist applied filters
    localStorage.setItem('cbc_summative_appliedGrade', stagedGrade);
    localStorage.setItem('cbc_summative_appliedStream', stagedStream);
    localStorage.setItem('cbc_summative_appliedTerm', stagedTerm);
    localStorage.setItem('cbc_summative_appliedYear', stagedAcademicYear);
    localStorage.setItem('cbc_summative_appliedLearningArea', stagedLearningArea);
    localStorage.setItem('cbc_summative_appliedTestId', stagedTestId);

    // Clear marks when filters applied
    if (stagedTestId !== selectedTestId) {
      setMarks({});
    }
  }, [stagedGrade, stagedStream, stagedTerm, stagedAcademicYear, stagedLearningArea, stagedTestId, selectedTestId, setup]);

  const [generatingAI, setGeneratingAI] = useState({});

  const handleGenerateAIComment = async (learnerId) => {
    try {
      setGeneratingAI(prev => ({ ...prev, [learnerId]: true }));
      const response = await aiAPI.generateFeedback(learnerId, setup.selectedTerm, setup.selectedAcademicYear);

      if (response.success && response.data) {
        setMarks(prev => ({
          ...prev,
          [learnerId]: {
            ...(prev[learnerId] || { mark: '' }),
            comment: response.data
          }
        }));
        showSuccess('AI comment generated successfully!');
      }
    } catch (error) {
      showError(error.message || 'Failed to generate AI comment');
    } finally {
      setGeneratingAI(prev => ({ ...prev, [learnerId]: false }));
    }
  };

  // User Context removed schoolId for single-tenant mode
  const { user } = useAuth();
  const schoolId = null;

  // Load Tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all tests for this school context
      const response = await assessmentAPI.getTests({});
      let testsData = [];
      if (response && response.data && Array.isArray(response.data)) {
        testsData = response.data;
      } else if (Array.isArray(response)) {
        testsData = response;
      }

      // Only show published, active tests (backend enforces this too)
      const activeTests = testsData.filter(t =>
        (t.status || '').toUpperCase() === 'PUBLISHED' && t.active !== false
      );

      setTests(activeTests);
    } catch (error) {
      console.error('Error loading tests:', error);
      showError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);


  // Load Terms, and Streams for selectors
  const loadOptions = useCallback(async () => {
    try {
      setAvailableTerms(['TERM_1', 'TERM_2', 'TERM_3']);
      // Streams from config
      if (true) {
        const streamsResp = await configAPI.getStreamConfigs();
        const streamsArr = (streamsResp && streamsResp.data) ? streamsResp.data : [];
        const streamNames = streamsArr.filter(s => s.active !== false).map(s => s.name);
        setAvailableStreams(streamNames);
      } else {
        setAvailableStreams([]);
      }
    } catch (error) {
      console.error('Error loading selector options:', error);
      // Safe defaults
      setAvailableTerms(['TERM_1', 'TERM_2', 'TERM_3']);
    }
  }, [schoolId]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Alert teacher if they have no assignments
  useEffect(() => {
    if (!teacherWorkload.loading && teacherWorkload.isTeacher && !teacherWorkload.hasAnyAssignments) {
      showError('You are not currently assigned to any classes or subjects. Please consult with the Head Teacher.');
    }
  }, [teacherWorkload.loading, teacherWorkload.isTeacher, teacherWorkload.hasAnyAssignments, showError]);

  // Derived Data
  const selectedTest = useMemo(() =>
    tests.find(t => String(t.id) === String(selectedTestId)),
    [selectedTestId, tests]
  );

  const filteredTestsBySelection = useMemo(() =>
    tests.filter(t => {
      if (setup.selectedGrade) {
        // Handle variations like GRADE_1 vs Grade 1 or GRADE 1
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

  // Staged filtered tests - for dropdown options while editing
  const stagedFilteredTestsBySelection = useMemo(() =>
    tests.filter(t => {
      if (stagedGrade) {
        const normalizedGrade = stagedGrade.replace(/\s+/g, '_').toUpperCase();
        const testGrade = (t.grade || '').replace(/\s+/g, '_').toUpperCase();
        if (testGrade !== normalizedGrade) return false;
      }
      if (stagedTerm) {
        const normalizedTerm = stagedTerm.toUpperCase().trim();
        const testTerm = (t.term || '').toUpperCase().trim();
        if (testTerm !== normalizedTerm) return false;
      }
      return true;
    }),
    [tests, stagedGrade, stagedTerm]
  );

  const availableLearningAreas = useMemo(() => {
    // Collect all learning areas from the filtered tests
    const areas = new Set();
    filteredTestsBySelection.forEach(t => {
      if (t.learningArea) areas.add(t.learningArea);
    });

    // Unified source: merge persisted tests + official grade map
    (learningAreasMgr.flatLearningAreas || []).forEach((area) => areas.add(area));

    return Array.from(areas).sort();
  }, [filteredTestsBySelection, learningAreasMgr.flatLearningAreas]);

  // Staged available learning areas - for dropdown options while editing
  const stagedAvailableLearningAreas = useMemo(() => {
    const areas = new Set();
    stagedFilteredTestsBySelection.forEach(t => {
      if (t.learningArea) areas.add(t.learningArea);
    });

    // Use grade-driven canonical learning areas for staged grade, even before "Load" is clicked
    const stagedOfficialAreas = stagedGrade ? getLearningAreasByGrade(stagedGrade) : [];
    stagedOfficialAreas.forEach((area) => areas.add(area));

    return Array.from(areas).sort();
  }, [stagedFilteredTestsBySelection, stagedGrade]);

  const filteredLearningAreasByWorkload = useMemo(() => {
    const areas = availableLearningAreas;
    if (!teacherWorkload.isTeacher || !setup.selectedGrade) return areas;

    const assignedSubjects = teacherWorkload.getAssignedSubjectsForGrade(setup.selectedGrade);
    if (!assignedSubjects) return areas;

    const normalize = (val) => String(val || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '').trim();

    return areas.filter(area =>
      assignedSubjects.some(as => normalize(as) === normalize(area))
    );
  }, [availableLearningAreas, teacherWorkload.isTeacher, setup.selectedGrade, teacherWorkload]);

  // Staged filtered learning areas - for dropdown options while editing
  const stagedFilteredLearningAreasByWorkload = useMemo(() => {
    const areas = stagedAvailableLearningAreas;
    if (!teacherWorkload.isTeacher || !stagedGrade) return areas;

    const assignedSubjects = teacherWorkload.getAssignedSubjectsForGrade(stagedGrade);
    if (!assignedSubjects) return areas;

    const normalize = (val) => String(val || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '').trim();

    return areas.filter(area =>
      assignedSubjects.some(as => normalize(as) === normalize(area))
    );
  }, [stagedAvailableLearningAreas, teacherWorkload.isTeacher, stagedGrade, teacherWorkload]);

  const finalTests = useMemo(() => {
    if (!selectedLearningArea) return [];

    const normalize = (val) => String(val || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '').trim();
    const normalizedSelected = normalize(selectedLearningArea);

    return filteredTestsBySelection.filter(t => {
      const testArea = normalize(t.learningArea);
      return testArea === normalizedSelected;
    });
  }, [filteredTestsBySelection, selectedLearningArea]);

  // Staged final tests - for dropdown options while editing
  const stagedFinalTests = useMemo(() => {
    if (!stagedLearningArea) return [];

    const normalize = (val) => String(val || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '').trim();
    const normalizedSelected = normalize(stagedLearningArea);

    return stagedFilteredTestsBySelection.filter(t => {
      const testArea = normalize(t.learningArea);
      return testArea === normalizedSelected;
    });
  }, [stagedFilteredTestsBySelection, stagedLearningArea]);

  // Sort grades from lowest to highest
  const gradeOrder = ['PLAYGROUP', 'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9'];

  const filteredGrades = useMemo(() => {
    const gradesFromTests = [...new Set(
      tests
        .map((test) => String(test?.grade || '').trim())
        .filter(Boolean)
        .map((grade) => grade.replace(/\s+/g, '_').toUpperCase())
    )];

    const mergedGrades = [...new Set([...(availableGrades || []), ...gradesFromTests])];

    let grades = !teacherWorkload.isTeacher
      ? mergedGrades
      : mergedGrades.filter(g => teacherWorkload.assignedGrades.includes(g));

    // Sort by grade order
    return grades.sort((a, b) => {
      const aIndex = gradeOrder.indexOf(a);
      const bIndex = gradeOrder.indexOf(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [availableGrades, tests, teacherWorkload.isTeacher, teacherWorkload.assignedGrades]);


  // Effects for Auto-selection & Prefill
  // 1. Auto-prefill Grade and Stream for teachers
  useEffect(() => {
    if (teacherWorkload.isTeacher && !teacherWorkload.loading && step === 1) {
      if (!setup.selectedGrade && teacherWorkload.primaryGrade) {
        setup.setSelectedGrade(teacherWorkload.primaryGrade);
      }
      if (!setup.selectedStream && teacherWorkload.primaryStream) {
        setup.setSelectedStream(teacherWorkload.primaryStream);
      }

      if (!stagedGrade && teacherWorkload.primaryGrade) {
        setStagedGrade(teacherWorkload.primaryGrade);
      }
      if (!stagedStream && teacherWorkload.primaryStream) {
        setStagedStream(teacherWorkload.primaryStream);
      }
      if (!stagedTerm) {
        setStagedTerm('TERM_1');
      }
    }
  }, [
    teacherWorkload.isTeacher,
    teacherWorkload.loading,
    teacherWorkload.primaryGrade,
    teacherWorkload.primaryStream,
    setup,
    step,
    stagedGrade,
    stagedStream,
    stagedTerm,
  ]);

  // 2. Auto-select Learning Area if only one is available
  useEffect(() => {
    if (teacherWorkload.isTeacher && filteredLearningAreasByWorkload.length === 1 && !selectedLearningArea && step === 1) {
      setSelectedLearningArea(filteredLearningAreasByWorkload[0]);
    }
  }, [teacherWorkload.isTeacher, filteredLearningAreasByWorkload, selectedLearningArea, step]);

  // 3. Auto-select Test if only one is available
  useEffect(() => {
    if (teacherWorkload.isTeacher && finalTests.length === 1 && !selectedTestId && step === 1) {
      setSelectedTestId(finalTests[0].id);
    }
  }, [teacherWorkload.isTeacher, finalTests, selectedTestId, step]);

  // Fetch Learners state (declared early to be used in assessmentProgress)
  const [fetchedLearners, setFetchedLearners] = useState([]);
  const [loadingLearners, setLoadingLearners] = useState(false);

  // Calculate Assessment Progress
  const assessmentProgress = useMemo(() => {
    const totalLearners = fetchedLearners.length;
    const assessedCount = Object.keys(marks).filter(learnerId => {
      const mark = marks[learnerId]?.mark;
      return mark !== null && mark !== undefined && mark !== '';
    }).length;

    const percentage = totalLearners > 0 ? Math.round((assessedCount / totalLearners) * 100) : 0;
    const isComplete = assessedCount === totalLearners && totalLearners > 0;

    return { assessed: assessedCount, total: totalLearners, percentage, isComplete };
  }, [marks, fetchedLearners]);

  // Calculate Statistics for PDF
  const statistics = useMemo(() => {
    const validMarks = Object.values(marks).map(m => m?.mark).filter(m => m !== null && m !== undefined && m !== '');
    const numericMarks = validMarks.map(m => parseFloat(m));

    if (numericMarks.length === 0) {
      return { sum: 0, average: 0, count: 0, min: 0, max: 0, gradeDistribution: {} };
    }

    const sum = numericMarks.reduce((acc, val) => acc + val, 0);
    const average = sum / numericMarks.length;
    const min = Math.min(...numericMarks);
    const max = Math.max(...numericMarks);

    // Calculate grade distribution if grading scale exists
    const gradeDistribution = {};
    if (gradingScale && gradingScale.ranges && selectedTest?.totalMarks) {
      numericMarks.forEach(mark => {
        const percentage = (mark / selectedTest.totalMarks) * 100;
        const range = gradingScale.ranges.find(r =>
          percentage >= r.minPercentage && percentage <= r.maxPercentage
        );
        if (range) {
          const label = range.label || range.grade || 'Unknown';
          gradeDistribution[label] = (gradeDistribution[label] || 0) + 1;
        }
      });
    }

    return { sum, average: average.toFixed(2), count: numericMarks.length, min, max, gradeDistribution };
  }, [marks, gradingScale, selectedTest]);

  // Chunk learners into pages of 15 for PDF
  const learnersForPDF = useMemo(() => {
    return fetchedLearners.sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [fetchedLearners]);

  const chunkedLearners = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < learnersForPDF.length; i += 15) {
      chunks.push(learnersForPDF.slice(i, i + 15));
    }
    return chunks;
  }, [learnersForPDF]);

  // Load Grading Scale and Existing Results
  useEffect(() => {
    const loadTestDetails = async () => {
      if (!selectedTestId) {
        setGradingScale(null);
        setMarks({});
        return;
      }
      try {
        // 1. Fetch Grading Scale using selectedTest (resolved from state)
        const test = tests.find(t => String(t.id) === String(selectedTestId));
        if (test) {
          const systems = await gradingAPI.getSystems();
          let scale = null;

          if (test.scaleId) {
            scale = systems.find(s => String(s.id) === String(test.scaleId));
          }

          if (!scale) {
            const normalizedGrade = String(test.grade || '').replace(/\s+/g, '_').toUpperCase();
            const normalizedArea = String(test.learningArea || '').toUpperCase().trim();

            scale = systems.find(s => {
              const systemName = String(s.name).toUpperCase();
              const hasGrade = systemName.includes(normalizedGrade);

              if (!hasGrade) return false;

              if (systemName.includes(normalizedArea)) return true;
              if (normalizedArea.includes('MATHEMATIC') && systemName.includes('MATHEMATIC')) return true;
              if (normalizedArea.includes('LANGUAGE') && systemName.includes('LANGUAGE')) return true;
              if (normalizedArea.includes('ENVIRONMENTAL') && systemName.includes('ENVIRONMENTAL')) return true;
              if (normalizedArea.includes('CREATIVE') && systemName.includes('CREATIVE')) return true;
              if (normalizedArea.includes('RELIGIOUS') && systemName.includes('RELIGIOUS')) return true;

              return false;
            });
          }

          if (scale && scale.ranges) {
            scale.ranges.sort((a, b) => b.minPercentage - a.minPercentage);
            setGradingScale(scale);
          } else {
            setGradingScale(null);
          }
        }



        // 3. Fetch Existing Marks or Load from Draft
        const draftKey = `draft-marks-${selectedTestId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          setMarks(parsedDraft);
          setIsDraft(true);
          setLastSaved(new Date());
          showSuccess('Draft marks restored automatically');
        } else {
          const resultsResponse = await assessmentAPI.getTestResults(selectedTestId);
          const results = resultsResponse.data || resultsResponse || [];

          const existingMarks = {};
          results.forEach(r => {
            if (r.learnerId) {
              existingMarks[r.learnerId] = {
                mark: r.marksObtained,
                comment: r.teacherComment || ''
              };
            }
          });
          setMarks(existingMarks);
          setIsDraft(false);
          setLastSaved(null);
        }

      } catch (error) {
        console.error('Error loading test details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTestDetails();
  }, [selectedTestId, tests, schoolId, showSuccess]);

  // Clear stale selected test IDs from localStorage/context if they no longer exist
  useEffect(() => {
    if (!selectedTestId) return;

    const exists = tests.some((test) => String(test.id) === String(selectedTestId));
    if (!exists) {
      setSelectedTestId('');
      setStagedTestId('');
      setMarks({});
      localStorage.removeItem('cbc_summative_appliedTestId');
      localStorage.removeItem('cbc_summative_stagedTestId');
    }
  }, [selectedTestId, tests]);

  // Auto-save marks to localStorage with debouncing
  useEffect(() => {
    if (!selectedTestId) return;

    const draftKey = `draft-marks-${selectedTestId}`;

    // Only save if there are marks and they aren't the same as existing (to avoid initial blank save)
    const timeoutId = setTimeout(() => {
      if (Object.keys(marks).length > 0) {
        localStorage.setItem(draftKey, JSON.stringify(marks));
        setIsDraft(true);
        setLastSaved(new Date());
        console.log('Draft marks auto-saved.');
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [marks, selectedTestId]);


  // Fetch Learners when test is selected
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedTestId && selectedTest) {
      const fetchLearners = async () => {
        setLoadingLearners(true);
        try {
          // Fetch learners for the selected Grade and Stream
          // Use learnerAPI.getAll with filters
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
        } catch (error) {
          console.error('Error fetching learners:', error);
          showError('Failed to load learners');
          setFetchedLearners([]);
        } finally {
          setLoadingLearners(false);
        }
      };

      fetchLearners();
    }
  }, [selectedTestId, selectedTest, setup.selectedStream, showError])

  const filteredLearners = useMemo(() => {
    let result = fetchedLearners;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.firstName + ' ' + l.lastName).toLowerCase().includes(query) ||
        (l.admissionNumber || '').toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [fetchedLearners, searchQuery]);

  // Helpers
  const handleMarkChange = (learnerId, value) => {
    const numValue = parseFloat(value);
    if (value === '') {
      setMarks(prev => ({
        ...prev,
        [learnerId]: {
          ...(prev[learnerId] || {}),
          mark: ''
        }
      }));
      return;
    }

    if (!isNaN(numValue)) {
      setMarks(prev => ({
        ...prev,
        [learnerId]: {
          ...(prev[learnerId] || {}),
          mark: Math.min(Math.max(0, numValue), selectedTest?.totalMarks || 100)
        }
      }));
    }
  };

  const handleCommentChange = (learnerId, value) => {
    setMarks(prev => ({
      ...prev,
      [learnerId]: {
        ...(prev[learnerId] || { mark: '' }),
        comment: value
      }
    }));
  };

  const getDescriptionForGrade = (mark, total, learnerName) => {
    if (!total || mark === undefined || mark === null || mark === '') return 'Not assessed';

    const percentage = (mark / total) * 100;

    if (gradingScale && gradingScale.ranges) {
      const range = gradingScale.ranges.find(r =>
        percentage >= r.minPercentage && percentage <= r.maxPercentage
      );
      if (range && range.description) {
        return range.description.replace(/\{\{learner\}\}/g, learnerName || 'Learner');
      }
      return range ? range.label : 'Not assessed';
    }

    return 'Not assessed';
  };



  const handlePrintReport = async (onProgress) => {
    try {
      setGeneratingPDF(true);

      if (onProgress) onProgress('Preparing report...', 10);

      // Elements are already visible from the preview modal
      // Just add a small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onProgress) onProgress('Processing content...', 20);

      // Get school information from user context and branding settings
      const schoolInfo = {
        schoolName: user?.school?.name || brandingSettings?.schoolName || 'School Name',
        address: user?.school?.address || brandingSettings?.address || 'School Address',
        phone: user?.school?.phone || brandingSettings?.phone || 'Phone Number',
        email: user?.school?.email || brandingSettings?.email || 'email@school.com',
        website: user?.school?.website || brandingSettings?.website || 'www.school.com',
        logoUrl: brandingSettings?.logoUrl || user?.school?.logo || '/logo-new.png',
        brandColor: brandingSettings?.brandColor || '#1e3a8a',
        skipLetterhead: true
      };

      // Generate filename
      const testName = (selectedTest?.title || selectedTest?.name || 'test').replace(/\s+/g, '_');
      const grade = selectedTest?.grade?.replace('_', '') || 'Grade';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${grade}_${testName}_Results_${timestamp}.pdf`;

      // Generate PDF with LANDSCAPE orientation for better table display
      const result = await generatePDFWithLetterhead(
        'assessment-report-content',
        filename,
        schoolInfo,
        {
          orientation: 'landscape',
          scale: 2,
          multiPage: true,
          onProgress: (message, progress) => {
            console.log(`PDF Generation: ${message} (${progress}%)`);
            if (onProgress) {
              onProgress(message, progress);
            }
          }
        }
      );

      if (result.success) {
        if (onProgress) onProgress('Complete!', 100);
        showSuccess('✅ PDF report downloaded successfully!');
      } else {
        showError(`Failed to generate PDF: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('Print report error:', error);
      showError('Failed to generate PDF report');
      throw error;
    } finally {
      setGeneratingPDF(false);
      setLoading(false);
    }
  };

  const handleExport = (type = 'xlsx') => {
    if (filteredLearners.length === 0) {
      showError("No data to export");
      return;
    }

    const exportData = filteredLearners.map(l => ({
      'Admission Number': l.admissionNumber,
      'Student Name': `${l.firstName} ${l.lastName}`,
      'Mark': marks[l.id]?.mark || '',
      'Teacher Comment': marks[l.id]?.comment || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");

    const fileName = `${(selectedTest?.title || 'Marks').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    if (type === 'xlsx') {
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else {
      XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
    }
    showSuccess(`Successfully exported to ${type.toUpperCase()}`);
  };

  const handleSave = async (marksToSaveOverride = null) => {
    const currentMarksToSave = marksToSaveOverride || marks;



    if (Object.keys(currentMarksToSave).length === 0) {
      showError('No marks entered to save');
      return;
    }

    try {
      setLoading(true);

      // 🚨 CRITICAL FIX #1: Check for existing results before saving
      const existingResultsResponse = await assessmentAPI.getTestResults(selectedTestId);
      const existingResults = existingResultsResponse.data || existingResultsResponse || [];

      if (existingResults.length > 0) {
        const publishedResultsCount = existingResults.filter(r => r.status === 'PUBLISHED').length;

        let confirmTitle = 'Results Already Exist';
        let confirmMessage = `Results already exist for ${existingResults.length} learner(s) in this test.\\n\\n`;

        if (publishedResultsCount > 0) {
          confirmTitle = '⚠️ Warning: Published Results Exist';
          confirmMessage += `**${publishedResultsCount} result(s) are PUBLISHED.** Overwriting will affect report cards and student records.\\n\\n`;
        }

        confirmMessage += `New marks to save: ${Object.keys(currentMarksToSave).length} learner(s).\\n\\nAre you sure you want to overwrite these results?`;

        const userConfirmed = window.confirm(`${confirmTitle}\\n\\n${confirmMessage}`);

        if (!userConfirmed) {
          setLoading(false);
          showError('Save cancelled - existing results were not overwritten');
          return;
        }

        showSuccess('Overwriting existing results...');
      }

      // Prepare bulk payload — skip learners with no mark entered
      const resultsToSave = Object.entries(currentMarksToSave)
        .filter(([, markData]) => {
          const m = markData?.mark;
          return m !== null && m !== undefined && m !== '';
        })
        .map(([learnerId, markData]) => {
        const mark = markData.mark;
        // Find existing result to preserve remarks if not new mark
        const existingResult = existingResults.find(r => r.learnerId === learnerId);
        let remarks = existingResult?.remarks || '-'; // Use existing remarks if available
        // Remove the automatic fallback that saves "Score: X/Y" as a comment.
        // This prevents desynchronized score data in the comment field.
        let teacherComment = markData.comment || existingResult?.teacherComment || '';

        if (selectedTest?.totalMarks && mark !== null && mark !== undefined && mark !== '') {
          const percentage = (mark / selectedTest.totalMarks) * 100;
          if (gradingScale && gradingScale.ranges) {
            const range = gradingScale.ranges.find(r => percentage >= r.minPercentage && percentage <= r.maxPercentage);
            remarks = range ? range.label : remarks; // Update remarks only if a new range is found
          }
        }

        return {
          learnerId,
          marksObtained: mark,
          remarks,
          teacherComment
        };
      });

      if (resultsToSave.length === 0) {
        setLoading(false);
        showError('No marks to save — enter at least one score first.');
        return;
      }

      // Send bulk request
      await assessmentAPI.recordBulkResults({
        testId: selectedTestId,
        results: resultsToSave
      });

      showSuccess(`Successfully saved marks for ${resultsToSave.length} learner(s)!`);
      // After successful save, refresh marks from backend to ensure consistency
      const updatedResultsResponse = await assessmentAPI.getTestResults(selectedTestId);
      const updatedResults = updatedResultsResponse.data || updatedResultsResponse || [];
      const updatedMarks = {};
      updatedResults.forEach(r => {
        if (r.learnerId) {
          updatedMarks[r.learnerId] = {
            mark: r.marksObtained,
            comment: r.teacherComment || ''
          };
        }
      });
      setMarks(updatedMarks);
      localStorage.removeItem(`draft-marks-${selectedTestId}`); // Clear draft after successful save
    } catch (error) {
      console.error('Save error:', error);
      showError('Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  // Render Main Page with persistent filter bar
  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Combined Sticky Header + Filter Bar - Unified Component */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        {/* Assessment Header - Renders above filter when test selected */}
        {selectedTestId && (
          <div className="border-b border-gray-100 px-6 py-4 flex gap-4">
            <div className="flex-1">
              {/* Top Row: Context & Helper */}
              <div className="flex items-center justify-between mb-2 h-5">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span>Assessment</span>
                  <ChevronRight size={10} className="text-gray-300" />
                  <span className="capitalize">{setup.selectedGrade?.replace(/_/g, ' ').toLowerCase()}</span>
                  <ChevronRight size={10} className="text-gray-300" />
                  <span className="capitalize">{setup.selectedTerm?.replace(/_/g, ' ').toLowerCase()}</span>
                </div>


              </div>

              {/* Bottom Row: Title & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-800 leading-none">
                    {selectedTest?.title || selectedTest?.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${assessmentProgress.percentage === 100
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                    {assessmentProgress.percentage}% Complete
                  </span>

                  {selectedTest?.weight !== undefined && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border bg-amber-50 text-amber-700 border-amber-200">
                      Weight: {selectedTest.weight}
                    </span>
                  )}

                  {isDraft && (
                    <span className="text-[10px] text-gray-400 font-medium italic flex items-center gap-1.5 ml-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Saved {lastSaved && `at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center">
                  <button
                    onClick={() => setShowPDFPreview(true)}
                    disabled={generatingPDF || filteredLearners.length === 0}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview
                  </button>

                  <div className="h-3 w-px bg-gray-200 mx-3" />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport('xlsx')}
                      disabled={filteredLearners.length === 0}
                      className="flex items-center gap-1.5 text-sm font-medium text-brand-purple hover:text-brand-purple/80 transition-colors disabled:opacity-50"
                      title="Export to Excel"
                    >
                      <FileSpreadsheet size={16} />
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      disabled={filteredLearners.length === 0}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                      title="Export to CSV"
                    >
                      <Download size={16} />
                      CSV
                    </button>
                  </div>

                  <div className="h-3 w-px bg-gray-200 mx-3" />

                  <button
                    onClick={() => setShowBulkImportModal(true)}
                    disabled={!selectedTestId || loading || loadingLearners}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-teal hover:text-brand-teal/80 transition-colors disabled:opacity-50"
                  >
                    <UploadCloud size={16} />
                    Import
                  </button>

                  <div className="h-3 w-px bg-gray-200 mx-3" />

                  <button
                    onClick={() => handleSave()}
                    disabled={loading}
                    className="text-sm font-bold text-[#0D9488] hover:text-[#0f766e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar - Always visible below header */}
        <div className="border-t border-slate-200 px-6 py-3.5">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Grade - Compact Input */}
            <select
              value={stagedGrade}
              onChange={(e) => {
                setStagedGrade(e.target.value);
                setStagedLearningArea('');
                setStagedTestId('');
              }}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-24"
              title="Select Grade"
            >
              <option value="">Grade</option>
              {filteredGrades.map(g => (
                <option key={g} value={g}>
                  {g.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Stream - Compact */}
            <select
              value={stagedStream}
              onChange={(e) => setStagedStream(e.target.value)}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-20"
              title="Select Stream"
            >
              <option value="">Stream</option>
              {availableStreams.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Academic Term - Compact */}
            <select
              value={stagedTerm}
              onChange={(e) => {
                setStagedTerm(e.target.value);
                setStagedLearningArea('');
                setStagedTestId('');
              }}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-24"
              title="Select Term"
            >
              <option value="">Term</option>
              {availableTerms.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>

            {/* Academic Year - Compact */}
            <select
              value={stagedAcademicYear}
              onChange={(e) => {
                setStagedAcademicYear(parseInt(e.target.value));
                setStagedLearningArea('');
                setStagedTestId('');
              }}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-24"
              title="Select Academic Year"
            >
              <option value="">Year</option>
              {getAcademicYearOptions().map(y => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>

            {/* Learning Area - Balanced */}
            <select
              value={stagedLearningArea}
              onChange={(e) => {
                setStagedLearningArea(e.target.value);
                setStagedTestId('');
              }}
              disabled={!stagedGrade || !stagedTerm || stagedAvailableLearningAreas.length === 0}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 flex-1 min-w-[120px]"
              title="Select Learning Area"
            >
              <option value="">
                {!stagedGrade || !stagedTerm
                  ? 'Area'
                  : 'Area'}
              </option>
              {stagedFilteredLearningAreasByWorkload.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>

            {/* Test - Balanced */}
            <select
              value={stagedTestId}
              onChange={(e) => setStagedTestId(e.target.value)}
              disabled={stagedFinalTests.length === 0}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 flex-1 min-w-[120px]"
              title="Select Test"
            >
              <option value="">
                {stagedFinalTests.length === 0
                  ? (stagedLearningArea ? 'No tests' : 'Test')
                  : 'Test'}
              </option>
              {stagedFinalTests.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title || t.name}
                </option>
              ))}
            </select>

            {/* Apply Filters Button - Green button clicked to apply filters */}
            <button
              onClick={applyFilters}
              disabled={!stagedTestId}
              className="h-9 px-3 rounded bg-brand-teal hover:bg-brand-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
              title={stagedTestId ? 'Click to load assessment' : 'Select a test first'}
            >
              <PlayCircle size={16} className="text-white" />
              <span className="text-xs font-medium text-white">Load</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedTestId && (
        <div className="px-6 py-12">
          <EmptyState
            icon={Database}
            title="No Assessment Selected"
            message="Select a grade, term, learning area, and test to begin recording assessments. The results table will appear below the filters as soon as you make a selection."
            actionText="Go to Test Management"
            onAction={() => window.location.hash = '#/assess-summative-tests'}
          />
        </div>
      )}

      {/* Assessment Table - Renders below filter bar when test selected */}
      {selectedTestId && (
        <div className="p-6">
          {/* PDF Export Content Wrapper */}
          <div id="assessment-report-content" className="bg-white">

            {/* STUDENT RESULTS TABLES (Chunked for pagination) */}
            {chunkedLearners.map((chunk, pageIndex) => (
              <div
                key={pageIndex}
                className="px-5 print-only flex flex-col"
                style={{
                  pageBreakBefore: pageIndex === 0 ? 'avoid' : 'always',
                  pageBreakAfter: pageIndex === chunkedLearners.length - 1 ? 'auto' : 'always',
                  pageBreakInside: 'avoid',
                  minHeight: '100vh',
                  // Standard document margins: 1 inch / 25.4mm top & bottom, 0.75 inch / 19mm sides
                  paddingTop: pageIndex === 0 ? '20px' : '95px', // 1 inch (25.4mm) for subsequent pages, less for first with letterhead
                  paddingBottom: '113px', // 30mm to safely avoid footer
                  paddingLeft: '20px', // ~19mm left margin
                  paddingRight: '20px', // ~19mm right margin
                  marginLeft: '0',
                  marginRight: '0'
                }}
              >
                {/* Letterhead / Page Header - Logo Left, Text Right - First Page Only */}
                {pageIndex === 0 && (
                  <div style={{
                    paddingBottom: '1rem',
                    borderBottom: '3px solid #1e3a8a',
                    marginBottom: '1.5rem',
                    pageBreakInside: 'avoid'
                  }}>
                    <div className="flex items-center justify-between gap-8">
                      {/* Logo Column - Left */}
                      <div className="flex-shrink-0 pr-6">
                        <img
                          src={brandingSettings?.logoUrl || user?.school?.logo || '/logo-new.png'}
                          alt="School Logo"
                          className="h-24 w-24 object-contain"
                          onError={(e) => { e.target.src = '/logo-new.png'; }}
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(30, 58, 138, 0.1))' }}
                        />
                      </div>

                      {/* Text Content Column - Right, Right-Aligned */}
                      <div className="flex-1 text-right">
                        <h1 className="text-2xl font-bold text-[#1e3a8a] uppercase tracking-wider leading-tight">
                          {user?.school?.name || user?.schoolName || 'SCHOOL NAME'}
                        </h1>
                        <h2 className="text-base font-bold text-gray-800 leading-tight mt-1">
                          Summative Assessment Results
                        </h2>
                        <p className="text-sm text-gray-700 font-semibold leading-tight mt-0.5">
                          {selectedTest?.learningArea} | {selectedTest?.grade?.replace('_', ' ')} | {setup.selectedStream || 'All Streams'}
                        </p>
                        <p className="text-sm text-gray-600 leading-tight mt-0.5">
                          {selectedTest?.term?.replace('_', ' ')} {selectedTest?.academicYear || new Date().getFullYear()} | Total Marks: {selectedTest?.totalMarks} | Weight: {selectedTest?.weight || '1.0'} | Test Date: {selectedTest?.testDate ? new Date(selectedTest.testDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table Container with safe padding */}
                <div className="flex-1 overflow-hidden" style={{
                  pageBreakInside: 'avoid',
                  paddingLeft: '0',
                  paddingRight: '0',
                  marginBottom: '50px', // Keep table away from footer
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <table className="w-full text-left border-collapse border border-gray-300" style={{ pageBreakInside: 'avoid' }}>
                    <thead className="bg-[#1e3a8a] text-white" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'avoid' }}>
                      <tr style={{ pageBreakInside: 'avoid' }}>
                        <th className="px-2 py-2 text-[9px] font-bold uppercase tracking-wide text-center w-10 border-r border-blue-700">No</th>
                        <th className="px-2 py-2 text-[9px] font-bold uppercase tracking-wide text-center w-20 border-r border-blue-700">Adm No</th>
                        <th className="px-2 py-2 text-[9px] font-bold uppercase tracking-wide border-r border-blue-700">Student Name</th>
                        <th className="px-2 py-2 text-[9px] font-bold uppercase tracking-wide text-center w-20 border-r border-blue-700">Score</th>
                        <th className="px-2 py-2 text-[9px] font-bold uppercase tracking-wide w-72">Performance Descriptor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {chunk.map((learner, index) => {
                        const globalIndex = pageIndex * 10 + index;
                        const score = marks[learner.id];

                        return (
                          <tr key={learner.id} className={`${index % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'}`} style={{ pageBreakInside: 'avoid' }}>
                            <td className="px-2 py-1.5 text-xs text-center font-semibold text-gray-700 border-r border-gray-200">{globalIndex + 1}</td>
                            <td className="px-2 py-1.5 text-xs text-center font-semibold text-gray-900 border-r border-gray-200">{learner.admissionNumber}</td>
                            <td className="px-2 py-1.5 text-xs font-bold text-[#1e293b] border-r border-gray-200">
                              {learner.firstName?.toUpperCase()} {learner.lastName?.toUpperCase()}
                            </td>
                            <td className="px-2 py-1.5 text-center border-r border-gray-200">
                              <span className="inline-block font-bold text-sm text-gray-900">
                                {score?.mark ?? '-'}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-[10px] text-[#475569] italic leading-snug">
                              {getDescriptionForGrade(marks[learner.id]?.mark, selectedTest?.totalMarks, learner.firstName)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Summary row on LAST page only */}
                    {pageIndex === chunkedLearners.length - 1 && (
                      <tfoot className="bg-gray-100 border-t-2 border-gray-400">
                        <tr>
                          <td colSpan="3" className="px-2 py-2 text-xs font-bold text-gray-800 text-right">
                            Summary:
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <div className="text-[10px] font-bold text-gray-900">
                              Avg: {statistics.average}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-[10px] text-gray-700">
                            Total: <span className="font-bold">{statistics.count}</span> |
                            Sum: <span className="font-bold">{statistics.sum.toFixed(2)}</span> |
                            Range: <span className="font-bold">{statistics.min}-{statistics.max}</span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Page number */}
                <div className="text-right text-xs text-gray-500 mt-auto pt-4" style={{
                  marginTop: 'auto',
                  paddingTop: '1rem',
                  pageBreakInside: 'avoid'
                }}>
                  Page {pageIndex + 2} of {chunkedLearners.length + 1}
                </div>
              </div>
            ))}
          </div>

          {/* INTERACTIVE TABLE FOR SCREEN (with search) - NOT printed */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 no-print">
            <div className="p-4 border-b border-gray-200 flex justify-start">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or adm no..."
                  className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-purple focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <VirtualizedTable
                data={filteredLearners}
                rowHeight={40} // Compact row height for assessment
                visibleHeight={500}
                emptyComponent={
                  <div className="px-6 py-12 text-center text-gray-500 text-sm">
                    No learners found for this grade/stream.
                  </div>
                }
                header={
                  <tr className="bg-brand-purple text-white">
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-center w-10 border-r border-brand-purple/20">No</th>
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-center w-32 border-r border-brand-purple/20">Adm No</th>
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wide border-r border-brand-purple/20 w-1/3">Student Name</th>
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-center w-20 border-r border-brand-purple/20">Score</th>
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wide border-r border-brand-purple/20 w-1/4">Comments ✨</th>
                    <th className="px-3 py-2 text-[9px] font-bold uppercase tracking-wide">Descriptor</th>
                  </tr>
                }
                renderRow={(learner, index) => {
                  const score = marks[learner.id];
                  return (
                    <tr key={learner.id} className={`${index % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white'} hover:bg-[#f1f5f9] transition`}>
                      <td className="px-3 py-1.5 text-xs text-center font-semibold text-gray-700 border-r border-gray-200">{index + 1}</td>
                      <td className="px-3 py-1.5 text-xs text-center font-semibold text-gray-900 border-r border-gray-200">{learner.admissionNumber}</td>
                      <td className="px-3 py-1.5 text-xs font-bold text-[#1e293b] border-r border-gray-200">
                        {learner.firstName?.toUpperCase()} {learner.lastName?.toUpperCase()}
                      </td>
                      <td className="px-3 py-1.5 text-center border-r border-gray-200">
                        <input
                          type="number"
                          min="0"
                          max={selectedTest?.totalMarks}
                          value={marks[learner.id]?.mark ?? ''}
                          onChange={(e) => handleMarkChange(learner.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 bg-white rounded focus:ring-2 focus:ring-brand-purple outline-none transition text-center font-semibold text-xs"
                          placeholder="-"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <textarea
                            value={marks[learner.id]?.comment ?? ''}
                            onChange={(e) => handleCommentChange(learner.id, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 bg-white rounded focus:ring-2 focus:ring-brand-purple outline-none transition text-xs"
                            rows="1"
                            placeholder="Add narrative feedback..."
                          />
                          <button
                            onClick={() => handleGenerateAIComment(learner.id)}
                            disabled={generatingAI[learner.id]}
                            className="p-1 text-brand-purple hover:bg-purple-100 rounded transition"
                            title="AI Suggester"
                          >
                            {generatingAI[learner.id] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-[10px] text-[#475569] italic leading-snug">
                        {getDescriptionForGrade(marks[learner.id]?.mark, selectedTest?.totalMarks, learner.firstName)}
                      </td>
                    </tr>
                  );
                }}
              />
            </div>
          </div>

          {/* Bulk Mark Import Modal */}
          <BulkMarkImportModal
            show={showBulkImportModal}
            onClose={() => setShowBulkImportModal(false)}
            onImport={(importedMarks) => {
              // Wrap simple values into the expected object structure
              const formattedMarks = {};
              Object.entries(importedMarks).forEach(([id, val]) => {
                formattedMarks[id] = { mark: val, comment: '' };
              });
              setMarks(prevMarks => ({ ...prevMarks, ...formattedMarks }));
              handleSave(formattedMarks);
              setShowBulkImportModal(false);
            }}
            learners={fetchedLearners}
            totalMarks={selectedTest?.totalMarks}
          />

          {/* PDF Preview Modal */}
          <PDFPreviewModal
            show={showPDFPreview}
            onClose={() => setShowPDFPreview(false)}
            onGenerate={handlePrintReport}
            contentElementId="assessment-report-content"
            title={`${selectedTest?.learningArea || 'Assessment'} Results - ${selectedTest?.grade?.replace('_', ' ') || ''}`}
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// ENHANCED PIE CHART COMPONENT WITH LABELS
// ============================================
const PieChartWithLabels = ({ data }) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  let currentAngle = -90; // Start from top

  return (
    <g>
      {/* Draw pie slices with percentage labels */}
      {Object.entries(data).map(([grade, count]) => {
        const percentage = (count / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        // Calculate slice path
        const startX = 100 + 85 * Math.cos((startAngle * Math.PI) / 180);
        const startY = 100 + 85 * Math.sin((startAngle * Math.PI) / 180);
        const endX = 100 + 85 * Math.cos((endAngle * Math.PI) / 180);
        const endY = 100 + 85 * Math.sin((endAngle * Math.PI) / 180);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = [
          `M 100 100`,
          `L ${startX} ${startY}`,
          `A 85 85 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          `Z`
        ].join(' ');

        // Calculate label position (middle of slice)
        const middleAngle = (startAngle + endAngle) / 2;
        const labelRadius = 60; // Position labels mid-way in slice
        const labelX = 100 + labelRadius * Math.cos((middleAngle * Math.PI) / 180);
        const labelY = 100 + labelRadius * Math.sin((middleAngle * Math.PI) / 180);

        currentAngle = endAngle;

        return (
          <g key={grade}>
            {/* Pie Slice */}
            <path
              d={pathData}
              fill={getGradeColor(grade)}
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity="0.95"
            />

            {/* Percentage Label (show if >= 5%) */}
            {percentage >= 5 && (
              <>
                {/* White background circle for better readability */}
                <circle
                  cx={labelX}
                  cy={labelY}
                  r="12"
                  fill="white"
                  opacity="0.9"
                />

                {/* Percentage Text */}
                <text
                  x={labelX}
                  y={labelY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill={getGradeColor(grade)}
                >
                  {percentage.toFixed(0)}%
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Center Circle with Total Count */}
      <circle
        cx="100"
        cy="100"
        r="32"
        fill="white"
        stroke="#cbd5e1"
        strokeWidth="3"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
      />

      {/* Total Number */}
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="#1e293b"
      >
        {total}
      </text>

      {/* "Students" Label */}
      <text
        x="100"
        y="108"
        textAnchor="middle"
        fontSize="8"
        fill="#64748b"
        fontWeight="600"
      >
        Students
      </text>
    </g>
  );
};

export default SummativeAssessment;
