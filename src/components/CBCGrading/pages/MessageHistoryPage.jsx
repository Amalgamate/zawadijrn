import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Loader, MessageSquare, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Button, Input, Label, Badge } from '../../../components/ui';
import { useNotifications } from '../hooks/useNotifications';
import { toInputDate } from '../utils/dateHelpers';
import api from '../../../services/api';
import { getAdminSchoolId, getStoredUser } from '../../../services/tenantContext';

const MessageHistoryPage = () => {
    const { showSuccess, showError } = useNotifications();

    // State
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState({ totalSent: 0, successRate: 0, failed: 0, estimatedCost: 0 });
    const [schoolId, setSchoolId] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        channel: 'all',
        status: 'all',
        search: ''
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 50;

    useEffect(() => {
        let sid = getAdminSchoolId();
        if (!sid) {
            const user = getStoredUser();
            sid = user?.schoolId || user?.school?.id;
        }
        setSchoolId(sid);

        if (sid) {
            fetchLogs(sid);
        }
    }, [page, filters]);

    const fetchLogs = async (sid) => {
        setLoading(true);
        try {
            const response = await api.notifications.getAuditLogs({
                schoolId: sid,
                startDate: filters.startDate,
                endDate: filters.endDate,
                channel: filters.channel === 'all' ? undefined : filters.channel,
                status: filters.status === 'all' ? undefined : filters.status,
                search: filters.search || undefined,
                page,
                limit
            });

            if (response.success) {
                setLogs(response.data.logs || []);
                setSummary(response.data.summary || { totalSent: 0, successRate: 0, failed: 0, estimatedCost: 0 });
                setTotalPages(Math.ceil((response.data.total || 0) / limit));
            }
        } catch (error) {
            console.error('Failed to fetch message history:', error);
            showError('Failed to load message history');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (schoolId) {
            fetchLogs(schoolId);
            showSuccess('Refreshed!');
        }
    };

    const handleExportCSV = () => {
        if (logs.length === 0) {
            showError('No data to export');
            return;
        }

        const headers = ['Date/Time', 'Learner Name', 'Parent Phone', 'Channel', 'Status', 'Sent By', 'Term'];
        const rows = logs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            log.learner?.firstName + ' ' + log.learner?.lastName || 'N/A',
            log.phoneNumber || 'N/A',
            log.channel || 'N/A',
            log.status || 'N/A',
            log.sentBy?.firstName + ' ' + log.sentBy?.lastName || 'System',
            log.term || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `message_history_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showSuccess('CSV exported successfully!');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-brand-teal to-brand-teal/80 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <MessageSquare size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Message History</h1>
                        <p className="text-white/80 text-sm">Track all communications sent to parents and guardians</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExportCSV}
                        disabled={logs.length === 0}
                        className="bg-white text-brand-teal hover:bg-gray-100 font-bold gap-2"
                    >
                        <Download size={18} />
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="border-white/30 text-white hover:bg-white/10"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Total Sent</p>
                            <p className="text-3xl font-bold text-brand-teal">{summary.totalSent}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Success Rate</p>
                            <p className="text-3xl font-bold text-green-600">{summary.successRate}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">Failed</p>
                            <p className="text-3xl font-bold text-red-600">{summary.failed}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-1">SMS Parts</p>
                            <p className="text-3xl font-bold text-brand-purple">{summary.estimatedCost}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Section */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="startDate" className="text-xs font-bold">From Date</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={toInputDate(filters.startDate)}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="endDate" className="text-xs font-bold">To Date</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={toInputDate(filters.endDate)}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="channel" className="text-xs font-bold">Channel</Label>
                        <select
                            id="channel"
                            value={filters.channel}
                            onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-sm"
                        >
                            <option value="all">All Channels</option>
                            <option value="SMS">SMS</option>
                            <option value="WhatsApp">WhatsApp</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="status" className="text-xs font-bold">Status</Label>
                        <select
                            id="status"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="SENT">Sent</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="search" className="text-xs font-bold">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                id="search"
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Name or phone..."
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <Loader className="animate-spin mb-4 text-brand-teal" size={32} />
                        <p className="text-gray-500 font-medium">Loading message history...</p>
                    </div>
                ) : logs.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-gray-600 uppercase text-xs">Date/Time</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 uppercase text-xs">Learner</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 uppercase text-xs">Phone</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 uppercase text-xs">Channel</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 uppercase text-xs">Status</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 uppercase text-xs">Sent By</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 uppercase text-xs">Term</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {logs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-xs text-gray-700 font-mono">{formatDate(log.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal font-bold text-sm">
                                                        {log.learner?.firstName?.charAt(0) || 'L'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">
                                                            {log.learner?.firstName} {log.learner?.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{log.learner?.admissionNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono text-gray-700">{log.phoneNumber || 'N/A'}</td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={log.channel === 'SMS' ? 'secondary' : 'outline'}
                                                    className={log.channel === 'SMS' ? '' : 'bg-green-50 text-green-700 border-green-200'}
                                                >
                                                    {log.channel || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.status === 'SENT' ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle size={16} />
                                                        <span className="text-xs font-bold">Sent</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-red-600">
                                                        <XCircle size={16} />
                                                        <span className="text-xs font-bold">Failed</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-700">
                                                {log.sentBy?.firstName} {log.sentBy?.lastName || 'System'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-700">{log.term || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="gap-1"
                                    >
                                        <ChevronLeft size={16} />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="gap-1"
                                    >
                                        Next
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <MessageSquare size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600">No Messages Found</h3>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or date range</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageHistoryPage;
