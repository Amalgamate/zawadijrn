import React, { useState, useEffect } from 'react';
import { Home, Plus, MapPin, Eye, Building2, Box, X } from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const InventoryStores = () => {
    const { showSuccess, showError } = useNotifications();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: ''
    });

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const data = await api.inventory.getStores();
            setStores(data?.success ? data.data : (data || []));
        } catch (error) {
            console.error('Error fetching stores:', error);
            showError('Failed to load stores');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStore = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const response = await api.inventory.createStore(formData);
            if (response.success || response.id) {
                showSuccess('Store created successfully!');
                setShowModal(false);
                setFormData({ name: '', code: '', location: '' });
                fetchStores();
            } else {
                showError(response.message || 'Failed to create store');
            }
        } catch (error) {
            console.error('Error creating store:', error);
            showError(error.message || 'Failed to create store');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-medium text-gray-800">Inventory Stores</h1>
                    <p className="text-gray-500 text-sm">Manage physical storage locations and warehouses</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                >
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
                    <div className="md:col-span-2 lg:col-span-3 bg-white p-20 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                        <Building2 size={64} className="mx-auto mb-6 text-blue-600 opacity-20" />
                        <h2 className="text-xl font-medium text-gray-700 mb-2">No Stores Found</h2>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Storage locations like Main Store, Library, or Science Labs haven't been configured yet.</p>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-blue-50 text-blue-600 font-medium px-6 py-3 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2 mx-auto"
                        >
                            <Plus size={20} />
                            Set up your first store
                        </button>
                    </div>
                ) : (
                    stores.map((store) => (
                        <div key={store.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col">
                            <div className="flex justify-between items-start mb-5">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <Home size={24} />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {store.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {store.code && (
                                        <span className="text-[10px] font-mono text-gray-400 font-medium uppercase">{store.code}</span>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-gray-800 mb-1 group-hover:text-blue-600 transition-colors uppercase">{store.name}</h3>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                                <MapPin size={16} className="text-red-400" />
                                <span className="font-medium">{store.location || 'Central Campus'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-auto">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Items</p>
                                    <div className="flex items-center gap-2">
                                        <Box size={16} className="text-blue-500" />
                                        <span className="font-medium text-gray-800 text-lg">0</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                    <p className="font-medium text-green-600 text-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Ready
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button className="flex-1 bg-white border-2 border-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    <Eye size={18} />
                                    Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Store Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-8 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-medium text-gray-800">New Store</h2>
                                    <p className="text-sm text-gray-500">Configure a storage or distribution point</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2.5 hover:bg-gray-50 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveStore} className="p-8">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            Store Name
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            required 
                                            value={formData.name} 
                                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                            type="text" 
                                            className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 font-medium" 
                                            placeholder="e.g. Main Science Lab" 
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-sm font-medium text-gray-700">Store Code</label>
                                        <input 
                                            value={formData.code} 
                                            onChange={e => setFormData({ ...formData, code: e.target.value })} 
                                            type="text" 
                                            className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 font-medium" 
                                            placeholder="e.g. MSL-01" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Location / Landmark</label>
                                    <input 
                                        value={formData.location} 
                                        onChange={e => setFormData({ ...formData, location: e.target.value })} 
                                        type="text" 
                                        className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-700 font-medium" 
                                        placeholder="e.g. Block B, 2nd Floor" 
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
                                    {submitting ? 'Adding...' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryStores;
