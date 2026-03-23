/**
 * Summary Report Page - Full Assessment Matrix
 * Professional, high-density grid for cross-subject analysis
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Loader, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  Printer,
  Table as TableIcon,
  Filter,
  RefreshCw,
  DownloadCloud,
  FileSpreadsheet,
  CheckCircle,
  Layout,
  Users
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import api, { configAPI, assessmentAPI, learnerAPI } from '../../../../services/api';
import { useSchoolData } from '../../../../contexts/SchoolDataContext';
import VirtualizedTable from '../../shared/VirtualizedTable';
import { getAcademicYearOptions, getCurrentAcademicYear } from '../../utils/academicYear';
import { learningAreas } from '../../data/learningAreas';
import { gradeStructure } from '../../data/gradeStructure';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

// ============================================================================
// CONSTANTS & UTILS
// ============================================================================

const LEARNING_AREA_ABBREVIATIONS = {
  'MATHEMATICS': 'MAT',
  'ENGLISH': 'ENG',
  'KISWAHILI': 'KIS',
  'SCIENCE AND TECHNOLOGY': 'SCI',
  'SOCIAL STUDIES': 'SST',
  'CHRISTIAN RELIGIOUS EDUCATION': 'CRE',
  'ISLAMIC RELIGIOUS EDUCATION': 'IRE',
  'CREATIVE ARTS AND SPORTS': 'ARTS',
  'AGRICULTURE': 'AGRI',
  'ENVIRONMENTAL ACTIVITIES': 'ENV',
  'HOMESCIENCE': 'H/SCI',
  'MUSIC': 'MUS',
  'ART AND CRAFT': 'ART',
  'PHYSICAL AND HEALTH EDUCATION': 'PHE',
  'SHUGHULI ZA KISWAHILI': 'KIS',
  'MATHEMATICAL ACTIVITIES': 'MAT',
  'ENGLISH LANGUAGE ACTIVITIES': 'ENG',
  'KISWAHILI LANGUAGE ACTIVITIES': 'KIS',
  'SCIENCE & TECHNOLOGY': 'SCI',
  'AGRICULTURE': 'AGRI',
  'PRE-TECHNICAL STUDIES': 'TECH',
  'INTEGRATED SCIENCE': 'I/SCI',
  'SOCIAL STUDIES & LIFE SKILLS': 'SST',
  'MOVEMENT AND CREATIVE ACTIVITIES': 'ARTS',
  'ENVIRONMENTAL STUDIES': 'ENV',
  'LITERACY ACTIVITIES': 'LIT',
  'LITERACY': 'LIT',
  'HYGIENE AND NUTRITION ACTIVITIES': 'HYG',
  'RELIGIOUS EDUCATION': 'RE'
};

const getAbbreviatedName = (name) => {
  if (!name) return '';
  const upper = name.toUpperCase().trim();
  return LEARNING_AREA_ABBREVIATIONS[upper] || (name.length > 8 ? name.substring(0, 8).toUpperCase() : name.toUpperCase());
};

const getCBCGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'EE1', remark: 'Exceeding', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (percentage >= 75) return { grade: 'EE2', remark: 'Exceeding', color: 'text-emerald-600', bg: 'bg-emerald-50/50' };
  if (percentage >= 58) return { grade: 'ME1', remark: 'Meeting', color: 'text-blue-700', bg: 'bg-blue-50' };
  if (percentage >= 41) return { grade: 'ME2', remark: 'Meeting', color: 'text-blue-600', bg: 'bg-blue-50/50' };
  if (percentage >= 31) return { grade: 'AE1', remark: 'Approaching', color: 'text-amber-700', bg: 'bg-amber-50' };
  if (percentage >= 21) return { grade: 'AE2', remark: 'Approaching', color: 'text-amber-600', bg: 'bg-amber-50/50' };
  if (percentage >= 11) return { grade: 'BE1', remark: 'Below', color: 'text-rose-700', bg: 'bg-rose-50' };
  return { grade: 'BE2', remark: 'Below', color: 'text-rose-800', bg: 'bg-rose-100' };
};

// ============================================================================
// COMPONENT
// ============================================================================

const SummaryReportPage = () => {
  const { user } = useAuth();
  const { grades: fetchedGrades, classes, loading: schoolDataLoading } = useSchoolData();

  // Filter States
  const [stagedGrade, setStagedGrade] = useState('');
  const [stagedStream, setStagedStream] = useState('all');
  const [stagedTerm, setStagedTerm] = useState('TERM_1');
  const [stagedYear, setStagedYear] = useState(getCurrentAcademicYear());

  // Data States
  const [loading, setLoading] = useState(false);
  const [matrixData, setMatrixData] = useState(null);
  const [noStudentsFound, setNoStudentsFound] = useState(false);
  const [availableStreams, setAvailableStreams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track last fetched configuration to avoid loops but allow auto-switching
  const lastFetchRef = useRef(null);

  // Initial Fetch: Streams
  useEffect(() => {
    const fetchStreams = async () => {
      if (user?.schoolId) {
        try {
          const resp = await configAPI.getStreamConfigs(user.schoolId);
          setAvailableStreams(resp?.data?.filter(s => s.active !== false) || []);
        } catch (error) {
          console.error('Failed to fetch streams:', error);
        }
      }
    };
    fetchStreams();
  }, [user?.schoolId]);

  // Handle Generation
  const handleGenerate = useCallback(async () => {
    if (!stagedGrade) return;

    // Update last fetch ref
    lastFetchRef.current = `${stagedGrade}-${stagedStream}-${stagedTerm}-${stagedYear}`;

    setLoading(true);
    setMatrixData(null);
    setNoStudentsFound(false);

    try {
      const apiParams = {
        grade: stagedGrade,
        academicYear: stagedYear,
        term: stagedTerm
      };
      if (stagedStream && stagedStream !== 'all') {
          apiParams.stream = stagedStream;
      }

      // 1. Fetch Students & Results concurrently
      const [studentsResp, resultsResp] = await Promise.all([
        learnerAPI.getByGrade(stagedGrade, apiParams.stream ? { stream: apiParams.stream } : {}),
        assessmentAPI.getBulkResults(apiParams)
      ]);

      if (!studentsResp.success) throw new Error('Failed to fetch students');
      
      const students = studentsResp.data || [];
      const rawResults = resultsResp.data || [];

      if (students.length === 0) {
        setNoStudentsFound(true);
        setLoading(false);
        return;
      }

      // 2. Identify Subjects — robust multi-strategy lookup
      const gradeObj = gradeStructure.find(g => g.code === stagedGrade);
      const gradeName = gradeObj ? gradeObj.name : stagedGrade.replace(/_/g, ' ');
      const gradeLevelName = gradeObj?.learningArea; // e.g. 'Lower Primary'

      // Build a mapping from gradeLevel label in learningAreas to gradeStructure.learningArea
      // This bridges the mismatch between 'Early Years' (learningAreas) and 'Pre-Primary' (gradeStructure)
      // Strategy: match both by grade name in the array AND by grade level
      const getExpectedSubjectsForGrade = () => {
        // First try: direct match by grade name in la.grades array
        const byGradeName = learningAreas.filter(la => 
          la.grades && la.grades.some(g => g.toLowerCase() === gradeName.toLowerCase())
        );
        if (byGradeName.length > 0) return byGradeName.map(la => la.name);

        // Second try: match by gradeLevel — handle Early Years / Pre-Primary mismatch
        const gradeLevelMap = {
          'Pre-Primary': ['Pre-Primary'],
          'Lower Primary': ['Lower Primary'],
          'Upper Primary': ['Upper Primary'],
          'Junior School': ['Junior School']
        };
        const matchingLevels = gradeLevelMap[gradeLevelName] || [gradeLevelName];
        const byLevel = learningAreas.filter(la => matchingLevels.includes(la.gradeLevel));
        if (byLevel.length > 0) return byLevel.map(la => la.name);

        return [];
      };

      const expectedSubjectNames = getExpectedSubjectsForGrade();
      
      // Seed map with expected subjects for this grade
      const subjectsMap = new Map();
      expectedSubjectNames.forEach(s => subjectsMap.set(s, s));
      
      // Add any subjects found in actual results that aren't already in the map
      rawResults.forEach(r => {
        if (r.test?.learningArea) {
          subjectsMap.set(r.test.learningArea, r.test.learningArea);
        }
      });
      const subjects = Array.from(subjectsMap.keys()).sort();

      // 3. Transform into Grid Data
      const gridRows = students.map(student => {
        const studentResults = rawResults.filter(r => r.learnerId === student.id);
        
        const subjectScores = {};
        let totalScore = 0;
        let totalMax = 0;
        let subjectsAssessed = 0;

        subjects.forEach(sub => {
          const res = studentResults.find(r => r.test?.learningArea === sub);
          if (res) {
            subjectScores[sub] = {
              marks: res.marksObtained,
              max: res.test?.totalMarks || 100,
              grade: res.grade,
              percentage: res.percentage
            };
            totalScore += res.marksObtained;
            totalMax += (res.test?.totalMarks || 100);
            subjectsAssessed++;
          } else {
            subjectScores[sub] = null;
          }
        });

        const overallPct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
        const { grade: overallGrade, color: gradeColor, bg: gradeBg } = getCBCGrade(overallPct);

        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          stream: student.stream,
          subjectScores,
          totalScore: totalScore.toFixed(0),
          averagePct: overallPct.toFixed(1),
          overallGrade,
          gradeColor,
          gradeBg,
          subjectsAssessed,
          isComplete: subjectsAssessed === subjects.length
        };
      });

      gridRows.sort((a, b) => parseFloat(b.averagePct) - parseFloat(a.averagePct));
      const rankedRows = gridRows.map((row, idx) => ({ ...row, rank: idx + 1 }));

      setMatrixData({
        rows: rankedRows,
        subjects,
        meta: apiParams
      });

      toast.success('Matrix updated');
    } catch (error) {
      console.error('Matrix Generation Error:', error);
      toast.error(error.message || 'Failed to generate matrix');
    } finally {
      setLoading(false);
    }
  }, [stagedGrade, stagedStream, stagedTerm, stagedYear]);

  // Set default grade when data is ready
  useEffect(() => {
    if (!schoolDataLoading && fetchedGrades.length > 0 && !stagedGrade) {
        // Try to find a grade with students if possible, or just default to Playgroup
        const hasPlaygroup = fetchedGrades.includes('PLAYGROUP');
        setStagedGrade(hasPlaygroup ? 'PLAYGROUP' : fetchedGrades[0]);
    }
  }, [schoolDataLoading, fetchedGrades, stagedGrade]);

  // Auto-generate whenever filters change and data is "stale" or missing
  useEffect(() => {
    const currentConfig = `${stagedGrade}-${stagedStream}-${stagedTerm}-${stagedYear}`;
    if (stagedGrade && !loading && lastFetchRef.current !== currentConfig) {
        handleGenerate();
    }
  }, [stagedGrade, stagedStream, stagedTerm, stagedYear, loading, handleGenerate]);

  // Filtered Rows (Search)
  const filteredRows = useMemo(() => {
    if (!matrixData) return [];
    if (!searchQuery) return matrixData.rows;
    const q = searchQuery.toLowerCase();
    return matrixData.rows.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.admissionNumber.toLowerCase().includes(q)
    );
  }, [matrixData, searchQuery]);

  // Export to Excel
  const exportToExcel = () => {
    if (!matrixData) return;

    const exportRows = matrixData.rows.map(r => {
      const row = {
        'Rank': r.rank,
        'Name': r.name,
        'Adm No': r.admissionNumber,
        'Stream': r.stream,
        ...matrixData.subjects.reduce((acc, sub) => {
          acc[sub] = r.subjectScores[sub] ? r.subjectScores[sub].marks : 'ABS';
          return acc;
        }, {}),
        'Total': r.totalScore,
        'Average %': r.averagePct,
        'Grade': r.overallGrade
      };
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assessment Matrix");
    XLSX.writeFile(wb, `AssessmentMatrix_${stagedGrade}_${stagedTerm}_${stagedYear}.xlsx`);
  };

  // Rendering Helpers
  const renderRow = (row, index) => {
    return (
      <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
        <td className="sticky left-0 z-10 bg-inherit border-r border-slate-200 px-4 py-3 text-sm font-medium text-slate-500 text-center w-12">
          {row.rank}
        </td>
        <td className="sticky left-12 z-10 bg-inherit border-r border-slate-200 px-4 py-3 min-w-[200px]">
          <div>
            <div className="font-bold text-slate-800 uppercase text-xs">{row.name}</div>
            <div className="text-[10px] text-slate-500 font-mono">{row.admissionNumber} • {row.stream}</div>
          </div>
        </td>
        
        {matrixData.subjects.map(sub => {
          const score = row.subjectScores[sub];
          if (!score) {
            return (
              <td key={sub} className="border-r border-slate-100 px-2 py-3 text-center bg-rose-50/30">
                <span className="text-[10px] font-bold text-rose-400 opacity-40">ABS</span>
              </td>
            );
          }
          const { color } = getCBCGrade(score.percentage);
          return (
            <td key={sub} className="border-r border-slate-100 px-2 py-3 text-center">
              <div className={`text-sm font-bold ${color}`}>{score.marks}</div>
              <div className="text-[9px] text-slate-400 leading-none">{score.grade}</div>
            </td>
          );
        })}

        <td className="bg-indigo-50/30 border-r border-slate-200 px-4 py-3 text-center font-bold text-indigo-700 w-20">
          {row.totalScore}
        </td>
        <td className="bg-slate-50 border-r border-slate-200 px-4 py-3 text-center font-bold text-slate-700 w-20">
          {row.averagePct}%
        </td>
        <td className={`${row.gradeBg} px-4 py-3 text-center w-20`}>
          <div className={`text-sm font-black ${row.gradeColor}`}>{row.overallGrade}</div>
        </td>
      </tr>
    );
  };

  const tableHeader = (
    <tr>
      <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-200 px-4 py-3 text-[10px] font-bold text-slate-600 uppercase w-12">
        #
      </th>
      <th className="sticky left-12 z-30 bg-slate-100 border-b border-r border-slate-200 px-4 py-3 text-[10px] font-bold text-slate-600 uppercase text-left min-w-[200px]">
        Student Details
      </th>
      {matrixData?.subjects.map(sub => (
        <th key={sub} className="bg-slate-50 border-b border-r border-slate-200 px-2 py-3 text-[10px] font-bold text-slate-600 uppercase text-center min-w-[80px]">
          <div className="truncate px-1" title={sub}>{getAbbreviatedName(sub)}</div>
        </th>
      ))}
      <th className="bg-indigo-100/50 border-b border-r border-slate-200 px-4 py-3 text-[10px] font-bold text-indigo-600 uppercase text-center w-20">
        Total
      </th>
      <th className="bg-slate-100 border-b border-r border-slate-200 px-4 py-3 text-[10px] font-bold text-slate-600 uppercase text-center w-20">
        Avg %
      </th>
      <th className="bg-slate-200 border-b border-slate-200 px-4 py-3 text-[10px] font-bold text-slate-600 uppercase text-center w-20">
        Grade
      </th>
    </tr>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col overflow-hidden">
      {/* Combined Sticky Header + Filter Bar - Unified Component */}
      <div className="sticky top-0 z-40 bg-white shadow-sm print:hidden">
        {/* Assessment Header */}
        <div className="border-b border-gray-100 px-6 py-5 flex gap-4">
          <div className="flex-1">
            {/* Top Row: Context & Helper (Breadcrumbs) */}
            <div className="flex items-center justify-between mb-2 h-5">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <span>Assessment</span>
                <ChevronRight size={10} className="text-gray-300" />
                <span>Summary Report</span>
                {stagedGrade && (
                  <>
                    <ChevronRight size={10} className="text-gray-300" />
                    <span className="capitalize">{stagedGrade.replace(/_/g, ' ').toLowerCase()}</span>
                  </>
                )}
                {stagedTerm && (
                  <>
                    <ChevronRight size={10} className="text-gray-300" />
                    <span className="capitalize">{stagedTerm.replace(/_/g, ' ').toLowerCase()}</span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Row: Title & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-100">
                  <Layout className="text-white" size={16} />
                </div>
                <h2 className="text-lg font-bold text-gray-800 leading-none">
                  Full Assessment Matrix
                </h2>
                
                {matrixData && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border bg-blue-50 text-blue-700 border-blue-200">
                      {matrixData.rows.length} Students
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {matrixData.subjects.length} Subjects Assessed
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {matrixData && (
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    title="Export to Excel"
                  >
                    <FileSpreadsheet size={16} />
                    <span>Excel</span>
                  </button>
                )}
                <div className="h-3 w-px bg-gray-200 mx-1" />
                <button
                  onClick={() => window.print()}
                  disabled={!matrixData}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30"
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar - Always visible below header */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Class Grade</label>
              <select
                value={stagedGrade}
                onChange={(e) => setStagedGrade(e.target.value)}
                className="w-full h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors"
              >
                <option value="">Select Grade...</option>
                {fetchedGrades.map(g => (
                  <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[120px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Specific Stream</label>
              <select
                value={stagedStream}
                onChange={(e) => setStagedStream(e.target.value)}
                className="w-full h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors"
              >
                <option value="all">All Streams</option>
                {availableStreams.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="w-32">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Active Term</label>
              <select
                value={stagedTerm}
                onChange={(e) => setStagedTerm(e.target.value)}
                className="w-full h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors"
              >
                <option value="TERM_1">Term 1</option>
                <option value="TERM_2">Term 2</option>
                <option value="TERM_3">Term 3</option>
              </select>
            </div>

            <div className="w-24">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Year</label>
              <select
                value={stagedYear}
                onChange={(e) => setStagedYear(Number(e.target.value))}
                className="w-full h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors"
              >
                {getAcademicYearOptions().map(y => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </div>

            <div className="self-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !stagedGrade}
                className="h-9 px-4 bg-brand-teal hover:bg-brand-teal/90 disabled:bg-slate-200 text-white rounded font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                Generate Matrix
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & STATS ─────────────────────────────────────────────── */}
      {matrixData && (
        <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or adm..."
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase">
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500"/> {matrixData.subjects.length} Subjects Assessed</span>
              <span className="flex items-center gap-1"><AlertCircle size={10} className="text-indigo-500"/> {matrixData.rows.length} Total Students</span>
            </div>
          </div>
          
          <div className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            Auto-Ranked by Academic Performance
          </div>
        </div>
      )}

      {/* ── MATRIX GRID ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col">
          {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Loader className="animate-spin mb-4" size={40} />
                <p className="text-sm font-bold uppercase tracking-widest">Constructing Matrix...</p>
             </div>
          ) : noStudentsFound ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mb-6">
                <Users size={40} className="text-rose-300" />
              </div>
              <h3 className="text-xl font-black text-rose-400">No Enrolled Students</h3>
              <p className="text-sm font-medium text-slate-400 max-w-xs text-center mt-2">
                We couldn't find any learners enrolled in {stagedGrade.replace(/_/g, ' ')} {stagedStream !== 'all' ? `(${stagedStream})` : ''}.
              </p>
              <button 
                onClick={handleGenerate}
                className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
              >
                Retry Fetch
              </button>
            </div>
          ) : !matrixData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <Filter size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-400">Ready to Generate</h3>
              <p className="text-sm font-medium text-slate-400 max-w-xs text-center mt-2">
                Select grade filters above for a deep-dive performance analysis across all subjects.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <VirtualizedTable
                data={filteredRows}
                header={tableHeader}
                renderRow={renderRow}
                rowHeight={64}
                visibleHeight={1000} 
                className="flex-1"
                emptyComponent={
                  <div className="py-20 text-center text-slate-400 italic font-medium">
                    No students matched your search query in this grade.
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @media print {
          .min-h-screen { background: white !important; }
          button, .bg-white.border-b, .bg-slate-50.px-6.py-2, .Filter-Bar, .self-end { display: none !important; }
          .flex-1 { overflow: visible !important; height: auto !important; }
          .bg-white.rounded-2xl { box-shadow: none !important; border: none !important; }
          table { width: 100% !important; border: 1px solid #e2e8f0 !important; }
          th, td { border: 1px solid #e2e8f0 !important; }
          .sticky { position: static !important; }
        }
      `}</style>
    </div>
  );
};

export default SummaryReportPage;