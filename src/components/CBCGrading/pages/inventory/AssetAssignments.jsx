import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, RefreshCw, Box, UserCheck, Calendar, ArrowRight } from 'lucide-react';
import api from '../../../../services/api';
import { toInputDate } from '../../utils/dateHelpers';
import { useNotifications } from '../../hooks/useNotifications';

const AssetAssignments = () => {
    const [assets, setAssets] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [assetId, setAssetId] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [assignedToClassId, setAssignedToClassId] = useState('');
    const [expectedReturn, setExpectedReturn] = useState('');
    const [conditionOnAssigned, setConditionOnAssigned] = useState('GOOD');
    const [notes, setNotes] = useState('');

    const { showSuccess, showError } = useNotifications();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetRes, staffRes] = await Promise.all([
                api.inventory.getAssetRegister(),
                api.hr?.getStaffDirectory ? api.hr.getStaffDirectory() : Promise.resolve({ success: false })
            ]);

            if (assetRes.success) setAssets(assetRes.data);
            if (staffRes?.success) setStaff(staffRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Failed to load asset assignments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!assetId || (!assignedToId && !assignedToClassId)) {
            showError('Please select an asset and either a staff member or class to assign to.');
            return;
        }

        try {
            const response = await api.inventory.assignAsset({
                assetId,
                assignedToId: assignedToId || undefined,
                assignedToClassId: assignedToClassId || undefined,
                expectedReturn: expectedReturn ? new Date(expectedReturn).toISOString() : undefined,
                conditionOnAssigned,
                notes
            });

            if (response.success) {
                showSuccess('Asset assigned successfully');
                setShowForm(false);
                // Reset form
                setAssetId('');
                setAssignedToId('');
                setAssignedToClassId('');
                setExpectedReturn('');
                setConditionOnAssigned('GOOD');
                setNotes('');
                fetchData();
            } else {
                showError(response.message || 'Failed to assign asset');
            }
        } catch (error) {
            console.error('Error submitting:', error);
            showError('Failed to assign asset');
        }
    };

    const getConditionBadge = (condition) => {
        const colors = {
            NEW: 'bg-green-100 text-green-800',
            GOOD: 'bg-blue-100 text-blue-800',
            FAIR: 'bg-yellow-100 text-yellow-800',
            POOR: 'bg-orange-100 text-orange-800',
            BROKEN: 'bg-red-100 text-red-800'
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[condition] || 'bg-gray-100 text-gray-800'}`}>{condition}</span>;
    };

    // Extract all assets that are currently assigned
    const activeAssignments = assets.flatMap(asset =>
        (asset.assignments || [])
            .filter(a => !a.returnedAt) // Only active
            .map(a => ({ ...a, asset }))
    );

    const filteredAssignments = activeAssignments.filter(a =>
        a.asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.asset.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.assignedTo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.assignedTo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.assignedToClass?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showForm) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserCheck className="text-brand-purple" />
                        New Asset Assignment
                    </h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Select Asset <span className="text-red-500">*</span></label>
                        <select value={assetId} onChange={e => setAssetId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white" required>
                            <option value="">Choose a fixed asset...</option>
                            {assets.filter(a => a.status !== 'ASSIGNED' && a.status !== 'RETIRED').map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.assetCode})</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Only unassigned and active assets are shown.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Assign to Staff</label>
                            <select value={assignedToId} onChange={e => { setAssignedToId(e.target.value); setAssignedToClassId(''); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white">
                                <option value="">-- Select Staff Member --</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col justify-center items-center">
                            <span className="text-xs font-bold text-gray-400 bg-white px-2 rounded-full border border-gray-200">- OR -</span>
                        </div>

                        <div className="col-span-1 md:col-span-2 mt-[-10px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Assign to Class <span className="text-xs font-normal text-gray-500">(Enter Class Name/ID)</span></label>
                            <input type="text" value={assignedToClassId} onChange={e => { setAssignedToClassId(e.target.value); setAssignedToId(''); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" placeholder="e.g. Form 1A ID" disabled={!!assignedToId} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Asset Condition on Assignment</label>
                            <select value={conditionOnAssigned} onChange={e => setConditionOnAssigned(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white">
                                <option value="NEW">New</option>
                                <option value="GOOD">Good</option>
                                <option value="FAIR">Fair</option>
                                <option value="POOR">Poor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Return Date</label>
                            <input type="date" value={toInputDate(expectedReturn)} onChange={e => setExpectedReturn(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" placeholder="State purpose of assignment or existing damages"></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 font-bold shadow-sm">
                            Confirm Assignment
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
                            <Users className="text-brand-purple" />
                            Asset Assignments
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Track current custody of Fixed Assets checked out to staff or classes.
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
                            Check Out Asset
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by asset name/code, or staff/class name..."
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
                                <th className="p-4 font-semibold whitespace-nowrap">Checkout Date</th>
                                <th className="p-4 font-semibold">Asset Details</th>
                                <th className="p-4 font-semibold">Assigned To</th>
                                <th className="p-4 font-semibold">Condition</th>
                                <th className="p-4 font-semibold">Return Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">Loading assignments...</td>
                                </tr>
                            ) : filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No active assignments found. All fixed assets are currently stored.
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(assignment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{assignment.asset.name}</div>
                                            <div className="text-gray-500 font-mono text-xs">{assignment.asset.assetCode}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-brand-purple">
                                            {assignment.assignedTo ? (
                                                <div className="flex items-center gap-2">
                                                    <UserCheck size={16} />
                                                    {assignment.assignedTo.firstName} {assignment.assignedTo.lastName}
                                                </div>
                                            ) : assignment.assignedToClass ? (
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} />
                                                    {assignment.assignedToClass.name || 'Class Assigned'}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {getConditionBadge(assignment.conditionOnAssigned)}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {assignment.expectedReturn ? (
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    {new Date(assignment.expectedReturn).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Indefinite</span>
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

export default AssetAssignments;
