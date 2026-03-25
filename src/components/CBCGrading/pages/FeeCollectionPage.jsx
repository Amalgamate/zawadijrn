/**
 * Fee Collection Page
 * Record payments and view invoices
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Eye, Trash2, CheckCircle, AlertCircle, Clock, FileText, Download,
  X, Loader2, MessageSquare, Phone, Send, Info, Calendar, User, ShieldCheck, Mail
} from 'lucide-react';
import { generateDocument } from '../../../utils/simplePdfGenerator';
import EmptyState from '../shared/EmptyState';
import Toast from '../shared/Toast';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { toInputDate } from '../utils/dateHelpers';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';

const FeeCollectionPage = ({ learnerId }) => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'fetching', qrCode: null });
  const [allLearners, setAllLearners] = useState([]);
  const [searchLearnerId, setSearchLearnerId] = useState(learnerId || null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { showSuccess, showError, showToast, toastMessage, toastType, hideNotification } = useNotifications();
  const { user } = useAuth();

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: ''
  });

  // Update learner search if prop changes
  useEffect(() => {
    if (learnerId) {
      setSearchLearnerId(learnerId);
    }
  }, [learnerId]);

  const fetchInvoices = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter.toUpperCase() } : {};
      const response = await api.fees.getAllInvoices(params);
      setInvoices(response.data || []);
    } catch (error) {
      showError('Failed to load invoices');
      console.error(error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showError]);

  const fetchLearners = React.useCallback(async () => {
    try {
      const response = await api.learners.getAll({ status: 'ACTIVE' });
      setAllLearners(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load learners:', error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchLearners();
  }, [fetchInvoices, fetchLearners]);

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentData.amount) {
      showError('Please enter payment amount');
      return;
    }

    try {
      await api.fees.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber || null,
        notes: paymentData.notes || null
      });

      showSuccess('Payment recorded successfully!');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: '', paymentMethod: 'CASH', referenceNumber: '', notes: '' });
      fetchInvoices();
    } catch (error) {
      showError(error.message || 'Failed to record payment');
    }
  };

  const handleDownloadPdf = async (invoice) => {
    const isPaid = ['PAID', 'OVERPAID', 'WAIVED'].includes(invoice.status);
    const docType = isPaid ? 'OFFICIAL RECEIPT' : 'FEE INVOICE';
    const docRef = isPaid ? `RCT-${invoice.invoiceNumber}` : `INV-${invoice.invoiceNumber}`;
    const filename = isPaid ? `Receipt_${invoice.invoiceNumber}.pdf` : `Invoice_${invoice.invoiceNumber}.pdf`;

    const rowItems = invoice.feeStructure?.items?.length
      ? invoice.feeStructure.items
      : (invoice.items || [{ name: 'School Fees', amount: invoice.totalAmount, mandatory: true }]);

    const html = `
      <div style="margin-bottom: 30px; display: flex; justify-content: space-between; background: #f8fafc; padding: 20px; border-radius: 8px;">
        <div>
          <p style="font-size: 10px; font-weight: 800; color: #64748b; margin: 0 0 5px 0; text-transform: uppercase;">Bill To:</p>
          <p style="font-size: 14px; font-weight: 800; margin: 0; color: #1e293b;">${(invoice.learner?.firstName || '')} ${(invoice.learner?.lastName || '')}</p>
          <p style="font-size: 12px; color: #64748b; margin: 3px 0;">ADM: ${invoice.learner?.admissionNumber || '-'}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Class: ${(invoice.learner?.grade || '').replace(/_/g, ' ')}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 10px; font-weight: 800; color: #64748b; margin: 0 0 5px 0; text-transform: uppercase;">Details:</p>
          <p style="font-size: 12px; color: #1e293b; margin: 0;">Term: ${(invoice.term || '').replace(/_/g, ' ')} ${invoice.academicYear || ''}</p>
          <p style="font-size: 12px; color: #1e293b; margin: 3px 0;">Issued: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-GB')}</p>
          <p style="font-size: 12px; font-weight: 700; color: ${isPaid ? '#16a34a' : '#dc2626'}; margin: 0;">Status: ${invoice.status}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Description</th>
            <th style="width: 100px; text-align: center;">Type</th>
            <th style="width: 150px; text-align: right;">Amount (KES)</th>
          </tr>
        </thead>
        <tbody>
          ${rowItems.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td style="font-weight: 600;">${item.name || item.description || 'General Fees'}</td>
              <td style="text-align: center; font-size: 10px; color: #64748b;">${item.mandatory !== false ? 'MANDATORY' : 'OPTIONAL'}</td>
              <td style="text-align: right; font-weight: 700;">${Number(item.amount || 0).toLocaleString('en-KE')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 30px; display: flex; justify-content: flex-end;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; color: #64748b; font-size: 12px;">
            <span>Subtotal Charged:</span>
            <span>KES ${Number(invoice.totalAmount || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; color: #16a34a; font-size: 12px; font-weight: 600;">
            <span>Total Paid:</span>
            <span>KES ${Number(invoice.paidAmount || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #e2e8f0; margin-top: 5px; color: ${Number(invoice.balance || 0) <= 0 ? '#16a34a' : '#dc2626'}; font-size: 16px; font-weight: 800;">
            <span>BALANCE DUE:</span>
            <span>KES ${Number(invoice.balance || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;

    await generateDocument({
      html,
      fileName: filename,
      docInfo: { type: docType, ref: docRef },
      includeStamp: true,
      stampOptions: {
        status: isPaid ? 'PAID' : 'APPROVED',
        dept: 'FINANCE OFFICE'
      },
      includeLetterhead: false
    });
  };
  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      PARTIAL: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Partial' },
      PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
      OVERPAID: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Overpaid' },
      WAIVED: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: 'Waived' }
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };



  const filteredInvoices = React.useMemo(() => invoices.filter(invoice => {
    if (!searchLearnerId) return true;
    return invoice.learner?.id === searchLearnerId;
  }), [invoices, searchLearnerId]);

  // Create Invoice State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feeStructures, setFeeStructures] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    learnerId: '',
    feeStructureId: '',
    term: 'TERM_1',
    academicYear: new Date().getFullYear(),
    dueDate: new Date().toISOString().split('T')[0],
    includeTransport: true
  });

  // Fetch fee structures when modal opens
  useEffect(() => {
    if (showCreateModal) {
      const loadFeeStructures = async () => {
        try {
          const response = await api.fees.getAllFeeStructures({ status: 'ACTIVE' });
          setFeeStructures(response.data || []);
        } catch (error) {
          console.error('Failed to load fee structures:', error);
          showError('Failed to load fee structures');
        }
      };
      loadFeeStructures();
    }
  }, [showCreateModal, showError]);

  // Auto-select Fee Structure based on Learner, Term, and Year
  useEffect(() => {
    const learnerId = newInvoice.learnerId || searchLearnerId;

    if (showCreateModal && learnerId && feeStructures.length > 0) {
      // Find the learner to get their grade
      const learner = allLearners.find(l => l.id === learnerId);

      if (learner) {
        // Find matching fee structure
        // Match: Grade AND Term AND Year
        const matchedStructure = feeStructures.find(fs =>
          fs.grade === learner.grade &&
          fs.term === newInvoice.term &&
          Number(fs.academicYear) === Number(newInvoice.academicYear)
        );

        if (matchedStructure) {
          setNewInvoice(prev => {
            if (prev.feeStructureId !== matchedStructure.id) {
              return { ...prev, feeStructureId: matchedStructure.id };
            }
            return prev;
          });
        } else {
          // Optional: Clear selection if no match found for the new combination
          // This prevents submitting an invalid mismatch
          setNewInvoice(prev => {
            if (prev.feeStructureId !== '') {
              return { ...prev, feeStructureId: '' };
            }
            return prev;
          });
        }
      }
    }
  }, [showCreateModal, newInvoice.learnerId, searchLearnerId, newInvoice.term, newInvoice.academicYear, feeStructures, allLearners]);

  const handleCreateInvoice = async () => {
    const targetLearnerId = newInvoice.learnerId || searchLearnerId;
    if (!targetLearnerId) {
      showError('Please select a student');
      return;
    }
    if (!newInvoice.feeStructureId || !newInvoice.term || !newInvoice.dueDate) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.fees.createInvoice({
        ...newInvoice,
        learnerId: targetLearnerId
      });
      showSuccess('Invoice created successfully');
      setShowCreateModal(false);
      fetchInvoices();
      // Reset form (keep year and term defaults)
      setNewInvoice(prev => ({
        ...prev,
        learnerId: '',
        feeStructureId: '',
        includeTransport: true
      }));
    } catch (error) {
      console.error('Invoice Creation Error:', error);
      showError(error.message || 'Failed to create invoice');
    } finally {
      // Ensure loading is ALWAYS turned off
      setLoading(false);
    }
  };

  const handleSendReminder = async (invoice, channel) => {
    try {
      setLoading(true);
      const result = await api.fees.sendReminder(invoice.id, { channel });

      // The backend might return 200 but with partial failures in results
      if (result.success) {
        const smsStatus = result.data?.sms;
        const waStatus = result.data?.whatsapp;

        if (channel === 'SMS' && smsStatus?.startsWith('Failed')) {
          showError(`SMS Failed: ${smsStatus}`);
        } else if (channel === 'WHATSAPP' && waStatus?.startsWith('Failed')) {
          showError(`WhatsApp Failed: ${waStatus}`);
        } else {
          showSuccess(`Reminder sent via ${channel}`);
        }
      }
    } catch (error) {
      console.error('Reminder Error:', error);
      showError(error.message || 'Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      const status = await api.notifications.getWhatsAppStatus();
      setWhatsappStatus(status);
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error);
    }
  };

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  useEffect(() => {
    if (showDetailModal) {
      checkWhatsAppStatus();
    }
  }, [showDetailModal]);

  const handleBulkReminders = async (channel) => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      setLoading(true);
      await api.fees.bulkSendReminders({ invoiceIds: selectedInvoiceIds, channel });
      showSuccess(`Bulk reminder process started via ${channel}`);
      setSelectedInvoiceIds([]);
    } catch (error) {
      showError(error.message || 'Failed to send bulk reminders');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
    }
  };

  const toggleSelectInvoice = (id) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleResetInvoices = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL invoices and payments for the entire school.\nThis action cannot be undone.\n\nAre you sure you want to reset invoices?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.fees.resetInvoices();
      showSuccess(result.message || 'Invoices reset successfully');
      fetchInvoices();
    } catch (error) {
      showError(error.message || 'Failed to reset invoices');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showCreateModal && !showPaymentModal) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... (existing stats cards) ... */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {invoices.filter(i => i.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partial Payments</p>
              <p className="text-2xl font-bold text-blue-600">
                {invoices.filter(i => i.status === 'PARTIAL').length}
              </p>
            </div>
            <AlertCircle className="text-blue-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fully Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter(i => i.status === 'PAID').length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <div className="relative z-40">
              <SmartLearnerSearch
                learners={allLearners}
                selectedLearnerId={searchLearnerId}
                onSelect={setSearchLearnerId}
                placeholder="Search invoices by student..."
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            Create Invoice
          </button>

          <button
            onClick={handleResetInvoices}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2 whitespace-nowrap"
            title="Delete ALL invoices and payments"
          >
            <Trash2 size={18} />
            Reset Invoices
          </button>

        </div>
      </div>

      {/* Invoices Table */}
      {/* ... (existing table code) ... */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Invoices Found"
          message={searchLearnerId ? "No invoices found for selected learner." : "No invoices have been created yet."}
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Create Invoice
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvoiceIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Fee Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-50/50' : ''}`}
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setShowDetailModal(true);
                  }}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.includes(invoice.id)}
                      onChange={() => toggleSelectInvoice(invoice.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {invoice.learner?.firstName} {invoice.learner?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{invoice.learner?.admissionNumber}</p>
                      <p className="text-xs text-gray-500">{invoice.learner?.grade} {invoice.learner?.stream}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.feeStructure?.name}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    KES {Number(invoice.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    KES {Number(invoice.paidAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600">
                    KES {Number(invoice.balance).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {invoice.status !== 'PAID' && invoice.status !== 'WAIVED' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentData({ ...paymentData, amount: invoice.balance });
                            setShowPaymentModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Record Payment"
                        >
                          <Plus size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadPdf(invoice)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedInvoiceIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-bounce-in">
          <span className="font-semibold">{selectedInvoiceIds.length} Invoices selected</span>
          <div className="h-6 w-px bg-gray-700" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Send Reminders:</span>
            <button
              onClick={() => handleBulkReminders('SMS')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-full text-sm font-bold transition-all"
            >
              <FileText size={16} /> SMS
            </button>
            <button
              onClick={() => handleBulkReminders('WHATSAPP')}
              disabled={loading || whatsappStatus.status !== 'authenticated'}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${whatsappStatus.status === 'authenticated' ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
              title={whatsappStatus.status !== 'authenticated' ? 'WhatsApp not authenticated' : 'Send Bulk WhatsApp Reminders'}
            >
              <CheckCircle size={16} /> WhatsApp
            </button>
          </div>
          <button
            onClick={() => setSelectedInvoiceIds([])}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header - Matching Bulk Operations */}
            <div className="bg-[var(--brand-purple)] px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">Create New Invoice</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Student Selection Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Student *</label>
                {!searchLearnerId ? (
                  <select
                    value={newInvoice.learnerId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, learnerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A09D] focus:border-transparent transition-all"
                  >
                    <option value="">Select Student</option>
                    {allLearners.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.firstName} {l.lastName} ({l.admissionNumber})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">
                        {allLearners.find(l => l.id === searchLearnerId)?.firstName} {allLearners.find(l => l.id === searchLearnerId)?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {allLearners.find(l => l.id === searchLearnerId)?.admissionNumber}
                      </span>
                    </div>
                    <button
                      onClick={() => setSearchLearnerId(null)}
                      className="text-[#00A09D] text-xs font-bold hover:underline transition-all"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Fee Structure Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Fee Structure *</label>
                <select
                  value={newInvoice.feeStructureId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, feeStructureId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A09D] focus:border-transparent transition-all"
                >
                  <option value="">Select Fee Structure</option>
                  {feeStructures
                    .filter(fs => {
                      const lId = newInvoice.learnerId || searchLearnerId;
                      const learner = allLearners.find(l => l.id === lId);
                      return !learner || fs.grade === learner.grade;
                    })
                    .map(fs => (
                      <option key={fs.id} value={fs.id}>
                        {fs.grade.replace(/_/g, ' ')} - {fs.term.replace(/_/g, ' ')} ({fs.academicYear})
                      </option>
                    ))}
                </select>
                {feeStructures.filter(fs => {
                  const lId = newInvoice.learnerId || searchLearnerId;
                  const learner = allLearners.find(l => l.id === lId);
                  return learner && fs.grade === learner.grade;
                }).length === 0 && (newInvoice.learnerId || searchLearnerId) && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase">
                      No matching fee structure found for student grade.
                    </p>
                  )}
              </div>

              {/* Enhanced Transport Checkbox Selection Area */}
              <div className="flex items-center gap-3 p-4 bg-[#00A09D]/5 border border-[#00A09D]/20 rounded-xl transition-all hover:bg-[#00A09D]/10">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="includeTransport"
                    checked={newInvoice.includeTransport}
                    onChange={(e) => setNewInvoice({ ...newInvoice, includeTransport: e.target.checked })}
                    className="w-5 h-5 text-[#00A09D] border-gray-300 rounded focus:ring-[#00A09D] cursor-pointer transition-all"
                  />
                </div>
                <label htmlFor="includeTransport" className="flex flex-col cursor-pointer">
                  <span className="text-sm font-bold text-[#00706e]">Include Transport Fees</span>
                  <span className="text-[10px] text-gray-500">Enable this if student uses school transport</span>
                </label>
              </div>

              {/* Form Grid for Term/Year/Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Term *</label>
                  <select
                    value={newInvoice.term}
                    onChange={(e) => setNewInvoice({ ...newInvoice, term: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A09D] text-sm"
                  >
                    <option value="TERM_1">Term 1</option>
                    <option value="TERM_2">Term 2</option>
                    <option value="TERM_3">Term 3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Year *</label>
                  <input
                    type="number"
                    value={newInvoice.academicYear}
                    onChange={(e) => setNewInvoice({ ...newInvoice, academicYear: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A09D] text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date *</label>
                  <input
                    type="date"
                    value={toInputDate(newInvoice.dueDate)}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A09D] text-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateInvoice}
                  disabled={loading}
                  className="flex-1 bg-[#00A09D] text-white px-6 py-3 rounded-xl hover:bg-[#008c89] hover:shadow-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  <span>{loading ? 'Processing...' : 'Create Invoice'}</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-green-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Record Payment</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Invoice Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Invoice Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Student:</span>
                    <span className="ml-2 font-semibold">
                      {selectedInvoice.learner?.firstName} {selectedInvoice.learner?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Invoice #:</span>
                    <span className="ml-2 font-semibold">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-semibold">KES {Number(selectedInvoice.totalAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="ml-2 font-semibold text-green-600">KES {Number(selectedInvoice.paidAmount).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Outstanding Balance:</span>
                    <span className="ml-2 font-bold text-red-600 text-lg">
                      KES {Number(selectedInvoice.balance).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div>
                <label className="block text-sm font-semibold mb-2">Amount to Pay *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter amount"
                  step="0.01"
                  max={selectedInvoice.balance}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Payment Method *</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Reference Number {paymentData.paymentMethod === 'MPESA' && '*'}
                </label>
                <input
                  type="text"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={paymentData.paymentMethod === 'MPESA' ? 'M-Pesa transaction code' : 'Reference number (optional)'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRecordPayment}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentData({ amount: '', paymentMethod: 'CASH', referenceNumber: '', notes: '' });
                  }}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Elegant Header */}
            <div className="bg-[#002C60] px-8 py-6 flex justify-between items-center text-white relative">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">Invoice Details</h3>
                <p className="text-blue-200 text-sm font-medium uppercase tracking-widest">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="hover:bg-white/10 p-2 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
              {/* Top Quick Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Due</span>
                  <span className="text-lg font-bold text-gray-900">KES {Number(selectedInvoice.totalAmount).toLocaleString()}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Paid</span>
                  <span className="text-lg font-bold text-green-600">KES {Number(selectedInvoice.paidAmount).toLocaleString()}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Balance</span>
                  <span className="text-lg font-bold text-rose-600">KES {Number(selectedInvoice.balance).toLocaleString()}</span>
                </div>
              </div>

              {/* Student & Parent Info */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#002C60] font-bold text-xs uppercase tracking-wider">
                    <User size={14} /> Student Information
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                    <p className="font-bold text-gray-900">{selectedInvoice.learner?.firstName} {selectedInvoice.learner?.lastName}</p>
                    <p className="text-sm text-gray-500">ADM: {selectedInvoice.learner?.admissionNumber}</p>
                    <p className="text-sm text-gray-500">Grade: {selectedInvoice.learner?.grade} {selectedInvoice.learner?.stream}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#002C60] font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck size={14} /> Parent/Guardian
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-1">
                    <p className="font-bold text-gray-900">{selectedInvoice.learner?.primaryContactName || 'N/A'}</p>
                    <p className="text-sm text-green-600 font-medium">Phone: {selectedInvoice.learner?.primaryContactPhone || selectedInvoice.learner?.guardianPhone || 'N/A'}</p>
                    <p className="text-xs text-gray-400 italic">Preferred contact for reminders</p>
                  </div>
                </div>
              </div>

              {/* Invoice Specifics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#002C60] font-bold text-xs uppercase tracking-wider">
                  <Info size={14} /> Billing Details
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Term</span>
                      <span className="text-sm font-semibold">{selectedInvoice.term} {selectedInvoice.academicYear}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Due Date</span>
                      <span className="text-sm font-semibold text-rose-500">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Structure</span>
                      <span className="text-sm font-semibold truncate max-w-[120px]">{selectedInvoice.feeStructure?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Issued On</span>
                      <span className="text-sm font-semibold">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar inside Modal */}
              <div className="pt-4 flex gap-3">
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => handleSendReminder(selectedInvoice, 'SMS')}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <MessageSquare size={16} /> Send SMS
                  </button>
                  <button
                    onClick={() => handleSendReminder(selectedInvoice, 'WHATSAPP')}
                    disabled={loading || whatsappStatus.status !== 'authenticated'}
                    className={`flex-1 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 ${whatsappStatus.status === 'authenticated' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    title={whatsappStatus.status !== 'authenticated' ? 'WhatsApp not authenticated. Go to settings to scan QR code.' : 'Send WhatsApp Reminder'}
                  >
                    <Phone size={16} /> WhatsApp
                  </button>
                </div>
                <button
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  className="bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 transition-all font-bold tooltip"
                  title="Download PDF Invoice"
                >
                  <Download size={20} />
                </button>
                {selectedInvoice.status !== 'PAID' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setPaymentData({ ...paymentData, amount: selectedInvoice.balance });
                      setShowPaymentModal(true);
                    }}
                    className="bg-[#002C60] text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-100/50 px-8 py-4 text-[10px] text-gray-400 text-center font-medium letter-spacing-wider">
              OFFICIAL FINANCIAL DOCUMENT - ZAWADI SMS CORE UNIT
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={hideNotification}
      />
    </div>
  );
};

export default FeeCollectionPage;
