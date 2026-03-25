import React, { useState, useEffect } from 'react';
import {
    Users, Calendar, CreditCard, FileText,
    ArrowRight, Plus, Clock, CheckCircle,
    AlertCircle, TrendingUp, Briefcase
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
                <Icon size={24} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp size={14} className={trend === 'down' ? 'rotate-180' : ''} />
                    {trendValue}
                </div>
            )}
        </div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
);

const HRManager = ({ onNavigate }) => {
    const [stats, setStats] = useState({
        totalStaff: 0,
        activeLeave: 0,
        pendingPayroll: 0,
        recentRequests: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // In a real app, we'd have a dedicated dashboard endpoint
                // For now, we'll fetch directory and leave requests to compute stats
                const staff = await hrAPI.getStaffDirectory();
                const leave = await hrAPI.getLeaveRequests({ status: 'PENDING' });

                setStats({
                    totalStaff: staff.data?.length || 0,
                    activeLeave: leave.data?.length || 0,
                    pendingPayroll: 1, // Placeholder for demo
                    recentRequests: leave.data?.slice(0, 5) || []
                });
            } catch (error) {
                console.error('Error fetching HR dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const quickLinks = [
        { id: 'hr-staff-profiles', label: 'Staff Directory', icon: Users, color: 'blue', desc: 'Manage profiles, roles and bank details' },
        { id: 'hr-leave', label: 'Leave Management', icon: Calendar, color: 'purple', desc: 'Approve or track staff leave requests' },
        { id: 'hr-payroll', label: 'Payroll Center', icon: CreditCard, color: 'emerald', desc: 'Generate payslips and process salaries' },
        { id: 'hr-documents', label: 'Document Center', icon: FileText, color: 'orange', desc: 'Manage contracts and employee IDs' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HR Management</h1>
                    <p className="text-gray-500">Manage your school's most valuable asset: your staff.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigate('settings-users')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        <Plus size={18} />
                        Add New User
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Staff" value={stats.totalStaff} icon={Briefcase} color="blue" trend="up" trendValue="4%" />
                <StatCard title="On Leave Today" value={stats.activeLeave} icon={Calendar} color="purple" />
                <StatCard title="Payroll Status" value="Pending" icon={Clock} color="orange" />
                <StatCard title="Docs Uploaded" value="85%" icon={CheckCircle} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Access Menu */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Quick Access
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quickLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => onNavigate(link.id)}
                                className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-brand-teal/30 hover:shadow-md transition-all text-left group"
                            >
                                <div className={`p-3 rounded-xl bg-${link.color}-50 text-${link.color}-600 group-hover:scale-110 transition-transform`}>
                                    <link.icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 group-hover:text-brand-teal transition-colors">{link.label}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
                                </div>
                                <ArrowRight size={18} className="text-gray-300 group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>

                    {/* Activity/Notices Card */}
                    <div className="bg-[var(--brand-purple)] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">Announcement</span>
                                <h3 className="text-2xl font-bold">New Payroll Policy in Term 2</h3>
                                <p className="text-white/80 max-w-md">Please ensure all staff bank details are updated before the 25th to avoid processing delays.</p>
                            </div>
                            <button className="px-6 py-3 bg-white text-brand-purple rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg">
                                View Policy
                            </button>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl"></div>
                    </div>
                </div>

                {/* Sidebar: Recent Requests */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Recent Leave Requests</h2>
                        <button
                            onClick={() => onNavigate('hr-leave')}
                            className="text-brand-teal text-sm font-bold hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm overflow-hidden">
                        {stats.recentRequests.length > 0 ? (
                            stats.recentRequests.map((req) => (
                                <div key={req.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-brand-purple">
                                        {req.user.firstName[0]}{req.user.lastName[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-gray-900">{req.user.firstName} {req.user.lastName}</h4>
                                        <p className="text-xs text-gray-500 uppercase tracking-tighter">{req.leaveType.name}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-full uppercase">Pending</span>
                                        <span className="text-[10px] text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <div className="flex justify-center mb-3">
                                    <AlertCircle size={32} className="text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500">No pending requests</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <h3 className="font-bold text-emerald-900 mb-2">HR Tip</h3>
                        <p className="text-sm text-emerald-700 leading-relaxed">
                            Did you know you can customize leave types? Head to settings to define school-specific leave policies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRManager;
