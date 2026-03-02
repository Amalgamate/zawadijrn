import React, { useState } from 'react';
import { X, Search, Package, Plus, Info } from 'lucide-react';

const IssueItemModal = ({ isOpen, onClose, items, onIssue, teacherName }) => {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredItems = items.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500/75 backdrop-blur-sm" onClick={onClose} />

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block w-full max-w-2xl overflow-hidden text-left align-bottom transition-all transform bg-white rounded-3xl shadow-2xl sm:my-8 sm:align-middle">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Issue Item</h3>
                            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                Assigning to: <span className="text-brand-teal">{teacherName}</span>
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="px-8 py-6">
                        {/* Search */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by title, category, or ID/ISBN..."
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all font-medium"
                            />
                        </div>

                        {/* Items List */}
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {filteredItems.length > 0 ? (
                                filteredItems.map(item => (
                                    <div key={item.id} className="group p-4 rounded-2xl border border-gray-100 hover:border-brand-teal/30 hover:bg-brand-teal/[0.02] flex items-center justify-between transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-brand-teal/10 group-hover:text-brand-teal transition-colors">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{item.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded">{item.category}</span>
                                                    {item.isbn && (
                                                        <>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="text-xs text-gray-500 font-medium">ISBN: {item.isbn}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onIssue(item.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition shadow-sm font-bold text-sm"
                                        >
                                            <Plus size={16} />
                                            Issue
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <Package size={48} className="text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-500 font-bold">No available items found</p>
                                    <p className="text-sm text-gray-400 mt-1">Try a different search term or add more items to inventory.</p>
                                </div>
                            )}
                        </div>

                        {/* Info Note */}
                        <div className="mt-8 flex gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <Info size={20} className="text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                Issuing an item will change its status to <span className="font-bold">ISSUED</span>.
                                The teacher will be responsible for returning this item upon departure or at the end of the term.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueItemModal;
