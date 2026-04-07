/**
 * Parent portal dashboard — focused metrics, calendar/notices entry points, no staff tooling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, DollarSign, Bell,
  Download, TrendingUp, FileText, Users, Activity, ShieldCheck,
  Wallet, Sparkles, LayoutGrid, Megaphone
} from 'lucide-react';
import { generateDocument } from '../../../../utils/simplePdfGenerator';
import { dashboardAPI } from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../../../utils/cn';

const MATRIX_ACCENT = [
  'from-cyan-500/90 to-blue-600/95',
  'from-fuchsia-500/90 to-violet-600/95',
  'from-amber-500/90 to-orange-600/95',
  'from-emerald-500/90 to-teal-600/95',
];

const MatrixTile = ({ title, value, subtitle, icon: Icon, accentIndex = 0, onClick, className }) => {
  const grad = MATRIX_ACCENT[accentIndex % MATRIX_ACCENT.length];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 p-5 text-left shadow-lg transition-all duration-300',
        'bg-gradient-to-br ring-1 ring-black/5',
        grad,
        onClick && 'hover:scale-[1.02] hover:shadow-xl hover:brightness-105 cursor-pointer',
        !onClick && 'cursor-default',
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_45%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
      <div className="relative flex flex-col gap-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/85">{title}</p>
          <div className="rounded-xl bg-white/15 p-2 backdrop-blur-sm">
            <Icon size={20} strokeWidth={2.2} />
          </div>
        </div>
        <div>
          <p className="text-3xl font-black tracking-tight drop-shadow-sm">{value}</p>
          {subtitle && <p className="mt-1 text-xs font-semibold text-white/80">{subtitle}</p>}
        </div>
      </div>
    </button>
  );
};

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 sm:px-6',
      active
        ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
        : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
    )}
  >
    <Icon size={14} />
    {label}
  </button>
);

const ParentDashboard = ({ user, onNavigate }) => {
  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    children: [],
    stats: { totalBalance: 0, avgAttendance: 0, bulletins: 0 },
  });

  const loadData = useCallback(async () => {
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
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [user, loadData]);

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
          ${(child.subjects || []).map((sub) => `
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
        dept: 'ACADEMIC REGISTRY',
      },
    });

    showSuccess('Official transcript downloaded');
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MatrixTile
          title="Dependents"
          value={loading ? '…' : String(children.length)}
          subtitle="Enrolled learners"
          icon={Users}
          accentIndex={0}
          onClick={() => setActiveTab('children')}
        />
        <MatrixTile
          title="Attendance"
          value={loading ? '…' : `${stats.avgAttendance}%`}
          subtitle="Household average"
          icon={Activity}
          accentIndex={1}
          onClick={() => setActiveTab('children')}
        />
        <MatrixTile
          title="Fee balance"
          value={loading ? '…' : `KES ${Number(stats.totalBalance || 0).toLocaleString()}`}
          subtitle={stats.totalBalance > 0 ? 'Outstanding' : 'All clear'}
          icon={Wallet}
          accentIndex={2}
          onClick={() => setActiveTab('finance')}
        />
        <MatrixTile
          title="Bulletins"
          value={loading ? '…' : String(stats.bulletins ?? 0)}
          subtitle="School notices"
          icon={Bell}
          accentIndex={3}
          onClick={() => onNavigate?.('comm-notices')}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md">
        <div className="flex flex-col gap-1 border-b border-gray-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-brand-purple" />
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">Learner matrix</h3>
          </div>
          <p className="text-[11px] font-semibold text-gray-500">Snapshot across your children</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-gray-200 bg-slate-50/90">
              <tr>
                <th scope="col" className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--table-header-fg)]">
                  Learner
                </th>
                <th scope="col" className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--table-header-fg)]">
                  Grade
                </th>
                <th scope="col" className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--table-header-fg)]">
                  Performance
                </th>
                <th scope="col" className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--table-header-fg)]">
                  Attendance
                </th>
                <th scope="col" className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--table-header-fg)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && children.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No linked learners yet. Contact the school if this looks wrong.
                  </td>
                </tr>
              )}
              {!loading &&
                children.map((child, idx) => (
                  <tr key={child.id || idx} className="transition-colors hover:bg-violet-50/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black text-white shadow-sm',
                            idx % 4 === 0 && 'bg-cyan-500',
                            idx % 4 === 1 && 'bg-fuchsia-500',
                            idx % 4 === 2 && 'bg-amber-500',
                            idx % 4 === 3 && 'bg-emerald-500'
                          )}
                        >
                          {child.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 3)}
                        </div>
                        <p className="text-sm font-bold text-gray-900">{child.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">{child.grade}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
                          child.performanceLevel === 'EE'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-violet-200 bg-violet-50 text-violet-800'
                        )}
                      >
                        {child.overallPerformance}% ({child.performanceLevel})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{child.attendanceRate}%</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab('children')}
                        className="text-[10px] font-black uppercase tracking-widest text-brand-purple hover:underline"
                      >
                        Portfolio
                      </button>
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {children.map((child, idx) => (
        <div
          key={child.id || idx}
          className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-md ring-1 ring-black/[0.03]"
        >
          <div className="flex items-start justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-black tracking-tight text-gray-900">{child.name}</h3>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {child.grade} • ADM {child.admissionNumber}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Attendance</p>
              <p className="text-lg font-black text-gray-900">{child.attendanceRate}%</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Assessments</p>
              <p className="text-lg font-black text-gray-900">{(child.recentAssessments || []).length}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Level</p>
              <p className="text-lg font-black text-gray-900">{child.performanceLevel}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900">
              <TrendingUp size={12} className="text-brand-purple" /> Subject highlights
            </h4>
            <div className="divide-y divide-gray-100">
              {(child.subjects || []).slice(0, 5).map((sub, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-xs font-medium text-gray-600">{sub.name}</span>
                  <span className="text-[10px] font-black uppercase text-brand-purple">
                    {sub.grade} ({sub.score}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadReportCard(child)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-purple/20 bg-brand-purple/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-brand-purple transition hover:bg-brand-purple/10"
          >
            <Download size={14} />
            Download transcript
          </button>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Generate a PDF transcript for each learner. For official signed copies, contact the school office.
      </p>
      <div className="grid gap-3">
        {children.map((child, idx) => (
          <div
            key={child.id || idx}
            className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{child.name}</p>
                <p className="text-xs text-gray-500">
                  {child.grade} • {child.overallPerformance}% overall
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadReportCard(child)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-gray-800"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        ))}
        {!loading && children.length === 0 && (
          <p className="text-center text-sm text-gray-500">No learners linked to this account.</p>
        )}
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-amber-900">
          <DollarSign size={22} />
          <h3 className="text-sm font-black uppercase tracking-widest">Household balance</h3>
        </div>
        <p className="text-4xl font-black text-gray-900">KES {Number(stats.totalBalance || 0).toLocaleString()}</p>
        <p className="mt-2 text-sm text-gray-600">
          {stats.totalBalance > 0
            ? 'This is the combined outstanding amount on record. Pay at the office or via channels the school announces.'
            : 'No outstanding balance on record.'}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-brand-purple">
          <Megaphone size={20} />
          <h3 className="text-sm font-black uppercase tracking-widest">Notices & bulletins</h3>
        </div>
        <p className="text-sm text-gray-600">
          Fee reminders and school announcements appear in Notices. Open the inbox to read the latest updates.
        </p>
        <button
          type="button"
          onClick={() => onNavigate?.('comm-notices')}
          className="mt-4 w-full rounded-xl bg-brand-purple px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow hover:bg-brand-purple/90"
        >
          Open notices
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-[var(--brand-purple)] p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-md">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight md:text-2xl">Family portal</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/75">
                {user?.firstName || user?.name?.split(' ')[0] || 'Guardian'} • Linked learners & school pulse
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate?.('planner-calendar')}
              className="rounded-xl bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-widest backdrop-blur transition hover:bg-white/25"
            >
              School calendar
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('comm-messages')}
              className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-violet-900 shadow hover:bg-white/90"
            >
              Messages
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-sm">
        <TabButton active={activeTab === 'overview'} label="Overview" icon={LayoutGrid} onClick={() => setActiveTab('overview')} />
        <TabButton active={activeTab === 'children'} label="Portfolios" icon={BookOpen} onClick={() => setActiveTab('children')} />
        <TabButton active={activeTab === 'reports'} label="Transcripts" icon={FileText} onClick={() => setActiveTab('reports')} />
        <TabButton active={activeTab === 'finance'} label="Fees & notices" icon={Wallet} onClick={() => setActiveTab('finance')} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'children' && renderChildren()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'finance' && renderFinance()}
      </div>
    </div>
  );
};

export default ParentDashboard;
