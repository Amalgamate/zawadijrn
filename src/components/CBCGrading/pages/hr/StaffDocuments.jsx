import React, { useState, useEffect } from 'react';
import {
    FileText, Upload, Download, Search,
    Trash2, Eye, Filter, Plus,
    File, FolderOpen, MoreVertical,
    CheckCircle, AlertCircle
} from 'lucide-react';

const StaffDocuments = () => {
    const [documents, setDocuments] = useState([
        // Mock data for demo
        { id: 1, name: 'EmploymentContract_JohnDoe.pdf', type: 'CONTRACT', staff: 'John Doe', date: '2024-01-15', size: '1.2 MB' },
        { id: 2, name: 'KRA_PIN_Certificate.pdf', type: 'IDENTIFICATION', staff: 'Jane Smith', date: '2024-02-10', size: '450 KB' },
        { id: 3, name: 'MedicalCertificate_Jane.pdf', type: 'OTHER', staff: 'Jane Smith', date: '2024-02-12', size: '800 KB' }
    ]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const docTypes = ['CONTRACT', 'IDENTIFICATION', 'QUALIFICATION', 'OTHER'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Document Center</h1>
                    <p className="text-gray-500">Secure storage for employee contracts, IDs and certifications.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-100 hover:bg-brand-teal/90 transition-all">
                    <Upload size={18} />
                    Upload New Document
                </button>
            </div>

            {/* Quick Filter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {docTypes.map(type => (
                    <div key={type} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-brand-teal/30 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 text-gray-400 group-hover:text-brand-teal group-hover:bg-brand-teal/10 rounded-lg transition-colors">
                                <FolderOpen size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-700">{type.replace('_', ' ')}</h3>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">12 Files</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by filename or staff name..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-transparent text-sm font-bold text-gray-500">
                        <Filter size={16} />
                        Sort by: Newest First
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">File Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Upload Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Size</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                <FileText size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-brand-teal transition-colors">
                                                {doc.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase">
                                            {doc.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                        {doc.staff}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(doc.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                                        {doc.size}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all">
                                                <Download size={16} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Storage Usage Card */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-emerald-900">Storage Optimization</h3>
                        <p className="text-sm text-emerald-700">All documents are encrypted and backed up daily. Using 2.4 GB of 50 GB available.</p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <div className="w-48 h-2 bg-white/50 rounded-full overflow-hidden">
                        <div className="w-[5%] h-full bg-emerald-500"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDocuments;
