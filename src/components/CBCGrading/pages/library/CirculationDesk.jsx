/**
 * CirculationDesk.jsx — Library Phase 2 Frontend
 *
 * Handles all loan transactions:
 *   - Borrow by barcode scan or manual member/copy lookup
 *   - Return a book copy
 *   - Renew an active loan
 *
 * API: libraryAPI (book.api.js)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Search, ArrowDownLeft, ArrowUpRight, RefreshCw,
  ScanLine, User, Hash, X, Loader2, ChevronDown, AlertTriangle,
  CheckCircle2, Clock, RotateCcw, Calendar,
} from 'lucide-react';
import { libraryAPI } from '../../../../services/api/book.api';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

const LoanStatusBadge = ({ loan }) => {
  if (loan.returnedAt)
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">RETURNED</span>;
  if (isOverdue(loan.dueDate))
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">OVERDUE</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 text-sky-600">ACTIVE</span>;
};

// ─── Borrow Modal ─────────────────────────────────────────────────────────────
const BorrowModal = ({ onClose, onSaved }) => {
  const [mode, setMode] = useState('manual'); // 'manual' | 'scan'
  const [scanCode, setScanCode] = useState('');
  const [memberId, setMemberId] = useState('');
  const [copyId, setCopyId] = useState('');
  const [daysAllowed, setDaysAllowed] = useState(14);
  const [loading, setLoading] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => { if (mode === 'scan' && scanRef.current) scanRef.current.focus(); }, [mode]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setLoading(true);
    try {
      await libraryAPI.borrowByScan({ barcode: scanCode.trim(), daysAllowed });
      toast.success('Book borrowed via scan');
      onSaved();
    } catch (err) {
      toast.error(err?.message || 'Scan borrow failed');
    } finally {
      setLoading(false);
      setScanCode('');
    }
  };

  const handleManual = async (e) => {
    e.preventDefault();
    if (!memberId.trim() || !copyId.trim()) return toast.error('Member ID and Copy ID are required');
    setLoading(true);
    try {
      await libraryAPI.borrowForMember({ memberId: memberId.trim(), copyId: copyId.trim(), daysAllowed });
      toast.success('Book borrowed successfully');
      onSaved();
    } catch (err) {
      toast.error(err?.message || 'Borrow failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            <ArrowDownLeft size={18} className="text-violet-500" /> Issue Book
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        {/* Mode switcher */}
        <div className="flex gap-1 p-4 pb-0">
          {['manual', 'scan'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === m ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {m === 'scan' ? <span className="flex items-center justify-center gap-1.5"><ScanLine size={14} /> Scan Barcode</span> : <span className="flex items-center justify-center gap-1.5"><Hash size={14} /> Manual Entry</span>}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Days allowed */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Loan Duration (days)</label>
            <input type="number" min="1" max="60" value={daysAllowed}
              onChange={e => setDaysAllowed(parseInt(e.target.value) || 14)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
          </div>

          {mode === 'scan' ? (
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Scan / Enter Barcode</label>
                <input ref={scanRef} value={scanCode} onChange={e => setScanCode(e.target.value)}
                  placeholder="Scan or type copy barcode…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
              </div>
              <button type="submit" disabled={loading || !scanCode.trim()}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />} Issue by Scan
              </button>
            </form>
          ) : (
            <form onSubmit={handleManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Member ID / User ID</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={memberId} onChange={e => setMemberId(e.target.value)}
                    placeholder="e.g. usr_abc123"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Copy ID / Barcode</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={copyId} onChange={e => setCopyId(e.target.value)}
                    placeholder="e.g. CPY-00042"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                </div>
              </div>
              <button type="submit" disabled={loading || !memberId.trim() || !copyId.trim()}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowDownLeft size={15} />} Issue Book
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Return / Renew Modal ─────────────────────────────────────────────────────
const ActionModal = ({ loan, action, onClose, onSaved }) => {
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState(7);
  const [condition, setCondition] = useState('GOOD');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (action === 'return') {
        await libraryAPI.returnBook(loan.id, { condition, notes });
        toast.success('Book returned successfully');
      } else {
        await libraryAPI.renewLoan(loan.id, { additionalDays: days });
        toast.success(`Loan renewed for ${days} day${days !== 1 ? 's' : ''}`);
      }
      onSaved();
    } catch (err) {
      toast.error(err?.message || `${action === 'return' ? 'Return' : 'Renewal'} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            {action === 'return'
              ? <><ArrowUpRight size={18} className="text-emerald-500" /> Return Book</>
              : <><RotateCcw size={18} className="text-sky-500" /> Renew Loan</>}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
            <p className="font-semibold text-slate-800">{loan.book?.title || loan.copy?.book?.title}</p>
            <p className="text-slate-500 text-xs">Copy: <span className="font-mono">{loan.copy?.copyNumber}</span></p>
            <p className="text-slate-500 text-xs">Borrower: {loan.member?.name || loan.user?.name || loan.memberId}</p>
            <p className={`text-xs font-semibold ${isOverdue(loan.dueDate) ? 'text-red-500' : 'text-slate-500'}`}>
              Due: {fmt(loan.dueDate)} {isOverdue(loan.dueDate) && '(OVERDUE)'}
            </p>
          </div>

          {action === 'return' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Return Condition</label>
                <select value={condition} onChange={e => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 bg-white">
                  {['GOOD', 'FAIR', 'DAMAGED', 'LOST'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none" />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Days</label>
              <input type="number" min="1" max="30" value={days} onChange={e => setDays(parseInt(e.target.value) || 7)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2
                ${action === 'return' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {action === 'return' ? 'Confirm Return' : 'Confirm Renewal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CirculationDesk = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [search, setSearch] = useState('');
  const [showBorrow, setShowBorrow] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { loan, action }
  const searchTimeout = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter === 'ACTIVE') params.returned = 'false';
      if (statusFilter === 'RETURNED') params.returned = 'true';
      if (statusFilter === 'OVERDUE') { params.overdue = 'true'; params.returned = 'false'; }
      if (search.trim()) params.search = search.trim();
      const res = await libraryAPI.getLoans(params);
      setLoans(res?.data || res || []);
    } catch {
      toast.error('Failed to load loans');
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
    setShowBorrow(false);
    setActionModal(null);
    load();
  };

  const activeCount = loans.filter(l => !l.returnedAt).length;
  const overdueCount = loans.filter(l => !l.returnedAt && isOverdue(l.dueDate)).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Circulation Desk</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeCount} active loan{activeCount !== 1 ? 's' : ''}
            {overdueCount > 0 && <span className="ml-2 text-red-500 font-semibold">· {overdueCount} overdue</span>}
          </p>
        </div>
        <button onClick={() => setShowBorrow(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200">
          <ArrowDownLeft size={16} /> Issue Book
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search by title, member, or copy…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm font-semibold">
          {[
            { val: 'ACTIVE', label: 'Active' },
            { val: 'OVERDUE', label: 'Overdue' },
            { val: 'RETURNED', label: 'Returned' },
            { val: 'ALL', label: 'All' },
          ].map(opt => (
            <button key={opt.val} onClick={() => setStatusFilter(opt.val)}
              className={`px-4 py-2.5 transition-colors ${statusFilter === opt.val ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-violet-500" /></div>
      ) : loans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <BookOpen size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No loans found</p>
          <p className="text-slate-400 text-sm mt-1">Adjust the filter or issue a new book.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Book / Copy</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Member</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 leading-tight">
                      {loan.book?.title || loan.copy?.book?.title || '—'}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{loan.copy?.copyNumber}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-slate-700">{loan.member?.name || loan.user?.name || loan.memberId || '—'}</p>
                    <p className="text-xs text-slate-400">{loan.member?.role || loan.user?.role || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isOverdue(loan.dueDate) && !loan.returnedAt ? 'text-red-500 font-semibold' : 'text-slate-600'}`}>
                      {fmt(loan.dueDate)}
                    </span>
                    {loan.returnedAt && <p className="text-xs text-slate-400 mt-0.5">Returned {fmt(loan.returnedAt)}</p>}
                  </td>
                  <td className="px-4 py-3"><LoanStatusBadge loan={loan} /></td>
                  <td className="px-4 py-3">
                    {!loan.returnedAt && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setActionModal({ loan, action: 'renew' })}
                          className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors" title="Renew">
                          <RotateCcw size={14} />
                        </button>
                        <button onClick={() => setActionModal({ loan, action: 'return' })}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors" title="Return">
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showBorrow && <BorrowModal onClose={() => setShowBorrow(false)} onSaved={handleSaved} />}
      {actionModal && (
        <ActionModal
          loan={actionModal.loan}
          action={actionModal.action}
          onClose={() => setActionModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default CirculationDesk;
