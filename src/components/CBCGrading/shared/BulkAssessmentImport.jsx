import React, { useState, useMemo, useEffect } from 'react';
import {
    X, UploadCloud, FileText, CheckCircle,
    AlertCircle, Loader, Search, Info,
    AlertTriangle, Settings, FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';

const BulkAssessmentImport = ({
    show,
    onClose,
    onSuccess,
    academicYear,
    term,
    grade,
    learningAreas = []
}) => {
    const { showSuccess, showError } = useNotifications();
    const [file, setFile] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [parsing, setParsing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Results
    const [mapping, setMapping] = useState({}); // { "Math Col": "MATHEMATICAL ACTIVITIES" }
    const [admissionColumn, setAdmissionColumn] = useState('');
    const [summary, setSummary] = useState(null);
    const [errors, setErrors] = useState([]);

    // Auto-detect admission column and basic mapping
    useEffect(() => {
        if (headers.length > 0) {
            const newMapping = {};
            let detectAdm = '';

            headers.forEach(h => {
                const lower = h.toLowerCase().trim();
                // Detect Admission Number
                if (lower.includes('adm') || lower.includes('admission') || lower.includes('reg')) {
                    detectAdm = h;
                }

                // Detect subjects
                learningAreas.forEach(la => {
                    const laLower = la.toLowerCase();
                    if (lower === laLower || lower.includes(laLower) || laLower.includes(lower)) {
                        newMapping[h] = la;
                    }
                });
            });

            if (detectAdm) setAdmissionColumn(detectAdm);
            setMapping(newMapping);
        }
    }, [headers, learningAreas]);

    if (!show) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setParsing(true);
        setHeaders([]);
        setStep(1);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length > 0) {
                    setHeaders(data[0].filter(h => h && h.trim()));
                    setStep(2);
                } else {
                    showError("File appears to be empty");
                }
            } catch (err) {
                showError("Error reading file headers");
                console.error(err);
            } finally {
                setParsing(false);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleMappingChange = (csvCol, learningArea) => {
        setMapping(prev => ({
            ...prev,
            [csvCol]: learningArea
        }));
    };

    const handleUpload = async () => {
        if (!admissionColumn) {
            showError("Please select the Admission Number column");
            return;
        }

        if (Object.keys(mapping).length === 0) {
            showError("Please map at least one subject column");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('academicYear', academicYear);
            formData.append('term', term);
            formData.append('grade', grade);
            formData.append('admissionColumn', admissionColumn);
            formData.append('columnMapping', JSON.stringify(mapping));

            const response = await api.assessments.uploadBulk(formData);

            if (response.success) {
                setSummary(response.summary);
                setErrors(response.errors || []);
                setStep(3);
                showSuccess("Bulk assessment processed successfully");
                if (onSuccess) onSuccess();
            } else {
                showError(response.error || "Upload failed");
            }
        } catch (err) {
            showError(err.message || "An error occurred during upload");
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setHeaders([]);
        setMapping({});
        setAdmissionColumn('');
        setSummary(null);
        setErrors([]);
        setStep(1);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <UploadCloud className="text-blue-600" />
                            Bulk Score Import
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Upload scores for {grade}, {term} ({academicYear})
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <Info className="text-blue-500 shrink-0" size={20} />
                                <div className="text-sm text-blue-800">
                                    <p className="font-semibold">Import Instructions:</p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>Use a wide-format spreadsheet (one student per row)</li>
                                        <li>Ensure there is an <strong>Admission Number</strong> column</li>
                                        <li>Subject scores should be in separate columns</li>
                                        <li>Empty cells will be ignored</li>
                                    </ul>
                                </div>
                            </div>

                            <div
                                className="border-3 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
                                onClick={() => document.getElementById('bulk-file-input').click()}
                            >
                                <input
                                    type="file"
                                    id="bulk-file-input"
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText size={40} className="text-blue-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800">
                                        {parsing ? 'Reading file...' : 'Select Excel or CSV file'}
                                    </h4>
                                    <p className="text-gray-500 mt-2">
                                        Click to browse or drag and drop your score sheet here
                                    </p>
                                    {parsing && <Loader className="animate-spin mt-4 text-blue-600" />}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-between items-center bg-amber-50 border border-amber-100 p-4 rounded-xl">
                                <div className="flex gap-2">
                                    <Settings className="text-amber-600" size={20} />
                                    <div>
                                        <h4 className="font-bold text-amber-900 text-sm">Column Mapping</h4>
                                        <p className="text-xs text-amber-800">Link your spreadsheet columns to school subjects</p>
                                    </div>
                                </div>
                                <button onClick={reset} className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline">
                                    Change File
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Admission No Selection */}
                                <div className="grid grid-cols-2 gap-4 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700">Admission Number Column</label>
                                        <p className="text-xs text-gray-500">Essential for student identification</p>
                                    </div>
                                    <select
                                        value={admissionColumn}
                                        onChange={(e) => setAdmissionColumn(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">-- Select Column --</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                {/* Score Mapping */}
                                <h5 className="font-bold text-gray-800 text-sm mt-6 border-b pb-2">Subject Columns</h5>
                                <div className="divide-y border rounded-xl overflow-hidden">
                                    {headers.filter(h => h !== admissionColumn).map((header, idx) => (
                                        <div key={idx} className="grid grid-cols-2 gap-4 items-center p-3 hover:bg-gray-50 transition-colors">
                                            <span className="text-sm font-medium text-gray-700 truncate">{header}</span>
                                            <select
                                                value={mapping[header] || ""}
                                                onChange={(e) => handleMappingChange(header, e.target.value)}
                                                className={`w-full p-2 border rounded-lg text-sm ${mapping[header] ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                                            >
                                                <option value="">Ignore this column</option>
                                                {learningAreas.map(la => (
                                                    <option key={la} value={la}>{la}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && summary && (
                        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Import Complete</h3>
                                <p className="text-gray-600">Successfully processed scores from your file</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Total Rows</p>
                                    <p className="text-2xl font-black text-blue-900">{summary.totalRows}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Results Set</p>
                                    <p className="text-2xl font-black text-green-900">{summary.resultsProcessed}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Errors</p>
                                    <p className="text-2xl font-black text-red-900">{summary.errorsFound}</p>
                                </div>
                            </div>

                            {errors.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-bold flex items-center gap-2 text-red-700">
                                        <AlertTriangle size={18} />
                                        Issues Encountered
                                    </h4>
                                    <div className="max-h-60 overflow-y-auto border rounded-xl bg-gray-50 p-2 text-sm divide-y">
                                        {errors.map((err, idx) => (
                                            <div key={idx} className="py-2 px-3 text-red-600">
                                                <span className="font-bold font-mono text-xs bg-red-100 px-1 rounded mr-2">ROW {err.row}</span>
                                                {err.admNo && <span className="text-gray-500 mr-2 text-xs">({err.admNo})</span>}
                                                {err.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                    >
                        {step === 3 ? 'Close' : 'Cancel'}
                    </button>

                    {step === 2 && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {uploading ? <Loader className="animate-spin" /> : <UploadCloud />}
                            {uploading ? 'Processing...' : 'Complete Import'}
                        </button>
                    )}

                    {step === 3 && (
                        <button
                            onClick={reset}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Import More
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkAssessmentImport;
