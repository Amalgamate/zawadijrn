import React, { useState, useEffect } from 'react';
import {
    Search,
    Download,
    Plus,
    ChevronRight,
    ChevronDown,
    Loader2
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

const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());
    
    // New Account Form State
    const [newAccount, setNewAccount] = useState({
        code: '',
        name: '',
        type: 'EXPENSE',
        parentId: ''
    });

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await accountingAPI.getAccounts(true);
            if (response.success) {
                setAccounts(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            toast.error("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const buildTree = (flatAccounts) => {
        const map = {};
        const roots = [];
        
        flatAccounts.forEach(acc => {
            map[acc.id] = { ...acc, children: [] };
        });
        
        flatAccounts.forEach(acc => {
            if (acc.parentId && map[acc.parentId]) {
                map[acc.parentId].children.push(map[acc.id]);
            } else {
                roots.push(map[acc.id]);
            }
        });
        
        return roots;
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        try {
            const response = await accountingAPI.createAccount(newAccount);
            if (response.success) {
                toast.success("Account created successfully");
                setIsAddModalOpen(false);
                setNewAccount({ code: '', name: '', type: 'EXPENSE', parentId: '' });
                fetchAccounts();
            }
        } catch (error) {
            toast.error(error.message || "Failed to create account");
        }
    };

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedIds(newExpanded);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getTypeStyle = (type) => {
        if (type.includes('ASSET')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (type.includes('LIABILITY')) return 'bg-rose-50 text-rose-700 border-rose-100';
        if (type.includes('EQUITY')) return 'bg-blue-50 text-blue-700 border-blue-100';
        if (type.includes('REVENUE')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        if (type.includes('EXPENSE')) return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-gray-50 text-gray-700 border-gray-100';
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             acc.code.includes(searchTerm);
        const matchesType = filterType === 'ALL' || acc.type.includes(filterType);
        return matchesSearch && matchesType;
    });

    const accountTree = buildTree(filteredAccounts);

    const AccountRow = ({ account, depth = 0 }) => {
        const hasChildren = account.children && account.children.length > 0;
        const isExpanded = expandedIds.has(account.id);

        return (
            <>
                <tr className={`group hover:bg-gray-50/50 transition-colors cursor-pointer ${depth > 0 ? 'bg-gray-50/10' : 'font-semibold'}`}>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500" style={{ paddingLeft: `${depth * 2 + 1.5}rem` }}>
                        {account.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 flex items-center gap-2">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(account.id)}>
                                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                            </button>
                        ) : depth > 0 ? <div className="w-4"></div> : null}
                        {account.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeStyle(account.type)}`}>
                            {account.type.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(account.balance)}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <button 
                            className="text-gray-400 hover:text-brand-purple transition-colors p-1"
                            onClick={() => {
                                setNewAccount({ ...newAccount, parentId: account.id, type: account.type });
                                setIsAddModalOpen(true);
                            }}
                        >
                            <Plus size={16} title="Add Sub-account" />
                        </button>
                    </td>
                </tr>
                {isExpanded && account.children.map(child => (
                    <AccountRow key={child.id} account={child} depth={depth + 1} />
                ))}
            </>
        );
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
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all shadow-md font-medium"
                    >
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
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${filterType === type
                                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Accounts Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by code or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white transition-all text-sm"
                        />
                    </div>
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
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-brand-purple" />
                                            <span className="text-sm font-medium">Loading ledger...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : accountTree.length > 0 ? (
                                accountTree.map(account => (
                                    <AccountRow key={account.id} account={account} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                        No accounts found. Start by adding one or initializing the defaults.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Account Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Account</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAccount} className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">Code</Label>
                            <Input
                                id="code"
                                value={newAccount.code}
                                onChange={(e) => setNewAccount({...newAccount, code: e.target.value})}
                                className="col-span-3"
                                placeholder="e.g. 1010"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={newAccount.name}
                                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                                className="col-span-3"
                                placeholder="Account Name"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <select
                                id="type"
                                value={newAccount.type}
                                onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                                className="col-span-3 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all font-medium"
                                required
                            >
                                <option value="ASSET_CASH">Asset: Cash/Bank</option>
                                <option value="ASSET_RECEIVABLE">Asset: Receivable</option>
                                <option value="ASSET_CURRENT">Asset: Current</option>
                                <option value="ASSET_NON_CURRENT">Asset: Fixed</option>
                                <option value="LIABILITY_PAYABLE">Liability: Payable</option>
                                <option value="LIABILITY_CURRENT">Liability: Current</option>
                                <option value="EQUITY">Equity</option>
                                <option value="REVENUE">Revenue</option>
                                <option value="EXPENSE">Expense</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="parent" className="text-right">Parent</Label>
                            <select
                                id="parent"
                                value={newAccount.parentId}
                                onChange={(e) => setNewAccount({...newAccount, parentId: e.target.value})}
                                className="col-span-3 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all"
                            >
                                <option value="">None (Root Account)</option>
                                {accounts.filter(a => !a.parentId).map(acc => (
                                    <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-brand-purple text-white hover:bg-brand-purple/90">Save Account</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChartOfAccounts;
