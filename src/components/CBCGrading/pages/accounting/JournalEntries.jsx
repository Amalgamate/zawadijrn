import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Plus,
    Download,
    Calendar,
    Eye,
    CheckCircle2,
    Clock,
    ArrowRightLeft,
    FileSearch
} from 'lucide-react';

const JournalEntries = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock journal entries
        const mockEntries = [
            { id: '1', date: '2026-02-23', reference: 'FEES/2026/001', description: 'School Fees - John Doe', amount: 45000, status: 'POSTED', journal: 'SALES' },
            { id: '2', date: '2026-02-23', reference: 'EXP/2026/042', description: 'Office Electricity Bill', amount: 12500, status: 'POSTED', journal: 'PURCHASE' },
            { id: '3', date: '2026-02-22', reference: 'PAY/2026/002', description: 'Feb 2026 Staff Salary', amount: 850000, status: 'POSTED', journal: 'MISC' },
            { id: '4', date: '2026-02-21', reference: 'JV/2026/015', description: 'Correction of petty cash entry', amount: 1200, status: 'DRAFT', journal: 'MISC' },
            { id: '5', date: '2026-02-20', reference: 'FEES/2026/002', description: 'School Fees - Jane Smith', amount: 38000, status: 'POSTED', journal: 'SALES' },
        ];
        setEntries(mockEntries);
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
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Journal Entries</h1>
                    <p className="text-gray-500 text-sm">Review and manage double-entry bookkeeping records</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
                        <Calendar size={18} className="text-gray-400" />
                        Pick Period
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all shadow-md font-medium">
                        <Plus size={18} />
                        New Entry
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search entries, references..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white transition-all text-sm"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select className="px-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20">
                        <option>All Journals</option>
                        <option>Sales Journal</option>
                        <option>Purchase Journal</option>
                        <option>Cash Journal</option>
                        <option>General Journal</option>
                    </select>
                    <select className="px-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/20">
                        <option>All Status</option>
                        <option>Posted</option>
                        <option>Draft</option>
                        <option>Cancelled</option>
                    </select>
                    <button className="p-2 bg-gray-50 text-gray-500 rounded-lg border border-transparent hover:bg-gray-100 transition-all">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Entries List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hideen">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                <th className="px-6 py-4">Ref / Description</th>
                                <th className="px-6 py-4 text-center">Date</th>
                                <th className="px-6 py-4">Journal</th>
                                <th className="px-6 py-4 text-right">Total Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {entries.map(entry => (
                                <tr key={entry.id} className="group hover:bg-gray-50/50 transition-all cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono font-bold text-brand-purple">{entry.reference}</span>
                                            <span className="text-sm font-medium text-gray-800 group-hover:text-black transition-colors">{entry.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-medium text-gray-500">{entry.date}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <ArrowRightLeft size={14} className="text-gray-300" />
                                            <span className="text-xs font-bold text-gray-600">{entry.journal}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(entry.amount)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {entry.status === 'POSTED' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-tighter">
                                                <CheckCircle2 size={12} />
                                                Posted
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 uppercase tracking-tighter">
                                                <Clock size={12} />
                                                Draft
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg hover:bg-brand-purple/10 hover:text-brand-purple transition-all">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-1.5 h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                                <FileSearch size={16} />
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

export default JournalEntries;
