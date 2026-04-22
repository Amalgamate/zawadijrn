import React, { useState, useEffect } from 'react';
import {
    Shield, Plus, Search, Filter,
    MapPin, User, Bookmark,
    Settings, History, AlertTriangle, X,
    Calendar, DollarSign, Tag, Info
} from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const AssetRegister = () => {
    const { showSuccess, showError } = useNotifications();
    const [assets, setAssets] = useState([]);
    const [items, setItems] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        assetCode: '',
        itemId: '',
        serialNumber: '',
        purchaseDate: '',
        purchaseCost: '',
        condition: 'NEW',
        location: '',
        currentStoreId: '',
        description: '',
        model: '',
        manufacturer: '',
        warrantyExpiry: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [assetsRes, itemsRes, storesRes] = await Promise.all([
                api.inventory.getAssetRegister(),
                api.inventory.getItems(),
                api.inventory.getStores()
            ]);

            setAssets(assetsRes?.success ? assetsRes.data : (assetsRes || []));
            setItems(itemsRes?.success ? itemsRes.data : (itemsRes || []));
            setStores(storesRes?.success ? storesRes.data : (storesRes || []));
        } catch (error) {
            console.error('Error fetching asset data:', error);
            showError('Failed to load asset data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        try {
            const data = await api.inventory.getAssetRegister();
            setAssets(data?.success ? data.data : (data || []));
        } catch (error) {
            console.error('Error refreshing assets:', error);
        }
    };

    const handleRegisterAsset = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const dataToSubmit = {
                ...formData,
                purchaseCost: formData.purchaseCost ? Number(formData.purchaseCost) : undefined,
                purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined,
                itemId: formData.itemId || undefined,
                currentStoreId: formData.currentStoreId || undefined
            };

            const response = await api.inventory.registerAsset(dataToSubmit);
            if (response.success || response.id) {
                showSuccess('Asset registered successfully!');
                setShowModal(false);
                resetForm();
                fetchAssets();
            } else {
                showError(response.message || 'Failed to register asset');
            }
        } catch (error) {
            console.error('Error registering asset:', error);
            showError(error.message || 'Failed to register asset');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            assetCode: '',
            itemId: '',
            serialNumber: '',
            purchaseDate: '',
            purchaseCost: '',
            condition: 'NEW',
            location: '',
            currentStoreId: '',
            description: '',
            model: '',
            manufacturer: '',
            warrantyExpiry: ''
        });
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
                    <h1 className="text-2xl font-medium text-gray-800">Fixed Asset Register</h1>
                    <p className="text-gray-500 text-sm">Tracking long-term school assets and equipment</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
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
                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse border border-gray-100"></div>)
                ) : assets.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Shield size={48} className="mx-auto mb-4 text-indigo-200" />
                        <h3 className="text-lg font-medium text-gray-700">Empty Asset Register</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Log your school assets to track location, custody and maintenance over time.</p>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="mt-6 text-indigo-600 font-medium hover:underline"
                        >
                            Register your first asset
                        </button>
                    </div>
                ) : (
                    assets.map(asset => (
                        <div key={asset.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:border-indigo-200 transition-all group">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-widest">{asset.assetCode}</span>
                                        <h3 className="text-lg font-medium text-gray-800 uppercase group-hover:text-indigo-600 transition-colors">{asset.name}</h3>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-medium ${getConditionColor(asset.condition)}`}>
                                        {asset.condition}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <MapPin size={16} className="text-red-400" />
                                        <span>{asset.location || asset.currentStore?.name || 'Not Specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <User size={16} className="text-indigo-400" />
                                        <span>{asset.assignments?.[0]?.assignedTo?.firstName || 'Free / In Storage'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium font-mono">
                                        <Bookmark size={16} className="text-amber-400" />
                                        <span>{asset.serialNumber || 'SN Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-2">
                                <button className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                    <History size={16} />
                                    History
                                </button>
                                <button className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                    Assign
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Asset Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-8 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-medium text-gray-800">Register Fixed Asset</h2>
                                    <p className="text-sm text-gray-500">Track a new long-term high-value asset</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2.5 hover:bg-gray-50 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRegisterAsset} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Tag size={14} />
                                        Asset Name *
                                    </label>
                                    <input 
                                        required 
                                        value={formData.name} 
                                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                        type="text" 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700" 
                                        placeholder="e.g. Dell Latitude 5420 Laptop" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Bookmark size={14} />
                                        Asset Code / ID *
                                    </label>
                                    <input 
                                        required 
                                        value={formData.assetCode} 
                                        onChange={e => setFormData({ ...formData, assetCode: e.target.value })} 
                                        type="text" 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700" 
                                        placeholder="e.g. ASSET-2024-001" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Info size={14} />
                                        Serial Number
                                    </label>
                                    <input 
                                        value={formData.serialNumber} 
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} 
                                        type="text" 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700" 
                                        placeholder="e.g. S/N: 9XH2K3" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Settings size={14} />
                                        Item Reference (Optional)
                                    </label>
                                    <select 
                                        value={formData.itemId} 
                                        onChange={e => setFormData({ ...formData, itemId: e.target.value })} 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700 bg-white"
                                    >
                                        <option value="">Link to Inventory Item</option>
                                        {items.filter(i => i.type === 'ASSET').map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <MapPin size={14} />
                                        Initial Store
                                    </label>
                                    <select 
                                        value={formData.currentStoreId} 
                                        onChange={e => setFormData({ ...formData, currentStoreId: e.target.value })} 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700 bg-white"
                                    >
                                        <option value="">Select Location</option>
                                        {stores.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Calendar size={14} />
                                        Purchase Date
                                    </label>
                                    <input 
                                        value={formData.purchaseDate} 
                                        onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} 
                                        type="date" 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <DollarSign size={14} />
                                        Purchase Cost
                                    </label>
                                    <input 
                                        value={formData.purchaseCost} 
                                        onChange={e => setFormData({ ...formData, purchaseCost: e.target.value })} 
                                        type="number" 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700" 
                                        placeholder="Cost in local currency" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Shield size={14} />
                                        Condition
                                    </label>
                                    <select 
                                        value={formData.condition} 
                                        onChange={e => setFormData({ ...formData, condition: e.target.value })} 
                                        className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700 bg-white"
                                    >
                                        <option value="NEW">Brand New</option>
                                        <option value="GOOD">Good / Functional</option>
                                        <option value="FAIR">Fair / Used</option>
                                        <option value="POOR">Poor / Damaged</option>
                                        <option value="BROKEN">Broken / Non-functional</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? 'Registering...' : 'Complete Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetRegister;
