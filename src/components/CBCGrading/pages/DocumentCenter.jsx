import React, { useState, useEffect, useRef } from 'react';
import {
    Folder, FileText, Upload, Search,
    File, Image, FileSpreadsheet, Trash2,
    Download, RefreshCw, Grid, List, Plus
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useDocuments } from '../hooks/useDocuments';
import ConfirmDialog from '../shared/ConfirmDialog';
import ProfileLayout from '../shared/ProfileLayout';

// Simple icon placeholders
const UsersIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const GraduationCapIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
);

const DocumentCenter = () => {
    const {
        documents,
        categories,
        loading,
        fetchDocuments,
        fetchCategories,
        uploadDocument,
        deleteDocument
    } = useDocuments();

    const { showSuccess, showError } = useNotifications();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const fileInputRef = useRef(null);

    // Initial fetch
    useEffect(() => {
        fetchDocuments();
        fetchCategories();
    }, [fetchDocuments, fetchCategories]);

    // Fetch on category change
    useEffect(() => {
        const params = {};
        if (activeCategory !== 'all') params.category = activeCategory;
        if (searchQuery) params.search = searchQuery;
        fetchDocuments(params);
    }, [activeCategory, searchQuery]);

    const uiCategories = [
        { id: 'all', label: 'All Records', icon: Folder },
        { id: 'students', label: 'Student Files', icon: GraduationCapIcon },
        { id: 'staff', label: 'Staff Records', icon: UsersIcon },
        { id: 'finance', label: 'Financial Docs', icon: FileSpreadsheet },
        { id: 'reports', label: 'Academic Reports', icon: FileText },
        ...categories
            .filter(c => !['general', 'academic', 'finance', 'hr', 'marketing'].includes(c))
            .map(c => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1), icon: Folder }))
    ];

    const [isDragging, setIsDragging] = useState(false);

    const handleFileUpload = async (file) => {
        if (!file) return;
        const category = activeCategory === 'all' ? 'general' : activeCategory;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('name', file.name);

        const result = await uploadDocument(formData);
        if (result.success) {
            showSuccess('Document uploaded successfully');
        } else {
            showError('Failed to upload document');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        await handleFileUpload(file);
        e.target.value = null;
    };

    const confirmDelete = (doc) => {
        setDocumentToDelete(doc);
        setShowConfirmDialog(true);
    };

    const handleDelete = async () => {
        if (documentToDelete) {
            const result = await deleteDocument(documentToDelete.id);
            if (result.success) {
                showSuccess('Document deleted');
            } else {
                showError('Failed to delete');
            }
            setShowConfirmDialog(false);
            setDocumentToDelete(null);
        }
    };

    const handleDownload = (doc) => {
        window.open(doc.url, '_blank');
    };

    const getFileIcon = (type) => {
        if (!type) return <File className="text-gray-400" size={24} />;
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <FileText className="text-red-500" size={24} />;
        if (t.includes('excel') || t.includes('sheet') || t.includes('csv')) return <FileSpreadsheet className="text-green-600" size={24} />;
        if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <Image className="text-purple-500" size={24} />;
        if (t.includes('word') || t.includes('doc')) return <FileText className="text-blue-500" size={24} />;
        return <File className="text-gray-400" size={24} />;
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <ProfileLayout
            title="Administrative Docs"
            subtitle="Manage institutional records, student files, and reports"
            primaryAction={{
                label: "Upload Document",
                icon: Plus,
                onClick: () => fileInputRef.current?.click()
            }}
            secondaryAction={{
                label: "Refresh",
                icon: RefreshCw,
                onClick: () => fetchDocuments({ category: activeCategory !== 'all' ? activeCategory : undefined }),
                className: loading ? "animate-spin" : ""
            }}
        >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div className="flex h-[calc(100vh-220px)] gap-6">
                {/* Categories Sidebar */}
                <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-3 mb-4">Categories</h3>
                    <div className="space-y-1 overflow-y-auto flex-1 hide-scrollbar">
                        {uiCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition ${activeCategory === cat.id
                                    ? 'bg-brand-teal/10 text-brand-teal'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <cat.icon size={18} />
                                {cat.label}
                                {activeCategory === cat.id && <div className="ml-auto w-1.5 h-1.5 bg-brand-teal rounded-full"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main View Area */}
                <div
                    className={`flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${isDragging ? 'ring-2 ring-brand-teal ring-inset bg-brand-teal/5' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async (e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const files = e.dataTransfer.files;
                        if (files.length > 0) await handleFileUpload(files[0]);
                    }}
                >
                    {/* Inner Toolbar */}
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-teal/20 transition text-sm font-medium"
                            />
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Files Display */}
                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        {loading && documents.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <RefreshCw className="animate-spin text-brand-teal" size={32} />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Folder size={40} className="text-gray-200" />
                                </div>
                                <p className="text-lg font-black text-gray-400">Empty Category</p>
                                <p className="text-sm font-medium">Drop files here to start uploading</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid'
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                                : "space-y-2"
                            }>
                                {documents.map(file => (
                                    viewMode === 'grid' ? (
                                        <div
                                            key={file.id}
                                            className="group relative bg-white border border-gray-100 hover:border-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/5 rounded-2xl p-5 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
                                            onClick={() => handleDownload(file)}
                                        >
                                            <div className="w-16 h-16 mb-4 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 truncate w-full mb-1 px-2" title={file.name}>
                                                {file.name}
                                            </h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                            </p>

                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); confirmDelete(file); }}
                                                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            key={file.id}
                                            className="group flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition cursor-pointer border border-transparent hover:border-gray-100"
                                            onClick={() => handleDownload(file)}
                                        >
                                            <div className="p-2 bg-gray-50 rounded-lg">
                                                {React.cloneElement(getFileIcon(file.type), { size: 20 })}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-400">{formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-brand-teal"><Download size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); confirmDelete(file); }} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                show={showConfirmDialog}
                title="Delete Document"
                message={`Are you sure you want to permanentely delete "${documentToDelete?.name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
                onConfirm={handleDelete}
                onCancel={() => setShowConfirmDialog(false)}
            />
        </ProfileLayout>
    );
};

export default DocumentCenter;
