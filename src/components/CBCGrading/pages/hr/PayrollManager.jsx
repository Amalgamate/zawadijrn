import React, { useState, useEffect } from 'react';
import {
    CreditCard, Download, Search,
    Printer, Send, CheckCircle2,
    Clock, AlertCircle, Calendar,
    TrendingUp, ArrowUpRight, DollarSign
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const PayrollManager = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        fetchPayroll();
    }, [month, year]);

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
            if (res.success) {
                fetchPayroll();
            }
        } catch (error) {
            alert('Error generating payroll: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const totalGross = records.reduce((acc, curr) => acc + Number(curr.grossPay), 0);
    const totalNet = records.reduce((acc, curr) => acc + Number(curr.netPay), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll Center</h1>
                    <p className="text-gray-500">Automate salary processing and payslip generation.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm gap-4">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 font-bold text-gray-700 text-sm"
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 font-bold text-gray-700 text-sm"
                        >
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Net Pay</p>
                        <p className="text-2xl font-bold text-gray-900">KES {totalNet.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Gross Pay</p>
                        <p className="text-2xl font-bold text-gray-900">KES {totalGross.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                        <Calendar size={24} />
                    </div>
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
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm"
                    />
                </div>
                <div className="flex items-center gap-3">
                    {records.length === 0 ? (
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-100 hover:bg-brand-teal/90 transition-all flex items-center gap-2"
                        >
                            {generating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white"></div>
                            ) : (
                                <DollarSign size={18} />
                            )}
                            Generate Monthly Payroll
                        </button>
                    ) : (
                        <>
                            <button className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                                <Printer size={18} />
                                Print Payslips
                            </button>
                            <button className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <Send size={18} />
                                Email Payslips
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
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">View</th>
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
                            ) : records.length > 0 ? (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {record.user.firstName} {record.user.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {Number(record.basicSalary).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {Number(record.grossPay).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-red-600">
                                            -{Number(record.totalDeductions).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">
                                            {Number(record.netPay).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-bold text-[10px] border border-green-100 uppercase">
                                                Paid
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-brand-teal transition-colors">
                                                <ArrowUpRight size={18} />
                                            </button>
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
