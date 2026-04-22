import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Calendar,
    ArrowRightLeft,
    Banknote,
    Upload,
    CheckCircle2,
    AlertCircle,
    X
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
import { Label } from "../../../ui/label";
import { toast } from "react-hot-toast";

const BankReconciliation = () => {
    const [statements, setStatements] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeLine, setActiveLine] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [matchingLoading, setMatchingLoading] = useState(false);

    const fetchStatements = async (accountId) => {
        try {
            setLoading(true);
            setStatements([]);
            setActiveLine(null);
            setSuggestions([]);

            const stmtRes = await accountingAPI.getBankStatements(accountId);
            if (stmtRes.success) {
                setStatements(stmtRes.data);
            }
        } catch (error) {
            toast.error("Failed to load bank data");
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const accRes = await accountingAPI.getAccounts();

            if (accRes.success) {
                const banks = accRes.data.filter(a => a.type === 'ASSET_CASH');
                setBankAccounts(banks);
                if (banks.length > 0) setSelectedBankId(banks[0].id);
            }
        } catch (error) {
            toast.error("Failed to load bank data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedBankId) {
            fetchStatements(selectedBankId);
        }
    }, [selectedBankId]);

    const fetchSuggestions = async (line) => {
        try {
            setActiveLine(line);
            setMatchingLoading(true);
            setSuggestions([]);
            const response = await accountingAPI.getSuggestedMatches(line.id);
            if (response.success) {
                setSuggestions(response.data);
            }
        } catch (error) {
            toast.error("Failed to find matches");
        } finally {
            setMatchingLoading(false);
        }
    };

    const handleReconcile = async (matchId) => {
        try {
            const response = await accountingAPI.reconcileLine({
                lineId: activeLine.id,
                journalItemId: matchId
            });
            if (response.success) {
                toast.success("Successfully reconciled");
                setActiveLine(null);
                setSuggestions([]);
                if (selectedBankId) {
                    fetchStatements(selectedBankId);
                }
            }
        } catch (error) {
            toast.error(error.message || "Failed to reconcile");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(amount || 0);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium text-gray-800 tracking-tight flex items-center gap-2">
                        Bank Reconciliation
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-purple/10 text-brand-purple uppercase tracking-tighter">Live Beta</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Match bank statement lines with ledger entries</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-all shadow-md font-medium"
                    >
                        <Upload size={18} />
                        Import Statement
                    </button>
                </div>
            </div>

            {/* Bank Selector */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                        <Banknote size={20} />
                    </div>
                    <Label className="text-xs font-medium uppercase text-gray-400 tracking-widest">Selected Bank Account</Label>
                </div>
                <select 
                    className="flex-1 w-full flex h-10 rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm font-medium"
                    value={selectedBankId}
                    onChange={(e) => {
                        setSelectedBankId(e.target.value);
                        setActiveLine(null);
                        setSuggestions([]);
                    }}
                >
                    {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>[{acc.code}] {acc.name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-6 px-4 py-2 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="text-right">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">System Balance</p>
                        <p className="text-xs font-medium text-gray-800 font-mono">
                            {formatCurrency(bankAccounts.find(a => a.id === selectedBankId)?.balance || 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Reconciliation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
                {/* Left: Statement Lines */}
                <div className="lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Statement Lines</h2>
                        <span className="text-[10px] font-medium text-brand-purple">{statements.length} total entries</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-brand-purple" />
                                <span className="text-sm font-medium text-gray-500 font-mono">Scanning statement records...</span>
                            </div>
                        ) : statements.length > 0 ? (
                            statements.map(line => (
                                <div 
                                    key={line.id} 
                                    onClick={() => !line.isReconciled && fetchSuggestions(line)}
                                    className={`p-4 transition-all cursor-pointer group ${
                                        activeLine?.id === line.id ? 'bg-brand-purple/5 border-l-4 border-brand-purple' : 'hover:bg-gray-50'
                                    } ${line.isReconciled ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-800 line-clamp-1">{line.description}</span>
                                                {line.isReconciled && (
                                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-400 font-mono flex items-center gap-2">
                                                <Calendar size={12} /> {new Date(line.date).toLocaleDateString()}
                                                <span className="text-gray-200">|</span>
                                                {line.reference || 'NO REF'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-semibold ${line.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(line.amount)}
                                            </span>
                                            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">
                                                {line.isReconciled ? 'Reconciled' : 'Unmatched'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                                <Banknote size={40} className="text-gray-100" />
                                <span className="text-sm italic">No imported statements found for this account</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Matching Area */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Match Ledger Entry</h2>
                    </div>
                    <div className="p-6 h-full flex flex-col">
                        {!activeLine ? (
                            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <ArrowRightLeft className="text-gray-300" size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Select an entry</p>
                                    <p className="text-xs text-gray-400 max-w-[200px]">Click on a statement line to find matching ledger entries</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="p-4 bg-brand-purple/5 rounded-xl border border-brand-purple/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-semibold text-brand-purple uppercase tracking-widest">Active Search</p>
                                        <button onClick={() => setActiveLine(null)}><X size={14} className="text-gray-400" /></button>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900">{activeLine.description}</h3>
                                    <div className="flex justify-between items-end mt-4 text-[10px] font-mono">
                                        <span className="text-gray-500">{new Date(activeLine.date).toDateString()}</span>
                                        <span className={`text-sm font-semibold ${activeLine.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {formatCurrency(Math.abs(activeLine.amount))}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Potential Matches</p>
                                        {matchingLoading && <Loader2 className="animate-spin text-brand-purple" size={14} />}
                                    </div>

                                    {suggestions.length > 0 ? (
                                        suggestions.map(match => (
                                            <div 
                                                key={match.id}
                                                className="p-3 bg-white border border-gray-100 rounded-xl hover:border-brand-purple transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-medium text-brand-purple uppercase">{match.journalEntry.reference}</span>
                                                        <span className="text-xs font-medium text-gray-800">{match.account.name}</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-gray-900 font-mono">
                                                        {formatCurrency(Number(match.debit) || Number(match.credit))}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                                                    <span>{new Date(match.journalEntry.date).toLocaleDateString()}</span>
                                                    <button 
                                                        onClick={() => handleReconcile(match.id)}
                                                        className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-all font-medium uppercase tracking-tighter"
                                                    >
                                                        Match
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : !matchingLoading ? (
                                        <div className="p-8 text-center space-y-2 border-2 border-dashed border-gray-100 rounded-2xl">
                                            <AlertCircle className="mx-auto text-amber-400" size={24} />
                                            <p className="text-xs font-medium text-gray-600">No exact matches found</p>
                                            <p className="text-[10px] text-gray-400">Try manual adjustment or create a missing entry</p>
                                            <button className="text-[10px] font-semibold text-brand-purple font-mono underline uppercase mt-2">
                                                Manual Journal
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Import Dialog */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Bank Statement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center space-y-4 hover:border-brand-purple/40 transition-all cursor-pointer">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                <Upload size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-800">Drop bank CSV here</p>
                                <p className="text-xs text-gray-400">Supports Equity, KCB, and M-Pesa statements</p>
                            </div>
                            <Button size="sm" variant="outline">Browse Files</Button>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg flex gap-3 text-amber-800 border border-amber-100">
                            <AlertCircle className="shrink-0 text-amber-500" size={18} />
                            <p className="text-[10px] leading-normal font-medium">
                                Ensure your CSV contains columns: Date, Description, Reference, and Amount. Statements are automatically stripped of duplicate records based on reference.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                        <Button disabled className="bg-brand-purple text-white">Process Statement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BankReconciliation;
