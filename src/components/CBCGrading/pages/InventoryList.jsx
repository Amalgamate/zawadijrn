import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Package, Edit, Trash2,
    Filter, RefreshCw, BookOpen, Laptop,
    History, User, Check, X, AlertCircle, Info, MoreVertical,
    LayoutGrid, List, ChevronRight, ArrowRight, Book, ShieldCheck,
    Calendar, Tag, Hash, UserCheck, ChevronDown
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useNotifications } from '../hooks/useNotifications';
import StatusBadge from '../shared/StatusBadge';
import EmptyState from '../shared/EmptyState';

const InventoryList = () => {
    const { items, loading, fetchItems, createItem, updateItem, deleteItem } = useInventory();
    const { showSuccess, showError } = useNotifications();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        category: 'Textbook',
        status: 'AVAILABLE'
    });

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setFormData({
            title: '',
            author: '',
            isbn: '',
            category: 'Textbook',
            status: 'AVAILABLE'
        });
        setShowAddModal(true);
    };

    const handleOpenEdit = (item, e) => {
        if (e) e.stopPropagation();
        setEditingItem(item);
        setFormData({
            title: item.title,
            author: item.author || '',
            isbn: item.isbn || '',
            category: item.category || 'Textbook',
            status: item.status || 'AVAILABLE'
        });
        setShowAddModal(true);
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let res;
            if (editingItem) {
                res = await updateItem(editingItem.id, formData);
            } else {
                res = await createItem(formData);
            }

            if (res.success) {
                showSuccess(editingItem ? 'Item updated successfully' : 'Item added to inventory');
                setShowAddModal(false);
                // If the selected item was updated, update it in the detail view too
                if (selectedItem?.id === editingItem?.id) {
                    setSelectedItem(res.data);
                }
            } else {
                showError(res.message || 'Failed to save item');
            }
        } catch (err) {
            showError('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this item from inventory?')) return;
        try {
            const res = await deleteItem(id);
            if (res.success) {
                showSuccess('Item deleted successfully');
                if (selectedItem?.id === id) setSelectedItem(null);
            } else {
                showError(res.message || 'Failed to delete item');
            }
        } catch (err) {
            showError('An error occurred');
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch =
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.isbn?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, filterCategory]);

    const categories = ['Textbook', 'Teacher Guide', 'Reference', 'Equipment', 'Other'];

    const getIcon = (category, size = 20) => {
        switch (category) {
            case 'Equipment': return <Laptop size={size} />;
            default: return <BookOpen size={size} />;
        }
    };

    return (
        <div className="relative h-[calc(100vh-120px)] overflow-hidden flex flex-col space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory Hub</h1>
                    <p className="text-gray-500 font-medium">Manage and track school resources with precision.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand-teal shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-2xl hover:bg-brand-teal/90 transition shadow-lg shadow-brand-teal/20 font-bold"
                    >
                        <Plus size={20} />
                        Add New
                    </button>
                </div>
            </div>

            {/* toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 flex-shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by title, author, or ISBN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none font-bold text-gray-600 transition-all appearance-none min-w-[180px]"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                        onClick={() => fetchItems()}
                        className="p-3 bg-gray-50 text-gray-600 rounded-2xl border border-gray-200 hover:bg-gray-100 transition shadow-sm"
                        title="Refresh Inventory"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Content Area with Flex Layout */}
            <div className="flex-1 overflow-auto flex gap-6 min-h-0 relative">
                <div className={`flex-1 overflow-auto transition-all duration-300 ${selectedItem ? 'pr-0 xl:pr-4' : ''}`}>
                    {loading && items.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 p-20 flex flex-col items-center justify-center space-y-4 shadow-sm h-full">
                            <div className="w-16 h-16 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-bold animate-pulse text-lg">Inventory Scanning...</p>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-2">
                                {filteredItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={`group bg-white rounded-3xl border-2 transition-all duration-300 relative overflow-hidden cursor-pointer ${selectedItem?.id === item.id ? 'border-brand-teal shadow-xl shadow-brand-teal/10 scale-[1.02]' : 'border-gray-100 border-transparent hover:border-brand-teal/40 hover:shadow-xl hover:shadow-gray-200/50 hover:scale-[1.01]'
                                            }`}
                                    >
                                        <div className="p-6">
                                            {/* Decoration */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>

                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${item.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-teal/5 text-brand-teal'
                                                    }`}>
                                                    {getIcon(item.category)}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => handleOpenEdit(item, e)}
                                                        className="p-2 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-xl transition"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-gray-900 line-clamp-2 leading-snug group-hover:text-brand-teal transition-colors uppercase tracking-tight">{item.title}</h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                <StatusBadge status={item.status} />
                                                <div className="flex items-center gap-1 text-brand-teal font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View Details <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifier</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredItems.map(item => (
                                            <tr
                                                key={item.id}
                                                onClick={() => handleItemClick(item)}
                                                className={`group hover:bg-brand-teal/[0.02] cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-brand-teal/[0.04]' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-teal/5 text-brand-teal'}`}>
                                                            {getIcon(item.category, 16)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 truncate uppercase tracking-tight">{item.title}</p>
                                                            <p className="text-xs text-gray-400 font-medium truncate">{item.author || 'No Author Info'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.category}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="text-xs font-mono font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{item.isbn || 'N/A'}</code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={item.status} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => handleOpenEdit(item, e)}
                                                            className="p-2 text-gray-400 hover:text-brand-teal hover:bg-white rounded-lg transition border border-transparent hover:border-brand-teal/20"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(item.id, e)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition border border-transparent hover:border-red-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        <EmptyState
                            title="No Items Found"
                            message={searchTerm ? `No results for "${searchTerm}"` : "You haven't added any items to your inventory yet."}
                            actionText="Add My First Item"
                            onAction={handleOpenAdd}
                        />
                    )}
                </div>

                {/* Right Side Detail Panel - Only shown when an item is selected */}
                <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-[60] transition-transform duration-500 transform border-l border-gray-100 ${selectedItem ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedItem && (
                        <div className="h-full flex flex-col h-screen overflow-hidden">
                            {/* Panel Header */}
                            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-teal text-white flex items-center justify-center shadow-lg shadow-brand-teal/20">
                                        {getIcon(selectedItem.category, 24)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 leading-none">Resource Detail</h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {selectedItem.id.substring(0, 8)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition border border-transparent hover:border-gray-200"
                                >
                                    <ArrowRight size={24} />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Title Section */}
                                <div className="space-y-4">
                                    <StatusBadge status={selectedItem.status} />
                                    <h1 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{selectedItem.title}</h1>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Tag size={16} className="text-brand-teal" />
                                            <span className="text-xs font-bold uppercase tracking-widest">{selectedItem.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Hash size={16} className="text-brand-teal" />
                                            <span className="text-xs font-mono font-bold tracking-tight">{selectedItem.isbn || 'No ID'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <Book size={18} className="text-brand-teal" />
                                            <span className="text-sm font-black uppercase tracking-widest text-[10px]">Publishing Info</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Author/Brand</span>
                                                <span className="text-sm font-black text-gray-700">{selectedItem.author || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Academic Year</span>
                                                <span className="text-sm font-black text-gray-700">2024</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assignment Status */}
                                    <div className={`p-5 rounded-2xl border ${selectedItem.status === 'ISSUED' ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'} space-y-4`}>
                                        <div className={`flex items-center gap-3 ${selectedItem.status === 'ISSUED' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                            <UserCheck size={18} />
                                            <span className="text-sm font-black uppercase tracking-widest text-[10px]">Availability Status</span>
                                        </div>
                                        {selectedItem.assignedTo ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 font-black border border-orange-200">
                                                        {selectedItem.assignedTo.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest leading-none">Currently with</p>
                                                        <p className="text-sm font-black text-orange-900 leading-none mt-1">{selectedItem.assignedTo.firstName} {selectedItem.assignedTo.lastName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-orange-700 font-bold bg-white/50 p-3 rounded-xl">
                                                    <Calendar size={14} /> Issued on: {new Date().toLocaleDateString()}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-emerald-900 leading-none">Ready to Issue</p>
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">No pending assignments</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Audit Log / History Preview */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <History size={18} className="text-brand-teal" />
                                            <span className="text-sm font-black uppercase tracking-widest text-[10px]">Resource Activity</span>
                                        </div>
                                        <button className="text-[10px] font-black text-brand-teal uppercase tracking-widest hover:underline transition">Full Audit</button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex gap-3 relative pl-6 before:absolute before:left-[5px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100">
                                            <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-4 ring-emerald-50"></div>
                                            <div>
                                                <p className="text-xs font-black text-gray-800 tracking-tight leading-none mb-1">Added to Inventory</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Today, 10:15 AM</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel Actions */}
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={(e) => handleOpenEdit(selectedItem, e)}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl hover:border-brand-teal/40 hover:text-brand-teal transition-all font-black uppercase tracking-widest text-xs"
                                >
                                    <Edit size={18} /> Edit Info
                                </button>
                                <button
                                    onClick={(e) => handleDelete(selectedItem.id, e)}
                                    className="p-4 text-red-400 hover:text-red-600 bg-white border border-gray-200 hover:border-red-100 rounded-2xl transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500/75 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAddModal(false)} />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block w-full max-w-lg overflow-hidden text-left align-bottom transition-all transform bg-white rounded-3xl shadow-2xl sm:my-8 sm:align-middle">
                            <form onSubmit={handleSubmit}>
                                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase tracking-tighter">{editingItem ? 'Edit Resource' : 'Register New Resource'}</h3>
                                        <p className="text-[10px] font-black text-[#0D9488] mt-1 uppercase tracking-[0.2em]">Inventory Protocol</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                                        disabled={isSubmitting}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="px-8 py-8 space-y-6">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand-teal transition-colors">Resource Title / Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Mathematics Grade 4 Pupil's Book"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal focus:bg-white outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 uppercase tracking-tight"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand-teal transition-colors">Classification</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal focus:bg-white outline-none transition-all font-black text-gray-600 appearance-none uppercase tracking-widest text-[11px]"
                                                >
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand-teal transition-colors">Condition Status</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal focus:bg-white outline-none transition-all font-black text-gray-600 appearance-none uppercase tracking-widest text-[11px]"
                                                    disabled={formData.status === 'ISSUED'}
                                                >
                                                    <option value="AVAILABLE">Available</option>
                                                    <option value="ISSUED" disabled>Issued (Managed via profile)</option>
                                                    <option value="LOST">Lost</option>
                                                    <option value="DAMAGED">Damaged</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand-teal transition-colors">Author / Provider</label>
                                            <input
                                                type="text"
                                                value={formData.author}
                                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                                placeholder="e.g. Longhorn Publishers"
                                                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal focus:bg-white outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-brand-teal transition-colors">Serial / ISBN</label>
                                            <input
                                                type="text"
                                                value={formData.isbn}
                                                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                                placeholder="e.g. 978-0-123456-78-9"
                                                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal focus:bg-white outline-none transition-all font-mono font-bold text-gray-700 placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {formData.status === 'ISSUED' && (
                                        <div className="flex gap-4 p-5 bg-blue-50 rounded-2xl border-2 border-blue-100/50">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                                <Info size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-800 uppercase tracking-[0.15em] mb-1">Ownership Locked</p>
                                                <p className="text-xs text-blue-600/80 leading-relaxed font-bold">
                                                    This item is currently issued. Please return it via the teacher's profile before modifying availability status.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition"
                                        disabled={isSubmitting}
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-8 py-4 bg-brand-teal text-white rounded-2xl hover:bg-brand-teal/90 transition shadow-xl shadow-brand-teal/30 font-black uppercase tracking-widest text-xs"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <RefreshCw size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                                        {editingItem ? 'Update Protocol' : 'Finalize Registration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryList;
