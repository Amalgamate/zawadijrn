import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, MoreVertical, ChevronRight, Folder } from 'lucide-react';
import api from '../../../../services/api';

const InventoryCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await api.inventory.getCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Item Categories</h1>
                    <p className="text-gray-500 text-sm">Organize your inventory into hierarchical groups</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                    <span>New Category</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-600">All Categories</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Quick search..."
                                    className="pl-8 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm outline-none w-48 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-8 text-center animate-pulse text-gray-400">Loading categories...</div>
                            ) : categories.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Folder size={40} className="mx-auto mb-3 opacity-20" />
                                    <p>No categories defined yet.</p>
                                </div>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Folder size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-800">{cat.name}</h3>
                                                <p className="text-xs text-gray-500">{cat.description || 'No description'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600">
                                                {cat.items?.length || 0} Items
                                            </span>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
                        <Layers className="mb-4 opacity-80" size={32} />
                        <h2 className="text-lg font-bold mb-2">Category Management</h2>
                        <p className="text-blue-100 text-sm mb-4">
                            Categories help you group items for easier searching and reporting. You can even create sub-categories for laboratory equipment, sports gear, or office stationery.
                        </p>
                        <div className="bg-white/10 rounded-lg p-3 text-xs border border-white/20">
                            <p className="font-semibold text-white mb-1">PRO TIP:</p>
                            Use unique categories for assets to track depreciation and assignments separately from consumables.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryCategories;
