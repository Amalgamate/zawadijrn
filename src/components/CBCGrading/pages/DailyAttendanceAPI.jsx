import React from 'react';
import { Users, Save, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, ChevronRight, Search, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useAttendance } from '../hooks/useAttendanceAPI';
import { useNotifications } from '../hooks/useNotifications';
import { toInputDate } from '../utils/dateHelpers';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';

const DailyAttendance = () => {
  // Staged Filter State (matches SummativeAssessment pattern)
  const [stagedGrade, setStagedGrade] = React.useState(() => localStorage.getItem('cbc_attendance_stagedGrade') || '');
  const [stagedStream, setStagedStream] = React.useState(() => localStorage.getItem('cbc_attendance_stagedStream') || '');
  const [stagedDate, setStagedDate] = React.useState(() => toInputDate(localStorage.getItem('cbc_attendance_stagedDate')) || new Date().toISOString().split('T')[0]);

  // Active Context State (what is currently loaded)
  const [activeContext, setActiveContext] = React.useState(() => {
    const saved = localStorage.getItem('cbc_attendance_activeContext');
    try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });
  const [dailyReport, setDailyReport] = React.useState(null);
  const [pendingChanges, setPendingChanges] = React.useState({});
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  // Persist staged filters
  React.useEffect(() => {
    localStorage.setItem('cbc_attendance_stagedGrade', stagedGrade);
    localStorage.setItem('cbc_attendance_stagedStream', stagedStream);
    localStorage.setItem('cbc_attendance_stagedDate', stagedDate);
  }, [stagedGrade, stagedStream, stagedDate]);

  // Persist active context
  React.useEffect(() => {
    if (activeContext) {
      localStorage.setItem('cbc_attendance_activeContext', JSON.stringify(activeContext));
    } else {
      localStorage.removeItem('cbc_attendance_activeContext');
    }
  }, [activeContext]);

  // Hooks
  const {
    classes,
    loading,
    error,
    getDailyClassReport,
    markBulkAttendance,
  } = useAttendance();

  const { showSuccess, showError } = useNotifications();

  const assignedClass = React.useMemo(() => {
    if (!isTeacher || classes.length === 0) return null;
    return classes[0];
  }, [isTeacher, classes]);

  React.useEffect(() => {
    if (!isTeacher || !assignedClass) return;

    const assignedGrade = assignedClass.grade || '';
    const assignedStream = assignedClass.stream || '';

    if (stagedGrade !== assignedGrade) {
      setStagedGrade(assignedGrade);
    }
    if (stagedStream !== assignedStream) {
      setStagedStream(assignedStream);
    }

    if (activeContext && activeContext.classId !== assignedClass.id) {
      setActiveContext(null);
      setDailyReport(null);
      setPendingChanges({});
    }
  }, [isTeacher, assignedClass, stagedGrade, stagedStream, activeContext]);

  // Load daily report when "Load Workspace" is clicked
  const handleLoadWorkspace = React.useCallback(async () => {
    // Find the class that matches staged grade and stream
    const targetClass = isTeacher
      ? assignedClass
      : classes.find(c => c.grade === stagedGrade && (stagedStream ? c.stream === stagedStream : true));

    if (!targetClass) {
      showError(isTeacher
        ? 'No class assigned to your account. Please contact the Head Teacher.'
        : `No active class found for ${stagedGrade} ${stagedStream || ''}`
      );
      return;
    }

    setIsSyncing(true);
    try {
      const report = await getDailyClassReport(targetClass.id, stagedDate);
      if (report) {
        setDailyReport(report);
        setActiveContext({
          classId: targetClass.id,
          className: targetClass.name,
          date: stagedDate,
          grade: targetClass.grade,
          stream: targetClass.stream || ''
        });

        // Initialize pending changes
        const initialChanges = {};
        report.learners.forEach(learner => {
          if (learner.attendance) {
            initialChanges[learner.id] = {
              status: learner.attendance.status,
              remarks: learner.attendance.remarks || '',
            };
          }
        });
        setPendingChanges(initialChanges);
      }
    } catch (err) {
      showError('Failed to load attendance register');
    } finally {
      setIsSyncing(false);
    }
  }, [isTeacher, assignedClass, stagedGrade, stagedStream, stagedDate, classes, getDailyClassReport, showError]);

  // Auto-restore workspace if activeContext exists
  React.useEffect(() => {
    if (classes.length > 0 && activeContext && !dailyReport && !loading && !isSyncing) {
      handleLoadWorkspace();
    }
  }, [classes, activeContext, dailyReport, loading, isSyncing, handleLoadWorkspace]);

  React.useEffect(() => {
    if (isTeacher && assignedClass && !activeContext && !dailyReport && !loading && !isSyncing) {
      handleLoadWorkspace();
    }
  }, [isTeacher, assignedClass, activeContext, dailyReport, loading, isSyncing, handleLoadWorkspace]);


  // Status configuration
  const statusConfig = {
    PRESENT: { label: 'Present', color: 'bg-emerald-500', icon: CheckCircle, lightColor: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-500/20' },
    ABSENT: { label: 'Absent', color: 'bg-rose-500', icon: XCircle, lightColor: 'bg-rose-50 text-rose-600', ring: 'ring-rose-500/20' },
    LATE: { label: 'Late', color: 'bg-amber-500', icon: Clock, lightColor: 'bg-amber-50 text-amber-600', ring: 'ring-amber-500/20' },
    EXCUSED: { label: 'Excused', color: 'bg-sky-500', icon: AlertCircle, lightColor: 'bg-sky-50 text-sky-600', ring: 'ring-sky-500/20' },
  };

  const handleStatusChange = (learnerId, status) => {
    setPendingChanges(prev => ({
      ...prev,
      [learnerId]: {
        status,
        remarks: prev[learnerId]?.remarks || '',
      },
    }));
  };

  const handleMarkAllPresent = () => {
    if (!dailyReport) return;
    const allPresent = {};
    dailyReport.learners.forEach(learner => {
      allPresent[learner.id] = { status: 'PRESENT', remarks: '' };
    });
    setPendingChanges(allPresent);
    showSuccess('All learners marked as present');
  };

  const handleSaveAttendance = async () => {
    if (!activeContext) return;

    setIsSyncing(true);
    const attendanceRecords = Object.entries(pendingChanges).map(([learnerId, data]) => ({
      learnerId,
      status: data.status,
      remarks: data.remarks || undefined,
    }));

    if (attendanceRecords.length === 0) {
      showError('No attendance marked');
      setIsSyncing(false);
      return;
    }

    const result = await markBulkAttendance(activeContext.date, activeContext.classId, attendanceRecords);

    if (result.success) {
      showSuccess(result.message || 'Attendance synchronized successfully');
      // Refresh report
      const report = await getDailyClassReport(activeContext.classId, activeContext.date);
      if (report) setDailyReport(report);
    } else {
      showError(result.error || 'Synchronization failed');
    }
    setIsSyncing(false);
  };

  // Derived Data
  const filteredLearners = React.useMemo(() => {
    if (!dailyReport?.learners) return [];
    return dailyReport.learners.filter(l =>
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [dailyReport, searchTerm]);

  const stats = React.useMemo(() => {
    const total = dailyReport?.learners.length || 0;
    const present = Object.values(pendingChanges).filter(p => p.status === 'PRESENT').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, total, percentage };
  }, [pendingChanges, dailyReport]);

  // Distinct Grades and Streams from classes
  const availableGrades = [...new Set(classes.map(c => c.grade))].sort();
  const availableStreams = [...new Set(classes.filter(c => c.grade === stagedGrade).map(c => c.stream))].filter(Boolean).sort();

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        {/* Top Row: Title & Global Actions */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Daily Attendance</h1>
              <p className="text-xs text-gray-500 font-medium">Real-time Learner Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeContext && (
              <>
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 mr-2">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Present</p>
                    <p className="text-sm font-bold text-emerald-600">{stats.present}/{stats.total}</p>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Rate</p>
                    <p className="text-sm font-bold text-indigo-600">{stats.percentage}%</p>
                  </div>
                </div>

                <button
                  onClick={handleMarkAllPresent}
                  className="px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100"
                >
                  Mark All Present
                </button>

                <button
                  onClick={handleSaveAttendance}
                  disabled={isSyncing || Object.keys(pendingChanges).length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSyncing ? 'Syncing...' : 'Sync Attendance'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Row: Filter Bar (Aligned with SummativeAssessment) */}
        <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <select
            value={stagedGrade}
            onChange={(e) => {
              setStagedGrade(e.target.value);
              setStagedStream('');
            }}
            disabled={isTeacher}
            className="h-9 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-32"
          >
            <option value="">Grade</option>
            {availableGrades.map(g => (
              <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <select
            value={stagedStream}
            onChange={(e) => setStagedStream(e.target.value)}
            disabled={!stagedGrade || isTeacher}
            className="h-9 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-24 disabled:opacity-50"
          >
            <option value="">Stream</option>
            {availableStreams.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="date"
            value={toInputDate(stagedDate)}
            onChange={(e) => setStagedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="h-9 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-36"
          />

          <button
            onClick={handleLoadWorkspace}
            disabled={isTeacher ? (!assignedClass || loading || isSyncing) : (!stagedGrade || loading || isSyncing)}
            className="h-9 px-4 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Filter size={14} />}
            Load Register
          </button>

          {activeContext && (
            <div className="flex-1 flex justify-end">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search learners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {!activeContext ? (
          <div className="max-w-2xl mx-auto mt-20 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Workspace Ready</h2>
            <p className="text-slate-500 mb-8 font-medium">Select a grade and date above to load the attendance register. You can mark individual learners or use the "Mark All Present" shortcut.</p>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Mini-Summary */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Register:</span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold ring-1 ring-indigo-100">
                  {activeContext.grade.replace(/_/g, ' ')} {activeContext.stream} — {new Date(activeContext.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Learner</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Selection</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredLearners.length > 0 ? (
                      filteredLearners.map((learner) => {
                        const currentStatus = pendingChanges[learner.id]?.status;
                        return (
                          <tr key={learner.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${currentStatus ? statusConfig[currentStatus].lightColor : 'bg-slate-100 text-slate-400'}`}>
                                  {learner.firstName[0]}{learner.lastName[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{learner.firstName} {learner.lastName}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{learner.admissionNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1.5">
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <button
                                    key={key}
                                    onClick={() => handleStatusChange(learner.id, key)}
                                    title={config.label}
                                    className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 border ${currentStatus === key
                                      ? `${config.color} text-white border-transparent shadow-md scale-105`
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                      }`}
                                  >
                                    <config.icon size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wide hidden sm:inline">{config.label}</span>
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                placeholder="Add optional remarks..."
                                value={pendingChanges[learner.id]?.remarks || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPendingChanges(prev => ({
                                    ...prev,
                                    [learner.id]: {
                                      status: prev[learner.id]?.status || 'PRESENT',
                                      remarks: val
                                    }
                                  }));
                                }}
                                className="w-full bg-transparent text-xs font-medium text-slate-600 placeholder:text-slate-300 focus:outline-none focus:border-b focus:border-indigo-300"
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center">
                          <p className="text-slate-400 font-medium">No learners found matching your search.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyAttendance;
