import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Download,
    CreditCard,
    FileText,
    DollarSign,
    Tag,
    Calendar,
    Loader2,
    CheckCircle2,
    Upload
} from 'lucide-react';
import { accountingAPI } from '../../../../services/api/accounting.api';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "../../../ui/dialog";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { toast } from "react-hot-toast";
import ExpenseImportModal from '../../shared/ExpenseImportModal';

const ExpenseManager = () => {
    const [expenses, setExpenses] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [stats, setStats] = useState({ totalThisMonth: 0, unpaidClaims: 0, topCategory: 'N/A' });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    
    // Form State
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: 0,
        category: 'Operating',
        vendorId: '',
        date: new Date().toISOString().split('T')[0],
        accountId: '', // Expense account
        paymentAccountId: '', // Bank/Cash account
        reference: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expRes, venRes, accRes, statsRes] = await Promise.all([
                accountingAPI.getExpenses(),
                accountingAPI.getVendors(),
                accountingAPI.getAccounts(),
                accountingAPI.getDashboardStats()
            ]);

            if (expRes.success) setExpenses(expRes.data);
            if (venRes.success) setVendors(venRes.data);
            if (accRes.success) setAccounts(accRes.data);
            if (statsRes.success) {
                setStats({
                    totalThisMonth: expRes.data.reduce((sum, e) => sum + Number(e.amount), 0),
                    unpaidClaims: statsRes.data.accountsPayable || 0,
                    topCategory: expRes.data.length > 0 ? expRes.data[0].category : 'None'
                });
            }
        } catch (error) {
            toast.error("Failed to load expense data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRecordExpense = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newExpense,
                amount: Number(newExpense.amount),
                date: new Date(newExpense.date).toISOString()
            };
            const response = await accountingAPI.recordExpense(payload);
            if (response.success) {
                toast.success("Expense recorded and posted");
                setShowAddModal(false);
                setNewExpense({
                    description: '',
                    amount: 0,
                    category: 'Operating',
                    vendorId: '',
                    date: new Date().toISOString().split('T')[0],
                    accountId: '',
                    paymentAccountId: '',
                    reference: ''
                });
                fetchData();
            }
        } catch (error) {
            toast.error(error.message || "Failed to record expense");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const filteredExpenses = expenses.filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium text-gray-800 tracking-tight text-brand-purple">Expense Management</h1>
                    <p className="text-gray-500 text-sm italic">Track and categorize school spending</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
                        <Download size={18} className="text-gray-400" />
                        Export
                    </button>
                    <button 
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 border border-transparent text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md font-medium"
                    >
                        <Search size={18} />
                        Import
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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Expenses This Period</p>
                        <p className="text-xl font-semibold text-gray-900 font-mono">{formatCurrency(stats.totalThisMonth)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Total Payables</p>
                        <p className="text-xl font-semibold text-gray-900 font-mono">{formatCurrency(stats.unpaidClaims)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                        <Tag size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Active Category</p>
                        <p className="text-xl font-semibold text-gray-900 capitalize">{stats.topCategory}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by description, vendor or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em]">
                                <th className="px-6 py-4">Expense Details</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-brand-purple" />
                                            <span className="text-sm font-medium">Loading ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredExpenses.length > 0 ? (
                                filteredExpenses.map(expense => (
                                    <tr key={expense.id} className="group hover:bg-gray-50/20 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-800">{expense.description}</span>
                                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(expense.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-[10px] font-medium bg-white border border-gray-100 text-gray-600">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-400 uppercase">
                                                    {expense.vendor?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-sm text-gray-600">{expense.vendor?.name || 'Walk-in Vendor'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-gray-900 font-mono">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 uppercase tracking-tighter">
                                                <CheckCircle2 size={12} />
                                                Paid
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 rounded-lg transition-all">
                                                    <FileText size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">
                                        No expenses found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Expense Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Record Expense</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRecordExpense} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input 
                                    type="date" 
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input 
                                    placeholder="Utilities, Supplies, etc."
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input 
                                placeholder="What was this for?"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount (KES)</Label>
                                <Input 
                                    type="number"
                                    placeholder="0.00"
                                    className="font-medium text-brand-purple"
                                    value={newExpense.amount || ''}
                                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reference</Label>
                                <Input 
                                    placeholder="INV-001"
                                    value={newExpense.reference}
                                    onChange={(e) => setNewExpense({...newExpense, reference: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Vendor</Label>
                            <select 
                                className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                                value={newExpense.vendorId}
                                onChange={(e) => setNewExpense({...newExpense, vendorId: e.target.value})}
                            >
                                <option value="">Select Vendor (Optional)</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Expense Account</Label>
                                <select 
                                    className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                                    value={newExpense.accountId}
                                    onChange={(e) => setNewExpense({...newExpense, accountId: e.target.value})}
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {accounts.filter(a => a.type === 'EXPENSE').map(acc => (
                                        <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Paid Via (Account)</Label>
                                <select 
                                    className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                                    value={newExpense.paymentAccountId}
                                    onChange={(e) => setNewExpense({...newExpense, paymentAccountId: e.target.value})}
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {accounts.filter(a => a.type === 'ASSET_CASH').map(acc => (
                                        <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button type="submit" className="bg-brand-purple text-white hover:bg-brand-purple/90">Post Expense</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ExpenseImportModal 
                isOpen={showImportModal} 
                onClose={() => setShowImportModal(false)}
                onComplete={() => {
                    setShowImportModal(false);
                    fetchData();
                }}
            />
        </div>
    );
};

export default ExpenseManager;
