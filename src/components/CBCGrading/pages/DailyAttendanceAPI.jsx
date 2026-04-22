import React from 'react';
import { Users, Save, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, ChevronRight, Search, Calendar as CalendarIcon, Filter, Target, ChevronLeft, Check } from 'lucide-react';
import { useAttendance } from '../hooks/useAttendanceAPI';
import { useNotifications } from '../hooks/useNotifications';
import { toInputDate } from '../utils/dateHelpers';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import { useInstitutionLabels } from '../../../hooks/useInstitutionLabels';
import { cn } from '../../../utils/cn';

const DailyAttendance = () => {
  const labels = useInstitutionLabels();
  const { showSuccess, showError } = useNotifications();
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  // Staged Filter State
  const [stagedGrade, setStagedGrade] = React.useState(() => localStorage.getItem('cbc_attendance_stagedGrade') || '');
  const [stagedStream, setStagedStream] = React.useState(() => localStorage.getItem('cbc_attendance_stagedStream') || '');
  const [stagedDate, setStagedDate] = React.useState(() => toInputDate(localStorage.getItem('cbc_attendance_stagedDate')) || new Date().toISOString().split('T')[0]);

  // Active Context State
  const [activeContext, setActiveContext] = React.useState(() => {
    const saved = localStorage.getItem('cbc_attendance_activeContext');
    try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });
  const [dailyReport, setDailyReport] = React.useState(null);
  const [pendingChanges, setPendingChanges] = React.useState({});
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Persistence
  React.useEffect(() => {
    localStorage.setItem('cbc_attendance_stagedGrade', stagedGrade);
    localStorage.setItem('cbc_attendance_stagedStream', stagedStream);
    localStorage.setItem('cbc_attendance_stagedDate', stagedDate);
  }, [stagedGrade, stagedStream, stagedDate]);

  React.useEffect(() => {
    if (activeContext) localStorage.setItem('cbc_attendance_activeContext', JSON.stringify(activeContext));
    else localStorage.removeItem('cbc_attendance_activeContext');
  }, [activeContext]);

  // Hooks
  const {
    classes,
    loading,
    error,
    getDailyClassReport,
    markBulkAttendance,
  } = useAttendance();

  const assignedClass = React.useMemo(() => {
    if (!isTeacher || classes.length === 0) return null;
    return classes[0];
  }, [isTeacher, classes]);

  React.useEffect(() => {
    if (!isTeacher || !assignedClass) return;
    const assignedGrade = assignedClass.grade || '';
    const assignedStream = assignedClass.stream || '';
    if (stagedGrade !== assignedGrade) setStagedGrade(assignedGrade);
    if (stagedStream !== assignedStream) setStagedStream(assignedStream);
  }, [isTeacher, assignedClass, stagedGrade, stagedStream]);

  const handleLoadWorkspace = React.useCallback(async () => {
    const targetClass = isTeacher
      ? assignedClass
      : classes.find(c => c.grade === stagedGrade && (stagedStream ? c.stream === stagedStream : true));

    if (!targetClass) {
      showError(isTeacher ? `No ${labels.class.toLowerCase()} assigned to your account.` : `No active ${labels.class.toLowerCase()} found.`);
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
      showError('Failed to load register');
    } finally {
      setIsSyncing(false);
    }
  }, [isTeacher, assignedClass, stagedGrade, stagedStream, stagedDate, classes, getDailyClassReport, showError, labels]);

  // Auto-restore
  React.useEffect(() => {
    if (classes.length > 0 && activeContext && !dailyReport && !loading && !isSyncing) {
      handleLoadWorkspace();
    }
  }, [classes, activeContext, dailyReport, loading, isSyncing, handleLoadWorkspace]);

  const statusConfig = {
    PRESENT: { label: 'Present', color: 'bg-emerald-500', icon: CheckCircle, lightColor: 'bg-emerald-50 text-emerald-600' },
    ABSENT: { label: 'Absent', color: 'bg-rose-500', icon: XCircle, lightColor: 'bg-rose-50 text-rose-600' },
    LATE: { label: 'Late', color: 'bg-amber-500', icon: Clock, lightColor: 'bg-amber-50 text-amber-600' },
    EXCUSED: { label: 'Excused', color: 'bg-sky-500', icon: AlertCircle, lightColor: 'bg-sky-50 text-sky-600' },
  };

  const handleStatusChange = (learnerId, status) => {
    setPendingChanges(prev => ({
      ...prev,
      [learnerId]: { status, remarks: prev[learnerId]?.remarks || '' }
    }));
  };

  const handleMarkAllPresent = () => {
    if (!dailyReport) return;
    const allPresent = {};
    dailyReport.learners.forEach(learner => {
      allPresent[learner.id] = { status: 'PRESENT', remarks: '' };
    });
    setPendingChanges(allPresent);
    showSuccess(`All ${labels.learners.toLowerCase()} marked present`);
  };

  const handleSaveAttendance = async () => {
    if (!activeContext) return;
    setIsSyncing(true);
    const records = Object.entries(pendingChanges).map(([learnerId, data]) => ({
      learnerId,
      status: data.status,
      remarks: data.remarks || undefined,
    }));

    if (records.length === 0) {
      showError('No records marked');
      setIsSyncing(false);
      return;
    }

    const result = await markBulkAttendance(activeContext.date, activeContext.classId, records);
    if (result.success) {
      showSuccess('Register synchronized!');
      const report = await getDailyClassReport(activeContext.classId, activeContext.date);
      if (report) setDailyReport(report);
    } else {
      showError(result.error || 'Sync failed');
    }
    setIsSyncing(false);
  };

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

  const availableGrades = [...new Set(classes.map(c => c.grade))].sort();
  const availableStreams = [...new Set(classes.filter(c => c.grade === stagedGrade).map(c => c.stream))].filter(Boolean).sort();

  return (
    <div className="pb-24 font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 px-5 pt-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Users size={22} />
           </div>
           <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Attendance</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Daily Register</p>
           </div>
        </div>
        {activeContext && (
           <button
             onClick={handleSaveAttendance}
             disabled={isSyncing}
             className="w-11 h-11 flex items-center justify-center bg-[var(--brand-teal)] text-white rounded-2xl shadow-lg shadow-teal-50 active:scale-90 transition-all disabled:opacity-30"
           >
              {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
           </button>
        )}
      </div>

      {!activeContext ? (
        /* ── SETUP VIEW ── */
        <div className="px-5 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-[2.5rem] border border-transparent shadow-xl shadow-teal-50 p-6 space-y-6">
            <div className="space-y-1">
               <span className="text-[10px] font-black text-[var(--brand-purple)] uppercase tracking-widest">Stage 01</span>
               <h3 className="text-lg font-black text-gray-900">Select Register</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{labels.grade}</label>
                <select
                  value={stagedGrade}
                  onChange={(e) => { setStagedGrade(e.target.value); setStagedStream(''); }}
                  disabled={isTeacher}
                  className="w-full h-14 px-4 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-teal-100 outline-none disabled:opacity-60"
                >
                  <option value="">Choose {labels.grade}</option>
                  {availableGrades.map(g => <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stream</label>
                <select
                  value={stagedStream}
                  onChange={(e) => setStagedStream(e.target.value)}
                  disabled={!stagedGrade || isTeacher}
                  className="w-full h-14 px-4 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-teal-100 outline-none disabled:opacity-60"
                >
                  <option value="">All Streams</option>
                  {availableStreams.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                <input
                  type="date"
                  value={stagedDate}
                  onChange={(e) => setStagedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full h-14 px-4 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-teal-100 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleLoadWorkspace}
            disabled={isSyncing || (!stagedGrade && !isTeacher)}
            className="w-full h-16 bg-teal-600 text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl shadow-teal-200 active:scale-95 transition-all outline-none disabled:opacity-30"
          >
            <span className="text-xs font-black uppercase tracking-[0.2em] ml-2">Load Register</span>
            <RefreshCw size={20} className={cn(isSyncing && "animate-spin")} />
          </button>
        </div>
      ) : (
        /* ── REGISTRY VIEW ── */
        <div className="space-y-6 px-5 animate-in fade-in slide-in-from-bottom-4">
          {/* Context Header */}
          <div className="bg-white border-b border-gray-100 py-4 -mx-1 flex items-center justify-between sticky top-0 z-10 transition-all">
             <button onClick={() => setActiveContext(null)} className="p-3 border border-gray-100 rounded-2xl active:scale-90 transition-all">
                <ChevronLeft size={20} className="text-gray-900" />
             </button>
             <div className="text-center flex-1">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeContext.grade.replace(/_/g, ' ')} {activeContext.stream}</h4>
                <p className="text-xs font-black text-gray-900">{new Date(activeContext.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
             </div>
             <button onClick={handleMarkAllPresent} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl active:scale-90 transition-all">
                <Check size={20} strokeWidth={3} />
             </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-gray-50 p-4 rounded-[2rem] text-center border border-gray-100">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Present</p>
                <p className="text-xl font-black text-emerald-600">{stats.present}</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-[2rem] text-center border border-gray-100">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl font-black text-gray-900">{stats.total}</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-[2rem] text-center border border-gray-100">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Rate</p>
                <p className="text-xl font-black text-teal-600">{stats.percentage}%</p>
             </div>
          </div>

          {/* Search */}
          <div className="relative">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
             <input
               type="text"
               placeholder={`Search ${labels.learners.toLowerCase()}...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-[1.5rem] text-xs font-bold outline-none focus:ring-2 focus:ring-teal-100"
             />
          </div>

          {/* Learner List */}
          <div className="space-y-4 py-2">
             {filteredLearners.map(learner => {
                const currentStatus = pendingChanges[learner.id]?.status;
                return (
                   <div key={learner.id} className="bg-white rounded-[2.5rem] border border-gray-50 p-6 shadow-sm space-y-5">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-colors",
                            currentStatus ? statusConfig[currentStatus].lightColor : "bg-gray-100 text-gray-400"
                         )}>
                            {learner.firstName[0]}{learner.lastName[0]}
                         </div>
                         <div>
                            <h5 className="text-sm font-black text-gray-900 leading-tight">{learner.firstName} {learner.lastName}</h5>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">{learner.admissionNumber}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                         {Object.entries(statusConfig).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => handleStatusChange(learner.id, key)}
                              className={cn(
                                 "flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-300",
                                 currentStatus === key 
                                    ? `${config.color} text-white border-transparent shadow-lg shadow-${config.color.split('-')[1]}-100 scale-105` 
                                    : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                              )}
                            >
                               <config.icon size={16} strokeWidth={currentStatus === key ? 3 : 2} />
                               <span className="text-[8px] font-black uppercase tracking-widest">{config.label}</span>
                            </button>
                         ))}
                      </div>

                      {currentStatus && (
                         <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                            <input
                               type="text"
                               placeholder="Add remark..."
                               value={pendingChanges[learner.id]?.remarks || ''}
                               onChange={(e) => setPendingChanges(prev => ({
                                  ...prev,
                                  [learner.id]: { ...prev[learner_id], remarks: e.target.value }
                               }))}
                               className="w-full bg-transparent text-[10px] font-bold text-gray-500 placeholder:text-gray-300 outline-none border-b border-gray-50 focus:border-teal-200 pb-1"
                            />
                         </div>
                      )}
                   </div>
                );
             })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAttendance;
