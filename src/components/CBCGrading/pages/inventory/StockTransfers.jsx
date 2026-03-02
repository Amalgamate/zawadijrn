import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ArrowRight, Plus, Search, RefreshCw, Box } from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const StockTransfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [items, setItems] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [itemId, setItemId] = useState('');
    const [fromStoreId, setFromStoreId] = useState('');
    const [toStoreId, setToStoreId] = useState('');
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
                // Filter only transfers
                setTransfers(movRes.data.filter(m => m.type === 'TRANSFER'));
            }
            if (itemRes.success) setItems(itemRes.data);
            if (storeRes.success) setStores(storeRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load transfers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!itemId || !fromStoreId || !toStoreId || !quantity) {
            showError('Please fill in all required fields');
            return;
        }
        if (fromStoreId === toStoreId) {
            showError('Source and Destination stores cannot be the same');
            return;
        }
        if (Number(quantity) <= 0) {
            showError('Quantity must be greater than zero');
            return;
        }

        try {
            const response = await api.inventory.recordMovement({
                itemId,
                fromStoreId,
                toStoreId,
                quantity: Number(quantity),
                type: 'TRANSFER',
                reference,
                description: notes
            });

            if (response.success) {
                showSuccess('Stock transferred successfully');
                setShowForm(false);
                // Reset form
                setItemId('');
                setFromStoreId('');
                setToStoreId('');
                setQuantity('');
                setReference('');
                setNotes('');
                fetchData();
            } else {
                showError(response.message || 'Failed to transfer stock');
            }
        } catch (error) {
            console.error('Error submitting:', error);
            showError('Failed to transfer stock');
        }
    };

    const filteredTransfers = transfers.filter(t =>
        t.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showForm) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ArrowLeftRight className="text-brand-purple" />
                        New Stock Transfer
                    </h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Select Item <span className="text-red-500">*</span></label>
                        <select value={itemId} onChange={e => setItemId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white" required>
                            <option value="">Choose an item...</option>
                            {items.map(i => (
                                <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">From Store <span className="text-red-500">*</span></label>
                            <select value={fromStoreId} onChange={e => setFromStoreId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white" required>
                                <option value="">Source Store...</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">To Store <span className="text-red-500">*</span></label>
                            <select value={toStoreId} onChange={e => setToStoreId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white" required>
                                <option value="">Destination Store...</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                            <input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Reference No. (Optional)</label>
                            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" placeholder="e.g. TR-2023-001" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Reason</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple"></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 font-bold shadow-sm">
                            Execute Transfer
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
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <ArrowLeftRight className="text-brand-purple" />
                            Store Transfers
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Move inventory items between different storage locations.
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
                            className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition shadow-sm font-bold text-sm"
                        >
                            <Plus size={18} />
                            New Transfer
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search transfers by item name or reference..."
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
                                <th className="p-4 font-semibold">Qty</th>
                                <th className="p-4 font-semibold">Route</th>
                                <th className="p-4 font-semibold">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">Loading transfers...</td>
                                </tr>
                            ) : filteredTransfers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No transfers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransfers.map((transfer) => (
                                    <tr key={transfer.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(transfer.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                                            <Box size={16} className="text-gray-400" />
                                            {transfer.item?.name || 'Unknown Item'}
                                        </td>
                                        <td className="p-4 font-bold text-gray-700">
                                            {Number(transfer.quantity)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">
                                                    {transfer.fromStore?.name || 'Unknown Store'}
                                                </span>
                                                <ArrowRight size={14} className="text-gray-400" />
                                                <span className="px-2 py-1 bg-brand-purple/10 text-brand-purple rounded font-medium">
                                                    {transfer.toStore?.name || 'Unknown Store'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 font-mono text-xs">
                                            {transfer.reference || '-'}
                                            {transfer.description && (
                                                <div className="text-gray-400 mt-1 truncate max-w-[200px]" title={transfer.description}>
                                                    {transfer.description}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockTransfers;
