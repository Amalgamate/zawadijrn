import React from 'react';
import { Users, Save, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, Search, ChevronLeft, Check, Loader2 } from 'lucide-react';
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
    grades,
    streams,
    loading,
    getDailyClassReport,
    markBulkAttendance,
  } = useAttendance();

  const getClassGrade = React.useCallback((classItem) => {
    return classItem?.grade || classItem?.classGrade || classItem?.level || classItem?.gradeLevel || classItem?.classLevel || '';
  }, []);

  const normalizeStreamName = React.useCallback((value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object') {
      return (
        value.name ||
        value.stream ||
        value.label ||
        value.streamName ||
        value.value ||
        value.title ||
        value.code ||
        ''
      ).toString().trim();
    }
    return String(value).trim();
  }, []);

  const getClassStream = React.useCallback((classItem) => {
    return normalizeStreamName(
      classItem?.stream ||
      classItem?.classStream ||
      classItem?.streamName ||
      classItem?.streamLabel ||
      classItem?.streamValue ||
      classItem?.streamConfig ||
      classItem?.streamObj
    );
  }, [normalizeStreamName]);

  const getClassId = React.useCallback((classItem) => {
    return classItem?.id || classItem?._id || classItem?.classId || '';
  }, []);

  const assignedClass = React.useMemo(() => {
    if (!isTeacher || classes.length === 0) return null;
    return classes[0];
  }, [isTeacher, classes]);

  React.useEffect(() => {
    if (!isTeacher || !assignedClass) return;
    const assignedGrade = getClassGrade(assignedClass);
    const assignedStream = getClassStream(assignedClass);
    if (stagedGrade !== assignedGrade) setStagedGrade(assignedGrade);
    if (stagedStream !== assignedStream) setStagedStream(assignedStream);
  }, [isTeacher, assignedClass, stagedGrade, stagedStream, getClassGrade, getClassStream]);

  const handleLoadWorkspace = React.useCallback(async () => {
    const targetClass = isTeacher
      ? assignedClass
      : classes.find((c) => {
        const classGrade = getClassGrade(c);
        const classStream = getClassStream(c);
        return classGrade === stagedGrade && (stagedStream ? classStream === stagedStream : true);
      });

    if (!targetClass) {
      showError(isTeacher ? `No ${labels.class.toLowerCase()} assigned to your account.` : `No active ${labels.class.toLowerCase()} found.`);
      return;
    }

    setIsSyncing(true);
    try {
      const targetClassId = getClassId(targetClass);
      const report = await getDailyClassReport(targetClassId, stagedDate);
      if (report) {
        setDailyReport(report);
        setActiveContext({
          classId: targetClassId,
          className: targetClass.name,
          date: stagedDate,
          grade: getClassGrade(targetClass),
          stream: getClassStream(targetClass)
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
  }, [isTeacher, assignedClass, stagedGrade, stagedStream, stagedDate, classes, getDailyClassReport, showError, labels, getClassGrade, getClassStream, getClassId]);

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
    const absent = Object.values(pendingChanges).filter(p => p.status === 'ABSENT').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, percentage };
  }, [pendingChanges, dailyReport]);

  const availableGrades = React.useMemo(() => {
    const classGrades = classes.map((c) => getClassGrade(c)).filter(Boolean);
    const hookGrades = Array.isArray(grades) ? grades.filter(Boolean) : [];
    return [...new Set([...hookGrades, ...classGrades])].sort();
  }, [classes, grades, getClassGrade]);

  const availableStreams = React.useMemo(() => {
    const classStreams = classes
      .filter((c) => (stagedGrade ? getClassGrade(c) === stagedGrade : true))
      .map((c) => getClassStream(c))
      .filter(Boolean);
    const hookStreams = Array.isArray(streams) ? streams.map((s) => normalizeStreamName(s)).filter(Boolean) : [];
    return [...new Set([...(hookStreams || []), ...(classStreams || [])])].sort();
  }, [classes, streams, stagedGrade, getClassGrade, getClassStream, normalizeStreamName]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Daily Attendance</h2>
            <p className="text-sm text-slate-600">Capture and synchronize class register records.</p>
          </div>
        </div>
        {activeContext && (
          <button
            onClick={handleSaveAttendance}
            disabled={isSyncing}
            className="h-10 px-4 bg-brand-teal text-white rounded-md hover:bg-brand-teal/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Register
          </button>
        )}
      </div>

      {!activeContext ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Load Register</h3>
            <p className="text-sm text-slate-600">Select class context and date to begin marking attendance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{labels.grade}</label>
              <select
                value={stagedGrade}
                onChange={(e) => { setStagedGrade(e.target.value); setStagedStream(''); }}
                disabled={isTeacher}
                className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none disabled:opacity-60"
              >
                <option value="">Choose {labels.grade}</option>
                {availableGrades.map(g => <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stream</label>
              <select
                value={stagedStream}
                onChange={(e) => setStagedStream(e.target.value)}
                disabled={isTeacher}
                className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none disabled:opacity-60"
              >
                <option value="">All Streams</option>
                {availableStreams.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={stagedDate}
                onChange={(e) => setStagedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleLoadWorkspace}
              disabled={isSyncing || (!stagedGrade && !isTeacher)}
              className="h-10 px-4 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <RefreshCw size={16} className={cn(isSyncing && "animate-spin")} />
              Load Register
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveContext(null)}
              className="h-9 px-3 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">
                {activeContext.grade.replace(/_/g, ' ')}{activeContext.stream ? ` • ${activeContext.stream}` : ''}
              </p>
              <p className="text-xs text-slate-600">
                {new Date(activeContext.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={handleMarkAllPresent}
              className="h-9 px-3 border border-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors flex items-center gap-1"
            >
              <Check size={15} />
              Mark All Present
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Present</p>
              <p className="text-2xl font-semibold text-emerald-600">{stats.present}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Absent</p>
              <p className="text-2xl font-semibold text-rose-600">{stats.absent}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Total</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Rate</p>
              <p className="text-2xl font-semibold text-brand-teal">{stats.percentage}%</p>
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${labels.learners.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-slate-300 rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-brand-teal/20"
            />
          </div>

          {loading || isSyncing ? (
            <div className="bg-white border border-slate-200 rounded-lg py-14 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : filteredLearners.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg py-14 text-center text-slate-500">
              No learners found for this context.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLearners.map((learner) => {
                const currentStatus = pendingChanges[learner.id]?.status;
                return (
                  <div key={learner.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-900">{learner.firstName} {learner.lastName}</h5>
                        <p className="text-xs text-slate-500">{learner.admissionNumber}</p>
                      </div>
                      {currentStatus && (
                        <span className={cn("text-xs font-semibold px-2 py-1 rounded-md", statusConfig[currentStatus].lightColor)}>
                          {statusConfig[currentStatus].label}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => handleStatusChange(learner.id, key)}
                          className={cn(
                            "h-9 rounded-md border text-xs font-semibold transition-colors flex items-center justify-center gap-1",
                            currentStatus === key
                              ? `${config.color} text-white border-transparent`
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <config.icon size={14} />
                          {config.label}
                        </button>
                      ))}
                    </div>

                    {currentStatus && (
                      <input
                        type="text"
                        placeholder="Add remark (optional)"
                        value={pendingChanges[learner.id]?.remarks || ''}
                        onChange={(e) => setPendingChanges(prev => ({
                          ...prev,
                          [learner.id]: { ...(prev[learner.id] || { status: currentStatus, remarks: '' }), remarks: e.target.value }
                        }))}
                        className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm bg-white outline-none focus:ring-2 focus:ring-brand-teal/20"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyAttendance;
