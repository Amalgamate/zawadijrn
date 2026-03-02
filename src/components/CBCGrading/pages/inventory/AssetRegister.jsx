import React, { useState, useEffect } from 'react';
import {
    Shield, Plus, Search, Filter,
    MapPin, User, Bookmark,
    Settings, History, AlertTriangle
} from 'lucide-react';
import api from '../../../../services/api';

const AssetRegister = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await api.inventory.getAssetRegister();
            setAssets(data || []);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getConditionColor = (condition) => {
        switch (condition) {
            case 'NEW': return 'text-green-600 bg-green-50';
            case 'GOOD': return 'text-blue-600 bg-blue-50';
            case 'FAIR': return 'text-amber-600 bg-amber-50';
            case 'POOR': return 'text-orange-600 bg-orange-50';
            case 'BROKEN': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fixed Asset Register</h1>
                    <p className="text-gray-500 text-sm">Tracking long-term school assets and equipment</p>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                    <Plus size={20} />
                    <span>Register New Asset</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Asset ID, Serial No or Name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-700"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="p-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 hover:bg-white transition-all">
                        <Filter size={20} />
                    </button>
                    <button className="p-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 hover:bg-white transition-all">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>)
                ) : assets.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-bold text-gray-700">Empty Asset Register</h3>
                        <p className="text-gray-500">Log your school assets to track location, custody and maintenance.</p>
                    </div>
                ) : (
                    assets.map(asset => (
                        <div key={asset.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:border-indigo-200 transition-all">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{asset.assetCode}</span>
                                        <h3 className="text-lg font-bold text-gray-800 uppercase">{asset.name}</h3>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${getConditionColor(asset.condition)}`}>
                                        {asset.condition}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span>{asset.location || 'Not Specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <User size={16} className="text-gray-400" />
                                        <span>{asset.assignments?.[0]?.assignedTo?.firstName || 'Free / In Storage'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Bookmark size={16} className="text-gray-400" />
                                        <span>{asset.serialNumber || 'SN Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                                <button className="flex-1 bg-white border border-gray-200 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                    <History size={16} />
                                    History
                                </button>
                                <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                    Assign
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AssetRegister;
