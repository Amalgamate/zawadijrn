import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, MoreVertical, ChevronRight, Folder, X } from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const InventoryCategories = () => {
    const { showSuccess, showError } = useNotifications();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await api.inventory.getCategories();
            setCategories(data?.success ? data.data : (data || []));
        } catch (error) {
            console.error('Error fetching categories:', error);
            showError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const response = await api.inventory.createCategory(formData);
            if (response.success || response.id) {
                showSuccess('Category created successfully!');
                setShowModal(false);
                setFormData({ name: '', description: '' });
                fetchCategories();
            } else {
                showError(response.message || 'Failed to create category');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            showError(error.message || 'Failed to create category');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-medium text-gray-800">Item Categories</h1>
                    <p className="text-gray-500 text-sm">Organize your inventory into hierarchical groups</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
                    <Plus size={20} />
                    <span>New Category</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-600">All Categories ({categories.length})</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Quick search..."
                                    className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-48 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center animate-pulse text-gray-400 font-medium">Loading categories...</div>
                            ) : categories.length === 0 ? (
                                <div className="p-20 text-center text-gray-500">
                                    <Folder size={64} className="mx-auto mb-4 opacity-10 text-blue-600" />
                                    <h3 className="text-lg font-medium text-gray-400">Empty Library</h3>
                                    <p className="max-w-[200px] mx-auto text-sm">Start by creating your first inventory category.</p>
                                </div>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat.id} className="p-5 hover:bg-gray-50/80 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <Folder size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-800 text-base">{cat.name}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-1">{cat.description || 'No description provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-600">
                                                {cat.items?.length || 0} Items
                                            </span>
                                            <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-200 flex flex-col relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <Layers className="mb-6 opacity-80" size={40} />
                        <h2 className="text-xl font-medium mb-3">Category Management</h2>
                        <p className="text-blue-100/90 text-sm leading-relaxed mb-6">
                            Categories help you group items for easier searching and reporting. You can even create sub-categories for laboratory equipment, sports gear, or office stationery.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-xs border border-white/20">
                            <p className="font-medium text-white mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                PRO TIP:
                            </p>
                            Use unique categories for assets to track depreciation and assignments separately from consumables.
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Category Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-8 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-medium text-gray-800">New Category</h2>
                                    <p className="text-sm text-gray-500">Add a high-level grouping for items</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2.5 hover:bg-gray-50 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        Category Name
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        required 
                                        value={formData.name} 
                                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                        type="text" 
                                        className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 font-medium" 
                                        placeholder="e.g. Science Equipment" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Description</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                        rows="4"
                                        className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 font-medium resize-none" 
                                        placeholder="Add more context about what belongs in this category..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-8 mt-4 border-t border-gray-50">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="px-8 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? 'Creating...' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryCategories;
