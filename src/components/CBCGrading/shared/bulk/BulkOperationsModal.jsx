import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileDown, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import axiosInstance, { API_BASE_URL } from '../../../../services/axiosConfig';

const BulkOperationsModal = ({
  isOpen,
  onClose,
  title,
  entityType, // 'learners', 'teachers', 'parents'
  onUploadComplete,
  userRole // Pass user role if needed, though context is now header-based
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [forceCreate, setForceCreate] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const canUpload = () => !!file;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setUploadResult(null);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        alert('Please select a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!canUpload()) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const schoolId = localStorage.getItem('currentSchoolId');
      if (!schoolId) {
        setUploadResult({
          success: false,
          error: 'School context not initialized. Please log out and log in again.'
        });
        setUploading(false);
        return;
      }

      const response = await axiosInstance.post(`/bulk/${entityType}/upload?forceCreate=${forceCreate ? 'true' : 'false'}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const result = response.data;
      setUploadResult(result);
      if (result.summary && result.summary.created > 0 && onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Upload failed. Please try again.';
      setUploadResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axiosInstance.get(`/bulk/${entityType}/template`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template. Please check your connection and try again.');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Authentication required. Please log in again.');
        setExporting(false);
        return;
      }

      const schoolId = localStorage.getItem('currentSchoolId');
      if (!schoolId) {
        alert('School context not initialized. Please log out and log in again to ensure your school is properly configured.');
        setExporting(false);
        return;
      }

      let url = `${API_BASE_URL}/bulk/${entityType}/export`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-School-Id': schoolId,
          'X-Branch-Id': localStorage.getItem('currentBranchId') || ''
        }
      });

      if (!response.ok) {
        console.error('Export failed:', response.status, response.statusText);
        alert(`Failed to export data (${response.status}). Please check your connection and try again.`);
        setExporting(false);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${entityType}_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please check your connection and try again.');
    } finally {
      setExporting(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#520050] text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center justify-center gap-2 p-3 border border-[#00A09D]/30 rounded-lg hover:border-[#00A09D] hover:bg-[#00A09D]/5 transition group"
            >
              <FileDown size={18} className="text-[#00A09D]" />
              <span className="text-xs font-semibold text-[#00A09D]">Template</span>
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 p-3 border border-[#520050]/30 rounded-lg hover:border-[#520050] hover:bg-[#520050]/5 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader size={18} className="animate-spin text-[#520050]" />
                  <span className="text-xs text-[#520050]">Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={18} className="text-[#520050]" />
                  <span className="text-xs font-semibold text-[#520050]">Export CSV</span>
                </>
              )}
            </button>
          </div>

          {/* Upload Section */}
          <div className="space-y-3">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition ${dragActive
                ? 'border-[#00A09D] bg-[#00A09D]/5'
                : 'border-gray-200 hover:border-[#00A09D]/50'
                } ${!canUpload() && file ? 'opacity-50' : ''}`}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-[#00A09D]">
                    <CheckCircle size={20} />
                    <span className="text-sm font-semibold truncate max-w-[200px]">{file.name}</span>
                  </div>

                  {/* Force Create Option */}
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="forceCreate"
                      checked={forceCreate}
                      onChange={(e) => setForceCreate(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="forceCreate" className="text-xs cursor-pointer text-gray-700">
                      <span className="font-semibold">Force Create (Replace Existing)</span>
                      <p className="text-gray-600">Will replace all records with matching admission numbers</p>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-center flex-col items-center w-full">
                    {uploading && (
                      <div className="w-full space-y-2 mb-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00A09D] transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 justify-center w-full">
                      <button
                        onClick={handleUpload}
                        disabled={!canUpload() || uploading}
                        className="flex-1 max-w-[120px] px-4 py-2 bg-[#00A09D] text-white text-xs font-bold rounded-lg hover:bg-[#00908d] transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest"
                      >
                        {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                        <span>{uploading ? 'Processing' : 'Upload'}</span>
                      </button>
                      <button
                        onClick={resetUpload}
                        disabled={uploading}
                        className="flex-1 max-w-[120px] px-4 py-2 border border-gray-200 text-xs font-bold text-gray-500 rounded-lg hover:bg-gray-50 transition uppercase tracking-widest"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="mx-auto text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">
                    Drag & drop CSV or <label className="text-[#520050] cursor-pointer hover:underline">
                      browse
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                </div>
              )}
            </div>

            {/* Upload Results */}
            {uploadResult && (
              <div className={`p-3 rounded-lg border ${uploadResult.success
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
                }`}>
                <div className="flex items-start gap-2">
                  {uploadResult.success ? (
                    <CheckCircle size={18} className="text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-600 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold ${uploadResult.success ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {uploadResult.success ? 'Import Successful' : 'Upload Failed'}
                    </h4>

                    {uploadResult.success && uploadResult.summary && (
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-700">
                          <span>Total: <b>{uploadResult.summary.total}</b></span>
                          <span>Created: <b>{uploadResult.summary.created}</b></span>
                          {uploadResult.summary.failed > 0 && <span className="text-rose-600">Failed: <b>{uploadResult.summary.failed}</b></span>}
                        </div>

                        {/* Show errors if any */}
                        {uploadResult.details && (uploadResult.details.failed.length > 0 || uploadResult.details.validationErrors.length > 0) && (
                          <details className="mt-2 group">
                            <summary className="cursor-pointer text-xs font-semibold text-rose-600 group-open:mb-2">
                              View Details ({uploadResult.details.failed.length + uploadResult.details.validationErrors.length})
                            </summary>
                            <div className="max-h-32 overflow-y-auto bg-white/50 p-2 rounded text-[11px] space-y-1">
                              {uploadResult.details.failed.map((err, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <span className="text-gray-400">L{err.line}:</span>
                                  <span className="text-rose-600">{err.reason}</span>
                                </div>
                              ))}
                              {uploadResult.details.validationErrors.map((err, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <span className="text-gray-400">L{err.line}:</span>
                                  <span className="text-amber-600">Validation error</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}

                    {uploadResult.error && (
                      <p className="text-xs text-rose-600 mt-1">
                        {typeof uploadResult.error === 'string'
                          ? uploadResult.error
                          : uploadResult.error?.message || 'An error occurred'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsModal;
