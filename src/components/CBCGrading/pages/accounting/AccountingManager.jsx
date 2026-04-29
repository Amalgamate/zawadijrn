import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    FileText,
    History,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { accountingAPI } from '../../../../services/api';

const AccountingManager = ({ user }) => {
    const [stats, setStats] = useState({
        cashOnHand: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
        feesCollected: 0,
        netProfit: 0
    });
    const [recentEntries, setRecentEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);

            try {
                const response = await accountingAPI.getDashboardStats();
                const payload = response?.data ?? response;

                if (response && response.success === false) {
                    console.error('Accounting dashboard API returned an error:', response.message);
                    return;
                }

                setStats({
                    cashOnHand: payload?.cashOnHand ?? payload?.cashActual ?? 0,
                    accountsReceivable: payload?.accountsReceivable ?? 0,
                    accountsPayable: payload?.accountsPayable ?? 0,
                    feesCollected: payload?.feesCollected ?? 0,
                    netProfit: payload?.netProfit ?? 0
                });
                setRecentEntries(payload?.recentEntries ?? []);
            } catch (error) {
                console.error('Error fetching accounting data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">Loading accounting dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium text-gray-800 tracking-tight">Accounting Dashboard</h1>
                    <p className="text-gray-500 text-sm">Real-time financial overview and ledger management</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm font-medium">
                        <FileText size={18} className="text-gray-400" />
                        Reports
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all shadow-md shadow-brand-purple/20 font-medium">
                        <Plus size={18} />
                        Journal Entry
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Cash on Hand"
                    amount={stats.cashOnHand}
                    icon={<CreditCard className="text-emerald-500" />}
                    trend="+12% from last month"
                    trendUp={true}
                />
                <StatCard
                    title="Accounts Receivable"
                    amount={stats.accountsReceivable}
                    icon={<ArrowUpRight className="text-blue-500" />}
                    trend="8 pending invoices"
                />
                <StatCard
                    title="Fees Collected"
                    amount={stats.feesCollected}
                    icon={<BarChart3 className="text-teal-500" />}
                    trend="Total fee payments"
                />
                <StatCard
                    title="Accounts Payable"
                    amount={stats.accountsPayable}
                    icon={<ArrowDownLeft className="text-amber-500" />}
                    trend="Due in < 7 days"
                />
                <StatCard
                    title="Net Profit (Period)"
                    amount={stats.netProfit}
                    icon={<TrendingUp className="text-indigo-500" />}
                    trend="+5.4% YoY"
                    trendUp={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-medium text-gray-800 flex items-center gap-2">
                            <History size={18} className="text-brand-purple" />
                            Recent Journal Entries
                        </h2>
                        <button className="text-sm font-medium text-brand-purple hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">{entry.date}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{entry.description}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entry.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'
                                                }`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                            {formatCurrency(entry.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                {entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Links / Actions */}
                <div className="space-y-6">
                    <div className="bg-[var(--brand-purple)] rounded-xl p-6 text-white shadow-xl shadow-brand-purple/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                        <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                            <BarChart3 size={20} className="text-brand-teal" />
                            Fiscal Year Summary
                        </h3>
                        <p className="text-white/70 text-xs mb-4">Academic Year 2026</p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-sm text-white/80">Collection Target</span>
                                <span className="font-medium text-white">85%</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                                <div className="bg-brand-teal h-full rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                            </div>
                            <div className="pt-2">
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium text-white transition-all">
                                    Generate Balance Sheet
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                            <AlertCircle size={18} className="text-amber-500" />
                            Critical Notifications
                        </h3>
                        <div className="space-y-3">
                            <NotificationItem
                                title="Unreconciled Bank Statement"
                                time="2 hours ago"
                                type="warning"
                            />
                            <NotificationItem
                                title="Pending Payroll Approval"
                                time="1 day ago"
                                type="info"
                            />
                            <NotificationItem
                                title="Missing Vendor Invoices (3)"
                                time="3 days ago"
                                type="error"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, amount, icon, trend, trendUp }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-gray-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            {trend && (
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                    }`}>
                    {trend}
                </span>
            )}
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-medium text-gray-900 tracking-tight">
            {new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                maximumFractionDigits: 0
            }).format(amount)}
        </p>
    </div>
);

const NotificationItem = ({ title, time, type }) => {
    const colors = {
        warning: 'bg-amber-500',
        info: 'bg-blue-500',
        error: 'bg-rose-500'
    };

    return (
        <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${colors[type] || 'bg-gray-400'}`}></div>
            <div>
                <h4 className="text-sm font-medium text-gray-800 leading-tight">{title}</h4>
                <p className="text-xs text-gray-400 mt-1">{time}</p>
            </div>
        </div>
    );
};

export default AccountingManager;
