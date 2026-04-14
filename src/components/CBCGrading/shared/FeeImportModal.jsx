import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, RefreshCw, CreditCard, Download, Info } from 'lucide-react';
import axiosInstance from '../../../services/api/index';
import { downloadFeeTemplate, downloadBalanceTemplate } from '../../../utils/feeTemplateGenerator';

const FeeImportModal = ({ isOpen, onClose, onComplete }) => {
  const [importMode, setImportMode] = useState('balances'); // 'balances' or 'payments'
  const [file, setFile] = useState(null);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [term, setTerm] = useState('TERM_1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.xlsx') || selected.name.endsWith('.csv'))) {
      setFile(selected);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid .xlsx or .csv file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('academicYear', academicYear);
    formData.append('term', term);

    try {
      let endpoint = '/bulk/fees/upload-balances';
      if (importMode === 'payments') {
        endpoint = '/bulk/fees/upload-payments';
      }

      const response = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || data.details || 'Upload failed');
      }

      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 flex items-center justify-center rounded-lg">
              <Upload size={24} className="text-blue-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Import Fee Records</h2>
              <p className="text-blue-200 text-sm">Upload Excel or CSV fee data</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {!results ? (
            <>
              {/* Import Mode Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">1. Select Import Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setImportMode('balances')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      importMode === 'balances' 
                      ? 'border-blue-600 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <RefreshCw className={`mb-2 ${importMode === 'balances' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                    <h3 className={`font-bold ${importMode === 'balances' ? 'text-blue-900' : 'text-gray-700'}`}>Initial Balances</h3>
                    <p className="text-xs text-gray-500 mt-1 shadow-sm">Sync cumulative Billed, Paid & Balance for students.</p>
                  </div>

                  <div
                    onClick={() => setImportMode('payments')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      importMode === 'payments' 
                      ? 'border-green-600 bg-green-50 shadow-sm' 
                      : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className={`mb-2 ${importMode === 'payments' ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                    <h3 className={`font-bold ${importMode === 'payments' ? 'text-green-900' : 'text-gray-700'}`}>Daily Payments</h3>
                    <p className="text-xs text-gray-500 mt-1">Upload daily bank statements and individual transactions.</p>
                  </div>
                </div>
              </div>

              {/* Term & Year Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">2. Select Period</label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-gray-700"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-semibold text-gray-700"
                  >
                    <option value="TERM_1">Term 1</option>
                    <option value="TERM_2">Term 2</option>
                    <option value="TERM_3">Term 3</option>
                  </select>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700">3. Upload File</label>
                <div className="relative border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-8 hover:bg-blue-50 transition-colors group text-center cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet className="mx-auto text-blue-400 group-hover:text-blue-500 mb-3 transition-colors" size={48} />
                  {file ? (
                    <p className="text-sm font-bold text-blue-900">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-blue-900">Click or drag to upload .xlsx or .csv data file</p>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg shadow-sm text-xs font-bold text-blue-700 hover:bg-blue-50 transition-all pointer-events-auto" onClick={(e) => { e.stopPropagation(); importMode === 'balances' ? downloadBalanceTemplate() : downloadFeeTemplate(); }}>
                        <Download size={14} /> Download {importMode === 'balances' ? 'Balances' : 'Payments'} Template
                      </div>
                    </>
                  )}
                </div>
                
                {/* Requirement Guide */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <Info size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">Required Columns:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(importMode === 'balances' 
                        ? ['Adm No', 'Billed', 'Paid', 'Balance'] 
                        : ['Adm No', 'Amount', 'Date', 'Reference']
                      ).map(col => (
                        <span key={col} className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-black text-gray-600 shadow-sm">{col}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic font-medium"> Note: Matching is done via Admission Number. Ensure student records already exist.</p>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 font-medium px-1 flex items-center gap-1.5"><X size={16}/>{error}</p>}
              </div>

            </>
          ) : (
            /* Results Screen */
            <div className="space-y-6">
              <div className="p-6 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Import Complete!</h3>
                <p className="text-green-700 font-medium">Successfully processed {results.summary?.totalRows} rows.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Rows</p>
                  <p className="text-2xl font-black text-gray-800">{results.summary?.totalRows || 0}</p>
                </div>
                {importMode === 'balances' ? (
                  <>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                      <p className="text-xs font-bold text-blue-500 uppercase">Created</p>
                      <p className="text-2xl font-black text-blue-700">{results.summary?.created || 0}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <p className="text-xs font-bold text-emerald-500 uppercase">Updated</p>
                      <p className="text-2xl font-black text-emerald-700">{results.summary?.updated || 0}</p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center col-span-2">
                    <p className="text-xs font-bold text-blue-500 uppercase">Payments Processed</p>
                    <p className="text-2xl font-black text-blue-700">{results.summary?.processed || 0}</p>
                  </div>
                )}
                
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                  <p className="text-xs font-bold text-red-500 uppercase">Failed</p>
                  <p className="text-2xl font-black text-red-700">{results.summary?.failed || 0}</p>
                </div>
              </div>

              {results.errors?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-red-800 flex items-center gap-2">
                    <X size={18} className="p-0.5 bg-red-200 rounded-full" />
                    Review Errors (Top 50)
                  </h4>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 h-40 overflow-y-auto">
                    <ul className="text-xs text-red-700 space-y-1.5 list-disc pl-4 font-medium">
                      {results.errors.map((e, idx) => (
                        <li key={idx}>Row {e.row}: {e.error} {e.admNo ? `(Adm: ${e.admNo})` : ''}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            {!results ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-6 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="flex-[2] py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  <span>{loading ? 'Processing Upload...' : 'Upload & Process'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onComplete || onClose}
                className="w-full py-4 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-xl transition-all"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeImportModal;
