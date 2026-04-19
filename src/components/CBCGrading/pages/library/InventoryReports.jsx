/**
 * InventoryReports.jsx — Library Phase 4 Frontend
 *
 * Dashboard + tabbed report views:
 *   - KPI stat cards (total books, active loans, overdue, members)
 *   - Popular Books report
 *   - Overdue Loans report
 *   - Loan/Fine totals summary
 *
 * API: libraryAPI (book.api.js)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Users, Clock, DollarSign, TrendingUp, RefreshCw,
  Loader2, AlertTriangle, BarChart2, List, Award,
} from 'lucide-react';
import { libraryAPI } from '../../../../services/api/book.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const KES = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'violet' }) => {
  const colors = {
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    sky:    'bg-sky-50 text-sky-600 border-sky-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    emerald:'bg-emerald-50 text-emerald-600 border-emerald-100',
    red:    'bg-red-50 text-red-600 border-red-100',
  };
  const text = {
    violet: 'text-violet-700',
    sky:    'text-sky-700',
    amber:  'text-amber-700',
    emerald:'text-emerald-700',
    red:    'text-red-700',
  };
  return (
    <div className={`bg-white rounded-2xl border ${colors[color].split(' ').at(-1)} p-5 flex items-center gap-4 shadow-sm`}>
      <div className={`w-12 h-12 rounded-xl ${colors[color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${text[color]}`}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ─── Popular Books Tab ────────────────────────────────────────────────────────
const PopularBooksTab = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI.getPopularBooks(20)
      .then(res => setBooks(res?.data || res || []))
      .catch(() => toast.error('Failed to load popular books'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-violet-500" /></div>;
  if (!books.length) return (
    <div className="text-center py-20 text-slate-400">
      <Award size={40} className="mx-auto mb-3 text-slate-200" />
      <p className="font-medium">No data yet</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">#</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Title</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Author</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Category</th>
            <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Total Loans</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {books.map((b, i) => (
            <tr key={b.id || i} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 text-slate-400 font-bold text-sm w-10">{i + 1}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{b.title}</p>
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm hidden md:table-cell">{b.author || '—'}</td>
              <td className="px-4 py-3 hidden md:table-cell">
                {b.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-violet-50 text-violet-600 font-medium">
                    {b.category}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-violet-700">{b.totalLoans ?? b._count?.loans ?? '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Overdue Loans Tab ────────────────────────────────────────────────────────
const OverdueLoansTab = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI.getOverdueLoans()
      .then(res => setLoans(res?.data || res || []))
      .catch(() => toast.error('Failed to load overdue loans'))
      .finally(() => setLoading(false));
  }, []);

  const daysOverdue = (dueDate) => {
    const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-violet-500" /></div>;
  if (!loans.length) return (
    <div className="text-center py-20 text-slate-400">
      <Clock size={40} className="mx-auto mb-3 text-slate-200" />
      <p className="font-medium text-emerald-600">No overdue loans! 🎉</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Book / Copy</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Member</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Due Date</th>
            <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Days Overdue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loans.map(loan => (
            <tr key={loan.id} className="hover:bg-red-50/30 transition-colors">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{loan.book?.title || loan.copy?.book?.title || '—'}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{loan.copy?.copyNumber}</p>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <p className="text-slate-700">{loan.member?.name || loan.user?.name || loan.memberId || '—'}</p>
                <p className="text-xs text-slate-400">{loan.member?.role || ''}</p>
              </td>
              <td className="px-4 py-3 text-red-500 font-semibold">{fmt(loan.dueDate)}</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  {daysOverdue(loan.dueDate)}d
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Summary Tab ──────────────────────────────────────────────────────────────
const SummaryTab = ({ stats }) => {
  if (!stats) return (
    <div className="text-center py-20 text-slate-400">
      <BarChart2 size={40} className="mx-auto mb-3 text-slate-200" />
      <p className="font-medium">No summary data available</p>
    </div>
  );

  const rows = [
    { label: 'Total Books in Catalog',   value: stats.totalBooks ?? '—' },
    { label: 'Total Physical Copies',    value: stats.totalCopies ?? '—' },
    { label: 'Available Copies',         value: stats.availableCopies ?? '—' },
    { label: 'Borrowed Copies',          value: stats.borrowedCopies ?? '—' },
    { label: 'Damaged Copies',           value: stats.damagedCopies ?? '—' },
    { label: 'Lost Copies',              value: stats.lostCopies ?? '—' },
    { label: 'Total Members',            value: stats.totalMembers ?? '—' },
    { label: 'Active Members',           value: stats.activeMembers ?? '—' },
    { label: 'Total Loans (All Time)',   value: stats.totalLoans ?? '—' },
    { label: 'Active Loans',             value: stats.activeLoans ?? '—' },
    { label: 'Overdue Loans',            value: stats.overdueLoans ?? '—' },
    { label: 'Total Fines Collected',    value: stats.totalFinesCollected != null ? KES(stats.totalFinesCollected) : '—' },
    { label: 'Pending Fines',            value: stats.pendingFines != null ? KES(stats.pendingFines) : '—' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-50">
          {rows.map(row => (
            <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3.5 text-slate-600">{row.label}</td>
              <td className="px-5 py-3.5 text-right font-bold text-slate-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const InventoryReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await libraryAPI.getStats();
      setStats(res?.data || res || null);
    } catch {
      toast.error('Failed to load library statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const tabs = [
    { id: 'summary',  label: 'Summary',       icon: List },
    { id: 'popular',  label: 'Popular Books',  icon: Award },
    { id: 'overdue',  label: 'Overdue Loans',  icon: AlertTriangle },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Library analytics and resource overview</p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-24 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={BookOpen}   label="Total Books"    value={stats?.totalBooks}    sub={`${stats?.totalCopies ?? 0} copies total`} color="violet" />
          <StatCard icon={TrendingUp} label="Active Loans"   value={stats?.activeLoans}   sub="Currently borrowed" color="sky" />
          <StatCard icon={Clock}      label="Overdue Loans"  value={stats?.overdueLoans}  sub="Need follow-up" color="red" />
          <StatCard icon={Users}      label="Members"        value={stats?.totalMembers}  sub={`${stats?.activeMembers ?? 0} active`} color="emerald" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px
                ${tab === t.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'summary'  && <SummaryTab stats={stats} />}
        {tab === 'popular'  && <PopularBooksTab />}
        {tab === 'overdue'  && <OverdueLoansTab />}
      </div>
    </div>
  );
};

export default InventoryReports;
