import React, { useState, useEffect } from 'react';
import { Home, Plus, MapPin, Eye, Building2, Box } from 'lucide-react';
import api from '../../../../services/api';

const InventoryStores = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const data = await api.inventory.getStores();
            setStores(data || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Stores</h1>
                    <p className="text-gray-500 text-sm">Manage physical storage locations and warehouses</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
                    <Plus size={20} />
                    <span>Add Warehouse/Store</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse border border-gray-100 items-center justify-center flex">
                            <Building2 className="text-gray-200" size={48} />
                        </div>
                    ))
                ) : stores.length === 0 ? (
                    <div className="md:col-span-2 lg:col-span-3 bg-white p-16 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                        <Building2 size={64} className="mx-auto mb-4 text-gray-200" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Stores Found</h2>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">Storage locations like Main Store, Library, or Science Labs haven't been configured yet.</p>
                        <button className="text-blue-600 font-medium hover:underline flex items-center gap-2 mx-auto">
                            <Plus size={18} />
                            Set up your first store
                        </button>
                    </div>
                ) : (
                    stores.map((store) => (
                        <div key={store.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Home size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {store.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{store.name}</h3>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                <MapPin size={14} />
                                <span>{store.location || 'Central Campus'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Stock Items</p>
                                    <div className="flex items-center gap-2">
                                        <Box size={14} className="text-blue-500" />
                                        <span className="font-bold text-gray-800">124</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Asset Value</p>
                                    <p className="font-bold text-gray-800 text-sm">₹ 2.4M</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                    <Eye size={16} />
                                    View Stock
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InventoryStores;
