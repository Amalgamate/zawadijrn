import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Activity, PieChart, DollarSign, RefreshCw } from 'lucide-react';
import api from '../../../../services/api';
import { toInputDate } from '../../utils/dateHelpers';
import { useNotifications } from '../../hooks/useNotifications';

const FinancialReports = () => {
    const [activeTab, setActiveTab] = useState('trial-balance');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]); // Start of year
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const { showError } = useNotifications();

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.accounting.getTrialBalance(startDate, endDate);
            if (res.success) {
                setReportData(res.data);
            } else {
                showError(res.message || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Report error:', error);
            showError('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);
    };

    const renderTrialBalance = () => {
        if (!reportData?.trialBalance) return null;
        const totalDebit = reportData.trialBalance.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
        const totalCredit = Math.abs(reportData.trialBalance.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0));

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-700">
                            <th className="p-4">Account Code</th>
                            <th className="p-4">Account Name</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 text-right">Debit</th>
                            <th className="p-4 text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reportData.trialBalance.map(acc => {
                            const isDebit = acc.balance >= 0;
                            const absBalance = Math.abs(acc.balance);
                            return (
                                <tr key={acc.code} className="hover:bg-gray-50/50 text-sm">
                                    <td className="p-4 font-mono text-gray-500">{acc.code}</td>
                                    <td className="p-4 font-medium text-gray-800">{acc.name}</td>
                                    <td className="p-4 text-gray-500">{acc.type.replace(/_/g, ' ')}</td>
                                    <td className="p-4 text-right font-medium text-gray-800">{isDebit ? formatCurrency(absBalance) : '-'}</td>
                                    <td className="p-4 text-right font-medium text-gray-800">{!isDebit ? formatCurrency(absBalance) : '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-medium text-gray-900 border-t-2 border-gray-200">
                        <tr>
                            <td colSpan="3" className="p-4 text-right">Totals:</td>
                            <td className="p-4 text-right">{formatCurrency(totalDebit)}</td>
                            <td className="p-4 text-right">{formatCurrency(totalCredit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    const renderProfitLoss = () => {
        if (!reportData?.profitLoss) return null;
        const { totalIncome, totalExpenses, netProfit } = reportData.profitLoss;

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 mb-1">Total Income</p>
                        <p className="text-2xl font-medium text-green-600">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 mb-1">Total Expenses</p>
                        <p className="text-2xl font-medium text-red-600">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <div className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm ${netProfit >= 0 ? 'bg-brand-purple/5 border-brand-purple/20' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-sm font-semibold text-gray-500 mb-1">Net Profit / (Loss)</p>
                        <p className={`text-2xl font-medium ${netProfit >= 0 ? 'text-brand-purple' : 'text-red-700'}`}>{formatCurrency(netProfit)}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-800">
                        Income Statement Breakdown
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Income Section */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 mb-3">Revenue</h3>
                            <div className="space-y-2">
                                {reportData.trialBalance.filter(a => a.type === 'REVENUE').map(acc => (
                                    <div key={acc.code} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{acc.name}</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(Math.abs(acc.balance))}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between font-medium text-gray-800 mt-4 pt-2 border-t border-gray-200">
                                <span>Total Revenue</span>
                                <span className="text-green-600">{formatCurrency(totalIncome)}</span>
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 mb-3">Expenses</h3>
                            <div className="space-y-2">
                                {reportData.trialBalance.filter(a => a.type === 'EXPENSE').map(acc => (
                                    <div key={acc.code} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{acc.name}</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(Math.abs(acc.balance))}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between font-medium text-gray-800 mt-4 pt-2 border-t border-gray-200">
                                <span>Total Expenses</span>
                                <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
                            </div>
                        </div>

                        {/* Net Income */}
                        <div className={`flex justify-between text-lg font-medium p-4 rounded-lg mt-6 ${netProfit >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            <span>Net Income</span>
                            <span>{formatCurrency(netProfit)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBalanceSheet = () => {
        if (!reportData?.balanceSheet) return (
            <div className="text-center p-8 text-gray-500 italic">Please update the backend service to include Balance Sheet aggregation to view this report.</div>
        );

        const bs = reportData.balanceSheet;

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-brand-purple/5 text-center">
                        <h2 className="text-xl font-medium text-brand-purple">Balance Sheet</h2>
                        <p className="text-sm text-gray-600 font-medium">As of {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-100">
                        {/* ASSETS */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-medium border-b-2 border-gray-800 pb-2 text-gray-900">ASSETS</h3>

                            {/* Non-Current Assets */}
                            <div>
                                <h4 className="font-medium text-gray-700 text-sm uppercase mb-2">Non-Current Assets</h4>
                                <div className="space-y-1 pl-2">
                                    {reportData.trialBalance.filter(a => a.type === 'ASSET_NON_CURRENT').map(acc => (
                                        <div key={acc.code} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{acc.name}</span>
                                            <span>{formatCurrency(acc.balance)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-medium text-gray-800 mt-2 pt-1 border-t border-gray-200 pl-2 text-sm">
                                    <span>Total Non-Current Assets</span>
                                    <span>{formatCurrency(bs.assets.nonCurrent)}</span>
                                </div>
                            </div>

                            {/* Current Assets */}
                            <div>
                                <h4 className="font-medium text-gray-700 text-sm uppercase mb-2">Current Assets</h4>
                                <div className="space-y-1 pl-2">
                                    {reportData.trialBalance.filter(a => ['ASSET_RECEIVABLE', 'ASSET_CASH'].includes(a.type)).map(acc => (
                                        <div key={acc.code} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{acc.name}</span>
                                            <span>{formatCurrency(acc.balance)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-medium text-gray-800 mt-2 pt-1 border-t border-gray-200 pl-2 text-sm">
                                    <span>Total Current Assets</span>
                                    <span>{formatCurrency(bs.assets.current)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-lg font-medium border-t-2 border-gray-800 pt-3 text-gray-900">
                                <span>TOTAL ASSETS</span>
                                <span>{formatCurrency(bs.assets.total)}</span>
                            </div>
                        </div>

                        {/* LIABILITIES & EQUITY */}
                        <div className="space-y-6 pl-4 md:pl-8">
                            <h3 className="text-xl font-medium border-b-2 border-gray-800 pb-2 text-gray-900">LIABILITIES & EQUITY</h3>

                            {/* Liabilities */}
                            <div>
                                <h4 className="font-medium text-gray-700 text-sm uppercase mb-2">Liabilities</h4>
                                <div className="space-y-1 pl-2">
                                    {reportData.trialBalance.filter(a => ['LIABILITY_PAYABLE', 'LIABILITY_CURRENT', 'LIABILITY_NON_CURRENT'].includes(a.type)).map(acc => (
                                        <div key={acc.code} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{acc.name}</span>
                                            {/* Note: Liabilities are credit normal, so convert to absolute for display if negative, but they should be negative in trial balance. */}
                                            <span>{formatCurrency(Math.abs(acc.balance))}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-medium text-gray-800 mt-2 pt-1 border-t border-gray-200 pl-2 text-sm">
                                    <span>Total Liabilities</span>
                                    <span>{formatCurrency(Math.abs(bs.liabilities.total))}</span>
                                </div>
                            </div>

                            {/* Equity */}
                            <div>
                                <h4 className="font-medium text-gray-700 text-sm uppercase mb-2">Equity</h4>
                                <div className="space-y-1 pl-2">
                                    {reportData.trialBalance.filter(a => a.type === 'EQUITY').map(acc => (
                                        <div key={acc.code} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{acc.name}</span>
                                            <span>{formatCurrency(Math.abs(acc.balance))}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 italic mt-1">Net Income (Current Year)</span>
                                        <span>{formatCurrency(bs.equity.currentYearProfit)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between font-medium text-gray-800 mt-2 pt-1 border-t border-gray-200 pl-2 text-sm">
                                    <span>Total Equity</span>
                                    <span>{formatCurrency(Math.abs(bs.equity.total))}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-lg font-medium border-t-2 border-gray-800 pt-3 text-gray-900 mt-auto">
                                <span>TOTAL LIABILITIES & EQUITY</span>
                                <span>{formatCurrency(Math.abs(bs.totalLiabilitiesAndEquity))}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2">
                            <PieChart className="text-brand-purple" />
                            Financial Reports
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Generate and view Trial Balance, Profit & Loss, and Balance Sheet.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <Calendar size={16} className="text-gray-500 ml-2" />
                            <input
                                type="date"
                                value={toInputDate(startDate)}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 p-1"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={toInputDate(endDate)}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 p-1 mr-1"
                            />
                        </div>
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition shadow-sm font-medium text-sm disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Generate
                        </button>
                    </div>
                </div>

                <div className="flex space-x-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('trial-balance')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'trial-balance' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={16} /> Trial Balance
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('profit-loss')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profit-loss' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Activity size={16} /> Profit & Loss
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('balance-sheet')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'balance-sheet' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <DollarSign size={16} /> Balance Sheet
                        </div>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <RefreshCw size={32} className="text-brand-purple animate-spin" />
                </div>
            ) : (
                <div className="mt-6">
                    {activeTab === 'trial-balance' && renderTrialBalance()}
                    {activeTab === 'profit-loss' && renderProfitLoss()}
                    {activeTab === 'balance-sheet' && renderBalanceSheet()}
                </div>
            )}
        </div>
    );
};

export default FinancialReports;
