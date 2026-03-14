/**
 * Summary Report Page
 * Clean, minimal design matching Summative Assessment setup
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { configAPI } from '../../../../services/api';
import { useSchoolData } from '../../../../contexts/SchoolDataContext';

const SummaryReportPage = () => {
  const { user } = useAuth();
  const { grades: fetchedGrades, classes, loading: schoolDataLoading } = useSchoolData();

  const [selectedType, setSelectedType] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedTest, setSelectedTest] = useState('');

  // Staged filter state - only apply when Generate button clicked
  const [stagedType, setStagedType] = useState('');
  const [stagedGrade, setStagedGrade] = useState('');
  const [stagedStream, setStagedStream] = useState('');
  const [stagedTerm, setStagedTerm] = useState('');
  const [stagedTest, setStagedTest] = useState('');

  const [availableStreams, setAvailableStreams] = useState([]);

  // Apply filters when button clicked
  const applyFilters = useCallback(() => {
    setSelectedType(stagedType);
    setSelectedGrade(stagedGrade);
    setSelectedStream(stagedStream);
    setSelectedTerm(stagedTerm);
    setSelectedTest(stagedTest);
  }, [stagedType, stagedGrade, stagedStream, stagedTerm, stagedTest]);

  useEffect(() => {
    const fetchStreams = async () => {
      if (user?.schoolId) {
        try {
          const resp = await configAPI.getStreamConfigs(user.schoolId);
          const arr = resp?.data || [];
          setAvailableStreams(arr.filter(s => s.active !== false));
        } catch (error) {
          console.error('Failed to fetch streams:', error);
        }
      }
    };
    fetchStreams();
  }, [user?.schoolId]);

  const reportTypes = [
    { value: 'grade-report', label: 'Grade Sheet' },
    { value: 'stream-report', label: 'Stream Sheet' },
    { value: 'learner-report', label: 'Learner Sheet' },
    { value: 'learner-termly-report', label: 'Learner Termly Sheet' },
    { value: 'stream-ranking-report', label: 'Stream Ranking Sheet' },
    { value: 'stream-analysis-report', label: 'Stream Analysis Sheet' },
    { value: 'grade-analysis-report', label: 'Grade Analysis Sheet' }
  ];

  const gradesOptions = fetchedGrades.map(g => ({
    value: g,
    label: g.replace(/_/g, ' ')
  }));

  const termsMap = new Set();
  classes.forEach(c => c.term && termsMap.add(c.term));
  const uniqueTerms = Array.from(termsMap).sort();

  const termsOptions = uniqueTerms.length > 0
    ? uniqueTerms.map(t => ({ value: t, label: t.replace(/_/g, ' ') }))
    : [
      { value: 'TERM_1', label: 'Term 1' },
      { value: 'TERM_2', label: 'Term 2' },
      { value: 'TERM_3', label: 'Term 3' }
    ];

  const tests = [
    { value: 'mid-term', label: 'Mid-Term Test' },
    { value: 'end-term', label: 'End-Term Test' },
    { value: 'cat-1', label: 'CAT 1' },
    { value: 'cat-2', label: 'CAT 2' },
    { value: 'final-exam', label: 'Final Exam' }
  ];

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Sticky Filter Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        {/* Report Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Summary Report</h2>
        </div>

        {/* Filter Bar */}
        <div className="border-t border-slate-200 px-6 py-3.5">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Type */}
            <select
              value={stagedType}
              onChange={(e) => setStagedType(e.target.value)}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-32"
              title="Select Report Type"
            >
              <option value="">Type</option>
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Grade */}
            <select
              value={stagedGrade}
              onChange={(e) => setStagedGrade(e.target.value)}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-28"
              title="Select Grade"
            >
              <option value="">Grade</option>
              {gradesOptions.map(grade => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>

            {/* Stream */}
            <select
              value={stagedStream}
              onChange={(e) => setStagedStream(e.target.value)}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-20"
              title="Select Stream"
            >
              <option value="">Stream</option>
              {availableStreams.map(stream => (
                <option key={stream.id} value={stream.name}>
                  {stream.name}
                </option>
              ))}
            </select>

            {/* Term */}
            <select
              value={stagedTerm}
              onChange={(e) => setStagedTerm(e.target.value)}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors w-20"
              title="Select Term"
            >
              <option value="">Term</option>
              {termsOptions.map(term => (
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </select>

            {/* Test */}
            <select
              value={stagedTest}
              onChange={(e) => setStagedTest(e.target.value)}
              className="h-9 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-purple appearance-none cursor-pointer hover:border-slate-400 transition-colors flex-1 min-w-[120px]"
              title="Select Test"
            >
              <option value="">Test</option>
              {tests.map(test => (
                <option key={test.value} value={test.value}>
                  {test.label}
                </option>
              ))}
            </select>

            {/* Generate Button */}
            <button
              onClick={applyFilters}
              disabled={!stagedType}
              className="h-9 px-3 rounded bg-brand-teal hover:bg-brand-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
              title={stagedType ? 'Click to apply filters' : 'Select a report type first'}
            >
              <FileText size={16} className="text-white" />
              <span className="text-xs font-medium text-white">Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {selectedType ? (
            <div>
              <p className="text-gray-600">
                <strong>Report Type:</strong> {reportTypes.find(t => t.value === selectedType)?.label}
              </p>
              {selectedGrade && <p className="text-gray-600"><strong>Grade:</strong> {gradesOptions.find(g => g.value === selectedGrade)?.label || selectedGrade}</p>}
              {selectedStream && <p className="text-gray-600"><strong>Stream:</strong> {selectedStream}</p>}
              {selectedTerm && <p className="text-gray-600"><strong>Term:</strong> {termsOptions.find(t => t.value === selectedTerm)?.label || selectedTerm}</p>}
              {selectedTest && <p className="text-gray-600"><strong>Test:</strong> {tests.find(t => t.value === selectedTest)?.label}</p>}
              <p className="text-sm text-gray-500 mt-4">Report would be generated with the selected filters...</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm">Select a report type and click Generate to create a report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryReportPage;