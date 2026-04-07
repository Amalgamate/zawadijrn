/**
 * Student Fee Statements Page
 * Generate and view individual student fee statements
 */

import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Search, User,
  CheckCircle, AlertCircle, Clock, Printer, Mail, Eye
} from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import { generateStatementPDF } from '../../../utils/simplePdfGenerator';
import { useSchoolData } from '../../../contexts/SchoolDataContext';

const StudentStatementsPage = () => {
  const [learners, setLearners] = useState([]);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [showStatement, setShowStatement] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const { grades: fetchedGrades } = useSchoolData();

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        setLoading(true);
        const response = await api.learners.getAll({ status: 'ACTIVE' });
        setLearners(response.data || []);
      } catch (error) {
        showError('Failed to load students');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLearners();
  }, [showError]);

  const fetchLearnerStatement = async (learnerId) => {
    try {
      setLoading(true);
      const invoicesResponse = await api.fees.getLearnerInvoices(learnerId);
      setInvoices(invoicesResponse.data || []);

      // Extract all payments from invoices
      const allPayments = [];
      invoicesResponse.data?.forEach(invoice => {
        invoice.payments?.forEach(payment => {
          allPayments.push({
            ...payment,
            invoiceNumber: invoice.invoiceNumber,
            feeType: invoice.feeStructure?.name
          });
        });
      });
      setPayments(allPayments);
      setShowStatement(true);
    } catch (error) {
      showError('Failed to load statement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStatement = (learner) => {
    setSelectedLearner(learner);
    fetchLearnerStatement(learner.id);
  };

  const handlePrintStatement = async () => {
    try {
      showSuccess('Opening print preview...');
      const { printWindow } = await import('../../../utils/simplePdfGenerator');
      const result = await printWindow('statement-content');
      if (!result.success) throw new Error(result.error || 'Failed to open print preview');
    } catch (error) {
      showError('Failed to generate print preview');
      console.error(error);
    }
  };

  const handleDownloadStatement = async () => {
    try {
      showSuccess('Generating PDF for download...');
      const filename = `Statement_${selectedLearner?.firstName}_${selectedLearner?.lastName}_${new Date().getFullYear()}.pdf`;
      const result = await generateStatementPDF(selectedLearner, invoices, payments, {
        elementId: 'statement-content',
        fileName: filename,
      });
      if (result.success) {
        showSuccess('Statement downloaded successfully');
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      showError('Failed to download statement');
      console.error(error);
    }
  };

  const handleEmailStatement = async () => {
    if (!selectedLearner) return;
    try {
      showSuccess('Preparing statement for email...');
      // Capture the statement DOM element as a PNG and convert to base64 for the email API
      const { captureElement } = await import('../../../utils/simplePdfGenerator');
      const el = document.getElementById('statement-content');
      if (!el) throw new Error('Statement element not found');
      const canvas = await captureElement(el);
      const base64data = canvas.toDataURL('image/png');
      showSuccess('Sending email...');
      await api.fees.emailStatement(selectedLearner.id, { pdfBase64: base64data });
      showSuccess('Statement sent successfully');
    } catch (error) {
      console.error('Failed to prepare statement:', error);
      showError(error.message || 'Failed to prepare statement for emailing');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      PARTIAL: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Partial' },
      PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
      OVERPAID: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Overpaid' },
      WAIVED: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Waived' }
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

  const filteredLearners = learners.filter(learner => {
    const fullName = `${learner.firstName} ${learner.lastName}`.toLowerCase();
    const admNo = (learner.admissionNumber || learner.admNo || '').toString().toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(lowerTerm) || admNo.includes(lowerTerm);
    const matchesGrade = filterGrade === 'all' || learner.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const calculateTotals = () => {
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const totalBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
    return { totalAmount, totalPaid, totalBalance };
  };

  if (loading && !showStatement) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {!showStatement ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by student name or admission number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Grades</option>
                {fetchedGrades.map(grade => (
                  <option key={grade} value={grade}>{grade.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Students List */}
          {filteredLearners.length === 0 ? (
            <EmptyState
              icon={User}
              title="No Students Found"
              message={searchTerm ? "No students match your search." : "No active students found."}
            />
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-[color:var(--table-border)]">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Student</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Grade</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Admission No.</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLearners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="text-blue-600" size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">
                              {learner.firstName} {learner.lastName}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {learner.parentName || 'No parent linked'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {learner.grade} {learner.stream}
                      </td>
                      <td className="px-4 py-2 text-xs font-medium text-gray-900">
                        {learner.admissionNumber || 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleViewStatement(learner)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs"
                        >
                          <Eye size={14} />
                          View Statement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        // Statement View
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowStatement(false);
                  setSelectedLearner(null);
                  setInvoices([]);
                  setPayments([]);
                }}
                className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition"
              >
                ← Back to Students
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStatement}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50 transition"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  onClick={handleDownloadStatement}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download size={14} />
                  Download PDF
                </button>
                <button
                  onClick={handleEmailStatement}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Mail size={14} />
                  Email
                </button>
              </div>
            </div>
          </div>

          {/* Statement Header */}
          <div id="statement-content" className="bg-white rounded-lg shadow p-4">
            <div className="border-b pb-3 mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Fee Statement</h2>
                  <p className="text-xs text-gray-600">Academic Year {new Date().getFullYear()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-600">Generated on</p>
                  <p className="font-semibold text-xs">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-600 mb-2">Student Details</h3>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-semibold">
                      {selectedLearner?.firstName} {selectedLearner?.lastName}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-600">Admission No:</span>
                    <span className="ml-2 font-semibold">{selectedLearner?.admissionNumber}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-600">Grade:</span>
                    <span className="ml-2 font-semibold">
                      {selectedLearner?.grade} {selectedLearner?.stream}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600 mb-2">Parent/Guardian Details</h3>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-semibold">{selectedLearner?.parentName || 'N/A'}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-semibold">{selectedLearner?.parentPhone || 'N/A'}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-semibold">{selectedLearner?.parentEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 mb-0.5">Total Fees</p>
                <p className="text-lg font-bold text-blue-700">
                  KES {calculateTotals().totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-0.5">Amount Paid</p>
                <p className="text-lg font-bold text-green-700">
                  KES {calculateTotals().totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600 mb-0.5">Balance Due</p>
                <p className="text-lg font-bold text-red-700">
                  KES {calculateTotals().totalBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Fee Invoices</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[color:var(--table-border)]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Invoice #</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Fee Type</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Term</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Amount</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Paid</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Balance</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-3 py-2 text-xs font-medium">{invoice.invoiceNumber}</td>
                        <td className="px-3 py-2 text-xs">{invoice.feeStructure?.name}</td>
                        <td className="px-3 py-2 text-xs">{invoice.feeStructure?.term}</td>
                        <td className="px-3 py-2 text-xs font-semibold">
                          KES {Number(invoice.totalAmount).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs text-green-600">
                          KES {Number(invoice.paidAmount).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs text-red-600 font-semibold">
                          KES {Number(invoice.balance).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{getStatusBadge(invoice.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">Payment History</h3>
              {payments.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-xs">No payments recorded yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[color:var(--table-border)]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Invoice #</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Fee Type</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Amount</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Method</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-xs">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-xs font-medium">{payment.invoiceNumber}</td>
                          <td className="px-3 py-2 text-xs">{payment.feeType}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-green-600">
                            KES {Number(payment.amount).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-xs">{payment.paymentMethod}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {payment.referenceNumber || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-0.5">Note:</p>
            <p>This is an official fee statement. For any inquiries or discrepancies, please contact the accounts office.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentStatementsPage;
