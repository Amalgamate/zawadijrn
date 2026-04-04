import React, { useState, useEffect, useRef } from 'react';
import {
    CreditCard, Download, Search, X,
    Printer, Send, CheckCircle2,
    Clock, AlertCircle, Calendar,
    TrendingUp, ArrowUpRight, DollarSign, Eye
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { printWindow, captureSingleReport } from '../../../../utils/simplePdfGenerator';

// ─── Payslip print template rendered off-screen ──────────────────────────────
const PayslipPrintArea = ({ records, month, months, year }) => (
    <div id="payslip-bulk-content" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {records.map((record) => (
            <div
                key={record.id}
                className="pdf-report-page bg-white"
                style={{ width: '794px', minHeight: '1123px', padding: '60px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
            >
                {/* Header */}
                <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e3a8a', margin: 0 }}>PAYSLIP</h1>
                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{months[month - 1]} {year}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Reference</p>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>PAY-{year}-{String(month).padStart(2, '0')}-{record.id.slice(-6).toUpperCase()}</p>
                    </div>
                </div>

                {/* Employee Info */}
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
                        {record.user.firstName} {record.user.lastName}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div><p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Role</p><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{(record.user.role || '').replace(/_/g, ' ')}</p></div>
                        <div><p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Staff ID</p><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{record.user.staffId || 'N/A'}</p></div>
                        <div><p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Bank Account</p><p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', margin: 0 }}>{record.user.bankAccount || 'N/A'}</p></div>
                    </div>
                </div>

                {/* Earnings & Deductions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Earnings</h3>
                        {[{ label: 'Basic Salary', value: record.basicSalary }, { label: 'Allowances', value: record.allowances || 0 }, { label: 'Overtime', value: record.overtime || 0 }].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '13px', color: '#475569' }}>{item.label}</span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>KES {Number(item.value || 0).toLocaleString()}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #1e3a8a', marginTop: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Gross Pay</span>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a' }}>KES {Number(record.grossPay).toLocaleString()}</span>
                        </div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Deductions</h3>
                        {[{ label: 'PAYE (Tax)', value: record.paye || 0 }, { label: 'NHIF', value: record.nhif || 0 }, { label: 'NSSF', value: record.nssf || 0 }, { label: 'Other Deductions', value: record.otherDeductions || 0 }].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '13px', color: '#475569' }}>{item.label}</span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>KES {Number(item.value || 0).toLocaleString()}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #dc2626', marginTop: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Total Deductions</span>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>KES {Number(record.totalDeductions).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Net Pay box */}
                <div style={{ background: '#1e3a8a', borderRadius: '12px', padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>Net Pay (Take Home)</span>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff' }}>KES {Number(record.netPay).toLocaleString()}</span>
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div style={{ textAlign: 'center' }}><div style={{ borderBottom: '1px solid #cbd5e1', height: '32px', marginBottom: '4px' }} /><p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Employee Signature</p></div>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}><p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Payroll Status</p><span style={{ padding: '4px 12px', background: record.status === 'CONFIRMED' ? '#dcfce7' : '#fef9c3', color: record.status === 'CONFIRMED' ? '#166534' : '#854d0e', fontSize: '10px', fontWeight: '800', borderRadius: '20px', textTransform: 'uppercase' }}>{record.status || 'DRAFT'}</span></div>
                    <div style={{ textAlign: 'center' }}><div style={{ borderBottom: '1px solid #cbd5e1', height: '32px', marginBottom: '4px' }} /><p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Authorised By</p></div>
                </div>
                <p style={{ fontSize: '9px', color: '#cbd5e1', textAlign: 'center', marginTop: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confidential — Generated by Zawadi SMS · {new Date().toLocaleDateString()}</p>
            </div>
        ))}
    </div>
);

// ─── Payslip detail modal ────────────────────────────────────────────────────
const PayslipModal = ({ record, months, onClose, onConfirm, confirming }) => {
    if (!record) return null;
    const m = record;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{m.user.firstName} {m.user.lastName}</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-0.5">Payslip Detail</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {[{ label: 'Basic Salary', value: m.basicSalary, color: 'text-gray-900' }, { label: 'Allowances', value: m.allowances || 0, color: 'text-gray-900' }, { label: 'Gross Pay', value: m.grossPay, color: 'text-green-600' }, { label: 'PAYE', value: m.paye || 0, color: 'text-red-600' }, { label: 'NHIF', value: m.nhif || 0, color: 'text-red-600' }, { label: 'NSSF', value: m.nssf || 0, color: 'text-red-600' }, { label: 'Total Deductions', value: m.totalDeductions, color: 'text-red-600' }].map(row => (
                            <div key={row.label} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{row.label}</span>
                                <span className={`text-sm font-bold ${row.color}`}>KES {Number(row.value || 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-brand-purple text-white rounded-2xl p-4 flex justify-between items-center">
                        <span className="font-bold text-sm">Net Pay</span>
                        <span className="text-xl font-black">KES {Number(m.netPay).toLocaleString()}</span>
                    </div>
                    {m.status !== 'CONFIRMED' && (
                        <button onClick={() => onConfirm(m.id)} disabled={confirming} className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50">
                            {confirming ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white" /> : <CheckCircle2 size={18} />}
                            Confirm & Post to Ledger
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────
const PayrollManager = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

    useEffect(() => { fetchPayroll(); }, [month, year]);

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const res = await hrAPI.getPayrollRecords({ month, year });
            setRecords(res.data || []);
        } catch (error) {
            console.error('Error fetching payroll:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const res = await hrAPI.generatePayroll({ month, year });
            if (res.success) fetchPayroll();
        } catch (error) {
            alert('Error generating payroll: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handlePrintAll = async () => {
        setPrinting(true);
        await printWindow('payslip-bulk-content');
        setPrinting(false);
    };

    const handleDownloadAll = async () => {
        setPrinting(true);
        const filename = `Payslips_${months[month - 1]}_${year}.pdf`;
        await captureSingleReport('payslip-bulk-content', filename);
        setPrinting(false);
    };

    const handleConfirm = async (id) => {
        try {
            setConfirming(true);
            const res = await hrAPI.confirmPayroll(id);
            if (res.success) {
                fetchPayroll();
                setSelectedRecord(null);
            }
        } catch (error) {
            alert('Error confirming payroll: ' + error.message);
        } finally {
            setConfirming(false);
        }
    };

    const filteredRecords = records.filter(r =>
        (r.user.firstName + ' ' + r.user.lastName).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalGross = records.reduce((acc, curr) => acc + Number(curr.grossPay), 0);
    const totalNet = records.reduce((acc, curr) => acc + Number(curr.netPay), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Off-screen payslip print area */}
            {records.length > 0 && <PayslipPrintArea records={records} month={month} months={months} year={year} />}

            {/* Payslip detail modal */}
            <PayslipModal
                record={selectedRecord}
                months={months}
                onClose={() => setSelectedRecord(null)}
                onConfirm={handleConfirm}
                confirming={confirming}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll Center</h1>
                    <p className="text-gray-500">Automate salary processing and payslip generation.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm gap-4">
                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent border-none focus:ring-0 font-bold text-gray-700 text-sm">
                            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent border-none focus:ring-0 font-bold text-gray-700 text-sm">
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Net Pay</p>
                        <p className="text-2xl font-bold text-gray-900">KES {totalNet.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><CreditCard size={24} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Gross Pay</p>
                        <p className="text-2xl font-bold text-gray-900">KES {totalGross.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Calendar size={24} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Processing Status</p>
                        <p className={`text-2xl font-bold ${records.length ? 'text-green-600' : 'text-orange-500'}`}>
                            {records.length ? 'Completed' : 'Pending'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search staff payroll records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm"
                    />
                </div>
                <div className="flex items-center gap-3">
                    {records.length === 0 ? (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-100 hover:bg-brand-teal/90 transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                            {generating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white" /> : <DollarSign size={18} />}
                            Generate Monthly Payroll
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handlePrintAll}
                                disabled={printing}
                                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                <Printer size={18} />
                                {printing ? 'Preparing…' : 'Print Payslips'}
                            </button>
                            <button
                                onClick={handleDownloadAll}
                                disabled={printing}
                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-60"
                            >
                                <Download size={18} />
                                {printing ? 'Generating…' : 'Download PDF'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Basic Salary</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Pay</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Deductions</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Net Pay</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-6" colSpan={7}>
                                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {record.user.firstName} {record.user.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            KES {Number(record.basicSalary).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            KES {Number(record.grossPay).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-red-600">
                                            -KES {Number(record.totalDeductions).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">
                                            KES {Number(record.netPay).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-md font-bold text-[10px] border uppercase ${
                                                record.status === 'CONFIRMED'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            }`}>
                                                {record.status === 'CONFIRMED' ? 'Confirmed' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedRecord(record)}
                                                    className="p-2 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all"
                                                    title="View payslip"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        // Render only this one payslip then download
                                                        const id = `payslip-single-${record.id}`;
                                                        let el = document.getElementById(id);
                                                        if (!el) {
                                                            // Find it inside the bulk print area
                                                            const all = document.querySelectorAll('#payslip-bulk-content .pdf-report-page');
                                                            const idx = records.findIndex(r => r.id === record.id);
                                                            el = all[idx] || null;
                                                        }
                                                        if (el) {
                                                            const filename = `Payslip_${record.user.firstName}_${record.user.lastName}_${months[month - 1]}_${year}.pdf`;
                                                            await captureSingleReport(el.id || 'payslip-bulk-content', filename);
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Download individual payslip"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="p-4 bg-orange-50 text-orange-500 rounded-full mb-4">
                                                <AlertCircle size={48} />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">Payroll Not Generated</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                                The payroll for {months[month - 1]} {year} hasn't been processed yet. Click generate to start.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayrollManager;
