import React from 'react';
import { Calendar, Download, FileText, CheckCircle, XCircle, Search, Filter, ArrowUpRight, Printer } from 'lucide-react';
import { useAttendance } from '../hooks/useAttendanceAPI';
import { getCurrentDate, toInputDate } from '../utils/dateHelpers';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import { printWindow } from '../../../utils/simplePdfGenerator';

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Build and trigger a CSV download from the filtered attendance records.
 * One row per record; columns: Date, Admission No, Name, Grade, Status, Remarks.
 */
function exportAttendanceCSV(records, learners, activeReport) {
  const headers = ['Date', 'Admission No', 'Name', 'Grade', 'Status', 'Remarks'];

  const rows = records.map(record => {
    const learner = learners.find(l => l.id === record.learnerId);
    const date = record.date
      ? new Date(record.date).toLocaleDateString('en-GB')
      : '';
    return [
      date,
      learner?.admissionNumber || '',
      learner ? `${learner.firstName} ${learner.lastName}` : record.learnerId,
      learner?.grade || '',
      record.status || '',
      (record.remarks || '').replace(/,/g, ';'),  // escape commas
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const label = activeReport
    ? `${activeReport.startDate}_to_${activeReport.endDate}`
    : new Date().toISOString().split('T')[0];

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Attendance_${label}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

const AttendanceReports = ({ learners }) => {
  // Staged Filter State
  const [reportType, setReportType] = React.useState('grade'); // 'grade' or 'learner'
  const [stagedGrade, setStagedGrade] = React.useState('all');
  const [stagedLearnerId, setStagedLearnerId] = React.useState('');
  const [stagedStartDate, setStagedStartDate] = React.useState(getCurrentDate());
  const [stagedEndDate, setStagedEndDate] = React.useState(getCurrentDate());

  // Active Context State (for loaded report)
  const [activeReport, setActiveReport] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  const { attendanceRecords, fetchAttendance, loading, grades, classes } = useAttendance();

  const assignedClass = React.useMemo(() => {
    if (!isTeacher || !classes?.length) return null;
    return classes[0];
  }, [isTeacher, classes]);

  const teacherScopedLearners = React.useMemo(() => {
    if (!isTeacher || !assignedClass) return learners;
    return (learners || []).filter((learner) => {
      const sameGrade = learner.grade === assignedClass.grade;
      const learnerStream = learner.stream || '';
      const classStream = assignedClass.stream || '';
      return sameGrade && learnerStream === classStream;
    });
  }, [isTeacher, assignedClass, learners]);

  const availableGrades = React.useMemo(() => {
    const learnerGrades = [...new Set((teacherScopedLearners || []).map((l) => l.grade).filter(Boolean))];
    const classGrades = [...new Set((classes || []).map((c) => c.grade).filter(Boolean))];
    const contextGrades = Array.isArray(grades) ? grades.filter(Boolean) : [];
    return [...new Set([...learnerGrades, ...classGrades, ...contextGrades])];
  }, [teacherScopedLearners, classes, grades]);

  React.useEffect(() => {
    if (!isTeacher || !assignedClass) return;

    if (stagedGrade !== assignedClass.grade) {
      setStagedGrade(assignedClass.grade);
    }
  }, [isTeacher, assignedClass, stagedGrade]);

  React.useEffect(() => {
    if (!isTeacher || !stagedLearnerId) return;

    const isScopedLearner = teacherScopedLearners.some((learner) => learner.id === stagedLearnerId);
    if (!isScopedLearner) {
      setStagedLearnerId('');
    }
  }, [isTeacher, stagedLearnerId, teacherScopedLearners]);

  // Load report data
  const handleLoadReport = React.useCallback(() => {
    const params = {
      startDate: stagedStartDate,
      endDate: stagedEndDate
    };
    if (isTeacher && assignedClass?.id) {
      params.classId = assignedClass.id;
    }
    if (reportType === 'learner' && stagedLearnerId) {
      params.learnerId = stagedLearnerId;
    }
    fetchAttendance(params);
    setActiveReport({
      type: reportType,
      grade: stagedGrade,
      classId: isTeacher ? assignedClass?.id : undefined,
      learnerId: stagedLearnerId,
      startDate: stagedStartDate,
      endDate: stagedEndDate
    });
  }, [stagedStartDate, stagedEndDate, reportType, stagedLearnerId, stagedGrade, isTeacher, assignedClass, fetchAttendance]);

  // Execute initial load
  React.useEffect(() => {
    handleLoadReport();
  }, [handleLoadReport]);

  // Filter attendance records (Client-side refinement)
  const filteredRecords = React.useMemo(() => {
    if (!attendanceRecords) return [];

    return attendanceRecords.filter(record => {
      let recordDate = record.date;
      if (typeof recordDate === 'string' && recordDate.includes('T')) {
        recordDate = recordDate.split('T')[0];
      } else if (recordDate instanceof Date) {
        recordDate = recordDate.toISOString().split('T')[0];
      }

      if (activeReport?.type === 'learner') {
        if (activeReport.learnerId) return record.learnerId === activeReport.learnerId;
        return true;
      }

      const learner = teacherScopedLearners.find(l => l.id === record.learnerId);
      if (!learner) return false;

      return activeReport?.grade === 'all' || learner.grade === activeReport?.grade;
    }).filter(record => {
      const learner = teacherScopedLearners.find(l => l.id === record.learnerId);
      if (!learner) return false;
      const fullName = `${learner.firstName} ${learner.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || learner.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [attendanceRecords, teacherScopedLearners, activeReport, searchTerm]);

  // Calculate statistics
  const totalDays = [...new Set(filteredRecords.map(r => r.date?.split('T')[0]))].length;
  const presentCount = filteredRecords.filter(r => r.status === 'PRESENT').length;
  const totalRecords = filteredRecords.length;
  const attendancePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const stats = [
    { title: 'Attendance Rate', value: `${attendancePercentage}%`, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Compliance' },
    { title: 'Present Count', value: presentCount, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Recorded' },
    { title: 'Absence Count', value: filteredRecords.filter(r => r.status === 'ABSENT').length, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Watchlist' },
    { title: 'Days Tracked', value: totalDays, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Periods' },
  ];

  return (
    <div className="space-y-6">
      {/* Sticky Top Section */}
      <div className="sticky top-0 z-40 bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Header: Title & Actions */}
        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Attendance Reports</h1>
              <p className="text-sm text-slate-600">Review trends, print summaries, and export attendance records.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => printWindow('attendance-report-content')}
              className="h-10 px-4 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={() => exportAttendanceCSV(filteredRecords, teacherScopedLearners, activeReport)}
              className="h-10 px-4 bg-brand-teal text-white rounded-md hover:bg-brand-teal/90 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Filter Bar (Aligned with SummativeAssessment) */}
        <div className="px-5 py-3 border-t border-slate-200 flex flex-wrap items-center gap-3 bg-slate-50">
          <div className="flex bg-white p-1 rounded-md border border-slate-300 mr-2">
            <button
              disabled={isTeacher}
              onClick={() => setReportType('grade')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${reportType === 'grade' ? 'bg-brand-purple text-white' : 'text-slate-600 hover:bg-slate-50'} disabled:opacity-50`}
            >
              Grade
            </button>
            <button
              disabled={isTeacher}
              onClick={() => setReportType('learner')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${reportType === 'learner' ? 'bg-brand-purple text-white' : 'text-slate-600 hover:bg-slate-50'} disabled:opacity-50`}
            >
              Learner
            </button>
          </div>

          {reportType === 'grade' ? (
            <select
              value={stagedGrade}
              onChange={(e) => setStagedGrade(e.target.value)}
              disabled={isTeacher}
              className="h-10 px-3 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-teal/20 outline-none w-52"
            >
              <option value="all">Consolidated (All Grades)</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
              ))}
            </select>
          ) : (
            <div className="w-64 h-10">
              <SmartLearnerSearch
                learners={teacherScopedLearners}
                selectedLearnerId={stagedLearnerId}
                onSelect={setStagedLearnerId}
                placeholder="Find learner..."
              />
            </div>
          )}

          <div className="flex items-center gap-2 h-10 px-3 border border-slate-300 rounded-md bg-white">
            <input
              type="date"
              value={toInputDate(stagedStartDate)}
              onChange={(e) => setStagedStartDate(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 focus:ring-0 outline-none w-24"
            />
            <span className="text-slate-300">→</span>
            <input
              type="date"
              value={toInputDate(stagedEndDate)}
              onChange={(e) => setStagedEndDate(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 focus:ring-0 outline-none w-24"
            />
          </div>

          <button
            onClick={handleLoadReport}
            className="h-10 px-4 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Filter size={14} />
            Apply Filters
          </button>

          <div className="flex-1 flex justify-end">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Filter results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-10 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-700">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-md ${stat.bg} ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${stat.color} opacity-70`}>{stat.trend}</span>
              </div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">{stat.title}</p>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Data Presentation */}
        <div id="attendance-report-content" className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Attendance Records</h3>
            {activeReport && (
              <span className="text-xs font-medium text-slate-500">
                Showing data from {new Date(activeReport.startDate).toLocaleDateString()} to {new Date(activeReport.endDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="p-0">
            {loading ? (
              <div className="py-20 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                <h4 className="font-semibold text-slate-300 uppercase tracking-widest">No Intelligence Data</h4>
                <p className="text-[10px] font-semibold text-slate-400">Run an analysis with the filters above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Learner</th>
                      <th className="px-6 py-4 text-center text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((record) => {
                      const learner = teacherScopedLearners.find(l => l.id === record.learnerId);
                      if (!learner) return null;

                      const statusMap = {
                        'PRESENT': { color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
                        'ABSENT': { color: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
                        'LATE': { color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
                        'EXCUSED': { color: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
                      };
                      const style = statusMap[record.status] || { color: 'bg-slate-500', text: 'text-slate-600', bg: 'bg-slate-50' };

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-semibold text-slate-900">
                              {new Date(record.date).toLocaleDateString('en-GB').replace(/\//g, ' . ')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-semibold text-[10px] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {learner.firstName[0]}{learner.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 tracking-tight">{learner.firstName} {learner.lastName}</p>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">{learner.admissionNumber} | {learner.grade}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest ${style.bg} ${style.text} ring-1 ring-inset ring-current/20`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${style.color} mr-2`} />
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-[10px] text-slate-500 italic font-medium max-w-[220px] truncate">
                              {record.remarks || 'No remarks'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
