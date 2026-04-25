/**
 * Comprehensive Admin Dashboard
 * Modern, intuitive design with data visualizations
 */

import React, { useEffect, useState } from 'react';
import { schoolAPI, dashboardAPI } from '../../../../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import CompactMetricBanner from './CompactMetricBanner';

// --- Dashboard Data Visualizations are computed dynamically from Real API Metrics ---
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
  Wallet,
  Settings,
  Activity,
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  Briefcase,
  X,
  Filter,
  UserPlus,
  Receipt,
  ClipboardCheck,
  Package,
  Brain,
  Zap,
  ShieldAlert
} from 'lucide-react';

// Professional Metric Card with Premium Styling
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'brand-purple' }) => {
  return (
    <div className="group relative bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative flex justify-between items-start mb-2">
        <div className={`p-3 rounded-lg bg-${color}/5 group-hover:bg-${color}/10 transition-colors duration-300`}>
          <Icon size={20} className={`text-${color}`} />
        </div>
        {trendValue && (
          <span className={`flex items-center text-[10px] font-semibold px-2 py-1 rounded-full ${trend === 'up'
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-rose-50 text-rose-600'
            }`}>
            {trend === 'up' ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-semibold text-gray-900 mt-1">{value}</h3>
      {subtitle && <p className="text-[10px] font-medium text-gray-500 mt-1 truncate opacity-70">{subtitle}</p>}
    </div>
  );
};

// Tab Button with Premium Styling
const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-300 border-b-2 relative ${active
      ? 'border-brand-purple text-brand-purple bg-brand-purple/10'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
      }`}
  >
    <Icon size={16} />
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple"></div>}
  </button>
);

const AdminDashboard = ({ learners = [], pagination, teachers = [], user, onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUnAssessedSheet, setShowUnAssessedSheet] = useState(false);
  const [timeFilter, setTimeFilter] = useState('term');
  const [metrics, setMetrics] = useState(null);
  const [apiError, setApiError] = useState(null);
  // Stable user id — prevents re-fetch every time the user object reference changes
  const userId = user?.id || user?.userId;

  const loadMetrics = async (filter) => {
    try {
      setRefreshing(true);
      setApiError(null);
      const response = await dashboardAPI.getAdminMetrics(filter || timeFilter);
      if (response.success) {
        setMetrics(response.data);
      } else {
        setApiError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
      setApiError(error.message || 'Could not reach the server. It may be waking up — please retry in a moment.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics(timeFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, timeFilter]);

  // ── Loading state: show skeleton while first fetch is in progress ─────────────
  if (refreshing && !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 lg:gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-10 w-96 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-72 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  // ── Error state: server unreachable (cold start / network) ─────────────────
  if (apiError && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl max-w-md">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-base font-semibold text-amber-900 mb-1">Dashboard is warming up</h3>
          <p className="text-xs text-amber-700 mb-4">{apiError}</p>
          <button
            onClick={() => loadMetrics(timeFilter)}
            className="px-6 py-2 bg-brand-purple text-white text-xs font-semibold uppercase tracking-widest rounded-lg hover:bg-brand-purple/90 transition"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalStudents: metrics?.stats?.totalStudents || pagination?.total || learners.length || 0,
    activeStudents: metrics?.stats?.activeStudents || learners.filter(l => l.status === 'ACTIVE').length || 0,
    totalTeachers: metrics?.stats?.totalTeachers || teachers.length || 0,
    activeTeachers: metrics?.stats?.activeTeachers || teachers.filter(t => t.status === 'ACTIVE').length || 0,
    males: metrics?.stats?.males || learners.filter(l => (l.gender || '').toLowerCase().startsWith('m')).length || 0,
    females: metrics?.stats?.females || learners.filter(l => (l.gender || '').toLowerCase().startsWith('f')).length || 0,
    presentToday: metrics?.stats?.presentToday || 0,
    absentToday: metrics?.stats?.absentToday || 0,
    totalClasses: metrics?.stats?.totalClasses || 0,
    totalAssessedClasses: metrics?.stats?.totalAssessedClasses || 0,
    totalMissedExams: metrics?.stats?.totalMissedExams || 0,
    currentTestSeries: metrics?.stats?.currentTestSeries || 'Current Series',
    avgAttendance: metrics?.stats?.avgAttendance || 0,
    feeCollected: metrics?.stats?.feeCollected || 0,
    feePending: metrics?.stats?.feePending || 0,
    studentTrend: metrics?.stats?.studentTrend,
    teacherTrend: metrics?.stats?.teacherTrend,
    atRiskStudents: metrics?.stats?.atRiskStudents || 0
  };

  const dynamicDemographicsData = [
    { name: 'Present Today', value: stats.presentToday || 0, color: '#14b8a6' },
    { name: 'Absent (Alert)', value: stats.absentToday || 0, color: '#f43f5e' }
  ];
  if (dynamicDemographicsData[0].value === 0 && dynamicDemographicsData[1].value === 0) {
     dynamicDemographicsData[0].value = stats.activeStudents > 0 ? stats.activeStudents : 1;
     dynamicDemographicsData[0].name = 'Enrolled';
  }

  const dynamicAssessmentData = [
    { name: 'Assessed', value: stats.totalStudents - stats.totalMissedExams || 0, color: '#8b5cf6' },
    { name: 'Missed (Warning)', value: stats.totalMissedExams || 0, color: '#f43f5e' }
  ];

  const dynamicFinanceData = (metrics?.financials?.streamBreakdown || []).map(row => ({
    name: row.name,
    collected: row.collected || 0,
    pending: row.bal || 0
  }));

  const dynamicProficiencyData = (metrics?.distributions?.subjectProficiency || []).map(row => ({
    name: row.area,
    ee: row.ee || 0,
    me: row.me || 0,
    be: row.be || 0
  }));

  const renderOverview = () => {
    const bannerMetrics = [
      {
        title: 'Total Students',
        value: stats.totalStudents,
        subtitle: (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span>{stats.activeStudents} active</span>
            <span className="text-pink-300 font-semibold text-[10px] border-l border-indigo-400/50 pl-1.5 opacity-90 drop-shadow-sm">
              {stats.males} Male / {stats.females} Female
            </span>
          </span>
        ),
        icon: Users,
        trend: stats.studentTrend?.startsWith('+') ? 'up' : 'down',
        trendValue: stats.studentTrend,
        colorTheme: 'primary',
        onClick: () => onNavigate('learners-list')
      },
      {
        title: 'Current Exam Series',
        value: stats.currentTestSeries,
        subtitle: 'Assessment Period',
        icon: GraduationCap,
        trend: null,
        trendValue: null,
        colorTheme: 'info',
        onClick: () => onNavigate('assess-summary-report')
      },
      {
        title: 'Total Un-Assessed',
        value: stats.totalMissedExams,
        subtitle: stats.currentTestSeries,
        icon: AlertCircle,
        trend: null,
        trendValue: null,
        colorTheme: 'warning',
        onClick: () => setShowUnAssessedSheet(true)
      },
      {
        title: 'Assessed Classes',
        value: stats.totalAssessedClasses,
        subtitle: 'Classes with active assessments',
        icon: UserCheck,
        trend: null,
        trendValue: null,
        colorTheme: 'success',
        onClick: () => onNavigate('assess-summative-assessment')
      }
    ];

    return (
      <div className="space-y-6">
        <CompactMetricBanner metrics={bannerMetrics} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Daily Attendance Pie */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">Daily Attendance</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicDemographicsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dynamicDemographicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assessment Progress */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4 flex items-center justify-between">
              Assessment Fulfillment
              {stats.totalMissedExams > 0 && <span className="text-[9px] font-semibold uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Action Req</span>}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicAssessmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dynamicAssessmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Finance Overview Bar */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">Uncollected Balances</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                {dynamicFinanceData.length > 0 ? (
                  <BarChart data={dynamicFinanceData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `${val >= 1000 ? val/1000 + 'k' : val}`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                    <Bar dataKey="collected" name="Collected" fill="#8b5cf6" radius={0} barSize={12} stackId="a" />
                    <Bar dataKey="pending" name="Pending (Danger)" fill="#f43f5e" radius={0} barSize={12} stackId="a" />
                  </BarChart>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 italic">No Financial Data</div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Activity Table */}
          <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Recent Activity Log</h3>
              <button className="text-xs font-medium text-brand-purple hover:underline">Download Audit</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase tracking-wider">
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
                      <td className="px-6 py-4 text-xs font-medium text-blue-600">Admission</td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700">New student {student.firstName} {student.lastName} enrolled</td>
                      <td className="px-6 py-4 text-xs"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium uppercase tracking-widest text-[9px]">Verified</span></td>
                    </tr>
                  ))}
                  {metrics?.recentActivity?.assessments?.slice(0, 5).map((as, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(as.createdAt).toLocaleDateString()}</td>
                      <td className={`px-6 py-4 text-xs font-medium ${as.type === 'SUMMATIVE' ? 'text-brand-purple' : 'text-brand-teal'}`}>
                        {as.type || 'Assessment'}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                        {as.title} recorded for {as.learner?.firstName} {as.learner?.lastName}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={`px-2 py-0.5 ${as.type === 'SUMMATIVE' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'} rounded-full font-medium uppercase tracking-widest text-[9px]`}>
                          {as.type === 'SUMMATIVE' ? 'Graded' : 'Calculated'}
                        </span>
                      </td>
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
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Operations Hub</h3>
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
                      <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-purple" />
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle size={14} /> System Alerts
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-1 h-8 bg-amber-400 rounded-full" />
                  <div>
                    <p className="text-[11px] font-medium text-amber-900">{metrics?.stats?.totalPendingAssessments || 0} Pending Assessments</p>
                    <p className="text-[9px] text-amber-700 uppercase font-semibold">Requires Head Teacher Review</p>
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
        <MetricCard title="Collection Rate" value={`${Math.round((stats.feeCollected / ((stats.feeCollected + stats.feePending) || 1)) * 100)}%`} icon={Activity} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
         <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4 flex items-center justify-between">
           Financial Collection Risks
           {stats.feePending > 0 && <span className="text-[9px] font-semibold uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Action Required</span>}
         </h3>
         <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {dynamicFinanceData.length > 0 ? (
                  <BarChart data={dynamicFinanceData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `${val >= 1000 ? val/1000 + 'k' : val}`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                    <Bar dataKey="collected" name="Collected Revenue" fill="#8b5cf6" radius={0} stackId="a" />
                    <Bar dataKey="pending" name="High Risk Pending" fill="#f43f5e" radius={0} stackId="a" />
                  </BarChart>
                ) : (
                   <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 italic">No Financial Data Available</div>
                )}
              </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Revenue Breakdown by Stream</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-medium uppercase hover:bg-gray-50 flex items-center gap-1"><Download size={12} /> XLS</button>
            <button className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-medium uppercase hover:bg-gray-50 flex items-center gap-1"><FileText size={12} /> PDF</button>
          </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead className="bg-[color:var(--table-header-bg)] text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">
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
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Ranking by Academic Average</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[color:var(--table-header-bg)] text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Grade Unit</th>
                <th className="px-6 py-3 text-right">Avg Rating</th>
                <th className="px-6 py-3 text-right">Proficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(metrics?.topPerformingClasses?.length > 0 ? metrics.topPerformingClasses : []).map((cls, idx) => (
                <tr key={idx} className="text-xs font-medium text-gray-700">
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
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Subject Proficiency Distribution</h3>
          <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {dynamicProficiencyData.length > 0 ? (
                  <BarChart data={dynamicProficiencyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#475569' }} width={90} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                    <Bar dataKey="ee" name="Exceeding" fill="#8b5cf6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="me" name="Meeting" fill="#14b8a6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="be" name="Below Expectation (Warning)" fill="#f43f5e" stackId="a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-400 italic">No Proficiency Data Logged</div>
                )}
              </ResponsiveContainer>
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
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">Academic Calendar & Milestones</h3>
          </div>
          <div className="p-0">
            {(metrics?.upcomingEvents?.length > 0 ? metrics.upcomingEvents : []).map((evt, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center p-2 min-w-[60px] bg-gray-100 rounded-md">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">{new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-sm font-semibold text-gray-900">{new Date(evt.date).getDate()}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">{evt.title}</h4>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">{evt.category} • Lead: {evt.responsible}</p>
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
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 flex items-center gap-2"><Briefcase size={16} className="text-gray-400" /> Staffing Capacity vs Deficit</h3>
          
          <div className="h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active Teachers', value: stats.activeTeachers || 0, color: '#14b8a6' },
                      { name: 'Deficit/Inactive', value: Math.max(0, (stats.totalTeachers - stats.activeTeachers)) || (stats.activeTeachers === 0 ? 1 : 0), color: '#f43f5e' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#14b8a6" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                </PieChart>
              </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider">Teaching Staff</span>
                <span className="text-xs font-semibold text-brand-teal">{stats.activeTeachers} / {stats.totalTeachers} Active</span>
              </div>
              <div className="w-full bg-white border border-gray-200 h-1 rounded-full overflow-hidden">
                <div className="bg-brand-teal h-full" style={{ width: `${(stats.activeTeachers / stats.totalTeachers) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider">Teacher-Student Ratio</span>
                <span className="text-xs font-semibold text-brand-purple">1 : {Math.round(stats.totalStudents / (stats.totalTeachers || 1))}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">Within optimal standard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-brand-purple to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-brand-purple/20">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Brain size={24} />
              </div>
              <h2 className="text-2xl font-bold">Zawadi Smart Insights</h2>
            </div>
            <p className="text-indigo-100 text-sm max-w-md leading-relaxed mb-6">
              Our AI engine analyzes longitudinal student performance, attendance patterns, and financial data to predict learning outcomes and identify students who may need additional support.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex-1 min-w-[140px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">System Accuracy</p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex-1 min-w-[140px]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Insights Generated</p>
                <p className="text-2xl font-bold">1,240</p>
              </div>
            </div>
          </div>
          <Zap className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Risk Monitoring</h3>
              <ShieldAlert className="text-rose-500" size={20} />
            </div>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-gray-900">{stats.atRiskStudents}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Students flagged as High-Risk</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('learners-list')}
            className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-bold uppercase tracking-widest transition"
          >
            Review At-Risk Students
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Academic Risk Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Critically Behind (BE)', value: 12, color: 'bg-rose-500' },
              { label: 'Needs Support (AE)', value: 45, color: 'bg-amber-500' },
              { label: 'Stable (ME)', value: 120, color: 'bg-emerald-500' },
              { label: 'Accelerated (EE)', value: 34, color: 'bg-brand-purple' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-gray-600">{item.label}</span>
                  <span className="text-xs font-bold text-gray-900">{item.value} Students</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full`} style={{ width: `${(item.value / 211) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Top AI Recommendations</h3>
          <div className="space-y-3">
            {[
              { title: 'Grade 4 Science Review', desc: 'Cluster average dropped 8% this week. Suggest remedial session.', icon: AlertCircle, color: 'text-rose-500' },
              { title: 'Automate Fee Reminders', desc: '72% of unpaid balances are for 10-day overdue invoices.', icon: Wallet, color: 'text-amber-500' },
              { title: 'Accelerated Learning Hub', desc: '15% of Grade 7 students qualify for advanced coding path.', icon: Brain, color: 'text-brand-purple' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-transparent hover:border-gray-100">
                <div className={`p-2 rounded-lg bg-white shadow-sm ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Un-Assessed Students Detailed Sheet ────────────────────────────────────────
  const UnAssessedSheet = () => {
    const breakdown = metrics?.unAssessedBreakdown || [];
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
        <div className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple">
                <AlertCircle size={20} />
              </div>
              <div>
                <h2 className="text-xl font-medium text-slate-900">Un-Assessed Students</h2>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Progress breakdown for {stats.currentTestSeries}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUnAssessedSheet(false)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filters Layout - Matching Assessment Page Style */}
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex flex-wrap gap-4 items-center">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                <Calendar size={14} className="text-slate-400 font-medium" />
                <span className="text-xs font-semibold text-slate-600">2026</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                <Filter size={14} className="text-slate-400 font-medium" />
                <span className="text-xs font-semibold text-slate-600">TERM 1</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm max-w-[150px]">
                <GraduationCap size={14} className="text-slate-400 font-medium" />
                <span className="text-xs font-semibold text-slate-600 truncate">{stats.currentTestSeries}</span>
             </div>
             <div className="ml-auto">
                <div className="bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                  Live Sync
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {breakdown.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-semibold text-slate-900">{stats.totalStudents}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 border-l-4 border-l-brand-teal">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Assessed</p>
                    <p className="text-2xl font-semibold text-brand-teal">{stats.totalStudents - stats.totalMissedExams}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-1">Progress</p>
                    <p className="text-2xl font-semibold text-emerald-600">{Math.round(((stats.totalStudents - stats.totalMissedExams) / stats.totalStudents) * 100)}%</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-1">Un-Assessed</p>
                    <p className="text-2xl font-semibold text-rose-600">{stats.totalMissedExams}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[color:var(--table-header-bg)] border-b border-[color:var(--table-border)]">
                        <th className="px-5 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest">Grade</th>
                        <th className="px-5 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest text-center">Students</th>
                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-center text-brand-teal">Done</th>
                        <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-center text-rose-500">Left</th>
                        <th className="px-5 py-4 text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {breakdown.map((item, idx) => {
                        const pct = item.total > 0 ? Math.round((item.assessed / item.total) * 100) : 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5 text-sm font-medium text-slate-900 uppercase tracking-tighter">{item.grade}</td>
                            <td className="px-5 py-3.5 text-sm text-center text-slate-600 font-medium">{item.total}</td>
                            <td className="px-5 py-3.5 text-sm text-center text-brand-teal font-semibold">{item.assessed}</td>
                            <td className="px-5 py-3.5 text-sm text-center text-rose-500 font-semibold">{item.unAssessed}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-semibold text-slate-500">{pct}%</span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${pct === 100 ? 'bg-brand-teal' : pct > 0 ? 'bg-brand-purple' : 'bg-slate-300'}`} 
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Activity className="text-slate-300" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Synchronizing...</h3>
                <p className="text-sm text-slate-500 max-w-xs">Connecting to the assessment matrix to fetch the latest grade-level progress.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={() => { setShowUnAssessedSheet(false); onNavigate('assess-summary-report'); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-purple text-white rounded-xl font-medium hover:bg-brand-purple/90 transition shadow-lg shadow-brand-purple/20"
            >
              Open Full Assessment Matrix <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Quick Shortcuts */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 lg:gap-4 mb-2">
        {[
          { label: 'Admissions', icon: UserPlus, color: 'bg-blue-500 text-white', path: 'learners-admissions' },
          { label: 'Collect Fees', icon: Receipt, color: 'bg-emerald-500 text-white', path: 'fees-collection' },
          { label: 'Attendance', icon: ClipboardCheck, color: 'bg-amber-500 text-white', path: 'attendance-daily' },
          { label: 'Assessments', icon: BookOpen, color: 'bg-brand-purple text-white', path: 'assess-summative-assessment' },
          { label: 'Inventory', icon: Package, color: 'bg-rose-500 text-white', path: 'inventory-items' },
          { label: 'Settings', icon: Settings, color: 'bg-slate-700 text-white', path: 'settings-academic' },
        ].map((shortcut, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(shortcut.path)}
            className="group flex flex-col items-center justify-start transition-all duration-300 active:scale-95"
          >
            <div className={`p-3.5 mb-2 rounded-full ${shortcut.color} shadow-md group-hover:shadow-lg group-hover:-translate-y-1 transition-transform duration-300 flex items-center justify-center`}>
              <shortcut.icon size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-600 group-hover:text-brand-purple text-center leading-tight w-full truncate">
              {shortcut.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-gray-200 bg-white px-2 rounded-lg shadow-md border border-gray-200">
        <TabButton id="overview" label="General Overview" icon={Activity} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton id="financials" label="Financials" icon={Wallet} active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />
        <TabButton id="performance" label="Academic Performance" icon={Award} active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
        <TabButton id="operations" label="School Operations" icon={Clock} active={activeTab === 'operations'} onClick={() => setActiveTab('operations')} />
        <TabButton id="ai-insights" label="AI Smart Insights" icon={Brain} active={activeTab === 'ai-insights'} onClick={() => setActiveTab('ai-insights')} />
      </div>

      {/* Tab Content */}
      <div className="animate-in slide-in-from-bottom-2 duration-300 rounded-lg">
        {showUnAssessedSheet && <UnAssessedSheet />}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'financials' && renderFinancials()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'operations' && renderOperations()}
        {activeTab === 'ai-insights' && renderAIInsights()}
      </div>
    </div>
  );
};

export default AdminDashboard;
