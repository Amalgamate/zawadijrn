import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    Plus,
    ChevronRight,
    ChevronDown,
    Building2,
    Wallet,
    CreditCard,
    TrendingDown,
    TrendingUp,
    Landmark,
    PiggyBank
} from 'lucide-react';

const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data for demonstration
        const mockAccounts = [
            {
                id: '1000', code: '1000', name: 'Cash and Bank Assets', type: 'ASSET', balance: 1250000, children: [
                    { id: '1010', code: '1010', name: 'Equity Bank - Main', type: 'ASSET', balance: 850000 },
                    { id: '1020', code: '1020', name: 'M-Pesa Business', type: 'ASSET', balance: 350000 },
                    { id: '1030', code: '1030', name: 'Petty Cash', type: 'ASSET', balance: 50000 },
                ]
            },
            { id: '1100', code: '1100', name: 'Accounts Receivable', type: 'ASSET', balance: 450000 },
            { id: '2100', code: '2100', name: 'Accounts Payable', type: 'LIABILITY', balance: 180000 },
            {
                id: '4000', code: '4000', name: 'Operating Revenue', type: 'REVENUE', balance: 3250000, children: [
                    { id: '4010', code: '4010', name: 'Tuition Fees', type: 'REVENUE', balance: 2800000 },
                    { id: '4020', code: '4020', name: 'Transport Fees', type: 'REVENUE', balance: 450000 },
                ]
            },
            {
                id: '5000', code: '5000', name: 'Operating Expenses', type: 'EXPENSE', balance: 1450000, children: [
                    { id: '5100', code: '5100', name: 'Staff Salaries', type: 'EXPENSE', balance: 850000 },
                    { id: '5200', code: '5200', name: 'Rent & Utilities', type: 'EXPENSE', balance: 350000 },
                    { id: '5300', code: '5300', name: 'School Supplies', type: 'EXPENSE', balance: 250000 },
                ]
            }
        ];
        setAccounts(mockAccounts);
        setLoading(false);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'ASSET': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'LIABILITY': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'EQUITY': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'REVENUE': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'EXPENSE': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Chart of Accounts</h1>
                    <p className="text-gray-500 text-sm">Organize and manage your school's financial accounts</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
                        <Download size={18} className="text-gray-400" />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all shadow-md font-medium">
                        <Plus size={18} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* Account Type Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(type => (
                    <button
                        key={type}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${type === 'ALL'
                                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Accounts Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by code or name..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white transition-all"
                        />
                    </div>
                    <button className="p-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-100 hover:bg-gray-100 transition-all">
                        <Filter size={20} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Account Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {accounts.map(account => (
                                <React.Fragment key={account.id}>
                                    {/* Parent Row */}
                                    <tr className="group hover:bg-gray-50/50 transition-colors cursor-pointer font-medium">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{account.code}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800 flex items-center gap-2">
                                            {account.children ? <ChevronDown size={16} className="text-gray-400" /> : <div className="w-4"></div>}
                                            {account.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeStyle(account.type)}`}>
                                                {account.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                            {formatCurrency(account.balance)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-gray-400 hover:text-brand-purple transition-colors p-1">
                                                <Plus size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Children Rows */}
                                    {account.children?.map(child => (
                                        <tr key={child.id} className="bg-gray-50/20 hover:bg-gray-50 transition-colors border-l-2 border-brand-purple/10">
                                            <td className="px-6 py-3 text-xs font-mono text-gray-400 pl-12">{child.code}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600 pl-12">{child.name}</td>
                                            <td className="px-6 py-3 text-sm">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border opacity-60 ${getTypeStyle(child.type)}`}>
                                                    {child.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-700 text-right">
                                                {formatCurrency(child.balance)}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button className="text-gray-300 hover:text-brand-purple transition-colors">
                                                    <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChartOfAccounts;
