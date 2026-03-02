/**
 * Enhanced Parent Dashboard
 * Special dashboard for parents with children's assessments, metrics, and PDF downloads
 */

import React, { useState } from 'react';
import {
  BookOpen, Calendar, DollarSign, Bell,
  Download, Award, TrendingUp, CheckCircle, Target,
  BarChart3, FileText, Users, Activity, ShieldCheck,
  ChevronRight, Clock, Wallet
} from 'lucide-react';
import { generateDocument } from '../../../../utils/simplePdfGenerator';
import { dashboardAPI } from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

// Professional Components
const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass = "text-gray-400", onClick }) => (
  <div onClick={onClick} className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-brand-purple/30 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}`}>
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 bg-gray-50 rounded-md ${colorClass}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
    <h3 className="text-xl font-black text-gray-900 mt-1">{value}</h3>
    {subtitle && <p className="text-[10px] text-gray-500 mt-1 font-medium">{subtitle}</p>}
  </div>
);

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${active
      ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const ParentDashboard = ({ user, onNavigate }) => {
  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview'); // overview, children, reports, finance
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    children: [],
    stats: { totalBalance: 0, avgAttendance: 0, bulletins: 0 }
  });

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getParentMetrics();
        if (response.success) {
          setDashboardData(response.data);
        }
      } catch (error) {
        showError('Failed to load parental dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const { children, stats } = dashboardData;

  const handleDownloadReportCard = async (child) => {
    showSuccess('Generating End-of-Term Transcript...');

    const html = `
      <div style="margin-bottom: 30px; background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 800;">Academic Portfolio: ${child.name}</h3>
        <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
          Grade: ${child.grade} • ADM No: ${child.admissionNumber}
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: #64748b; margin: 0 0 5px 0;">Attendance</p>
          <p style="font-size: 20px; font-weight: 900; color: #1e293b; margin: 0;">${child.attendanceRate}%</p>
        </div>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: #64748b; margin: 0 0 5px 0;">Performance</p>
          <p style="font-size: 20px; font-weight: 900; color: #1e293b; margin: 0;">${child.performanceLevel}</p>
        </div>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: #64748b; margin: 0 0 5px 0;">Term Average</p>
          <p style="font-size: 20px; font-weight: 900; color: #1e293b; margin: 0;">${child.overallPerformance}%</p>
        </div>
      </div>

      <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">Learning Area Assessments</h4>
      <table>
        <thead>
          <tr>
            <th>Learning Area</th>
            <th style="width: 100px; text-align: center;">Score</th>
            <th style="width: 100px; text-align: center;">Grade</th>
          </tr>
        </thead>
        <tbody>
          ${child.subjects.map(sub => `
            <tr>
              <td style="font-weight: 600;">${sub.name}</td>
              <td style="text-align: center; font-weight: 700;">${sub.score}%</td>
              <td style="text-align: center;"><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 11px;">${sub.grade}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    await generateDocument({
      html,
      fileName: `${child.name}_Transcript.pdf`,
      docInfo: { type: 'ACADEMIC TRANSCRIPT', ref: child.admissionNumber },
      includeStamp: true,
      stampOptions: {
        status: 'CERTIFIED',
        dept: 'ACADEMIC REGISTRY'
      }
    });

    showSuccess('✅ Official Transcript Downloaded');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Dependents" value={children.length} subtitle="Enrolled Learners" icon={Users} colorClass="text-blue-500" onClick={() => setActiveTab('children')} />
        <MetricCard title="Avg Attendance" value={`${stats.avgAttendance}%`} subtitle="Across all children" icon={Activity} colorClass="text-emerald-500" onClick={() => setActiveTab('children')} />
        <MetricCard title="Fee Liability" value={`KES ${stats.totalBalance.toLocaleString()}`} subtitle={stats.totalBalance > 0 ? "Pending Payment" : "Account Cleared"} icon={Wallet} colorClass={stats.totalBalance > 0 ? "text-amber-500" : "text-brand-purple"} onClick={() => setActiveTab('finance')} />
        <MetricCard title="Bulletins" value={stats.bulletins} subtitle="Unread Notifications" icon={Bell} colorClass="text-indigo-500" onClick={() => onNavigate && onNavigate('comm-notices')} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Immediate Academic Standing</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Learner Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Grade</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Perf. Index</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {children.map((child, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple text-[10px] font-black">
                        {child.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <p className="text-xs font-black text-gray-900">{child.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">{child.grade}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${child.performanceLevel === 'EE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                      {child.overallPerformance} ({child.performanceLevel})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-gray-900">{child.attendanceRate}%</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setActiveTab('children')} className="text-brand-purple text-[10px] font-black uppercase tracking-widest hover:underline">View Portfolio</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderChildren = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {children.map((child) => (
        <div key={child.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">{child.name}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{child.grade} • ADM No: {child.admissionNumber}</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Attendance</p>
              <p className="text-lg font-black text-gray-900">{child.attendanceRate}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assessments</p>
              <p className="text-lg font-black text-gray-900">{child.recentAssessments.length}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Level</p>
              <p className="text-lg font-black text-gray-900">{child.performanceLevel}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={12} className="text-brand-purple" /> Subject Performance
            </h4>
            <div className="divide-y divide-gray-50">
              {child.subjects.slice(0, 3).map((sub, i) => (
                <div key={i} className="py-2 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-600">{sub.name}</span>
                  <span className="text-[10px] font-black text-brand-purple uppercase">{sub.grade} ({sub.score}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-purple text-white rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">Parental Oversight Console</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guardian Portal • Account Status: <span className="text-emerald-500">ACTIVE</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-brand-purple text-white rounded text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-brand-purple/90 transition-all flex items-center gap-2">
            <DollarSign size={14} /> Settle Balances
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 rounded-t-lg overflow-hidden flex shadow-sm">
        <TabButton active={activeTab === 'overview'} label="Family Overview" icon={Activity} onClick={() => setActiveTab('overview')} />
        <TabButton active={activeTab === 'children'} label="Learner Portfolios" icon={BookOpen} onClick={() => setActiveTab('children')} />
        <TabButton active={activeTab === 'reports'} label="Academic Transcripts" icon={FileText} onClick={() => setActiveTab('reports')} />
        <TabButton active={activeTab === 'finance'} label="Accounts & Bulletins" icon={Wallet} onClick={() => setActiveTab('finance')} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'children' && renderChildren()}
        {/* Reports and Finance would follow similar patterns */}
      </div>
    </div>
  );
};

export default ParentDashboard;
