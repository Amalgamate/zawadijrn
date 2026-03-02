import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, ArrowRight, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';

const StockMovements = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const { showError } = useNotifications();

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const response = await api.inventory.getMovements();
            if (response.success) {
                setMovements(response.data);
            } else {
                showError('Failed to fetch stock movements');
            }
        } catch (error) {
            console.error('Error fetching movements:', error);
            showError('Failed to load stock movements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, []);

    const filteredMovements = movements.filter(m => {
        const matchesSearch =
            m.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.reference?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getMovementIcon = (type) => {
        switch (type) {
            case 'IN': return <ArrowRight className="text-green-500" size={18} />;
            case 'OUT': return <ArrowLeft className="text-red-500" size={18} />;
            case 'TRANSFER': return <RefreshCw className="text-blue-500" size={18} />;
            case 'ADJUSTMENT': return <AlertCircle className="text-purple-500" size={18} />;
            default: return <Activity className="text-gray-500" size={18} />;
        }
    };

    const getMovementBadge = (type) => {
        const styles = {
            IN: 'bg-green-100 text-green-800 border-green-200',
            OUT: 'bg-red-100 text-red-800 border-red-200',
            TRANSFER: 'bg-blue-100 text-blue-800 border-blue-200',
            ADJUSTMENT: 'bg-purple-100 text-purple-800 border-purple-200',
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
                {type}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="text-brand-purple" />
                            Stock Movements Ledger
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Historical log of all inventory IN, OUT, TRANSFER, and ADJUSTMENT events.
                        </p>
                    </div>
                    <button
                        onClick={fetchMovements}
                        className="p-2 text-gray-500 hover:text-brand-purple hover:bg-purple-50 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by item name or reference..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                        />
                    </div>
                    <div className="w-full md:w-48 relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent appearance-none bg-white"
                        >
                            <option value="ALL">All Movements</option>
                            <option value="IN">Stock In</option>
                            <option value="OUT">Stock Out</option>
                            <option value="TRANSFER">Transfer</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                                <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Item</th>
                                <th className="p-4 font-semibold">Qty</th>
                                <th className="p-4 font-semibold">Details / Stores</th>
                                <th className="p-4 font-semibold">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading movements...</td>
                                </tr>
                            ) : filteredMovements.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No movements found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredMovements.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(movement.date || movement.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getMovementIcon(movement.type)}
                                                {getMovementBadge(movement.type)}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-gray-800 truncate max-w-[200px]" title={movement.item?.name}>
                                            {movement.item?.name || 'Unknown Item'}
                                        </td>
                                        <td className="p-4 font-bold text-gray-700">
                                            {Number(movement.quantity)}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {movement.type === 'TRANSFER' ? (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="text-gray-500 truncate max-w-[100px]">{movement.fromStore?.name || 'External'}</span>
                                                    <ArrowRight size={12} className="text-gray-400 shrink-0" />
                                                    <span className="font-medium truncate max-w-[100px]">{movement.toStore?.name || 'External'}</span>
                                                </div>
                                            ) : movement.type === 'IN' ? (
                                                <span className="text-xs">To: {movement.toStore?.name || 'Direct'}</span>
                                            ) : movement.type === 'OUT' ? (
                                                <span className="text-xs">From: {movement.fromStore?.name || 'Store'}</span>
                                            ) : (
                                                <span className="text-xs text-gray-500 truncate max-w-[200px] block" title={movement.description}>{movement.description || '-'}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-500 font-mono text-xs">
                                            {movement.reference || '-'}
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

export default StockMovements;
