import React, { useState, useEffect, useCallback } from 'react';
import { 
  Gift, Search, Filter, CheckCircle, XCircle, Clock, 
  ArrowRight, User, FileText, Loader2, RefreshCw
} from 'lucide-react';
import usePageNavigation from '../../../hooks/usePageNavigation';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import Toast from '../shared/Toast';

const WAIVER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

const WaiversPage = () => {
  const navigateTo = usePageNavigation();
  const { showSuccess, showError, showToast, toastMessage, toastType, hideNotification } = useNotifications();
  
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'PENDING' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedWaiver, setSelectedWaiver] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchWaivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.fees.listWaivers(filters);
      if (response.success) {
        setWaivers(response.data.waivers || []);
      }
    } catch (err) {
      showError('Failed to fetch waivers');
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    fetchWaivers();
  }, [fetchWaivers]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this waiver?')) return;
    setProcessingId(id);
    try {
      const res = await api.fees.approveWaiver(id);
      if (res.success) {
        showSuccess('Waiver approved successfully');
        fetchWaivers();
      }
    } catch (err) {
      showError(err.message || 'Failed to approve waiver');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }
    setProcessingId(id);
    try {
      const res = await api.fees.rejectWaiver(id, { rejectionReason });
      if (res.success) {
        showSuccess('Waiver rejected');
        setSelectedWaiver(null);
        setRejectionReason('');
        fetchWaivers();
      }
    } catch (err) {
      showError(err.message || 'Failed to reject waiver');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-[#002C60] flex items-center gap-2">
            <Gift className="text-[#00A09D]" />
            Fee Waiver Management
          </h1>
          <p className="text-gray-500 text-sm">Review and manage scholarship and financial aid requests</p>
        </div>
        <button 
          onClick={fetchWaivers}
          className="p-2 text-gray-400 hover:text-[#002C60] hover:bg-gray-100 rounded-full transition-all"
          title="Refresh List"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1 max-w-sm">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by student or ADM..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => {
                setFilters(prev => {
                  const newFilters = { ...prev };
                  if (status === 'ALL') {
                    delete newFilters.status;
                  } else {
                    newFilters.status = status;
                  }
                  return newFilters;
                });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                (status === 'ALL' && !filters.status) || filters.status === status
                  ? 'bg-[#002C60] text-white shadow-md'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Waivers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && waivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
            <Loader2 size={40} className="animate-spin text-blue-200" />
            <p className="font-medium">Loading waiver requests...</p>
          </div>
        ) : waivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
            <Gift size={60} className="opacity-10" />
            <p className="font-medium text-lg">No waiver requests found</p>
            <p className="text-sm">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase tracking-wider border-r border-gray-100">Student</th>
                <th className="px-3 py-1.5 text-right text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase tracking-wider border-r border-gray-100">Amount</th>
                <th className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase tracking-wider border-r border-gray-100">Reason</th>
                <th className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase tracking-wider border-r border-gray-100">Status</th>
                <th className="px-3 py-1.5 text-center text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase tracking-wider border-r border-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {waivers.map((waiver) => (
                <tr key={waiver.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-3 py-1.5 border-r border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#002C60] font-medium text-xs border border-blue-100">
                        {waiver.invoice?.learner?.firstName?.charAt(0)}{waiver.invoice?.learner?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 leading-none mb-1">
                          {waiver.invoice?.learner?.firstName} {waiver.invoice?.learner?.lastName}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400 uppercase">
                          ADM: {waiver.invoice?.learner?.admissionNumber} · {waiver.invoice?.learner?.grade}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right border-r border-gray-100">
                    <p className="text-sm font-medium text-[#002C60]">KES {Number(waiver.amountWaived).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 italic font-medium">Original Balance: KES {Number(waiver.invoice?.balance).toLocaleString()}</p>
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-100">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-600 line-clamp-1" title={waiver.reason}>{waiver.reason}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> Requested {new Date(waiver.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-100">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border uppercase ${WAIVER_STATUS_COLORS[waiver.status]}`}>
                      {waiver.status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-100">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => navigateTo('fees-invoice-detail', { invoice: waiver.invoice })}
                        className="p-2 text-gray-400 hover:text-[#002C60] hover:bg-white rounded-lg transition-all"
                        title="View Invoice"
                      >
                        <FileText size={18} />
                      </button>
                      
                      {waiver.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleApprove(waiver.id)}
                            disabled={processingId === waiver.id}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
                            title="Approve"
                          >
                            {processingId === waiver.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                          </button>
                          <button 
                            onClick={() => setSelectedWaiver(waiver)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedWaiver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-medium text-lg">Reject Waiver Request</h3>
              <button onClick={() => setSelectedWaiver(null)} className="hover:bg-white/20 p-1 rounded-lg transition-all"><XCircle /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                <p className="text-sm font-medium text-red-900 mb-1">
                  KES {Number(selectedWaiver.amountWaived).toLocaleString()} Waiver for {selectedWaiver.invoice?.learner?.firstName}
                </p>
                <p className="text-xs text-red-700 italic">This will notify the parent that the request was declined.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">Reason for Rejection *</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  rows="3"
                  placeholder="e.g. Incomplete documentation, ineligible category..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => handleReject(selectedWaiver.id)}
                  disabled={processingId === selectedWaiver.id || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === selectedWaiver.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                  Confirm Rejection
                </button>
                <button 
                  onClick={() => setSelectedWaiver(null)}
                  className="px-6 py-3 border border-gray-200 text-gray-500 font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast show={showToast} message={toastMessage} type={toastType} onClose={hideNotification} />
    </div>
  );
};

export default WaiversPage;

