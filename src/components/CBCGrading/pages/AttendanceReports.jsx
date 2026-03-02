import React from 'react';
import { Calendar, Download, FileText, CheckCircle, XCircle, Clock, Users, Search, Filter, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';
import { useAttendance } from '../hooks/useAttendanceAPI';
import { getCurrentDate, toInputDate } from '../utils/dateHelpers';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';
import LoadingSpinner from '../shared/LoadingSpinner';

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

  const { attendanceRecords, fetchAttendance, loading, grades } = useAttendance();

  // Load report data
  const handleLoadReport = React.useCallback(() => {
    const params = {
      startDate: stagedStartDate,
      endDate: stagedEndDate
    };
    if (reportType === 'learner' && stagedLearnerId) {
      params.learnerId = stagedLearnerId;
    }
    fetchAttendance(params);
    setActiveReport({
      type: reportType,
      grade: stagedGrade,
      learnerId: stagedLearnerId,
      startDate: stagedStartDate,
      endDate: stagedEndDate
    });
  }, [stagedStartDate, stagedEndDate, reportType, stagedLearnerId, stagedGrade, fetchAttendance]);

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

      const learner = learners.find(l => l.id === record.learnerId);
      if (!learner) return false;

      return activeReport?.grade === 'all' || learner.grade === activeReport?.grade;
    }).filter(record => {
      const learner = learners.find(l => l.id === record.learnerId);
      if (!learner) return false;
      const fullName = `${learner.firstName} ${learner.lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || learner.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [attendanceRecords, learners, activeReport, searchTerm]);

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
    <div className="min-h-screen bg-slate-50/50">
      {/* Sticky Top Section */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        {/* Header: Title & Actions */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-900 rounded-xl text-white shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Attendance Analytics</h1>
              <p className="text-xs text-gray-500 font-medium italic uppercase tracking-widest">Intelligence Synthesis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold text-xs shadow-sm">
              <Printer size={16} />
              Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-xs shadow-lg shadow-indigo-600/20">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Filter Bar (Aligned with SummativeAssessment) */}
        <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/80 backdrop-blur-md">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm mr-2">
            <button
              onClick={() => setReportType('grade')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'grade' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Grade
            </button>
            <button
              onClick={() => setReportType('learner')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'learner' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Learner
            </button>
          </div>

          {reportType === 'grade' ? (
            <select
              value={stagedGrade}
              onChange={(e) => setStagedGrade(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none w-48"
            >
              <option value="all">Consolidated (All Grades)</option>
              {grades.map(g => (
                <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
              ))}
            </select>
          ) : (
            <div className="w-64 h-9">
              <SmartLearnerSearch
                learners={learners}
                selectedLearnerId={stagedLearnerId}
                onSelect={setStagedLearnerId}
                placeholder="Find learner..."
              />
            </div>
          )}

          <div className="flex items-center gap-2 h-9 px-3 border border-slate-300 rounded-lg bg-white">
            <input
              type="date"
              value={toInputDate(stagedStartDate)}
              onChange={(e) => setStagedStartDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none w-24"
            />
            <span className="text-slate-300">→</span>
            <input
              type="date"
              value={toInputDate(stagedEndDate)}
              onChange={(e) => setStagedEndDate(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 outline-none w-24"
            />
          </div>

          <button
            onClick={handleLoadReport}
            className="h-9 px-4 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Filter size={14} />
            Run Analysis
          </button>

          <div className="flex-1 flex justify-end">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Filter results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-9 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-700">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color} opacity-70`}>{stat.trend}</span>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.title}</p>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Data Presentation */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Observation Matrix</h3>
            {activeReport && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                <h4 className="font-black text-slate-300 uppercase tracking-widest">No Intelligence Data</h4>
                <p className="text-[10px] font-semibold text-slate-400">Run an analysis with the filters above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Node</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Learner Matrix</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Byte</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks & Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((record) => {
                      const learner = learners.find(l => l.id === record.learnerId);
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
                            <p className="text-xs font-black text-slate-900 font-mono">
                              {new Date(record.date).toLocaleDateString('en-GB').replace(/\//g, ' . ')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {learner.firstName[0]}{learner.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">{learner.firstName} {learner.lastName}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{learner.admissionNumber} | {learner.grade}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.text} ring-1 ring-inset ring-current/20`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${style.color} mr-2`} />
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-[10px] text-slate-500 italic font-medium max-w-[200px] truncate">
                              {record.remarks || 'No override remarks recorded'}
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
