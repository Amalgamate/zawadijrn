import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Plus, Edit2, Trash2,
    ExternalLink, Mail, Phone, Shield,
    Banknote, Download, MoreVertical,
    ChevronRight, ArrowLeft
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import AddEditTeacherPage from '../AddEditTeacherPage'; // We'll adapt this or make an HR version

const StaffDirectory = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await hrAPI.getStaffDirectory();
            if (response.success) {
                setStaff(response.data);
            }
        } catch (error) {
            console.error('Error fetching staff directory:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStaff = staff.filter(member => {
        const matchesSearch = (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.staffId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const roles = ['ALL', ...new Set(staff.map(s => s.role))];

    const handleEdit = (member) => {
        setSelectedStaff(member);
        setIsEditing(true);
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            ACTIVE: 'bg-green-100 text-green-700',
            INACTIVE: 'bg-gray-100 text-gray-700',
            SUSPENDED: 'bg-red-100 text-red-700',
            ON_LEAVE: 'bg-blue-100 text-blue-700'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    if (isEditing) {
        return (
            <div className="animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Edit Staff: {selectedStaff.firstName} {selectedStaff.lastName}</h1>
                </div>

                {/* We can use the existing AddEditTeacherPage but might need to extend it for HR fields */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <p className="text-gray-500 mb-8 italic">HR functionality for KRA, NHSF and Bank Details is currently being integrated into this form.</p>
                    {/* For now, we'll just show the base form and handle HR updates separately if needed */}
                    <AddEditTeacherPage
                        teacher={selectedStaff}
                        onCancel={() => setIsEditing(false)}
                        onSave={async (data) => {
                            // Update base info
                            const res = await hrAPI.updateStaffHR(selectedStaff.id, data);
                            if (res.success) {
                                fetchStaff();
                                setIsEditing(false);
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
                    <p className="text-gray-500">View and manage all employees of the institution.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
                        <Download size={18} />
                        Export List
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or Staff ID..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-teal/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-transparent">
                        <Filter size={16} className="text-gray-500" />
                        <select
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[color:var(--table-border)]">
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Staff ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Basic Salary</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-8" colSpan={7}>
                                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredStaff.length > 0 ? (
                                filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center font-bold text-brand-purple overflow-hidden">
                                                    {member.profilePicture ? (
                                                        <img src={member.profilePicture} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        `${member.firstName[0]}${member.lastName[0]}`
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 group-hover:text-brand-teal transition-colors">
                                                        {member.firstName} {member.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 lowercase">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            {member.staffId || 'Not Set'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-brand-purple/50" />
                                                <span className="text-sm font-medium text-gray-700">{member.role.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <a href={`tel:${member.phone}`} className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-brand-teal hover:bg-brand-teal/10 transition-colors">
                                                    <Phone size={14} />
                                                </a>
                                                <a href={`mailto:${member.email}`} className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-brand-teal hover:bg-brand-teal/10 transition-colors">
                                                    <Mail size={14} />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={member.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold text-emerald-600">
                                                <Banknote size={16} />
                                                KES {Number(member.basicSalary || 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="p-2 text-gray-400 hover:text-brand-teal hover:bg-gray-100 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No staff members found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffDirectory;
