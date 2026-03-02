import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../../../services/api';
import { toInputDate } from '../../utils/dateHelpers';
import { useNotifications } from '../../hooks/useNotifications';

const StockRequisitions = () => {
    const [requisitions, setRequisitions] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [department, setDepartment] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [requiredDate, setRequiredDate] = useState('');
    const [notes, setNotes] = useState('');
    const [reqItems, setReqItems] = useState([{ itemId: '', quantity: 1 }]);

    const { showSuccess, showError } = useNotifications();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reqRes, itemRes] = await Promise.all([
                api.inventory.getRequisitions(),
                api.inventory.getItems()
            ]);

            if (reqRes.success) setRequisitions(reqRes.data);
            if (itemRes.success) setItems(itemRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load requisitions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddItem = () => {
        setReqItems([...reqItems, { itemId: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index) => {
        setReqItems(reqItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...reqItems];
        newItems[index][field] = value;
        setReqItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (reqItems.some(i => !i.itemId || i.quantity <= 0)) {
            showError('Please complete all item lines with valid quantities');
            return;
        }

        try {
            const response = await api.inventory.createRequisition({
                department,
                priority,
                requiredDate: requiredDate ? new Date(requiredDate).toISOString() : undefined,
                notes,
                items: reqItems.map(i => ({ itemId: i.itemId, quantity: Number(i.quantity) }))
            });

            if (response.success) {
                showSuccess('Requisition submitted successfully');
                setShowForm(false);
                setDepartment('');
                setNotes('');
                setReqItems([{ itemId: '', quantity: 1 }]);
                fetchData();
            } else {
                showError(response.message || 'Failed to submit requisition');
            }
        } catch (error) {
            console.error('Error submitting:', error);
            showError('Failed to submit requisition');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const response = await api.inventory.updateRequisitionStatus(id, status);
            if (response.success) {
                showSuccess(`Requisition ${status.toLowerCase()} successfully`);
                fetchData();
            } else {
                showError(response.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Failed to update status');
        }
    };

    const filteredReqs = requisitions.filter(r => {
        const matchesSearch =
            r.requisitionNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING': return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-semibold"><Clock size={12} /> Pending</span>;
            case 'APPROVED': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold"><CheckCircle size={12} /> Approved</span>;
            case 'REJECTED': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold"><XCircle size={12} /> Rejected</span>;
            case 'FULFILLED': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-semibold"><CheckCircle size={12} /> Fulfilled</span>;
            default: return <span className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
        }
    };

    if (showForm) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">New Requisition</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Department/Class</label>
                            <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white">
                                <option value="LOW">Low</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Required By</label>
                            <input type="date" value={toInputDate(requiredDate)} onChange={e => setRequiredDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Requested Items</label>
                            <button type="button" onClick={handleAddItem} className="text-brand-purple text-sm font-medium hover:underline flex items-center gap-1">
                                <Plus size={16} /> Add Item
                            </button>
                        </div>
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {reqItems.map((item, index) => (
                                <div key={index} className="flex gap-3 items-start">
                                    <div className="flex-1">
                                        <select value={item.itemId} onChange={e => handleItemChange(index, 'itemId', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white" required>
                                            <option value="">Select an Item...</option>
                                            {items.map(i => (
                                                <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required placeholder="Qty" />
                                    </div>
                                    {reqItems.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-0.5">
                                            <XCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Justification</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple"></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 font-bold shadow-sm">
                            Submit Requisition
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
                            <ClipboardCheck className="text-brand-purple" />
                            Stock Requisitions
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage internal requests for supplies and assets.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition shadow-sm font-bold text-sm"
                    >
                        <Plus size={18} />
                        New Request
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Req No or Department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                        />
                    </div>
                    <div className="w-full md:w-48 relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent appearance-none bg-white"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="FULFILLED">Fulfilled</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                                <th className="p-4 font-semibold whitespace-nowrap">Req No.</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Requested By</th>
                                <th className="p-4 font-semibold">Department</th>
                                <th className="p-4 font-semibold">Items</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">Loading requisitions...</td>
                                </tr>
                            ) : filteredReqs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        No requisitions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReqs.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                        <td className="p-4 font-mono text-xs text-brand-purple font-semibold">{req.requisitionNo}</td>
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">
                                            {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {req.department || '-'}
                                        </td>
                                        <td className="p-4 text-gray-600 text-xs">
                                            {req.items?.length || 0} items
                                            <div className="text-gray-400 mt-0.5 truncate max-w-[150px]" title={req.items?.map(i => `${i.quantity}x ${i.item?.name}`).join(', ')}>
                                                {req.items?.map(i => i.item?.name).join(', ')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            {req.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateStatus(req.id, 'APPROVED')} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded" title="Approve">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(req.id, 'REJECTED')} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded" title="Reject">
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            {req.status === 'APPROVED' && (
                                                <button onClick={() => handleUpdateStatus(req.id, 'FULFILLED')} className="text-xs font-bold text-blue-600 hover:underline">
                                                    Mark Fulfilled
                                                </button>
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

export default StockRequisitions;
