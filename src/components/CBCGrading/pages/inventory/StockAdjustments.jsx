import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Search, RefreshCw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const StockAdjustments = () => {
    const [adjustments, setAdjustments] = useState([]);
    const [items, setItems] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [itemId, setItemId] = useState('');
    const [storeId, setStoreId] = useState('');
    const [adjustmentType, setAdjustmentType] = useState('INCREASE'); // INCREASE or DECREASE
    const [quantity, setQuantity] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');

    const { showSuccess, showError } = useNotifications();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [movRes, itemRes, storeRes] = await Promise.all([
                api.inventory.getMovements(),
                api.inventory.getItems(),
                api.inventory.getStores()
            ]);

            if (movRes.success) {
                setAdjustments(movRes.data.filter(m => m.type === 'ADJUSTMENT'));
            }
            if (itemRes.success) setItems(itemRes.data);
            if (storeRes.success) setStores(storeRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load adjustments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!itemId || !storeId || !quantity) {
            showError('Please fill in all required fields');
            return;
        }
        if (Number(quantity) <= 0) {
            showError('Quantity must be greater than zero');
            return;
        }

        const actualQuantity = adjustmentType === 'INCREASE' ? Number(quantity) : -Number(quantity);

        try {
            const response = await api.inventory.recordMovement({
                itemId,
                fromStoreId: storeId, // We record where it happened
                quantity: actualQuantity,
                type: 'ADJUSTMENT',
                reference,
                description: notes
            });

            if (response.success) {
                showSuccess('Stock adjusted successfully');
                setShowForm(false);
                // Reset form
                setItemId('');
                setStoreId('');
                setQuantity('');
                setAdjustmentType('INCREASE');
                setReference('');
                setNotes('');
                fetchData();
            } else {
                showError(response.message || 'Failed to adjust stock');
            }
        } catch (error) {
            console.error('Error submitting:', error);
            showError('Failed to adjust stock');
        }
    };

    const filteredAdjustments = adjustments.filter(a =>
        a.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showForm) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2">
                        <Sliders className="text-brand-purple" />
                        New Stock Adjustment
                    </h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Item <span className="text-red-500">*</span></label>
                            <select value={itemId} onChange={e => setItemId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white" required>
                                <option value="">Choose an item...</option>
                                {items.map(i => (
                                    <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Store <span className="text-red-500">*</span></label>
                            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white" required>
                                <option value="">Choose a store...</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Adjustment Type</label>
                            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('INCREASE')}
                                    className={`flex-1 py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 ${adjustmentType === 'INCREASE' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <TrendingUp size={16} /> Add Stock (+)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('DECREASE')}
                                    className={`flex-1 py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 ${adjustmentType === 'DECREASE' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <TrendingDown size={16} /> Remove Stock (-)
                                </button>
                            </div>
                        </div>
                        <div className="w-full md:w-32">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                            <input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Reference No. (Optional)</label>
                        <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" placeholder="e.g. AUDIT-2023-11" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Reason / Notes <span className="text-red-500">*</span></label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" required placeholder="Reason for adjustment (e.g. damaged goods, audit count mismatch)"></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className={`px-6 py-2 text-white rounded-lg font-medium shadow-sm transition ${adjustmentType === 'INCREASE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            Record Adjustment
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2">
                            <Sliders className="text-brand-purple" />
                            Stock Adjustments
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manual corrections to inventory levels (e.g. for audits, breakages, lost items).
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            className="p-2 text-gray-500 hover:text-brand-purple hover:bg-purple-50 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition shadow-sm font-medium text-sm"
                        >
                            <Plus size={18} />
                            New Adjustment
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search adjustments by item name or reference..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                                <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                                <th className="p-4 font-semibold">Item</th>
                                <th className="p-4 font-semibold">Store</th>
                                <th className="p-4 font-semibold text-center">Adjustment Qty</th>
                                <th className="p-4 font-semibold">Reason</th>
                                <th className="p-4 font-semibold">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading adjustments...</td>
                                </tr>
                            ) : filteredAdjustments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No adjustments found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAdjustments.map((adj) => {
                                    const qty = Number(adj.quantity);
                                    const isPositive = qty > 0;
                                    return (
                                        <tr key={adj.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                            <td className="p-4 text-gray-600 whitespace-nowrap">
                                                {new Date(adj.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">
                                                {adj.item?.name || 'Unknown Item'}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {adj.fromStore?.name || 'Unknown Store'}
                                            </td>
                                            <td className="p-4 text-center text-base font-medium">
                                                {isPositive ? (
                                                    <span className="text-green-600 flex items-center justify-center gap-1">
                                                        <TrendingUp size={16} /> +{qty}
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 flex items-center justify-center gap-1">
                                                        <TrendingDown size={16} /> {qty}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                <div className="truncate max-w-[200px]" title={adj.description}>
                                                    {adj.description || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-500 font-mono text-xs">
                                                {adj.reference || '-'}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustments;
