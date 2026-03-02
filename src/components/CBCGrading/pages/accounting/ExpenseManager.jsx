import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Download,
    CreditCard,
    ArrowUpRight,
    Trash2,
    FileText,
    DollarSign,
    Tag,
    Calendar,
    User
} from 'lucide-react';
import { accountingAPI } from '../../../../services/api';

const ExpenseManager = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        // Mock expenses
        const mockExpenses = [
            { id: '1', date: '2026-02-23', description: 'Monthly Electricity Bill', amount: 12450, category: 'Utilities', vendor: 'KPLC', status: 'PAID', paidVia: 'Equity Bank' },
            { id: '2', date: '2026-02-22', description: 'Printing Paper Replenishment', amount: 4800, category: 'Supplies', vendor: 'Quick Mart', status: 'PAID', paidVia: 'Petty Cash' },
            { id: '3', date: '2026-02-21', description: 'Internet Subscription - Feb', amount: 6500, category: 'Communication', vendor: 'Safaricom', status: 'PAID', paidVia: 'M-Pesa' },
            { id: '4', date: '2026-02-20', description: 'School Van Maintenance', amount: 15700, category: 'Transport', vendor: 'Auto Express', status: 'PENDING', paidVia: '-' },
            { id: '5', date: '2026-02-18', description: 'Cleaner Services', amount: 8000, category: 'Maintenance', vendor: 'Clean Co.', status: 'PAID', paidVia: 'Petty Cash' },
        ];
        setExpenses(mockExpenses);
        setLoading(false);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight text-brand-purple">Expense Management</h1>
                    <p className="text-gray-500 text-sm italic">Track and categorize school spending</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
                        <Download size={18} className="text-gray-400" />
                        Export Data
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all shadow-md font-medium"
                    >
                        <Plus size={18} />
                        Record Expense
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-brand-purple/10 rounded-full text-brand-purple">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total This Month</p>
                        <p className="text-xl font-black text-gray-900">{formatCurrency(47450)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Unpaid Claims</p>
                        <p className="text-xl font-black text-gray-900">{formatCurrency(15700)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                        <Tag size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Top Category</p>
                        <p className="text-xl font-black text-gray-900">Utilities</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by description, vendor or category..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all font-medium">
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                <th className="px-6 py-4">Expense Details</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Payment</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {expenses.map(expense => (
                                <tr key={expense.id} className="group hover:bg-gray-50/20 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800">{expense.description}</span>
                                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                <Calendar size={12} /> {expense.date}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-white border border-gray-100 text-gray-600">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                                                {expense.vendor.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-600">{expense.vendor}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-gray-900">
                                        {formatCurrency(expense.amount)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 font-black animate-pulse'
                                                }`}>
                                                {expense.status}
                                            </span>
                                            {expense.status === 'PAID' && (
                                                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">
                                                    via {expense.paidVia}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all">
                                                <FileText size={18} />
                                            </button>
                                            <button className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpenseManager;
