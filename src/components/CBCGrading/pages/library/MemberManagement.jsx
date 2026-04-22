/**
 * MemberManagement.jsx — Library Phase 5 Frontend
 *
 * Full library membership management:
 *   - List members with search and status filter
 *   - Register a new member by User ID
 *   - View member loan history in a slide-in drawer
 *   - Update member status and membership tier
 *
 * API: libraryAPI (book.api.js)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, UserPlus, Search, X, Loader2, CheckCircle2,
  XCircle, Clock, BookOpen, ChevronRight, Edit2, ShieldCheck,
} from 'lucide-react';
import { libraryAPI } from '../../../../services/api/book.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const MemberStatusBadge = ({ status }) => {
  const map = {
    ACTIVE:    'bg-emerald-100 text-emerald-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    EXPIRED:   'bg-red-100 text-red-600',
    INACTIVE:  'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] || map.INACTIVE}`}>
      {status}
    </span>
  );
};

// ─── Register Member Modal ────────────────────────────────────────────────────
const RegisterModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ userId: '', membershipType: 'STUDENT', maxBooks: 3, loanDays: 14 });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId.trim()) return toast.error('User ID is required');
    setLoading(true);
    try {
      await libraryAPI.createMember(form.userId.trim(), {
        membershipType: form.membershipType,
        maxBooks: parseInt(form.maxBooks) || 3,
        loanDays: parseInt(form.loanDays) || 14,
      });
      toast.success('Member registered successfully');
      onSaved();
    } catch (err) {
      toast.error(err?.message || 'Failed to register member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            <UserPlus size={18} className="text-violet-500" /> Register Member
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">User ID *</label>
            <input value={form.userId} onChange={e => set('userId', e.target.value)}
              placeholder="e.g. usr_abc123"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Membership Type</label>
            <select value={form.membershipType} onChange={e => set('membershipType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
              {['STUDENT', 'TEACHER', 'STAFF', 'PARENT', 'GUEST'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Books Allowed</label>
              <input type="number" min="1" max="20" value={form.maxBooks} onChange={e => set('maxBooks', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Loan Days</label>
              <input type="number" min="1" max="60" value={form.loanDays} onChange={e => set('loanDays', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Edit Member Modal ────────────────────────────────────────────────────────
const EditModal = ({ member, onClose, onSaved }) => {
  const [form, setForm] = useState({
    status: member.status || 'ACTIVE',
    membershipType: member.membershipType || 'STUDENT',
    maxBooks: member.maxBooks || 3,
    loanDays: member.loanDays || 14,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await libraryAPI.updateMember(member.userId || member.id, {
        ...form,
        maxBooks: parseInt(form.maxBooks),
        loanDays: parseInt(form.loanDays),
      });
      toast.success('Member updated');
      onSaved();
    } catch (err) {
      toast.error(err?.message || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            <Edit2 size={17} className="text-violet-500" />
            Edit — {member.user?.name || member.userId}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
              {['ACTIVE', 'SUSPENDED', 'EXPIRED', 'INACTIVE'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Membership Type</label>
            <select value={form.membershipType} onChange={e => set('membershipType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
              {['STUDENT', 'TEACHER', 'STAFF', 'PARENT', 'GUEST'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Books</label>
              <input type="number" min="1" max="20" value={form.maxBooks} onChange={e => set('maxBooks', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Loan Days</label>
              <input type="number" min="1" max="60" value={form.loanDays} onChange={e => set('loanDays', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── History Drawer ───────────────────────────────────────────────────────────
const HistoryDrawer = ({ member, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI.getMemberHistory(member.userId || member.id)
      .then(res => setHistory(res?.data || res || []))
      .catch(() => toast.error('Failed to load member history'))
      .finally(() => setLoading(false));
  }, [member]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-medium text-slate-900">{member.user?.name || member.userId}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Loan History · {member.membershipType}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-violet-500" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen size={36} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm">No loan history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(loan => (
                <div key={loan.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1.5">
                  <p className="font-semibold text-slate-800 text-sm leading-tight">
                    {loan.book?.title || loan.copy?.book?.title || '—'}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                    <span className="font-mono">{loan.copy?.copyNumber}</span>
                    <span>Issued {fmt(loan.issuedAt || loan.createdAt)}</span>
                    {loan.returnedAt
                      ? <span className="text-emerald-600 font-semibold">· Returned {fmt(loan.returnedAt)}</span>
                      : <span className="text-sky-600 font-semibold">· Active</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
          <p className="text-xs text-slate-400">
            Member since {fmt(member.joinedAt || member.createdAt)} · {member.totalLoans ?? history.length} total loan{history.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [showRegister, setShowRegister] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [historyMember, setHistoryMember] = useState(null);
  const searchTimeout = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await libraryAPI.getMembers(params);
      setMembers(res?.data || res || []);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(load, 350);
    return () => clearTimeout(searchTimeout.current);
  }, [load]);

  const handleSaved = () => {
    setShowRegister(false);
    setEditMember(null);
    load();
  };

  const typeColor = {
    STUDENT: 'bg-violet-50 text-violet-600',
    TEACHER: 'bg-sky-50 text-sky-600',
    STAFF:   'bg-teal-50 text-teal-600',
    PARENT:  'bg-orange-50 text-orange-600',
    GUEST:   'bg-slate-50 text-slate-500',
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Member Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200">
          <UserPlus size={16} /> Register Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search by name, ID or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm font-semibold">
          {['ACTIVE', 'SUSPENDED', 'EXPIRED', 'ALL'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 transition-colors ${statusFilter === s ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-violet-500" /></div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Users size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No members found</p>
          <p className="text-slate-400 text-sm mt-1">Register a new member to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Member</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Loans</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{member.user?.name || member.userId}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{member.user?.email || member.userId}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColor[member.membershipType] || typeColor.GUEST}`}>
                      {member.membershipType}
                    </span>
                  </td>
                  <td className="px-4 py-3"><MemberStatusBadge status={member.status} /></td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <button onClick={() => setHistoryMember(member)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 text-xs font-semibold transition-colors">
                      <BookOpen size={11} />
                      {member.totalLoans ?? member._count?.loans ?? 0}
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{fmt(member.joinedAt || member.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setHistoryMember(member)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors md:hidden" title="View history">
                        <BookOpen size={14} />
                      </button>
                      <button onClick={() => setEditMember(member)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit member">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals & Drawers */}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onSaved={handleSaved} />}
      {editMember   && <EditModal member={editMember} onClose={() => setEditMember(null)} onSaved={handleSaved} />}
      {historyMember && <HistoryDrawer member={historyMember} onClose={() => setHistoryMember(null)} />}
    </div>
  );
};

export default MemberManagement;
