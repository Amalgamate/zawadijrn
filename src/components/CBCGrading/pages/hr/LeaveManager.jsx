import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Check, X, Plus, Edit2, Trash2,
    AlertCircle, CheckCircle2, ChevronDown,
    BarChart2, Save, Ban
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';

// ─── helpers ─────────────────────────────────────────────────────────────────
const toIso = (dateStr) => {
    // Convert "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00.000Z" for the API
    if (!dateStr) return '';
    return new Date(dateStr).toISOString();
};

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const calcDays = (start, end) => {
    if (!start || !end) return 0;
    let count = 0;
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
};

const STATUS_STYLES = {
    PENDING:  'bg-yellow-50 text-yellow-700 border-yellow-200',
    APPROVED: 'bg-green-50  text-green-700  border-green-200',
    REJECTED: 'bg-red-50    text-red-600    border-red-200',
};

// ─── Apply Leave Modal ────────────────────────────────────────────────────────
const ApplyModal = ({ leaveTypes, balance, onClose, onSubmit, loading }) => {
    const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
    const [error, setError] = useState('');

    const selectedBalance = balance.find(b => b.typeId === form.leaveTypeId);
    const daysRequested = calcDays(form.startDate, form.endDate);

    const handleSubmit = async () => {
        setError('');
        if (!form.leaveTypeId) return setError('Please select a leave type');
        if (!form.startDate || !form.endDate) return setError('Please select start and end dates');
        if (new Date(form.endDate) < new Date(form.startDate)) return setError('End date must be after start date');
        if (selectedBalance && daysRequested > selectedBalance.remainingDays)
            return setError(`Insufficient balance. You have ${selectedBalance.remainingDays} day(s) remaining.`);
        try {
            await onSubmit({ ...form, startDate: toIso(form.startDate), endDate: toIso(form.endDate) });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to submit');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Apply for Leave</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={18}/></button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                        <AlertCircle size={16} className="flex-shrink-0"/>{error}
                    </div>
                )}

                {/* Leave Type */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Leave Type</label>
                    <div className="relative">
                        <select
                            value={form.leaveTypeId}
                            onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-brand-teal/30 outline-none"
                        >
                            <option value="">Select type…</option>
                            {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.maxDays} days/year)</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                    </div>
                    {selectedBalance && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                            <BarChart2 size={12} className="text-brand-teal"/>
                            <span className="text-gray-500">Balance: <strong className="text-gray-800">{selectedBalance.remainingDays}</strong> of {selectedBalance.maxDays} days remaining</span>
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                    {[['Start Date', 'startDate'], ['End Date', 'endDate']].map(([label, key]) => (
                        <div key={key}>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                            <input type="date" value={form[key]}
                                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-teal/30 outline-none"/>
                        </div>
                    ))}
                </div>

                {/* Days preview */}
                {daysRequested > 0 && (
                    <div className={`text-center text-sm font-bold py-2 rounded-xl ${
                        selectedBalance && daysRequested > selectedBalance.remainingDays
                            ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-brand-teal'}`}>
                        {daysRequested} working day{daysRequested !== 1 ? 's' : ''} requested
                    </div>
                )}

                {/* Reason */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Reason (optional)</label>
                    <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                        rows={3} placeholder="Brief reason for leave…"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-brand-teal/30 outline-none"/>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 py-3 bg-brand-teal text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-teal/90 disabled:opacity-50">
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white"/> : <Calendar size={16}/>}
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Leave Type CRUD Panel ────────────────────────────────────────────────────
const LeaveTypePanel = ({ types, onSave, onDelete, loading }) => {
    const [editItem, setEditItem] = useState(null); // null = list, obj = edit form
    const [form, setForm] = useState({ name: '', maxDays: 21, description: '' });
    const [error, setError] = useState('');

    const startNew = () => { setForm({ name: '', maxDays: 21, description: '' }); setEditItem('new'); setError(''); };
    const startEdit = (t) => { setForm({ name: t.name, maxDays: t.maxDays, description: t.description || '' }); setEditItem(t.id); setError(''); };
    const cancel = () => { setEditItem(null); setError(''); };

    const handleSave = async () => {
        setError('');
        if (!form.name.trim()) return setError('Name is required');
        if (!form.maxDays || form.maxDays < 1) return setError('Max days must be at least 1');
        try {
            await onSave(editItem === 'new' ? null : editItem, form);
            setEditItem(null);
        } catch (err) {
            setError(err.message || 'Save failed');
        }
    };

    if (editItem !== null) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{editItem === 'new' ? 'New Leave Type' : 'Edit Leave Type'}</h3>
                    <button onClick={cancel} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                </div>
                {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"
                        placeholder="e.g. Annual, Sick, Maternity…"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Max Days / Year</label>
                    <input type="number" min={1} max={365} value={form.maxDays}
                        onChange={e => setForm(f => ({ ...f, maxDays: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description (optional)</label>
                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"
                        placeholder="Brief note…"/>
                </div>
                <div className="flex gap-2">
                    <button onClick={cancel} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSave} disabled={loading}
                        className="flex-1 py-2.5 bg-brand-teal text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-teal/90 disabled:opacity-50">
                        {loading ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/50 border-t-white"/> : <Save size={14}/>}
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Leave Types</h3>
                <button onClick={startNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-teal/90">
                    <Plus size={13}/> Add
                </button>
            </div>
            <div className="space-y-2">
                {types.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No leave types configured.</p>}
                {types.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                        <div>
                            <p className="text-sm font-bold text-gray-800">{t.name}</p>
                            <p className="text-xs text-gray-400">{t.maxDays} days/year{t.description ? ` · ${t.description}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-brand-teal rounded-lg hover:bg-white"><Edit2 size={14}/></button>
                            <button onClick={() => onDelete(t.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-white"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main LeaveManager ────────────────────────────────────────────────────────
const LeaveManager = ({ currentUser }) => {
    const [requests, setRequests] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [balance, setBalance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [typeLoading, setTypeLoading] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);
    const [filter, setFilter] = useState('PENDING');
    const [showApply, setShowApply] = useState(false);
    const [toast, setToast] = useState(null);

    // Determine if current user is admin/head (can approve and manage types)
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'HEAD_TEACHER'].includes(currentUser?.role);
    const userId = currentUser?.userId || currentUser?.id;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [reqs, types] = await Promise.all([
                hrAPI.getLeaveRequests({ status: filter !== 'ALL' ? filter : undefined }),
                hrAPI.getLeaveTypes()
            ]);
            setRequests(reqs.data || []);
            setLeaveTypes(types.data || []);

            // Fetch own balance
            if (userId) {
                const bal = await hrAPI.getLeaveBalance(userId, new Date().getFullYear());
                setBalance(bal.data || []);
            }
        } catch (error) {
            console.error('Error fetching leave data:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApprove = async (id, approved, rejectionReason) => {
        try {
            setProcessingId(id);
            const res = await hrAPI.approveLeaveRequest(id, { approved, rejectionReason });
            if (res.success) {
                showToast(`Leave ${approved ? 'approved' : 'rejected'} — SMS sent to staff`);
                setRequests(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleApplyLeave = async (data) => {
        setApplyLoading(true);
        try {
            const res = await hrAPI.submitLeaveRequest(data);
            if (res.success) {
                showToast('Leave request submitted successfully');
                fetchData();
            } else {
                throw new Error(res.message || 'Submission failed');
            }
        } finally {
            setApplyLoading(false);
        }
    };

    const handleSaveType = async (id, data) => {
        setTypeLoading(true);
        try {
            if (id) {
                await hrAPI.updateLeaveType(id, data);
                showToast('Leave type updated');
            } else {
                await hrAPI.createLeaveType(data);
                showToast('Leave type created');
            }
            const res = await hrAPI.getLeaveTypes();
            setLeaveTypes(res.data || []);
        } finally {
            setTypeLoading(false);
        }
    };

    const handleDeleteType = async (id) => {
        if (!window.confirm('Deactivate this leave type?')) return;
        setTypeLoading(true);
        try {
            await hrAPI.deleteLeaveType(id);
            showToast('Leave type deactivated');
            const res = await hrAPI.getLeaveTypes();
            setLeaveTypes(res.data || []);
        } finally {
            setTypeLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top duration-300
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
                    {toast.msg}
                </div>
            )}

            {/* Apply Modal */}
            {showApply && (
                <ApplyModal
                    leaveTypes={leaveTypes}
                    balance={balance}
                    onClose={() => setShowApply(false)}
                    onSubmit={handleApplyLeave}
                    loading={applyLoading}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                    <p className="text-gray-500 text-sm">Review and manage staff leave applications.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setShowApply(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl font-bold text-sm hover:bg-brand-teal/90 shadow-sm">
                        <Plus size={16}/> Apply for Leave
                    </button>
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-brand-teal text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leave Balance Cards */}
            {balance.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {balance.map(b => {
                        const pct = b.maxDays > 0 ? Math.round((b.usedDays / b.maxDays) * 100) : 0;
                        const warn = pct >= 80;
                        return (
                            <div key={b.typeId} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{b.typeName}</p>
                                <p className="text-xl font-black text-gray-900">{b.remainingDays} <span className="text-sm font-normal text-gray-400">/ {b.maxDays} days</span></p>
                                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${warn ? 'bg-amber-400' : 'bg-brand-teal'}`}
                                        style={{ width: `${Math.min(100, pct)}%` }}/>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">{b.usedDays} used</p>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Requests list */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-1/2 mb-3"/>
                                <div className="h-3 bg-gray-100 rounded w-3/4"/>
                            </div>
                        ))
                    ) : requests.length > 0 ? (
                        requests.map(req => {
                            const days = calcDays(req.startDate, req.endDate);
                            return (
                                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    {req.status === 'PENDING' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-l-2xl"/>}
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center font-bold text-brand-purple text-sm flex-shrink-0">
                                                {req.user.firstName[0]}{req.user.lastName[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{req.user.firstName} {req.user.lastName}</h3>
                                                <div className="flex items-center flex-wrap gap-2 mt-1">
                                                    <span className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-md">{req.leaveType?.name}</span>
                                                    <span className="text-xs text-gray-500">{fmtDate(req.startDate)} → {fmtDate(req.endDate)}</span>
                                                    <span className="text-xs font-bold text-gray-600">{days} day{days !== 1 ? 's' : ''}</span>
                                                </div>
                                                {req.reason && <p className="text-sm text-gray-500 italic mt-1.5">"{req.reason}"</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[req.status] || ''}`}>
                                                {req.status}
                                            </span>
                                            <p className="text-[10px] text-gray-400">Applied {fmtDate(req.createdAt)}</p>
                                        </div>
                                    </div>

                                    {req.status === 'PENDING' && isAdmin && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
                                            <button onClick={() => handleApprove(req.id, false)}
                                                disabled={processingId === req.id}
                                                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold text-sm disabled:opacity-50">
                                                <X size={15}/> Reject
                                            </button>
                                            <button onClick={() => handleApprove(req.id, true)}
                                                disabled={processingId === req.id}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm shadow-sm disabled:opacity-50">
                                                {processingId === req.id
                                                    ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white"/>
                                                    : <Check size={15}/>}
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                <Calendar size={40} className="text-gray-300"/>
                            </div>
                            <h3 className="text-base font-bold text-gray-800">No {filter.toLowerCase()} requests</h3>
                            <p className="text-sm text-gray-400 mt-1">All clear! No leave requests match this filter.</p>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-5">
                    {/* Admin-only: leave type CRUD */}
                    {isAdmin ? (
                        <LeaveTypePanel
                            types={leaveTypes}
                            onSave={handleSaveType}
                            onDelete={handleDeleteType}
                            loading={typeLoading}
                        />
                    ) : (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Leave Entitlements</h3>
                            <div className="space-y-3">
                                {leaveTypes.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">{t.name}</p>
                                            {t.description && <p className="text-[10px] text-gray-400">{t.description}</p>}
                                        </div>
                                        <span className="text-brand-teal font-bold text-sm">{t.maxDays} days</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Policy reminder */}
                    <div className="bg-brand-purple rounded-2xl p-5 text-white">
                        <Calendar size={28} className="mb-3 opacity-50"/>
                        <h3 className="font-bold mb-1 text-sm">Leave Policy</h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                            Annual leave must be applied for at least 14 days in advance.
                            Sick leave exceeding 2 days requires a medical certificate.
                            Approved leave is automatically deducted from your entitlement balance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveManager;
