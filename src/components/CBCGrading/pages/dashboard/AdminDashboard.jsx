/**
 * Comprehensive Admin Dashboard
 * Modern, intuitive design with data visualizations
 */

import React, { useEffect, useState } from 'react';
import { schoolAPI, dashboardAPI } from '../../../../services/api';
import CompactMetricBanner from './CompactMetricBanner';
import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  RefreshCw,
  Wallet,
  Settings,
  Activity,
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';

// Professional Metric Card with Premium Styling
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => {
  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-brand-purple to-pink-500',
    teal: 'from-brand-teal to-cyan-500',
    amber: 'from-amber-500 to-orange-500'
  };
  const colors = ['blue', 'purple', 'teal', 'amber'];
  const gradient = gradients[colors[Math.floor(Math.random() * colors.length)]];

  return (
    <div className="group relative bg-white p-4 rounded-lg border border-gray-200 shadow-md hover:shadow-xl hover:border-brand-purple/50 transition-all duration-300">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${gradient} rounded-lg transition-opacity duration-300`}></div>
      <div className="relative flex justify-between items-start mb-2">
        <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 group-hover:scale-110 transition-transform duration-300">
          <Icon size={20} className="text-gray-600" />
        </div>
        {trendValue && (
          <span className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full ${trend === 'up'
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-rose-50 text-rose-600'
            }`}>
            {trend === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
      {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

// Tab Button with Premium Styling
const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all duration-300 border-b-2 relative ${active
      ? 'border-brand-purple text-brand-purple bg-gradient-to-r from-brand-purple/10 to-transparent'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
      }`}
  >
    <Icon size={16} />
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple to-pink-500"></div>}
  </button>
);

const AdminDashboard = ({ learners = [], pagination, teachers = [], user, onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, financials, performance, operations
  const [timeFilter, setTimeFilter] = useState('term');
  const [metrics, setMetrics] = useState(null);

  const loadMetrics = async (filter) => {
    try {
      setRefreshing(true);
      const response = await dashboardAPI.getAdminMetrics(filter || timeFilter);
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics(timeFilter);
  }, [user, timeFilter]);

  const stats = {
    totalStudents: metrics?.stats?.totalStudents || pagination?.total || learners.length || 0,
    activeStudents: metrics?.stats?.activeStudents || learners.filter(l => l.status === 'ACTIVE').length || 0,
    totalTeachers: metrics?.stats?.totalTeachers || teachers.length || 0,
    activeTeachers: metrics?.stats?.activeTeachers || teachers.filter(t => t.status === 'ACTIVE').length || 0,
    presentToday: metrics?.stats?.presentToday || 0,
    absentToday: metrics?.stats?.absentToday || 0,
    totalClasses: metrics?.stats?.totalClasses || 0,
    avgAttendance: metrics?.stats?.avgAttendance || 0,
    feeCollected: metrics?.stats?.feeCollected || 0,
    feePending: metrics?.stats?.feePending || 0,
    studentTrend: metrics?.stats?.studentTrend,
    teacherTrend: metrics?.stats?.teacherTrend
  };

  const renderOverview = () => {
    const bannerMetrics = [
      {
        title: 'Total Students',
        value: stats.totalStudents,
        subtitle: `${stats.activeStudents} active learners`,
        icon: Users,
        trend: stats.studentTrend?.startsWith('+') ? 'up' : 'down',
        trendValue: stats.studentTrend,
        onClick: () => onNavigate('learners-list')
      },
      {
        title: 'Teaching Staff',
        value: stats.totalTeachers,
        subtitle: `${stats.activeTeachers} verified tutors`,
        icon: GraduationCap,
        trend: stats.teacherTrend?.startsWith('+') ? 'up' : 'down',
        trendValue: stats.teacherTrend,
        onClick: () => onNavigate('teachers-list')
      },
      {
        title: 'Daily Attendance',
        value: `${stats.avgAttendance}%`,
        subtitle: `${stats.presentToday} present today`,
        icon: UserCheck,
        trend: null,
        trendValue: null,
        onClick: () => onNavigate('attendance-daily')
      },
      {
        title: 'Total Classes',
        value: stats.totalClasses,
        subtitle: 'Across all grades',
        icon: BookOpen,
        trend: null,
        trendValue: null,
        onClick: () => onNavigate('facilities-classes')
      }
    ];

    return (
      <div className="space-y-6">
        {/* Compact Metric Banner */}
        <CompactMetricBanner
          metrics={bannerMetrics}
          gradientFrom="from-brand-purple"
          gradientVia="via-purple-500"
          gradientTo="to-pink-500"
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Activity Table */}
          <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Activity Log</h3>
              <button className="text-xs font-bold text-brand-purple hover:underline">Download Audit</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Activity Description</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {metrics?.recentActivity?.admissions?.slice(0, 5).map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-blue-600">Admission</td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700">New student {student.firstName} {student.lastName} enrolled</td>
                      <td className="px-6 py-4 text-xs"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-bold uppercase tracking-widest text-[9px]">Verified</span></td>
                    </tr>
                  ))}
                  {metrics?.recentActivity?.assessments?.slice(0, 5).map((as, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(as.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-brand-purple">Assessment</td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700">{as.title} for {as.learningArea}</td>
                      <td className="px-6 py-4 text-xs"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold uppercase tracking-widest text-[9px]">Calculated</span></td>
                    </tr>
                  ))}
                  {!metrics?.recentActivity?.admissions?.length && !metrics?.recentActivity?.assessments?.length && (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-xs italic">No activity recorded for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Operations Hub</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Register New Student', icon: Users, page: 'learners-admissions' },
                  { label: 'Manage Staff Directory', icon: GraduationCap, page: 'teachers-list' },
                  { label: 'Academic Term Settings', icon: BookOpen, page: 'settings-academic' },
                  { label: 'Financial Statements', icon: FileText, page: 'accounting-reports' }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate(action.page)}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-brand-purple hover:bg-brand-purple/5 group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <action.icon size={18} className="text-gray-400 group-hover:text-brand-purple" />
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-purple" />
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle size={14} /> System Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-1 h-8 bg-amber-400 rounded-full" />
                  <div>
                    <p className="text-[11px] font-bold text-amber-900">{metrics?.stats?.totalPendingAssessments || 0} Pending Assessments</p>
                    <p className="text-[9px] text-amber-700 uppercase font-black">Requires Head Teacher Review</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancials = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Revenue" value={`KES ${stats.feeCollected.toLocaleString()}`} icon={Wallet} subtitle="Termly Collection" />
        <MetricCard title="Outstandings" value={`KES ${stats.feePending.toLocaleString()}`} icon={TrendingUp} subtitle="Pending Payments" />
        <MetricCard title="Collection Rate" value={`${Math.round((stats.feeCollected / (stats.feeCollected + stats.feePending)) * 100)}%`} icon={Activity} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Revenue Breakdown by Stream</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold uppercase hover:bg-gray-50 flex items-center gap-1"><Download size={12} /> XLS</button>
            <button className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold uppercase hover:bg-gray-50 flex items-center gap-1"><FileText size={12} /> PDF</button>
          </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Grade Category</th>
                <th className="px-6 py-3 text-right">Target Rev</th>
                <th className="px-6 py-3 text-right">Collected</th>
                <th className="px-6 py-3 text-right">Balance</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(metrics?.financials?.streamBreakdown?.length > 0 ? metrics.financials.streamBreakdown : []).map((row, idx) => (
                <tr key={idx} className="text-xs font-semibold text-gray-700">
                  <td className="px-6 py-4">{row.name}</td>
                  <td className="px-6 py-4 text-right">KES {row.target?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">KES {row.collected?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-rose-600">KES {row.bal?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${row.target > 0 ? (row.collected / row.target) * 100 : 0}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
              {!metrics?.financials?.streamBreakdown?.length && (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-xs italic">No financial data available for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Classes Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Ranking by Academic Average</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Grade Unit</th>
                <th className="px-6 py-3 text-right">Avg Rating</th>
                <th className="px-6 py-3 text-right">Proficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(metrics?.topPerformingClasses?.length > 0 ? metrics.topPerformingClasses : []).map((cls, idx) => (
                <tr key={idx} className="text-xs font-bold text-gray-700">
                  <td className="px-6 py-4 text-gray-400">#0{idx + 1}</td>
                  <td className="px-6 py-4 text-gray-900">{cls.grade}</td>
                  <td className="px-6 py-4 text-right">{cls.avg}</td>
                  <td className="px-6 py-4 text-right"><span className="px-3 py-1 bg-brand-teal/10 text-brand-teal rounded-full text-[10px]">{cls.label}</span></td>
                </tr>
              ))}
              {!metrics?.topPerformingClasses?.length && (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-xs italic">Not enough assessment data to generate rankings</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Learning Area Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Subject Proficiency Distribution</h3>
          <div className="space-y-6">
            {(metrics?.distributions?.subjectProficiency?.length > 0 ? metrics.distributions.subjectProficiency : []).map((subject, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-gray-800 tracking-tight">{subject.area}</span>
                  <span className="text-[10px] font-bold text-gray-400">{subject.ee}% Exceeding</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div style={{ width: `${subject.ee}%` }} className="bg-brand-purple" title="Exceeding" />
                  <div style={{ width: `${subject.me}%` }} className="bg-brand-teal" title="Meeting" />
                  <div style={{ width: `${subject.be}%` }} className="bg-rose-400" title="Below Expectation" />
                </div>
              </div>
            ))}
            {!metrics?.distributions?.subjectProficiency?.length && (
              <div className="py-8 text-center text-gray-400 text-xs italic">No proficiency data logged across subjects.</div>
            )}
          </div>
          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-brand-purple" /> <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">EE</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-brand-teal" /> <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ME</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-400" /> <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">BE</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Operational Deadlines */}
        <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Academic Calendar & Milestones</h3>
          </div>
          <div className="p-0">
            {(metrics?.upcomingEvents?.length > 0 ? metrics.upcomingEvents : []).map((evt, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center p-2 min-w-[60px] bg-gray-100 rounded-md">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-sm font-black text-gray-900">{new Date(evt.date).getDate()}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900">{evt.title}</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{evt.category} • Lead: {evt.responsible}</p>
                  </div>
                </div>
                <button onClick={() => onNavigate('events-calendar')} className="p-2 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-md transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
            {!metrics?.upcomingEvents?.length && (
              <div className="px-6 py-8 text-center text-gray-400 text-xs italic">No upcoming events scheduled.</div>
            )}
          </div>
        </div>

        {/* Staff Utilization */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2"><Briefcase size={16} className="text-gray-400" /> Staffing Overview</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Teaching Staff</span>
                <span className="text-xs font-black text-brand-teal">{stats.activeTeachers} / {stats.totalTeachers} Active</span>
              </div>
              <div className="w-full bg-white border border-gray-200 h-1 rounded-full overflow-hidden">
                <div className="bg-brand-teal h-full" style={{ width: `${(stats.activeTeachers / stats.totalTeachers) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Teacher-Student Ratio</span>
                <span className="text-xs font-black text-brand-purple">1 : {Math.round(stats.totalStudents / (stats.totalTeachers || 1))}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Within optimal standard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-purple via-purple-500 to-pink-500 p-8 text-white shadow-xl">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
              <TrendingUp size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">System Performance Dashboard</h1>
              <p className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2 mt-1">
                <span className="inline-block w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                Live Server Stats • {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 p-1 rounded-lg border border-white/20 backdrop-blur-sm">
              {['today', 'term', 'year'].map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-md transition-all duration-300 ${timeFilter === f
                    ? 'bg-white text-brand-purple shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => loadMetrics()}
              disabled={refreshing}
              className="p-2.5 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-300 text-white backdrop-blur-sm"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-gray-200 bg-white px-2 rounded-lg shadow-md border border-gray-200">
        <TabButton id="overview" label="General Overview" icon={Activity} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton id="financials" label="Financials" icon={Wallet} active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />
        <TabButton id="performance" label="Academic Performance" icon={Award} active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
        <TabButton id="operations" label="School Operations" icon={Clock} active={activeTab === 'operations'} onClick={() => setActiveTab('operations')} />
      </div>

      {/* Tab Content */}
      <div className="animate-in slide-in-from-bottom-2 duration-300 rounded-lg">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'financials' && renderFinancials()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'operations' && renderOperations()}
      </div>
    </div>
  );
};

export default AdminDashboard;
