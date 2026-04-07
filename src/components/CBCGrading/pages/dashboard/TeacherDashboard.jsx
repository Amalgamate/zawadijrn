/**
 * Teacher Dashboard - Compact & Clean Design with Drag & Drop
 * Minimal, efficient dashboard view for TEACHER role
 * Users can rearrange dashboard sections by dragging
 */

import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../../../services/api';
import CompactMetricBanner from './CompactMetricBanner';
import {
  Users,
  ClipboardList,
  BookOpen,
  Clock,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Activity,
  Award,
  Calendar,
  ChevronRight,
  FileText,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import AnimatedDoughnutChart from '../../shared/AnimatedDoughnutChart';
import { clockInTeacher, clockOutTeacher, getCurrentUserClockInStatus, syncCurrentUserClockInStatus } from '../../../../utils/teacherClockIn';

// Professional Components with Premium Styling
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => {
  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-brand-purple to-pink-500',
    teal: 'from-brand-teal to-cyan-500',
    amber: 'from-amber-500 to-orange-500',
    green: 'from-emerald-500 to-teal-600'
  };
  const colors = ['blue', 'purple', 'teal', 'amber', 'green'];
  const gradient = gradients[colors[Math.floor(Math.random() * colors.length)]];

  return (
    <div className="group relative bg-white p-4 rounded-lg border border-gray-200 shadow-md hover:shadow-xl hover:border-brand-purple/50 transition-all duration-300">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${gradient} rounded-lg transition-opacity duration-300`}></div>
      <div className="relative flex justify-between items-start mb-2">
        <div className="p-3 rounded-lg bg-gray-50 group-hover:scale-110 transition-transform duration-300">
          <Icon size={20} className="text-gray-600" />
        </div>
        {trendValue && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend === 'up'
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-rose-50 text-rose-600'
            }`}>
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
      {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 border-b-2 relative ${active
      ? 'border-brand-purple text-brand-purple bg-brand-purple/10'
      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-white/50'
      }`}
  >
    <Icon size={14} />
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple"></div>}
  </button>
);

const TeacherDashboard = ({ learners, user, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, instructional, students, analytics
  const [metrics, setMetrics] = useState(null);
  const [clockInState, setClockInState] = useState(() => getCurrentUserClockInStatus(user));

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getTeacherMetrics();
        if (response.success) {
          setMetrics(response.data);
        }
      } catch (error) {
        console.error('Failed to load teacher metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, [user?.id]);

  useEffect(() => {
    let active = true;

    const refreshClockIn = async () => {
      // Check local status first to avoid immediate API call
      const localStatus = getCurrentUserClockInStatus(user);
      if (localStatus.clockedIn) {
        setClockInState(localStatus);
      }
      
      const status = await syncCurrentUserClockInStatus(user);
      if (!active) return;
      setClockInState(status);
    };

    const handleClockInEvt = () => {
      if (!active) return;
      setClockInState(getCurrentUserClockInStatus(user));
    };

    refreshClockIn();
    window.addEventListener('teacherClockInChanged', handleClockInEvt);
    window.addEventListener('storage', handleClockInEvt);

    return () => {
      active = false;
      window.removeEventListener('teacherClockInChanged', handleClockInEvt);
      window.removeEventListener('storage', handleClockInEvt);
    };
  }, [user?.id]);

  const handleClockIn = () => {
    clockInTeacher(user, {
      source: 'dashboard',
      role: user?.role
    });
    setClockInState(getCurrentUserClockInStatus(user));
  };

  const handleClockOut = () => {
    clockOutTeacher(user, {
      source: 'dashboard',
      role: user?.role
    });
    setClockInState(getCurrentUserClockInStatus(user));
  };

  const stats = {
    myStudents: metrics?.stats?.myStudents || learners?.filter(l => l.status === 'Active').length || 0,
    classesToday: metrics?.schedule?.length || 0,
    pendingGrading: metrics?.stats?.pendingTasks || 0,
    attendanceRate: metrics?.stats?.analytics?.attendance || 94
  };

  const renderOverview = () => {
    const bannerMetrics = [
      {
        title: 'Enrollment',
        value: stats.myStudents,
        subtitle: 'Assigned Learners',
        icon: Users,
        trend: null,
        trendValue: null,
        onClick: () => onNavigate && onNavigate('learners-list')
      },
      {
        title: 'Active Classes',
        value: stats.classesToday,
        subtitle: 'Sessions Scheduled',
        icon: BookOpen,
        trend: null,
        trendValue: null,
        onClick: () => onNavigate && onNavigate('facilities-classes')
      },
      {
        title: 'Pending Review',
        value: stats.pendingGrading,
        subtitle: 'Assessments to Grade',
        icon: ClipboardList,
        trend: null,
        trendValue: null,
        onClick: () => onNavigate && onNavigate('assess-summative-assessment')
      },
      {
        title: 'Participation',
        value: `${stats.attendanceRate}%`,
        subtitle: 'Avg Daily Rate',
        icon: Activity,
        trend: null,
        trendValue: null,
        onClick: () => onNavigate && onNavigate('attendance-daily')
      }
    ];

    return (
      <div className="space-y-6">
        {/* Compact Metric Banner */}
        <CompactMetricBanner
          metrics={bannerMetrics}
          gradientFrom="from-brand-teal"
          gradientVia="via-teal-500"
          gradientTo="to-cyan-500"
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Urgent Tasks */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Instructional Priorities</h3>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-bold uppercase tracking-widest">Urgent</span>
            </div>
            <div className="divide-y divide-gray-100">
              {!clockInState.clockedIn && (
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-semibold">
                  You have not clocked in yet. Clock in to be recognized as available for today&apos;s timetable events.
                </div>
              )}
              {metrics?.stats?.pendingTasks > 0 ? (
                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">Grade Pending Formative Assessments</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black">{metrics.stats.pendingTasks} submissions awaiting review</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-brand-purple uppercase tracking-widest hover:underline">Process Now</button>
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-xs text-gray-400 italic">No high-priority tasks pending review.</div>
              )}
            </div>
          </div>

          {/* Next Class Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Clock size={14} className="text-brand-purple" /> Immediate Schedule
            </h3>
            {metrics?.schedule?.length > 0 ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center p-2 min-w-[70px] bg-white border border-gray-100 rounded shadow-sm">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Starts @</p>
                    <p className="text-sm font-black text-gray-900">{metrics.schedule[0].time}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight">{metrics.schedule[0].subject}</h4>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">{metrics.schedule[0].grade} • Room {metrics.schedule[0].room}</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 bg-brand-purple text-white rounded text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-brand-purple/90 transition-all">Launch Session</button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs italic">No more classes scheduled for the remainder of the session.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInstructional = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest text-[#242424]">Weekly Curricular Timetable</h3>
          <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-500 hover:text-brand-purple px-2 py-1 border border-gray-200 rounded bg-white"><FileText size={12} /> Export Table</button>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead className="border-b border-[color:var(--table-border)]">
              <tr>
                <th className="px-6 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Time Slot</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Unit / Learning Area</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Target Grade</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics?.schedule?.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-black text-gray-500">{item.time}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-900 tracking-tight">{item.subject}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-600">{item.grade}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">Building {item.room.charAt(0)} / RM {item.room}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-50 text-gray-400'}`}>
                      {idx === 0 ? 'Next Up' : 'Scheduled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-6">Subject Proficiency Metrics</h3>
          <div className="space-y-6">
            {[
              { label: 'Attendance Compliance', value: metrics?.stats?.analytics?.attendance || 94, color: 'bg-emerald-500' },
              { label: 'Assessment Grading Rate', value: metrics?.stats?.analytics?.graded || 88, color: 'bg-brand-purple' },
              { label: 'Curriculum Coverage', value: metrics?.stats?.analytics?.completion || 72, color: 'bg-blue-500' },
              { label: 'Average Learner Engagement', value: metrics?.stats?.analytics?.engagement || 91, color: 'bg-brand-teal' }
            ].map((bar, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{bar.label}</span>
                  <span className="text-xs font-black text-gray-900">{bar.value}%</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`${bar.color} h-full transition-all duration-1000 ease-out`} style={{ width: `${bar.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-6">Learning Outcomes Distribution</h3>
          <div className="flex items-center justify-center py-8">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-3xl font-black text-brand-purple">EE</p>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">Exceeding (24%)</p>
              </div>
              <div>
                <p className="text-3xl font-black text-brand-teal">ME</p>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">Meeting (56%)</p>
              </div>
              <div>
                <p className="text-3xl font-black text-amber-500">AE</p>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">Approaching (15%)</p>
              </div>
              <div>
                <p className="text-3xl font-black text-rose-500">BE</p>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">Below (5%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-brand-teal p-8 text-white shadow-xl">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
              <Target size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Faculty Instruction Console</h1>
              <p className="text-sm font-bold text-white/80 uppercase tracking-widest mt-1">
                Tutor ID: {user?.staffId || 'T-8829'} • {new Date().toLocaleDateString()} • Term 01, 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2.5 border border-white/30 rounded-lg hover:bg-white/10 transition-all duration-300 text-white font-bold text-sm backdrop-blur-sm flex items-center gap-2">
              <Calendar size={16} /> View Full Calendar
            </button>
            <button
              onClick={clockInState.clockedIn ? handleClockOut : handleClockIn}
              className={`px-4 py-2.5 rounded-lg border font-bold text-sm backdrop-blur-sm transition-all duration-300 ${clockInState.clockedIn
                ? 'bg-amber-500/30 text-white border-amber-200/60 hover:bg-amber-500/40'
                : 'border-white/40 text-white hover:bg-white/10'
                }`}
            >
              {clockInState.clockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 rounded-lg overflow-hidden flex shadow-md">
        <TabButton active={activeTab === 'overview'} label="Performance Hub" icon={Activity} onClick={() => setActiveTab('overview')} />
        <TabButton active={activeTab === 'instructional'} label="Daily Timetable" icon={Clock} onClick={() => setActiveTab('instructional')} />
        <TabButton active={activeTab === 'analytics'} label="Statistical Insight" icon={TrendingUp} onClick={() => setActiveTab('analytics')} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-lg">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'instructional' && renderInstructional()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};

export default TeacherDashboard;
