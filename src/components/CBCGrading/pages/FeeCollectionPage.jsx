/**
 * Fee Collection Page
 * Record payments and view invoices
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Eye, CheckCircle, AlertCircle, Clock, FileText, Download,
  X, Loader2, MessageSquare, Phone, Info, User, ShieldCheck, Mail, Upload,
  RefreshCw, Trash2, Gift, ThumbsUp, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { generateDocument } from '../../../utils/simplePdfGenerator';
import EmptyState from '../shared/EmptyState';
import Toast from '../shared/Toast';
import LoadingSpinner from '../shared/LoadingSpinner';
import ThermalReceipt from '../shared/ThermalReceipt';
import '../../../styles/receipt-print.css';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import { toInputDate } from '../utils/dateHelpers';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';
import FeeImportModal from '../shared/FeeImportModal';
import FeeWaiverModal from '../shared/FeeWaiverModal';
import { useFeeActions } from '../../../contexts/FeeActionsContext';
import usePageNavigation from '../../../hooks/usePageNavigation';
import { downloadFeeTemplate } from '../../../utils/feeTemplateGenerator';

const FeeCollectionPage = ({ learnerId, grade: gradeParam }) => {
  const navigateTo = usePageNavigation();
  const [invoices, setInvoices] = useState([]);
  const [statsInvoices, setStatsInvoices] = useState([]); // unfiltered — drives the metric cards
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetScope, setResetScope] = useState({ academicYear: new Date().getFullYear(), term: 'TERM_1' });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'fetching', qrCode: null });
  const [allLearners, setAllLearners] = useState([]);
  const [searchLearnerId, setSearchLearnerId] = useState(learnerId || null);
  const [gradeFilter, setGradeFilter] = useState(gradeParam || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transportFilter, setTransportFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const { showSuccess, showError, showToast, toastMessage, toastType, hideNotification } = useNotifications();
  const { user } = useAuth();
  const { registerFeeActions, clearFeeActions } = useFeeActions();

  // Sync grade filter if navigated here from the reports page
  useEffect(() => {
    if (gradeParam) setGradeFilter(gradeParam);
  }, [gradeParam]);

  // Update learner search if prop changes
  useEffect(() => {
    if (learnerId) {
      setSearchLearnerId(learnerId);
    }
  }, [learnerId]);

  // Fetch for the filtered table
  const fetchInvoices = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 50,
        ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
        ...(termFilter !== 'all' && { term: termFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(transportFilter !== 'all' && { isTransport: transportFilter === 'transport' ? 'true' : 'false' }),
        ...(gradeFilter !== 'all' && { grade: gradeFilter }),
        ...(searchLearnerId && { learnerId: searchLearnerId }),
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };
      const response = await api.fees.getAllInvoices(params);
      setInvoices(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      showError('Failed to load invoices');
      console.error(error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, termFilter, startDate, endDate, transportFilter, gradeFilter, searchLearnerId, currentPage, sortConfig, showError]);

  // Separate fetch — no filters — solely powers the metric cards
  const fetchStatsInvoices = React.useCallback(async () => {
    try {
      const response = await api.fees.getAllInvoices({ limit: 'all' });
      setStatsInvoices(response.data || []);
    } catch (error) {
      console.error('Failed to load stats invoices:', error);
    }
  }, []);

  const fetchLearners = React.useCallback(async () => {
    try {
      const response = await api.learners.getAll({ status: 'ACTIVE' });
      setAllLearners(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load learners:', error);
    }
  }, []);

  const fetchBranding = React.useCallback(async () => {
    try {
      const resp = await api.branding.get();
      if (resp.success) setSchoolInfo(resp.data);
    } catch (err) {
      console.error('Failed to load branding:', err);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchStatsInvoices();
    fetchLearners();
    fetchBranding();
  }, [fetchInvoices, fetchStatsInvoices, fetchLearners, fetchBranding]);


  const handleQuickApproveWaiver = async (e, invoice) => {
    e.stopPropagation();
    const pendingWaiver = invoice.waivers?.find(w => w.status === 'PENDING');
    if(!pendingWaiver) return;

    if(!window.confirm(`Quick Approve pending waiver of KES ${pendingWaiver.amountWaived}?`)) return;

    try {
      setLoading(true);
      await api.fees.approveWaiver(pendingWaiver.id);
      showSuccess('Waiver approved successfully');
      fetchInvoices();
      fetchStatsInvoices();
    } catch (err) {
      showError('Failed to approve waiver');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
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
          <div style="display: flex; justify-content: space-between; padding: 5px 0; color: #00A09D; font-size: 12px; font-weight: 600;">
            <span>Total Waived:</span>
            <span>KES ${(invoice.waivers || []).reduce((acc, w) => acc + Number(w.amountWaived), 0).toLocaleString()}</span>
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
        stampOptions: { status: isPaid ? 'PAID' : 'APPROVED', dept: 'FINANCE OFFICE' },
        includeLetterhead: false
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      showError('Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintThermal = async (invoice) => {
    setPrintingInvoice(invoice);
    // Give react a moment to render the hidden thermal receipt
    setTimeout(() => {
      window.print();
      setPrintingInvoice(null);
    }, 100);
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

  // Auto-select Fee Structure & Transport Toggle based on Learner, Term, and Year
  useEffect(() => {
    const learnerId = newInvoice.learnerId || searchLearnerId;

    if (showCreateModal && learnerId && allLearners.length > 0) {
      // Find the learner to get their grade and transport status
      const learner = allLearners.find(l => l.id === learnerId);

      if (learner) {
        // [NEW] Set transport toggle based on profile
        setNewInvoice(prev => {
          if (prev.includeTransport !== !!learner.isTransportStudent) {
            return { ...prev, includeTransport: !!learner.isTransportStudent };
          }
          return prev;
        });

        if (feeStructures.length > 0) {
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
            setNewInvoice(prev => {
              if (prev.feeStructureId !== '') {
                return { ...prev, feeStructureId: '' };
              }
              return prev;
            });
          }
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
      const res = await api.notifications.getWhatsAppStatus();
      if (res.success) setWhatsappStatus(res.data);
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error);
    }
  };

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);



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
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(invoices.map(i => i.id));
    }
  };

  const toggleSelectInvoice = (id) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleResetInvoices = () => {
    // Open the scoped reset modal instead of calling directly
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    try {
      setLoading(true);
      await api.fees.resetInvoices({ ...resetScope, confirmToken: 'CONFIRM_RESET' });
      showSuccess('Invoices and payments reset successfully');
      setShowResetModal(false);
      fetchInvoices();
    } catch (err) {
      showError(err.message || 'Failed to reset invoices');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Column Sorter
   */
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    // This triggers useEffect which calls fetchInvoices
  };

  useEffect(() => {
    fetchInvoices();
  }, [sortConfig]);

  const handleDownloadTemplate = async () => {
    try {
      await downloadFeeTemplate();
      showSuccess('Template downloaded');
    } catch (error) {
      console.error('Template Download Error:', error);
      showError('Failed to download template');
    }
  };

  // Register / clear fee actions in the horizontal submenu
  useEffect(() => {
    registerFeeActions({
      onCreate: () => setShowCreateModal(true),
      onImport: () => setShowImportModal(true),
      onDownloadTemplate: handleDownloadTemplate,
      onReset:  handleResetInvoices,
      userRole: user?.role
    });
    return () => clearFeeActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // ── Computed KES totals for each metric card (always unfiltered) ─────────────
  const stats = React.useMemo(() => {
    const fmt = (n) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;
    const src = statsInvoices; // never changes with filter clicks
    return {
      totalCount:    src.length,
      totalBilled:   fmt(src.reduce((s, i) => s + Number(i.totalAmount || 0), 0)),
      pendingCount:  src.filter(i => i.status === 'PENDING').length,
      pendingAmt:    fmt(src.filter(i => i.status === 'PENDING').reduce((s, i) => s + Number(i.balance || 0), 0)),
      partialCount:  src.filter(i => i.status === 'PARTIAL').length,
      partialAmt:    fmt(src.filter(i => i.status === 'PARTIAL').reduce((s, i) => s + Number(i.balance || 0), 0)),
      paidCount:     src.filter(i => i.status === 'PAID').length,
      paidAmt:       fmt(src.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.paidAmount || 0), 0)),
      overpaidCount: src.filter(i => i.status === 'OVERPAID').length,
      overpaidAmt:   fmt(src.filter(i => i.status === 'OVERPAID').reduce((s, i) => s + Math.abs(Number(i.balance || 0)), 0)),
    };
  }, [statsInvoices]);


  if (loading && !showCreateModal) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

        {/* Total Invoices — Indigo */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 shadow-lg shadow-indigo-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${
            statusFilter === 'all' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">Total Invoices</p>
              <p className="text-4xl font-black">{stats.totalCount}</p>
              <p className="text-xs font-semibold text-indigo-300 mt-1.5">{stats.totalBilled} billed</p>
            </div>
            <div className="p-2.5 bg-white/15 rounded-xl">
              <FileText size={22} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        </div>

        {/* Pending — Amber */}
        <div
          onClick={() => { setStatusFilter(prev => prev === 'pending' ? 'all' : 'pending'); setCurrentPage(1); }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 shadow-lg shadow-amber-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${
            statusFilter === 'pending' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-100 mb-1">Pending</p>
              <p className="text-4xl font-black">{stats.pendingCount}</p>
              <p className="text-xs font-semibold text-amber-200 mt-1.5">{stats.pendingAmt} outstanding</p>
            </div>
            <div className="p-2.5 bg-white/15 rounded-xl">
              <Clock size={22} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        </div>

        {/* Partial — Sky Blue */}
        <div
          onClick={() => { setStatusFilter(prev => prev === 'partial' ? 'all' : 'partial'); setCurrentPage(1); }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-5 shadow-lg shadow-sky-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${
            statusFilter === 'partial' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-100 mb-1">Partial Payments</p>
              <p className="text-4xl font-black">{stats.partialCount}</p>
              <p className="text-xs font-semibold text-sky-200 mt-1.5">{stats.partialAmt} balance due</p>
            </div>
            <div className="p-2.5 bg-white/15 rounded-xl">
              <AlertCircle size={22} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        </div>

        {/* Fully Paid — Emerald */}
        <div
          onClick={() => { setStatusFilter(prev => prev === 'paid' ? 'all' : 'paid'); setCurrentPage(1); }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 p-5 shadow-lg shadow-emerald-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${
            statusFilter === 'paid' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">Fully Paid</p>
              <p className="text-4xl font-black">{stats.paidCount}</p>
              <p className="text-xs font-semibold text-emerald-200 mt-1.5">{stats.paidAmt} collected</p>
            </div>
            <div className="p-2.5 bg-white/15 rounded-xl">
              <CheckCircle size={22} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        </div>

        {/* Overpaid — Purple */}
        <div
          onClick={() => { setStatusFilter(prev => prev === 'overpaid' ? 'all' : 'overpaid'); setCurrentPage(1); }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 p-5 shadow-lg shadow-purple-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${
            statusFilter === 'overpaid' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-1">Overpaid</p>
              <p className="text-4xl font-black">{stats.overpaidCount}</p>
              <p className="text-xs font-semibold text-purple-200 mt-1.5">{stats.overpaidAmt} credit</p>
            </div>
            <div className="p-2.5 bg-white/15 rounded-xl">
              <ShieldCheck size={22} className="text-white" />
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
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
                onSelect={(id) => { setSearchLearnerId(id); setCurrentPage(1); }}
                placeholder="Search invoices by student..."
              />
            </div>
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes</option>
            <option value="GRADE_1">Grade 1</option>
            <option value="GRADE_2">Grade 2</option>
            <option value="GRADE_3">Grade 3</option>
            <option value="GRADE_4">Grade 4</option>
            <option value="GRADE_5">Grade 5</option>
            <option value="GRADE_6">Grade 6</option>
            <option value="GRADE_7">Grade 7</option>
            <option value="GRADE_8">Grade 8</option>
            <option value="GRADE_9">Grade 9</option>
            <option value="GRADE_10">Grade 10</option>
            <option value="GRADE_11">Grade 11</option>
            <option value="GRADE_12">Grade 12</option>
            <option value="PP1">PP1</option>
            <option value="PP2">PP2</option>
          </select>

          <select
            value={termFilter}
            onChange={(e) => { setTermFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Terms</option>
            <option value="TERM_1">Term 1</option>
            <option value="TERM_2">Term 2</option>
            <option value="TERM_3">Term 3</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overpaid">Overpaid</option>
          </select>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="px-4 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="px-4 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <select
            value={transportFilter}
            onChange={(e) => { setTransportFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-brand-purple/5 border-brand-purple/20 text-brand-purple font-semibold"
          >
            <option value="all">All Students</option>
            <option value="transport">Transport Only</option>
            <option value="regular">Regular Only</option>
          </select>
          <button
            onClick={fetchInvoices}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600 font-semibold flex items-center gap-2"
            title="Refresh invoices"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
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
            <thead className="bg-[color:var(--table-header-bg)]">
              <tr className="border-b border-[color:var(--table-border)]">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvoiceIds.length === invoices.length && invoices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50"
                  onClick={() => handleSort('invoiceNumber')}
                >
                  <div className="flex items-center gap-1">
                    Invoice #
                    {sortConfig.key === 'invoiceNumber' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50"
                  onClick={() => handleSort('studentName')}
                >
                  <div className="flex items-center gap-1">
                    Student
                    {sortConfig.key === 'studentName' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50"
                  onClick={() => handleSort('grade')}
                >
                  <div className="flex items-center gap-1">
                    Grade
                    {sortConfig.key === 'grade' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Fee Type</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Date Issue
                    {sortConfig.key === 'createdAt' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center gap-1">
                    Billed
                    {sortConfig.key === 'totalAmount' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50"
                  onClick={() => handleSort('paidAmount')}
                >
                  <div className="flex items-center gap-1">
                    Paid
                    {sortConfig.key === 'paidAmount' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Waived</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center gap-1">
                    Balance
                    {sortConfig.key === 'balance' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[color:var(--table-header-fg)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-50/50' : ''}`}
                  onClick={() => navigateTo('fees-invoice-detail', { invoice })}
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
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.learner?.grade} {invoice.learner?.stream}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-800">
                      {invoice.feeStructure?.name || 'Standard Fees'}
                    </div>
                    {invoice.totalAmount > 0 && (
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mt-0.5">
                        Total Fee: KES {Number(invoice.totalAmount).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    KES {Number(invoice.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    KES {Number(invoice.paidAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-teal-600">
                      KES {(invoice.waivers || [])
                        .filter(w => w.status === 'APPROVED')
                        .reduce((acc, w) => acc + Number(w.amountWaived), 0).toLocaleString()}
                    </div>
                    {invoice.waivers?.some(w => w.status === 'PENDING') && (
                      <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock size={10} className="mr-1" /> Pending Request
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600">
                    KES {Number(invoice.balance).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateTo('fees-invoice-detail', { invoice })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {invoice.status !== 'PAID' && invoice.status !== 'WAIVED' && (
                        <button
                          onClick={() => navigateTo('fees-record-payment', { invoice })}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Record Payment"
                        >
                          <Plus size={18} />
                        </button>
                      )}

                      {/* Fee Waiver Button */}
                      {['PENDING', 'PARTIAL'].includes(invoice.status) && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowWaiverModal(true);
                          }}
                          className="p-2 bg-[#00A09D]/15 text-[#00A09D] hover:bg-[#00A09D]/25 rounded-lg font-semibold transition-all"
                          title="Request Fee Waiver"
                        >
                          <Gift size={18} />
                        </button>
                      )}

                      {/* Quick Approve Waiver Button */}
                      {invoice.waivers?.some(w => w.status === 'PENDING') && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                        <button
                          onClick={(e) => handleQuickApproveWaiver(e, invoice)}
                          className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-all"
                          title="Quick Approve Pending Waiver"
                        >
                          <ThumbsUp size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadPdf(invoice)}
                        disabled={downloadingId === invoice.id}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg disabled:opacity-50 flex items-center gap-1"
                        title="Normal Printer (A4 PDF)"
                      >
                        {downloadingId === invoice.id
                          ? <Loader2 size={16} className="animate-spin" />
                          : <FileText size={16} />}
                        <span className="text-[10px] font-bold">A4</span>
                      </button>

                      <button
                        onClick={() => handlePrintThermal(invoice)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-1"
                        title="Thermal Printer (80mm POS)"
                      >
                        <Download size={16} className="rotate-180" />
                        <span className="text-[10px] font-bold">POS</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-500 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold shadow-sm hover:bg-[#00A09D] hover:text-white hover:border-[#00A09D] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold shadow-sm hover:bg-[#00A09D] hover:text-white hover:border-[#00A09D] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
            >
              Next
            </button>
          </div>
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

      {/* Import Fees Modal */}
      <FeeImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        onComplete={() => {
          setShowImportModal(false);
          fetchInvoices();
        }}
      />

      {/* Fee Waiver Modal */}
      {selectedInvoice && (
        <FeeWaiverModal 
          invoice={selectedInvoice}
          isOpen={showWaiverModal} 
          onClose={() => {
            setShowWaiverModal(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            fetchInvoices();
          }}
        />
      )}




      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3 text-white">
              <Trash2 size={22} />
              <div>
                <h3 className="text-lg font-black tracking-tight">Reset Fee Invoices</h3>
                <p className="text-red-200 text-xs font-semibold">This action permanently deletes invoices &amp; payments</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
                ⚠️ Only invoices and payments matching the selected <strong>Term</strong> and <strong>Year</strong> will be deleted. This cannot be undone.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider">Academic Year</label>
                  <select
                    value={resetScope.academicYear}
                    onChange={(e) => setResetScope(prev => ({ ...prev, academicYear: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl font-bold focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-600 uppercase tracking-wider">Term</label>
                  <select
                    value={resetScope.term}
                    onChange={(e) => setResetScope(prev => ({ ...prev, term: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl font-bold focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                  >
                    <option value="TERM_1">Term 1</option>
                    <option value="TERM_2">Term 2</option>
                    <option value="TERM_3">Term 3</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95 transform"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Print Overlay (Hidden from screen, visible during print) */}
      {printingInvoice && (
        <div id="printable-thermal-receipt" className="thermal-print-overlay">
          <ThermalReceipt invoice={printingInvoice} schoolInfo={schoolInfo} />
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
