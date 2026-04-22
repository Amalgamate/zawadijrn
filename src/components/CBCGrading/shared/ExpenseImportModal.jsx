import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CreditCard } from 'lucide-react';
import axiosInstance from '../../../services/api/index';

const ExpenseImportModal = ({ isOpen, onClose, onComplete }) => {
  const [file, setFile] = useState(null);
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

    try {
      const response = await axiosInstance.post('/bulk/accounting/expenses/upload', formData, {
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
        <div className="bg-gradient-to-r from-teal-700 to-teal-900 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 flex items-center justify-center rounded-lg">
              <Upload size={24} className="text-teal-100" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Import Expenses</h2>
              <p className="text-teal-200 text-sm">Upload Petty Cash & Operations Logs (.xlsx / .csv)</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {!results ? (
            <>
              {/* File Upload Area */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Upload Expense File</label>
                <div className="relative border-2 border-dashed border-teal-200 bg-teal-50/50 rounded-xl p-8 hover:bg-teal-50 transition-colors group text-center cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet className="mx-auto text-teal-400 group-hover:text-teal-500 mb-3 transition-colors" size={48} />
                  <p className="text-sm font-medium text-teal-900">
                    {file ? file.name : "Click or drag to upload .xlsx or .csv data file"}
                  </p>
                  {!file && (
                    <p className="text-xs text-teal-600/70 mt-2">
                       Expects columns: Date, Description, Amount, Category, Vendor
                    </p>
                  )}
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
                <h3 className="text-xl font-medium text-green-900 mb-2">Import Complete!</h3>
                <p className="text-green-700 font-medium">Successfully processed {results.summary?.totalRows} rows.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center col-span-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Total Rows</p>
                  <p className="text-2xl font-semibold text-gray-800">{results.summary?.totalRows || 0}</p>
                </div>
              
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <p className="text-xs font-medium text-blue-500 uppercase">Processed</p>
                  <p className="text-2xl font-semibold text-blue-700">{results.summary?.processed || 0}</p>
                </div>
                
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                  <p className="text-xs font-medium text-red-500 uppercase">Failed</p>
                  <p className="text-2xl font-semibold text-red-700">{results.summary?.failed || 0}</p>
                </div>
              </div>

              {results.errors?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800 flex items-center gap-2">
                    <X size={18} className="p-0.5 bg-red-200 rounded-full" />
                    Review Errors (Top 50)
                  </h4>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 h-40 overflow-y-auto">
                    <ul className="text-xs text-red-700 space-y-1.5 list-disc pl-4 font-medium">
                      {results.errors.map((e, idx) => (
                        <li key={idx}>Row {e.row}: {e.error}</li>
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
                  className="flex-1 py-3.5 px-6 rounded-xl font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="flex-[2] py-3.5 px-6 rounded-xl font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  <span>{loading ? 'Processing Upload...' : 'Upload Expenses'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onComplete || onClose}
                className="w-full py-4 rounded-xl font-medium text-white bg-gray-900 hover:bg-black shadow-xl transition-all"
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

export default ExpenseImportModal;
