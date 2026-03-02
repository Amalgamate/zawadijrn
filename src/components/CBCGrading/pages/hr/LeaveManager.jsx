import React, { useState, useEffect } from 'react';
import {
    Calendar, Check, X, Clock,
    Filter, Search, AlertCircle,
    CheckCircle2, XCircle, FileText
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const LeaveManager = () => {
    const [requests, setRequests] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [filter, setFilter] = useState('PENDING');

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reqs, types] = await Promise.all([
                hrAPI.getLeaveRequests({ status: filter !== 'ALL' ? filter : undefined }),
                hrAPI.getLeaveTypes()
            ]);
            setRequests(reqs.data || []);
            setLeaveTypes(types.data || []);
        } catch (error) {
            console.error('Error fetching leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, approved) => {
        try {
            setProcessingId(id);
            const res = await hrAPI.approveLeaveRequest(id, { approved });
            if (res.success) {
                setRequests(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error('Error processing leave request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            APPROVED: 'bg-green-50 text-green-700 border-green-100',
            REJECTED: 'bg-red-50 text-red-700 border-red-100'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                    <p className="text-gray-500">Review and manage staff leave applications.</p>
                </div>
                <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-brand-teal text-white' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leave Requests List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-teal mb-4"></div>
                            <p className="text-gray-500 text-sm">Fetching requests...</p>
                        </div>
                    ) : requests.length > 0 ? (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                {req.status === 'PENDING' && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                                )}
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-purple/5 flex items-center justify-center font-bold text-brand-purple text-lg">
                                            {req.user.firstName[0]}{req.user.lastName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{req.user.firstName} {req.user.lastName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-brand-teal uppercase tracking-wider bg-brand-teal/5 px-2 py-0.5 rounded-md">
                                                    {req.leaveType.name}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    Applied on {new Date(req.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <StatusBadge status={req.status} />
                                        <p className="text-sm font-bold text-gray-700">
                                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 italic">"{req.reason || 'No reason provided'}"</p>
                                    </div>

                                    {req.status === 'PENDING' && (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleApprove(req.id, false)}
                                                disabled={processingId === req.id}
                                                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-bold text-sm"
                                            >
                                                <X size={18} />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.id, true)}
                                                disabled={processingId === req.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-sm shadow-md shadow-green-200"
                                            >
                                                {processingId === req.id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white"></div>
                                                ) : (
                                                    <Check size={18} />
                                                )}
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                <Calendar size={48} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No {filter.toLowerCase()} requests</h3>
                            <p className="text-gray-500 mt-2">All caught up! There are no leave requests to display here.</p>
                        </div>
                    )}
                </div>

                {/* Info/Stats Column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4">Leave Summary</h2>
                        <div className="space-y-4">
                            {leaveTypes.map(type => (
                                <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">{type.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{type.daysPerYear} days allowed</p>
                                    </div>
                                    <div className="text-brand-teal font-bold">{type.daysPerYear}</div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
                            Manage Leave Types
                        </button>
                    </div>

                    <div className="bg-brand-purple rounded-2xl p-6 text-white text-center">
                        <Calendar size={32} className="mx-auto mb-4 opacity-50" />
                        <h3 className="font-bold mb-2">Policy Reminder</h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                            Staff should apply for annual leave at least 14 days in advance. Sick leave requires a medical certificate if longer than 2 days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveManager;
