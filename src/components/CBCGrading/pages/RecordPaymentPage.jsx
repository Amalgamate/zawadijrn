/**
 * Record Payment Page
 * Full-page payment recording — replaces the former modal.
 *
 * CHANGES FROM ORIGINAL:
 *  - notes is no longer required (was crashing with null validation)
 *  - success toast now tells staff if note was saved and where to find it
 *  - after success, navigates to invoice detail so they can see the history
 */

import React, { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import usePageNavigation from '../../../hooks/usePageNavigation';
import { useNotifications } from '../hooks/useNotifications';
import Toast from '../shared/Toast';
import api from '../../../services/api';

const RecordPaymentPage = ({ invoice }) => {
  const navigateTo = usePageNavigation();
  const { showSuccess, showError, showToast, toastMessage, toastType, hideNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: invoice?.balance ?? '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: ''
  });
  // After success we show an inline confirmation panel before navigating
  const [successResult, setSuccessResult] = useState(null);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
        <p className="text-lg font-semibold">No invoice selected.</p>
        <button
          onClick={() => navigateTo('fees-collection')}
          className="flex items-center gap-2 px-4 py-2 bg-[#002C60] text-white rounded-lg font-semibold hover:bg-[#003a7a] transition"
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>
      </div>
    );
  }

  const handleRecordPayment = async () => {
    if (!paymentData.amount) {
      showError('Please enter a payment amount');
      return;
    }
    if (paymentData.paymentMethod === 'MPESA' && !paymentData.referenceNumber) {
      showError('M-Pesa reference number is required');
      return;
    }
    if (paymentData.paymentMethod === 'CHEQUE' && !paymentData.referenceNumber) {
      showError('Cheque number is required');
      return;
    }

    const noteSaved = paymentData.notes && paymentData.notes.trim().length > 0;

    try {
      setLoading(true);
      const result = await api.fees.recordPayment({
        invoiceId: invoice.id,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber || null,
        notes: paymentData.notes?.trim() || null   // ← send null when empty, never crash
      });

      setSuccessResult({ data: result.data, noteSaved });

      // Navigate to invoice detail after a short pause so staff can read confirmation
      setTimeout(() => navigateTo('fees-invoice-detail', { invoice }), 2800);
    } catch (error) {
      showError(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // ── Success confirmation panel ──────────────────────────────
  if (successResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12 pt-8">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 flex flex-col items-center text-center space-y-4 shadow-sm">
          <CheckCircle2 size={56} className="text-green-500" />
          <h2 className="text-2xl font-bold text-green-800">Payment Recorded!</h2>
          <p className="text-green-700 font-semibold">
            KES {Number(paymentData.amount).toLocaleString()} recorded via{' '}
            {paymentData.paymentMethod.replace('_', ' ')}.
          </p>
          <p className="text-sm text-green-600">
            Receipt #{successResult.data?.payment?.receiptNumber}
          </p>

          {successResult.noteSaved ? (
            <div className="flex items-start gap-2 bg-white border border-green-200 rounded-xl px-4 py-3 text-left w-full mt-2">
              <MessageSquare size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Note saved ✓</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Your note was saved with this payment. You can view it in the{' '}
                  <span className="font-semibold">Invoice Detail → Activity</span> section.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No note was added for this payment.</p>
          )}

          <p className="text-xs text-gray-400 mt-2">Returning to invoice detail…</p>
        </div>
      </div>
    );
  }

  // ── Normal form ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back link */}
      <button
        onClick={() => navigateTo('fees-invoice-detail', { invoice })}
        className="flex items-center gap-2 text-gray-500 hover:text-[#002C60] font-semibold transition-colors"
      >
        <ArrowLeft size={20} /> Back to Invoice
      </button>

      {/* Page Header */}
      <div className="bg-green-600 rounded-2xl px-8 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Record Payment</h1>
        <p className="text-green-100 text-sm mt-1">{invoice.invoiceNumber}</p>
      </div>

      {/* Invoice Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Invoice Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm pt-1">
          <div>
            <span className="text-gray-500">Student:</span>
            <span className="ml-2 font-semibold text-gray-800">
              {invoice.learner?.firstName} {invoice.learner?.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Invoice #:</span>
            <span className="ml-2 font-semibold">{invoice.invoiceNumber}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Amount:</span>
            <span className="ml-2 font-semibold">KES {Number(invoice.totalAmount).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Amount Paid:</span>
            <span className="ml-2 font-semibold text-green-600">KES {Number(invoice.paidAmount).toLocaleString()}</span>
          </div>
          <div className="col-span-2 pt-1 border-t border-gray-100">
            <span className="text-gray-500">Outstanding Balance:</span>
            <span className="ml-2 font-bold text-red-600 text-xl">
              KES {Number(invoice.balance).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Payment Information</h2>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Amount to Pay *</label>
          <input
            type="number"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-lg font-semibold"
            placeholder="Enter amount"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Payment Method *</label>
          <select
            value={paymentData.paymentMethod}
            onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          >
            <option value="CASH">Cash</option>
            <option value="MPESA">M-Pesa</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
          </select>
        </div>

        {paymentData.paymentMethod !== 'CASH' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-semibold text-gray-700">
              {paymentData.paymentMethod === 'CHEQUE' ? 'Cheque Number *' : `Reference Number${paymentData.paymentMethod === 'MPESA' ? ' *' : ''}`}
            </label>
            <input
              type="text"
              value={paymentData.referenceNumber}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder={
                paymentData.paymentMethod === 'MPESA' ? 'M-Pesa transaction code' : 
                paymentData.paymentMethod === 'CHEQUE' ? 'Enter cheque number' : 
                'Reference number (optional)'
              }
            />
          </div>
        )}

        {/* Notes — clearly optional, with helper text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">
              Notes
              <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            {paymentData.notes?.trim() && (
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <MessageSquare size={12} /> Will be saved with payment
              </span>
            )}
          </div>
          <textarea
            value={paymentData.notes}
            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
            rows={3}
            placeholder="e.g. Parent paid in two instalments, partial for term 1..."
          />
          <p className="text-xs text-gray-400">
            Notes are saved with the payment receipt. View them in the invoice Activity tab.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRecordPayment}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Processing...' : 'Record Payment'}
          </button>
          <button
            onClick={() => navigateTo('fees-invoice-detail', { invoice })}
            className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      <Toast show={showToast} message={toastMessage} type={toastType} onClose={hideNotification} />
    </div>
  );
};

export default RecordPaymentPage;
