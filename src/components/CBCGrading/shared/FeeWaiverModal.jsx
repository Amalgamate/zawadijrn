/**
 * Fee Waiver Modal Component
 * Allows staff to create and manage fee waiver requests
 */

import React, { useState, useEffect } from 'react';
import {
  FileText, X, CheckCircle, AlertCircle, Loader2, RefreshCw, ThumbsUp, ThumbsDown
} from 'lucide-react';
import Toast from './Toast';
import api from '../../../services/api';

const FeeWaiverModal = ({ invoice, isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [formData, setFormData] = useState({
    amountWaived: '',
    reason: '',
    waiverCategory: 'OTHER'
  });
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedWaiverId, setSelectedWaiverId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen && invoice) {
      fetchWaivers();
      setFormData({
        amountWaived: '',
        reason: '',
        waiverCategory: 'OTHER'
      });
    }
  }, [isOpen, invoice]);

  const fetchWaivers = async () => {
    try {
      setLoading(true);
      const response = await api.fees.listWaivers({
        invoiceId: invoice.id
      });
      setWaivers(response.data?.waivers || []);
    } catch (error) {
      console.error('Failed to fetch waivers:', error);
      setToast({
        type: 'error',
        message: 'Failed to load waivers'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWaiver = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amountWaived);
      
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (amount > Number(invoice.balanceAmount)) {
        throw new Error(`Amount cannot exceed balance of KES ${invoice.balanceAmount}`);
      }

      if (formData.reason.length < 5) {
        throw new Error('Reason must be at least 5 characters');
      }

      const response = await api.fees.createWaiver({
        invoiceId: invoice.id,
        amountWaived: amount,
        reason: formData.reason,
        waiverCategory: formData.waiverCategory
      });

      setToast({
        type: 'success',
        message: 'Fee waiver request created successfully'
      });

      setFormData({
        amountWaived: '',
        reason: '',
        waiverCategory: 'OTHER'
      });
      setActiveTab('history');

      await fetchWaivers();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating waiver:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to create waiver'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWaiver = async (waiverId) => {
    if (!window.confirm('Approve this fee waiver?')) return;

    setLoading(true);
    try {
      await api.fees.approveWaiver(waiverId);
      setToast({
        type: 'success',
        message: 'Fee waiver approved successfully'
      });
      await fetchWaivers();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error approving waiver:', error);
      setToast({
        type: 'error',
        message: 'Failed to approve waiver'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWaiver = async (waiverId) => {
    if (!rejectionReason.trim()) {
      setToast({
        type: 'error',
        message: 'Rejection reason is required'
      });
      return;
    }

    if (!window.confirm('Reject this fee waiver?')) return;

    setLoading(true);
    try {
      await api.fees.rejectWaiver(waiverId, {
        rejectionReason: rejectionReason
      });
      setToast({
        type: 'success',
        message: 'Fee waiver rejected successfully'
      });
      setRejectionReason('');
      setSelectedWaiverId(null);
      await fetchWaivers();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error rejecting waiver:', error);
      setToast({
        type: 'error',
        message: 'Failed to reject waiver'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' }
    };
    const badge = badges[status] || badges.PENDING;
    return badge;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <div>
              <h2 className="text-lg font-bold">Fee Waivers</h2>
              <p className="text-sm text-blue-100">Invoice: {invoice?.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-blue-600 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toast notification */}
        {toast && (
          <div className={`p-4 mb-4 mx-6 mt-4 rounded-lg ${
            toast.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          } flex items-center gap-2`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 font-medium text-center transition ${
              activeTab === 'create'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Create Waiver
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 font-medium text-center transition ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            History ({waivers.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Create Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateWaiver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Waive (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={invoice?.balanceAmount}
                  value={formData.amountWaived}
                  onChange={(e) => setFormData({...formData, amountWaived: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Balance: KES {Number(invoice?.balanceAmount || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.waiverCategory}
                  onChange={(e) => setFormData({...formData, waiverCategory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="OTHER">Other</option>
                  <option value="HARDSHIP">Financial Hardship</option>
                  <option value="DISABILITY">Disability Support</option>
                  <option value="SCHOLARSHIP">Scholarship/Award</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Waiver *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Explain why this waiver is being requested..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 5 characters required
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Submit Waiver Request
              </button>
            </form>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {loading && <div className="text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>}
              
              {!loading && waivers.length === 0 && (
                <p className="text-center text-gray-500 py-8">No waivers yet</p>
              )}

              {!loading && waivers.map((waiver) => (
                <div key={waiver.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        KES {Number(waiver.amountWaived).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {waiver.waiverCategory}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(waiver.status).bg} ${getStatusBadge(waiver.status).text}`}>
                      {getStatusBadge(waiver.status).icon} {waiver.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Reason:</strong> {waiver.reason}
                  </p>

                  {waiver.rejectionReason && (
                    <p className="text-sm text-red-700 mb-3 bg-red-50 p-2 rounded">
                      <strong>Rejection:</strong> {waiver.rejectionReason}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Requested: {new Date(waiver.createdAt).toLocaleDateString()}
                    </span>
                    {waiver.approvedAt && (
                      <span>
                        {waiver.status === 'APPROVED' ? 'Approved' : 'Decided'}: {new Date(waiver.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Action buttons for PENDING waivers */}
                  {waiver.status === 'PENDING' && (
                    <div className="mt-4 space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveWaiver(waiver.id)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                        >
                          <ThumbsUp size={16} /> Approve
                        </button>
                        <button
                          onClick={() => setSelectedWaiverId(selectedWaiverId === waiver.id ? null : waiver.id)}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                        >
                          <ThumbsDown size={16} /> Reject
                        </button>
                      </div>

                      {selectedWaiverId === waiver.id && (
                        <div className="mt-2 p-3 border border-red-200 bg-red-50 rounded-lg">
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection..."
                            rows="2"
                            className="w-full px-2 py-1 border border-red-300 rounded text-sm focus:ring-2 focus:ring-red-500"
                          />
                          <button
                            onClick={() => handleRejectWaiver(waiver.id)}
                            disabled={loading}
                            className="mt-2 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-sm font-medium transition"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-2 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeWaiverModal;
