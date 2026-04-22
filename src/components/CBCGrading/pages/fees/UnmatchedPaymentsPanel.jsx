/**
 * UnmatchedPaymentsPanel
 * 
 * Displays incoming Buy Goods Till payments that could not be automatically
 * matched to a learner. Admins can search for the correct learner + invoice
 * and assign the payment, or dismiss it with a reason.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle, CheckCircle2, X, Search, Phone, DollarSign,
    Clock, ChevronRight, RefreshCw, XCircle, Info, UserCheck
} from 'lucide-react';
import api from '../../../../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const statusColors = {
    PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    DISMISSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

// ─── Assign Modal ────────────────────────────────────────────────────────────
const AssignModal = ({ payment, onClose, onResolved }) => {
    const [step, setStep] = useState(1); // 1=search learner, 2=pick invoice
    const [learnerSearch, setLearnerSearch] = useState('');
    const [learners, setLearners] = useState([]);
    const [selectedLearner, setSelectedLearner] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [searching, setSearching] = useState(false);

    const searchLearners = useCallback(async () => {
        if (learnerSearch.trim().length < 2) return;
        setSearching(true);
        try {
            const res = await api.learners.getAll({ search: learnerSearch, status: 'ACTIVE', limit: 20 });
            setLearners(res.data || []);
        } catch {
            setLearners([]);
        } finally {
            setSearching(false);
        }
    }, [learnerSearch]);

    useEffect(() => {
        const timer = setTimeout(searchLearners, 400);
        return () => clearTimeout(timer);
    }, [searchLearners]);

    const selectLearner = async (learner) => {
        setSelectedLearner(learner);
        setStep(2);
        try {
            const res = await api.fees.getAllInvoices({ learnerId: learner.id, status: 'PENDING,PARTIAL', limit: 10 });
            setInvoices(res.data || []);
        } catch {
            setInvoices([]);
        }
    };

    const handleResolve = async () => {
        if (!selectedInvoice) return;
        setResolving(true);
        try {
            await api.mpesa.resolveUnmatchedPayment(payment.id, selectedLearner.id, selectedInvoice.id);
            onResolved();
        } catch (err) {
            console.error(err);
        } finally {
            setResolving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white rounded-t-3xl z-10 flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Assign Payment</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            KES {fmt(payment.amount)} · {payment.receiptNo} · from {payment.phone}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-400'}`}>1</span>
                        <span className={step >= 1 ? 'text-gray-700' : 'text-gray-400'}>Find Learner</span>
                        <ChevronRight size={12} className="text-gray-300" />
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-400'}`}>2</span>
                        <span className={step >= 2 ? 'text-gray-700' : 'text-gray-400'}>Select Invoice</span>
                    </div>

                    {/* Step 1: Learner search */}
                    {step === 1 && (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search by name or admission number…"
                                    value={learnerSearch}
                                    onChange={e => setLearnerSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                                />
                                {searching && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                            </div>

                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                {learners.length === 0 && learnerSearch.length >= 2 && !searching && (
                                    <p className="text-sm text-gray-400 text-center py-6">No learners found</p>
                                )}
                                {learners.map(l => (
                                    <button key={l.id} onClick={() => selectLearner(l)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-teal-50 border border-transparent hover:border-teal-100 transition-all text-left group">
                                        <div className="w-9 h-9 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-medium text-sm flex-shrink-0">
                                            {l.firstName?.[0]}{l.lastName?.[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate group-hover:text-teal-800">{l.firstName} {l.lastName}</p>
                                            <p className="text-xs text-gray-400 font-mono">{l.admissionNumber} · Grade {l.grade}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-teal-500 flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Invoice selection */}
                    {step === 2 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                                <UserCheck size={18} className="text-teal-600 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-sm text-gray-800">{selectedLearner.firstName} {selectedLearner.lastName}</p>
                                    <p className="text-xs text-gray-500">{selectedLearner.admissionNumber}</p>
                                </div>
                                <button onClick={() => { setStep(1); setSelectedLearner(null); setSelectedInvoice(null); }}
                                    className="ml-auto text-xs text-teal-600 font-medium hover:underline">Change</button>
                            </div>

                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Outstanding Invoices</p>

                            {invoices.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">No outstanding invoices</p>
                                    <p className="text-xs text-gray-400 mt-1">This learner has no pending fees.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {invoices.map(inv => (
                                        <button key={inv.id} onClick={() => setSelectedInvoice(inv)}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                selectedInvoice?.id === inv.id
                                                    ? 'border-teal-500 bg-teal-50'
                                                    : 'border-gray-100 bg-white hover:border-teal-200'
                                            }`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{inv.invoiceNumber}</p>
                                                    <p className="text-xs text-gray-500">{inv.term?.replace('_', ' ')} · {inv.academicYear}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">Balance</p>
                                                    <p className="font-medium text-red-600 text-sm">KES {fmt(inv.balance)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className="h-full bg-teal-500 rounded-full"
                                                    style={{ width: `${Math.min(100, (Number(inv.paidAmount) / Number(inv.totalAmount)) * 100)}%` }}
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedInvoice && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                                    <p className="font-medium mb-1">Confirm Assignment</p>
                                    <p>KES {fmt(payment.amount)} from <strong>{payment.phone}</strong> will be applied to invoice <strong>{selectedInvoice.invoiceNumber}</strong> (balance: KES {fmt(selectedInvoice.balance)}).</p>
                                </div>
                            )}

                            <button onClick={handleResolve} disabled={!selectedInvoice || resolving}
                                className="w-full py-3 bg-teal-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-teal-700 transition-all disabled:opacity-50">
                                {resolving
                                    ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white" /> Applying…</>
                                    : <><CheckCircle2 size={18} /> Apply Payment</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Dismiss Modal ───────────────────────────────────────────────────────────
const DismissModal = ({ payment, onClose, onDismissed }) => {
    const [note, setNote] = useState('');
    const [dismissing, setDismissing] = useState(false);

    const handleDismiss = async () => {
        setDismissing(true);
        try {
            await api.mpesa.dismissUnmatchedPayment(payment.id, note);
            onDismissed();
        } catch (err) {
            console.error(err);
        } finally {
            setDismissing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Dismiss Payment</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={18} /></button>
                </div>
                <p className="text-sm text-gray-500">
                    You are dismissing <strong>KES {fmt(payment.amount)}</strong> from <strong>{payment.phone}</strong> (Receipt: {payment.receiptNo}).
                    This will mark it as ignored.
                </p>
                <textarea
                    placeholder="Reason for dismissal (e.g. test payment, wrong till…)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-red-500/20"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl font-medium text-sm hover:bg-gray-50">Cancel</button>
                    <button onClick={handleDismiss} disabled={dismissing}
                        className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50">
                        {dismissing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white" /> : <XCircle size={16} />}
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main panel ──────────────────────────────────────────────────────────────
const UnmatchedPaymentsPanel = ({ onCountChange }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [assignTarget, setAssignTarget] = useState(null);
    const [dismissTarget, setDismissTarget] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.mpesa.getUnmatchedPayments({ status: statusFilter });
            setPayments(res.data || []);
            if (onCountChange) {
                const countRes = await api.mpesa.getUnmatchedCount();
                onCountChange(countRes.count || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, onCountChange]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    const handleResolved = () => {
        setAssignTarget(null);
        showToast('Payment successfully applied to learner invoice');
        fetchPayments();
    };

    const handleDismissed = () => {
        setDismissTarget(null);
        showToast('Payment dismissed', 'info');
        fetchPayments();
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Assign + Dismiss Modals */}
            {assignTarget && <AssignModal payment={assignTarget} onClose={() => setAssignTarget(null)} onResolved={handleResolved} />}
            {dismissTarget && <DismissModal payment={dismissTarget} onClose={() => setDismissTarget(null)} onDismissed={handleDismissed} />}

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-top duration-300
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'info' ? 'bg-gray-800 text-white' : 'bg-emerald-600 text-white'}`}>
                    <CheckCircle2 size={18} />
                    {toast.msg}
                </div>
            )}

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-800">
                <Info size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                    <strong>Buy Goods Till payments</strong> where the paying phone number isn't on record are held here for manual assignment.
                    Use <em>Assign</em> to link the payment to the correct learner's invoice.
                </p>
            </div>

            {/* Status filter + refresh */}
            <div className="flex items-center gap-3">
                {['PENDING', 'RESOLVED', 'DISMISSED'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                        }`}>
                        {s}
                    </button>
                ))}
                <button onClick={fetchPayments} className="ml-auto p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-100">
                            <tr>
                                {['Phone', 'Amount', 'M-Pesa Receipt', 'Date', 'Status', 'Note', ''].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-5 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                                        </td>
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-emerald-50 text-emerald-400 rounded-full">
                                                <CheckCircle2 size={40} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {statusFilter === 'PENDING' ? 'No unmatched payments' : `No ${statusFilter.toLowerCase()} payments`}
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {statusFilter === 'PENDING' ? 'All Buy Goods payments have been successfully matched.' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payments.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <Phone size={12} className="text-gray-500" />
                                                </div>
                                                <span className="text-sm font-mono text-gray-700">{p.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-medium text-gray-900">KES {fmt(p.amount)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{p.receiptNo}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs text-gray-500">{fmtDate(p.transactionDate)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-medium uppercase border ${statusColors[p.status]}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 max-w-[200px]">
                                            <span className="text-xs text-gray-400 truncate block">{p.note || '—'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {p.status === 'PENDING' && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setAssignTarget(p)}
                                                        className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors flex items-center gap-1">
                                                        <UserCheck size={12} />
                                                        Assign
                                                    </button>
                                                    <button
                                                        onClick={() => setDismissTarget(p)}
                                                        className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
                                                        Dismiss
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UnmatchedPaymentsPanel;
