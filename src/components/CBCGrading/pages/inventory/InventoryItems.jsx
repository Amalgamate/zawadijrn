import React, { useState, useEffect } from 'react';
import {
    Package, Plus, Search, Filter,
    MoreVertical, Download, AlertTriangle,
    ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import api from '../../../../services/api';

const InventoryItems = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await api.inventory.getItems();
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Items</h1>
                    <p className="text-gray-500 text-sm">Manage stock items, consumables and assets</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus size={20} />
                        <span>Add Item</span>
                    </button>
                    <button className="flex items-center gap-2 border border-blue-200 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <Download size={20} />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {[
                    { label: 'Total Items', value: items.length, icon: Package, color: 'blue' },
                    { label: 'Low Stock', value: '4', icon: AlertTriangle, color: 'amber' },
                    { label: 'Total Value', value: 'Ksh 120,400', icon: ArrowUpRight, color: 'green' },
                    { label: 'Borrowed', value: '12', icon: ArrowDownLeft, color: 'purple' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, SKU or barcode..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <select className="px-4 py-2 border border-gray-200 rounded-lg outline-none bg-white text-gray-600 text-sm">
                        <option>All Categories</option>
                        <option>Stationery</option>
                        <option>Laboratory</option>
                        <option>Electronics</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 text-sm">
                        <Filter size={18} />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Item Name</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Stock Level</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={7} className="px-6 py-4 h-16 bg-gray-50/50"></td>
                                </tr>
                            ))
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No inventory items found. Add your first item to get started.</p>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.unitOfMeasure}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.sku || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.category?.name || 'Uncategorized'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.type === 'ASSET' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-semibold text-gray-800">45</div>
                                        <div className="text-xs text-red-500">Reorder at {item.reorderLevel}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-sm text-green-600">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            In Stock
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryItems;
