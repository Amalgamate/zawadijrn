import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Upload, Download, Search,
    Trash2, Eye, Filter, FolderOpen,
    CheckCircle, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { documentsAPI } from '../../../../services/api';

const DOC_TYPES = ['CONTRACT', 'IDENTIFICATION', 'QUALIFICATION', 'OTHER'];

const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StaffDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const fileInputRef = useRef(null);

    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await documentsAPI.getAll({ entityType: 'STAFF' });
            setDocuments(res.data || []);
        } catch (error) {
            console.error('Error fetching staff documents:', error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        try {
            setUploading(true);
            const formData = new FormData();
            Array.from(files).forEach(f => formData.append('files', f));
            formData.append('entityType', 'STAFF');
            await documentsAPI.uploadMultiple(formData);
            await fetchDocuments();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + (error.message || 'Unknown error'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this document? This cannot be undone.')) return;
        try {
            setDeleting(id);
            await documentsAPI.delete(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Delete failed: ' + (error.message || 'Unknown error'));
        } finally {
            setDeleting(null);
        }
    };

    const handleView = (doc) => {
        if (doc.url || doc.fileUrl) window.open(doc.url || doc.fileUrl, '_blank');
    };

    const handleDownload = async (doc) => {
        const url = doc.url || doc.fileUrl;
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name || doc.originalName || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const filtered = documents.filter(doc => {
        const name = (doc.name || doc.originalName || '').toLowerCase();
        const staffName = (doc.uploadedByName || doc.staffName || '').toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || staffName.includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || (doc.type || doc.documentType) === typeFilter;
        return matchesSearch && matchesType;
    });

    const countByType = (type) => documents.filter(d => (d.type || d.documentType) === type).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Document Center</h1>
                    <p className="text-gray-500">Secure storage for employee contracts, IDs and certifications.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchDocuments} className="p-2 text-gray-500 hover:text-brand-teal hover:bg-brand-teal/10 rounded-xl transition-all" title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-100 hover:bg-brand-teal/90 transition-all disabled:opacity-60"
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        {uploading ? 'Uploading…' : 'Upload Document'}
                    </button>
                </div>
            </div>

            {/* Quick Filter Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DOC_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(prev => prev === type ? 'ALL' : type)}
                        className={`bg-white p-4 rounded-2xl border shadow-sm hover:border-brand-teal/40 transition-all text-left group ${
                            typeFilter === type ? 'border-brand-teal/60 bg-brand-teal/5' : 'border-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${
                                typeFilter === type ? 'text-brand-teal bg-brand-teal/10' : 'bg-gray-50 text-gray-400 group-hover:text-brand-teal group-hover:bg-brand-teal/10'
                            }`}>
                                <FolderOpen size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-700">{type.replace('_', ' ')}</h3>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{countByType(type)} files</p>
                            </div>
                        </div>
                    </button>
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
                    {typeFilter !== 'ALL' && (
                        <button onClick={() => setTypeFilter('ALL')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-teal/10 text-brand-teal rounded-xl text-xs font-bold hover:bg-brand-teal/20 transition-colors">
                            <Filter size={14} /> {typeFilter} <span className="ml-1 text-brand-teal/60">×</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[color:var(--table-border)]">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">File Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Uploaded By</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Upload Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider">Size</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[color:var(--table-header-fg)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-5" colSpan={6}><div className="h-4 bg-gray-100 rounded w-2/3" /></td>
                                    </tr>
                                ))
                            ) : filtered.length > 0 ? (
                                filtered.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText size={18} /></div>
                                                <span className="text-sm font-bold text-gray-900 group-hover:text-brand-teal transition-colors">
                                                    {doc.name || doc.originalName || 'Untitled'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase">
                                                {doc.type || doc.documentType || 'OTHER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                            {doc.uploadedByName || doc.staffName || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {doc.createdAt || doc.uploadedAt ? new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                                            {formatBytes(doc.fileSize || doc.size)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleView(doc)} className="p-2 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all" title="View">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => handleDownload(doc)} className="p-2 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all" title="Download">
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    disabled={deleting === doc.id}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deleting === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 rounded-full text-gray-300"><FileText size={40} /></div>
                                            <p className="text-sm font-bold text-gray-500">
                                                {searchTerm || typeFilter !== 'ALL' ? 'No documents match your filters' : 'No documents uploaded yet'}
                                            </p>
                                            {!searchTerm && typeFilter === 'ALL' && (
                                                <button onClick={() => fileInputRef.current?.click()} className="text-brand-teal text-sm font-bold hover:underline">Upload your first document</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Storage footer */}
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm"><CheckCircle size={24} /></div>
                    <div>
                        <h3 className="font-bold text-emerald-900">Secure Storage</h3>
                        <p className="text-sm text-emerald-700">{documents.length} document{documents.length !== 1 ? 's' : ''} on record. All files are encrypted and backed up automatically.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDocuments;
