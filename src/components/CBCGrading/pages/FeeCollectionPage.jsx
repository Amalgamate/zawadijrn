/**
 * Fee Collection Page
 * Record payments and view invoices
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Eye, CheckCircle, AlertCircle, Clock, FileText, Download,
  X, Loader2, MessageSquare, Phone, Info, User, ShieldCheck, Mail, Upload,
  Trash2, Gift, ThumbsUp, ArrowUpDown, ArrowUp, ArrowDown,
  Filter, Search, DollarSign, Wallet, Banknote, Coins, Building2, AlertTriangle
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
import FeeNoteModal from '../shared/FeeNoteModal';
import FeePledgeModal from '../shared/FeePledgeModal';
import { useFeeActions } from '../../../contexts/FeeActionsContext';
import usePageNavigation from '../../../hooks/usePageNavigation';
import { downloadFeeTemplate } from '../../../utils/feeTemplateGenerator';
import UnmatchedPaymentsPanel from './fees/UnmatchedPaymentsPanel';
import { useBootstrapStore } from '../../../store/useBootstrapStore';
import { useMobile } from '../../../hooks/useMobileDetection';
import { DataCard } from '../shared';

const FeeCollectionPage = ({ learnerId, grade: gradeParam }) => {
  const isMobile = useMobile();
  const navigateTo = usePageNavigation();
  const [invoices, setInvoices] = useState([]);
  const [statsInvoices, setStatsInvoices] = useState([]); // unfiltered — drives the metric cards
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetScope, setResetScope] = useState({ academicYear: new Date().getFullYear(), term: 'TERM_1' });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'unmatched'
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [whatsappStatus, setWhatsappStatus] = useState({ status: 'fetching', qrCode: null });
  const [allLearners, setAllLearners] = useState([]);
  const [searchLearnerId, setSearchLearnerId] = useState(learnerId || null);
  const [gradeFilter, setGradeFilter] = useState(gradeParam || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [listTotals, setListTotals] = useState({ totalBilled: 0, totalPaid: 0, totalBalance: 0, totalWaived: 0, totalOverpaid: 0 });
  const [showMetrics, setShowMetrics] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    invoiceNumber: false,
    student: true,
    grade: true,
    feeType: false,
    dateIssue: true,
    billed: true,
    paid: true,
    waived: true,
    balance: true,
    overpaid: true,
    status: true,
    paymentMode: true,
    actions: true
  });
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);

  const activeFilterCount = (gradeFilter !== 'all' ? 1 : 0) +
    (termFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (paymentMethodFilter !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const clearAllFilters = () => {
    setGradeFilter('all');
    setTermFilter('all');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setSearchLearnerId(null);
  };

  const { showSuccess, showError, showToast, toastMessage, toastType, hideNotification } = useNotifications();
  const { user } = useAuth();
  const { registerFeeActions, clearFeeActions } = useFeeActions();
  const bootstrapFeeStats = useBootstrapStore(s => s.feeStats);

  // Seed stats from bootstrap cache immediately (eliminates the race for most users)
  React.useEffect(() => {
    if (bootstrapFeeStats?.invoices?.length) {
      setStatsInvoices(bootstrapFeeStats.invoices);
      setStatsLoading(false);
    }
  }, [bootstrapFeeStats]);

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
      let rows = [];
      let pages = 1;
      let totals = null;

      if (searchLearnerId) {
        // Deterministic learner filtering path.
        const learnerRes = await api.fees.getLearnerInvoices(searchLearnerId);
        const learnerRows = Array.isArray(learnerRes?.data) ? learnerRes.data : [];
        rows = learnerRows;
      } else {
        const params = {
          page: currentPage,
          limit: 50,
          ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
          ...(termFilter !== 'all' && { term: termFilter }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(gradeFilter !== 'all' && { grade: gradeFilter }),
          ...(paymentMethodFilter !== 'all' && { paymentMethod: paymentMethodFilter }),
          sortBy: sortConfig.key,
          sortOrder: sortConfig.direction
        };
        const response = await api.fees.getAllInvoices(params);
        rows = response.data || [];
        pages = response.pagination?.pages || 1;
        totals = response.totals;
      }

      // Apply same filters to learner-search and list-path results for consistency.
      rows = rows.filter((inv) => {
        const matchGrade = gradeFilter === 'all' || String(inv?.learner?.grade || '') === gradeFilter;
        const matchStatus = statusFilter === 'all' || String(inv.status || '').toUpperCase() === statusFilter.toUpperCase();
        const matchTerm = termFilter === 'all' || String(inv.term || '') === termFilter;
        const paymentMode = String(inv.paymentMethod || (inv.payments?.[0]?.paymentMethod || '')).toUpperCase();
        const matchPayment = paymentMethodFilter === 'all' || paymentMode === paymentMethodFilter.toUpperCase();
        const invDate = inv.createdAt ? new Date(inv.createdAt) : null;
        const matchStart = !startDate || (invDate && invDate >= new Date(startDate));
        const matchEnd = !endDate || (invDate && invDate <= new Date(endDate));
        return matchGrade && matchStatus && matchTerm && matchPayment && matchStart && matchEnd;
      });

      rows = [...rows].sort((a, b) => {
        const key = sortConfig.key;
        const dir = sortConfig.direction === 'asc' ? 1 : -1;
        const av = a?.[key];
        const bv = b?.[key];
        if (key.toLowerCase().includes('date') || key === 'createdAt') {
          return ((new Date(av).getTime() || 0) - (new Date(bv).getTime() || 0)) * dir;
        }
        if (typeof av === 'number' || typeof bv === 'number') {
          return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
        }
        return String(av || '').localeCompare(String(bv || '')) * dir;
      });

      if (searchLearnerId) {
        pages = 1;
        totals = {
          totalBilled: rows.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
          totalPaid: rows.reduce((s, i) => s + Number(i.paidAmount || 0), 0),
          totalBalance: rows.reduce((s, i) => s + Number(i.balance || 0), 0),
          totalWaived: rows.reduce((s, i) => s + (i.waivers || []).filter(w => w.status === 'APPROVED').reduce((acc, w) => acc + Number(w.amountWaived || 0), 0), 0),
          totalOverpaid: rows.reduce((s, i) => s + Math.max(0, Number(i.paidAmount || 0) - Number(i.totalAmount || 0)), 0)
        };
      }

      setInvoices(rows);
      setTotalPages(pages);
      if (totals) {
        setListTotals(totals);
      }
    } catch (error) {
      showError('Failed to load invoices');
      console.error(error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, termFilter, startDate, endDate, gradeFilter, searchLearnerId, currentPage, sortConfig, showError, paymentMethodFilter]);

  // Separate fetch — no filters — solely powers the metric cards
  const fetchStatsInvoices = React.useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await api.fees.getAllInvoices({ limit: 'all' });
      setStatsInvoices(response.data || []);
    } catch (error) {
      console.error('Failed to load stats invoices:', error);
    } finally {
      setStatsLoading(false);
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
    // Fetch unmatched payment badge count
    api.mpesa?.getUnmatchedCount?.().then(res => setUnmatchedCount(res?.count || 0)).catch(() => { });
  }, [fetchInvoices, fetchStatsInvoices, fetchLearners, fetchBranding]);


  const handleQuickApproveWaiver = async (e, invoice) => {
    e.stopPropagation();
    const pendingWaiver = invoice.waivers?.find(w => w.status === 'PENDING');
    if (!pendingWaiver) return;

    if (!window.confirm(`Quick Approve pending waiver of KES ${pendingWaiver.amountWaived}?`)) return;

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

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = {
        limit: 'all',
        ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
        ...(termFilter !== 'all' && { term: termFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(gradeFilter !== 'all' && { grade: gradeFilter }),
        ...(searchLearnerId && { learnerId: searchLearnerId }),
        ...(paymentMethodFilter !== 'all' && { paymentMethod: paymentMethodFilter }),
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };

      const response = await api.fees.getAllInvoices(params);
      const data = response.data || [];

      if (data.length === 0) {
        showError('No records found to export');
        return;
      }

      const headers = [
        'Student Name',
        'Admission No',
        'Grade',
        'Stream',
        'Invoice #',
        'Date issued',
        'Fee Type',
        'Term',
        'Billed (KES)',
        'Paid (KES)',
        'Waived (KES)',
        'Balance (KES)',
        'Status',
        'Payment Mode'
      ];

      const rows = data.map(i => [
        `${i.learner?.firstName || ''} ${i.learner?.lastName || ''}`,
        i.learner?.admissionNumber || '',
        i.learner?.grade || '',
        i.learner?.stream || '',
        i.invoiceNumber || '',
        new Date(i.createdAt).toLocaleDateString(),
        i.feeType || i.feeName || '',
        i.term || '',
        i.totalAmount || 0,
        i.paidAmount || 0,
        (i.waivers || []).filter(w => w.status === 'APPROVED').reduce((acc, w) => acc + Number(w.amountWaived), 0),
        i.balance || 0,
        i.status || '',
        i.paymentMethod || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `fee_collections_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess(`Successfully exported ${data.length} records`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export data');
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
            <span>${Number(invoice.balance || 0) < 0 ? 'CREDIT BALANCE:' : 'BALANCE DUE:'}</span>
            <span>KES ${Math.abs(Number(invoice.balance || 0)).toLocaleString()}</span>
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
          let activeTerm = 'TERM_1';
          let activeAcademicYear = new Date().getFullYear();

          try {
            const termResp = await api.config.getActiveTermConfig();
            const payload = termResp?.data ?? termResp ?? null;
            if (payload?.term && payload?.academicYear) {
              activeTerm = payload.term;
              activeAcademicYear = Number(payload.academicYear) || activeAcademicYear;
            }
          } catch (termError) {
            console.warn('Using fallback term/year for invoice defaults:', termError);
          }

          setNewInvoice(prev => ({
            ...prev,
            term: activeTerm,
            academicYear: activeAcademicYear,
            feeStructureId: ''
          }));

          const response = await api.fees.getAllFeeStructures({
            status: 'ACTIVE',
            term: activeTerm,
            academicYear: activeAcademicYear
          });
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
      onExport: () => setShowExportModal(true),
      userRole: user?.role,
      searchProps: {
        learners: allLearners,
        selectedLearnerId: searchLearnerId,
        onSelect: (id) => {
          setActiveTab('invoices');
          setSearchLearnerId(id || null);
          setCurrentPage(1);
        }
      },
      metricsProps: {
        show: showMetrics,
        toggle: () => setShowMetrics(prev => !prev)
      }
    });
    return () => clearFeeActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, allLearners, searchLearnerId, showMetrics]);

  // ——— Computed KES totals for each metric card (always unfiltered) —————————————
  const stats = React.useMemo(() => {
    const fmt = (n) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;
    const src = statsInvoices;

    const totalBilledRaw = src.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const waivedTotalRaw = src.reduce((s, i) => {
      const rowWaived = (i.waivers || [])
        .filter(w => w.status === 'APPROVED')
        .reduce((acc, w) => acc + Number(w.amountWaived), 0);
      return s + rowWaived;
    }, 0);
    const actualCollectedRaw = src.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
    const netExpectedRaw = totalBilledRaw - waivedTotalRaw;
    const efficiency = netExpectedRaw > 0 ? (actualCollectedRaw / netExpectedRaw) * 100 : 0;

    // Sub-Categorization Tool
    const getMetrics = (list) => {
      const billed = list.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
      const paid = list.reduce((s, i) => s + Number(i.paidAmount || 0), 0);
      const waived = list.reduce((s, i) => s + (i.waivers || []).filter(w => w.status === 'APPROVED').reduce((acc, w) => acc + Number(w.amountWaived), 0), 0);
      const net = billed - waived;
      return {
        billed: fmt(billed),
        paid: fmt(paid),
        waived: fmt(waived),
        net: fmt(net),
        efficiency: net > 0 ? ((paid / net) * 100).toFixed(1) + '%' : '0%',
        count: list.length
      };
    };

    return {
      totalCount: src.length,
      totalBilled: fmt(totalBilledRaw),
      totalBilledRaw,
      pendingCount: src.filter(i => i.status === 'PENDING').length,
      pendingAmt: fmt(src.filter(i => i.status === 'PENDING').reduce((s, i) => s + Number(i.balance || 0), 0)),
      partialCount: src.filter(i => i.status === 'PARTIAL').length,
      partialAmt: fmt(src.filter(i => i.status === 'PARTIAL').reduce((s, i) => s + Number(i.paidAmount || 0), 0)),
      partialBalanceAmt: fmt(src.filter(i => i.status === 'PARTIAL').reduce((s, i) => s + Number(i.balance || 0), 0)),
      totalBalance: fmt(src.reduce((s, i) => s + Number(i.balance || 0), 0)),
      paidCount: src.filter(i => Number(i.balance) <= 0).length,
      paidAmt: fmt(src.filter(i => Number(i.balance) <= 0).reduce((s, i) => s + Number(i.totalAmount || 0), 0)),
      overpaidCount: src.filter(i => Number(i.paidAmount || 0) > Number(i.totalAmount || 0)).length,
      overpaidAmt: fmt(src.reduce((s, i) => s + Math.max(0, Number(i.paidAmount || 0) - Number(i.totalAmount || 0)), 0)),

      waivedTotal: fmt(waivedTotalRaw),
      waivedTotalRaw,
      netExpected: fmt(netExpectedRaw),
      netExpectedRaw,
      actualCollectedRaw,
      actualCollected: fmt(actualCollectedRaw),
      collectionEfficiency: efficiency.toFixed(1) + '%',

      // Departmental Splits
      tuition: getMetrics(src.filter(i => !i.learner?.isTransportStudent)),
      transport: getMetrics(src.filter(i => i.learner?.isTransportStudent)),

      mpesaTotal: fmt(src.reduce((s, i) => {
        const detail = (i.payments || []).filter(p => p.paymentMethod === 'MPESA').reduce((ss, p) => ss + Number(p.amount), 0);
        if (detail > 0) return s + detail;
        const recentMode = (i.payments && i.payments.length > 0) ? i.payments[0].paymentMethod : 'MPESA';
        return recentMode === 'MPESA' ? s + Number(i.paidAmount || 0) : s;
      }, 0)),
      cashTotal: fmt(src.reduce((s, i) => {
        const detail = (i.payments || []).filter(p => p.paymentMethod === 'CASH').reduce((ss, p) => ss + Number(p.amount), 0);
        if (detail > 0) return s + detail;
        const recentMode = (i.payments && i.payments.length > 0) ? i.payments[0].paymentMethod : 'MPESA';
        return recentMode === 'CASH' ? s + Number(i.paidAmount || 0) : s;
      }, 0)),
      bankTotal: fmt(src.reduce((s, i) => {
        const detail = (i.payments || []).filter(p => ['BANK_TRANSFER', 'CHEQUE'].includes(p.paymentMethod)).reduce((ss, p) => ss + Number(p.amount), 0);
        if (detail > 0) return s + detail;
        const recentMode = (i.payments && i.payments.length > 0) ? i.payments[0].paymentMethod : 'MPESA';
        return recentMode === 'BANK_TRANSFER' ? s + Number(i.paidAmount || 0) : s;
      }, 0))
    };
  }, [statsInvoices]);


  if (loading && !showCreateModal) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Page Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 -mb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'invoices'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Fee Invoices
        </button>
        <button
          onClick={() => setActiveTab('unmatched')}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'unmatched'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <AlertTriangle size={14} />
          Unmatched Payments
          {unmatchedCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-semibold">
              {unmatchedCount}
            </span>
          )}
        </button>
      </div>

      {/* Unmatched Payments Tab */}
      {activeTab === 'unmatched' && (
        <UnmatchedPaymentsPanel onCountChange={setUnmatchedCount} />
      )}

      {/* Main Invoices Tab — wrap everything else */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">

          {/* Collapsible Metrics Section */}
          <div
            className={`grid transition-all duration-500 ease-in-out ${showMetrics ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0'}`}
          >
            {statsLoading && showMetrics && (
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-28" />
                  ))}
                </div>
                <div className="rounded-2xl bg-gray-100 animate-pulse h-16" />
              </div>
            )}
            <div className={`overflow-hidden space-y-6 ${statsLoading ? 'hidden' : ''}`}>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* Total Invoices — Indigo */}
                <div
                  onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
                  className={`relative overflow-hidden rounded-2xl bg-indigo-600 p-5 shadow-lg shadow-indigo-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${statusFilter === 'all' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-indigo-200 mb-1">Expected Income</p>
                      <p className="text-2xl font-medium">{stats.totalBilled}</p>
                      <p className="text-lg font-semibold text-indigo-300 mt-1">{stats.totalCount} Students</p>
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
                  className={`relative overflow-hidden rounded-2xl bg-red-600 p-5 shadow-lg shadow-red-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${statusFilter === 'pending' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-red-100 mb-1">Not Paid Anything</p>
                      <p className="text-2xl font-medium">{stats.pendingAmt}</p>
                      <p className="text-lg font-semibold text-red-200 mt-1">{stats.pendingCount} Students</p>
                    </div>
                    <div className="p-2.5 bg-white/15 rounded-xl">
                      <Clock size={22} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full" />
                  <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
                </div>

                {/* Partial — Sky Blue (Now Orange) */}
                <div
                  onClick={() => { setStatusFilter(prev => prev === 'partial' ? 'all' : 'partial'); setCurrentPage(1); }}
                  className={`relative overflow-hidden rounded-2xl bg-orange-500 p-5 shadow-lg shadow-orange-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${statusFilter === 'partial' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-orange-100 mb-1">Partial Payments</p>
                      <p className="text-2xl font-medium mb-2">{stats.partialAmt}</p>
                      <div className="flex flex-col items-start gap-1">
                        <p className="text-lg font-medium text-orange-100 uppercase tracking-tight leading-none">BAL: {stats.partialBalanceAmt}</p>
                        <p className="text-sm font-semibold text-orange-200">{stats.partialCount} Students</p>
                      </div>
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
                  className={`relative overflow-hidden rounded-2xl bg-emerald-600 p-5 shadow-lg shadow-emerald-500/20 text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl ${statusFilter === 'paid' ? 'ring-4 ring-white/50 scale-[1.03]' : 'opacity-80 hover:opacity-100'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-emerald-100 mb-1">Completely Cleared</p>
                      <p className="text-2xl font-medium">{stats.paidAmt}</p>
                      <p className="text-lg font-semibold text-emerald-200 mt-1">{stats.paidCount} Students</p>
                    </div>
                    <div className="p-2.5 bg-white/15 rounded-xl">
                      <CheckCircle size={22} className="text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full" />
                  <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
                </div>

              </div>

              {/* Financial Reconciliation Strip — Redesigned for Premium Look */}
              <div className="relative overflow-hidden bg-white border-[0.5px] border-gray-300 rounded-2xl p-0 shadow-sm flex flex-col lg:flex-row items-stretch gap-0">

                {/* Total Collections - Emerald */}
                <div className="flex-1 flex items-center gap-4 p-4 bg-emerald-50/80 border-r-[0.5px] border-emerald-200/80 hover:bg-emerald-50 transition-colors">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <Wallet size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Total Collections
                    </p>
                    <span className="text-xl font-medium text-gray-900 tracking-tight leading-none block">
                      {stats.actualCollected.replace('KES ', '')}
                      <span className="text-[10px] font-medium text-gray-500 ml-1">KES</span>
                    </span>
                  </div>
                </div>

                {/* Total Balances - Red */}
                <div className="flex-1 flex items-center gap-4 p-4 bg-red-50/80 border-r-[0.5px] border-red-200/80 hover:bg-red-50 transition-colors">
                  <div className="w-10 h-10 bg-red-500 text-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-red-700 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Total Balances
                    </p>
                    <span className="text-xl font-medium text-gray-900 tracking-tight leading-none block">
                      {Number(listTotals.totalBalance || 0).toLocaleString()}
                      <span className="text-[10px] font-medium text-gray-500 ml-1">KES</span>
                    </span>
                  </div>
                </div>

                {/* Total Overpaid - Purple */}
                <div className="flex-1 flex items-center gap-4 p-4 bg-purple-50/80 border-r-[0.5px] border-purple-200/80 hover:bg-purple-50 transition-colors">
                  <div className="w-10 h-10 bg-purple-500 text-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-purple-700 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Total Overpaid
                    </p>
                    <span className="text-xl font-medium text-gray-900 tracking-tight leading-none block">
                      {Number(listTotals.totalOverpaid || 0).toLocaleString()}
                      <span className="text-[10px] font-medium text-gray-500 ml-1">KES</span>
                    </span>
                  </div>
                </div>

                {/* Adjustments Section — Waivers (Teal) */}
                <div className="flex-1 flex items-center gap-4 p-4 bg-teal-50/80 border-r-[0.5px] border-teal-200/80 hover:bg-teal-50 transition-colors">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <Gift size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-teal-700 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Total Waived
                    </p>
                    <span className="text-xl font-medium text-gray-900 tracking-tight leading-none block">
                      - {stats.waivedTotal.replace('KES ', '')}
                      <span className="text-[10px] font-medium text-gray-500 ml-1">KES</span>
                    </span>
                  </div>
                </div>

                {/* Breakdown Section — Mpesa/Cash/Bank (Lime/Blue/Indigo) */}
                <div className="flex-[2.5] flex items-center justify-around p-4 bg-gradient-to-r from-lime-50/20 via-blue-50/20 to-indigo-50/20">

                  {/* Mpesa */}
                  <div
                    onClick={() => setPaymentMethodFilter(prev => prev === 'MPESA' ? 'all' : 'MPESA')}
                    className={`flex-1 flex items-center gap-4 pr-4 border-r-[0.5px] border-gray-200 justify-center cursor-pointer transition-all duration-200 hover:scale-[1.02] ${paymentMethodFilter === 'MPESA' ? 'bg-lime-50/50 ring-2 ring-lime-400 ring-inset rounded-l-xl' : ''
                      }`}
                  >
                    <div className={`w-10 h-10 bg-lime-500 text-white rounded-xl shadow-sm shadow-lime-200 flex items-center justify-center font-medium text-base shrink-0 ${paymentMethodFilter === 'MPESA' ? 'ring-2 ring-white' : ''}`}>
                      M
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full bg-lime-500 ${paymentMethodFilter === 'MPESA' ? 'animate-ping' : 'animate-pulse'}`} />
                        <span className="text-[10px] font-medium text-lime-700 uppercase tracking-widest">Mpesa</span>
                      </div>
                      <span className="text-xl font-medium text-gray-900 tracking-tight leading-none block">
                        {stats.mpesaTotal.replace('KES ', '')}
                        <span className="text-[10px] font-medium text-gray-500 ml-1">KES</span>
                      </span>
                    </div>
                  </div>

                  {/* Cash */}
                  <div
                    onClick={() => setPaymentMethodFilter(prev => prev === 'CASH' ? 'all' : 'CASH')}
                    className={`flex-1 flex items-center gap-4 px-4 border-r-[0.5px] border-gray-200 justify-center cursor-pointer transition-all duration-200 hover:scale-[1.02] ${paymentMethodFilter === 'CASH' ? 'bg-blue-50/50 ring-2 ring-blue-400 ring-inset' : ''
                      }`}
                  >
                    <div className={`w-10 h-10 bg-blue-500 text-white rounded-xl shadow-sm shadow-blue-200 flex items-center justify-center shrink-0 ${paymentMethodFilter === 'CASH' ? 'ring-2 ring-white' : ''}`}>
                      <Banknote size={20} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-medium text-blue-700 uppercase tracking-widest">Cash</span>
                      </div>
                      <span className="text-xl font-medium text-gray-900 tracking-tight leading-none block">
                        {stats.cashTotal.replace('KES ', '')}
                        <span className="text-[10px] font-medium text-gray-500 ml-1">KES</span>
                      </span>
                    </div>
                  </div>

                  {/* Bank */}
                  <div
                    onClick={() => setPaymentMethodFilter(prev => prev === 'BANK_TRANSFER' ? 'all' : 'BANK_TRANSFER')}
                    className={`flex-1 flex items-center gap-4 pl-4 justify-center cursor-pointer transition-all duration-200 hover:scale-[1.02] ${paymentMethodFilter === 'BANK_TRANSFER' ? 'bg-indigo-50/50 ring-2 ring-indigo-400 ring-inset rounded-r-xl' : ''
                      }`}
                  >
                    <div className={`w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-sm shadow-indigo-200 flex items-center justify-center shrink-0 ${paymentMethodFilter === 'BANK_TRANSFER' ? 'ring-2 ring-white' : ''}`}>
                      <Building2 size={20} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-[10px] font-medium text-indigo-700 uppercase tracking-widest">Bank/Cheque</span>
                      </div>
                      <span className="text-xl font-medium text-gray-900 tracking-tight leading-none block">
                        {stats.bankTotal.replace('KES ', '')}
                        <span className="text-[10px] font-medium text-gray-500 ml-1">KES</span>
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>



          {/* Unified Action & Filter Toolbar */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-[0.5px] border-gray-200">
            <div className="flex flex-wrap items-center gap-4 w-full">          {/* Quick Action Chips Bar (Unified) */}
              <div className="flex flex-wrap gap-2 items-center flex-1 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 lg:pb-0">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mr-1 shrink-0">Quick Filters:</span>

                {/* Terms */}
                {[['TERM_1', 'Term 1'], ['TERM_2', 'Term 2'], ['TERM_3', 'Term 3']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setTermFilter(val); setCurrentPage(1); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${termFilter === val ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'}`}
                  >
                    {label}
                  </button>
                ))}

                <span className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                {/* Payment Status */}
                {[
                  ['pending', 'Pending', 'hover:border-red-300 hover:bg-red-50 hover:text-red-700', 'bg-red-600 text-white border-red-600 shadow-sm scale-105'],
                  ['partial', 'Partial', 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700', 'bg-orange-500 text-white border-orange-500 shadow-sm scale-105'],
                  ['paid', 'Paid', 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700', 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'],
                  ['overpaid', 'Overpaid', 'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700', 'bg-purple-600 text-white border-purple-600 shadow-sm scale-105'],
                ].map(([val, label, hoverCls, activeCls]) => (
                  <button
                    key={val}
                    onClick={() => { setStatusFilter(val); setCurrentPage(1); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${statusFilter === val ? activeCls : `border-gray-200 bg-gray-50 text-gray-600 ${hoverCls}`}`}
                  >
                    {label}
                  </button>
                ))}

                <span className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

                {/* Date shortcuts */}
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setStartDate(today);
                    setEndDate(today);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${startDate === new Date().toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0] ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105' : ''}`}
                >
                  📅 Today
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    setStartDate(firstDay);
                    setEndDate(today.toISOString().split('T')[0]);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  📅 This Month
                </button>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors shrink-0 ml-2"
                  >
                    <X size={12} /> Clear All
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="relative">
                  <button
                    onClick={() => setShowGlobalFilters(!showGlobalFilters)}
                    className={`px-4 py-2 border rounded-xl font-medium flex items-center gap-2 transition-all text-sm ${activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50 text-gray-700 bg-white shadow-sm'}`}
                  >
                    <Filter size={16} className={activeFilterCount > 0 ? "text-blue-600" : "text-gray-500"} />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] ml-1">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Filter Drawer/Popover */}
                  {showGlobalFilters && (
                    <div className="absolute left-0 mt-2 w-[480px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-6 flex flex-col gap-6 animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-center border-b pb-3">
                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                          <Filter size={18} className="text-gray-400" /> Refine Results
                        </h3>
                        <button onClick={() => setShowGlobalFilters(false)} className="text-gray-400 hover:text-gray-700 p-1 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {/* Academic Context */}
                        <div>
                          <h4 className="text-[11px] font-medium text-blue-500 uppercase tracking-widest mb-3">Academic Context</h4>
                          <div className="flex gap-3">
                            <div className="flex-1 flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-gray-600">Grade</label>
                              <select value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full outline-blue-500">
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
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-gray-600">Term</label>
                              <select value={termFilter} onChange={(e) => { setTermFilter(e.target.value); setCurrentPage(1); }} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full outline-blue-500">
                                <option value="all">All Terms</option>
                                <option value="TERM_1">Term 1</option>
                                <option value="TERM_2">Term 2</option>
                                <option value="TERM_3">Term 3</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Financial Context */}
                        <div>
                          <h4 className="text-[11px] font-medium text-emerald-500 uppercase tracking-widest mb-3">Financials</h4>
                          <div className="flex gap-3">
                            <div className="flex-1 flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-gray-600">Status</label>
                              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full outline-emerald-500">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="overpaid">Overpaid</option>
                              </select>
                            </div>

                          </div>


                        </div>
                      </div>

                      {/* Date Bounds */}
                      <div className="border-t pt-4">
                        <h4 className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3">Date Bounds</h4>
                        <div className="flex gap-3">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600">From</label>
                            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full" />
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600">To</label>
                            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full" />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 border-t pt-4 bg-gray-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                        {activeFilterCount > 0 && (
                          <button onClick={clearAllFilters} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors">
                            Clear Filters
                          </button>
                        )}
                        <button onClick={() => { setShowGlobalFilters(false); fetchInvoices(); }} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all">
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowColumnFilter(!showColumnFilter)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
                    title="Toggle Layout Columns"
                  >
                    Columns <ArrowUpDown size={16} className="text-gray-400" />
                  </button>
                  {showColumnFilter && (
                    <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-2 text-sm flex flex-col">
                      <div className="font-medium border-b pb-2 mb-2 px-2 text-gray-700 bg-gray-50/80 -mx-2 -mt-2 p-2 rounded-t-xl text-[11px] uppercase tracking-wider">Display Columns</div>
                      {Object.keys(visibleColumns).map(colKey => (
                        <label key={colKey} className="flex items-center gap-3 cursor-pointer hover:bg-blue-50/50 p-1.5 rounded transition-colors group">
                          <input
                            type="checkbox"
                            checked={visibleColumns[colKey]}
                            onChange={() => setVisibleColumns(prev => ({ ...prev, [colKey]: !prev[colKey] }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="capitalize text-gray-700 font-medium group-hover:text-blue-700">
                            {colKey === 'paymentMode' ? 'Mode / Quick Pay' : colKey.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Invoices List/Table */}
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
          ) : isMobile ? (
            // ******************** MOBILE CARDS VIEW ********************
            <div className="grid grid-cols-1 gap-4 pb-20">
              {invoices.map((invoice) => {
                const recentMode = (invoice.payments && invoice.payments.length > 0) ? invoice.payments[0].paymentMethod : 'MPESA';
                return (
                  <DataCard
                    key={invoice.id}
                    onClick={() => navigateTo('fees-invoice-detail', { invoice })}
                    icon={
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-sm shadow-inner">
                        {invoice.invoiceNumber?.substring(0, 2)}
                      </div>
                    }
                    title={`${invoice.learner?.firstName} ${invoice.learner?.lastName}`}
                    subtitle={`${invoice.invoiceNumber} • ${invoice.learner?.grade || ''}`}
                    badges={getStatusBadge(invoice.status)}
                    stats={{
                      "Total Billed": `KES ${Number(invoice.totalAmount).toLocaleString()}`,
                      "Current Balance": `KES ${Number(invoice.balance).toLocaleString()}`
                    }}
                    actions={
                      <div className="flex items-center gap-2 w-full justify-between mt-2">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigateTo('fees-record-payment', { invoice, initialMode: 'MPESA' }); }}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
                          >
                            MPESA
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigateTo('fees-record-payment', { invoice, initialMode: 'CASH' }); }}
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                          >
                            CASH
                          </button>
                        </div>
                        <div className="flex gap-1">
                          {invoice.status !== 'PAID' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoice(invoice);
                                setShowPledgeModal(true);
                              }}
                              className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center active:scale-90"
                            >
                              <Clock size={18} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(invoice);
                              setShowWaiverModal(true);
                            }}
                            className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center active:scale-90"
                          >
                            <Gift size={18} />
                          </button>
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          ) : (
            // ******************** DESKTOP TABLE VIEW ********************
            <div className="bg-white rounded-xl border-[0.5px] border-gray-200 shadow-sm overflow-auto max-h-[70vh] text-sm scrollbar-thin relative">
              <table className="w-full min-w-max border-collapse">
                <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b-[0.5px] border-gray-200">
                  <tr className="">
                    <th className="px-3 py-2 text-left border-r-[0.5px] border-gray-200 w-10 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.length === invoices.length && invoices.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    {visibleColumns.invoiceNumber && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50 border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                        onClick={() => handleSort('invoiceNumber')}
                      >
                        <div className="flex items-center gap-1">
                          Invoice #
                          {sortConfig.key === 'invoiceNumber' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="text-gray-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.student && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50 border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                        onClick={() => handleSort('studentName')}
                      >
                        <div className="flex items-center gap-1">
                          Student
                          {sortConfig.key === 'studentName' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="text-gray-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.grade && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50 border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                        onClick={() => handleSort('grade')}
                      >
                        <div className="flex items-center gap-1">
                          Grade
                          {sortConfig.key === 'grade' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="text-gray-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.feeType && (
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">Fee Type</th>
                    )}
                    {visibleColumns.dateIssue && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50 border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Date Issue
                          {sortConfig.key === 'createdAt' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="text-gray-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.billed && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50 border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                        onClick={() => handleSort('totalAmount')}
                      >
                        <div className="flex items-center gap-1">
                          Billed
                          {sortConfig.key === 'totalAmount' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="text-gray-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.paid && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50 border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                        onClick={() => handleSort('paidAmount')}
                      >
                        <div className="flex items-center gap-1">
                          Paid
                          {sortConfig.key === 'paidAmount' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="text-gray-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.waived && (
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">Waived</th>
                    )}
                    {visibleColumns.balance && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase cursor-pointer hover:bg-gray-100/50 border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                        onClick={() => handleSort('balance')}
                      >
                        <div className="flex items-center gap-1">
                          Balance
                          {sortConfig.key === 'balance' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                          ) : <ArrowUpDown size={10} className="text-gray-300" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.overpaid && (
                      <th
                        className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm"
                      >
                        Overpaid
                      </th>
                    )}

                    {visibleColumns.status && (
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">Status</th>
                    )}
                    {visibleColumns.paymentMode && (
                      <th className="px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase border-r-[0.5px] border-gray-200 sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">Mode / Quick Pay</th>
                    )}
                    {visibleColumns.actions && (
                      <th className="px-3 py-1.5 text-right text-[11px] font-medium text-[color:var(--table-header-fg)] uppercase sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices
                    .map((invoice) => {
                      const recentMode = (invoice.payments && invoice.payments.length > 0) ? invoice.payments[0].paymentMethod : 'MPESA';
                      return (
                        <tr
                          key={invoice.id}
                          className={`hover:bg-blue-50/30 transition-colors cursor-pointer border-b-[0.5px] border-gray-200 ${selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-50/50' : ''}`}
                          onClick={() => navigateTo('fees-invoice-detail', { invoice })}
                        >
                          <td className="px-3 py-1.5 border-r-[0.5px] border-gray-200" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedInvoiceIds.includes(invoice.id)}
                              onChange={() => toggleSelectInvoice(invoice.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          {visibleColumns.invoiceNumber && (
                            <td className="px-3 py-1.5 text-xs font-semibold text-gray-900 border-r-[0.5px] border-gray-200">{invoice.invoiceNumber}</td>
                          )}
                          {visibleColumns.student && (
                            <td className="px-3 py-1.5 border-r-[0.5px] border-gray-200">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-gray-800 text-xs">
                                  {invoice.learner?.firstName} {invoice.learner?.lastName}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">{invoice.learner?.admissionNumber}</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.grade && (
                            <td className="px-3 py-1.5 text-xs text-gray-600 border-r-[0.5px] border-gray-200 whitespace-nowrap">{invoice.learner?.grade} {invoice.learner?.stream}</td>
                          )}
                          {visibleColumns.feeType && (
                            <td className="px-3 py-1.5 border-r-[0.5px] border-gray-200">
                              <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                                {invoice.feeStructure?.name || 'Standard Fees'}
                              </div>
                              {invoice.totalAmount > 0 && (
                                <div className="text-[9px] font-medium text-blue-600 uppercase tracking-tight hidden">
                                  KES {Number(invoice.totalAmount).toLocaleString()}
                                </div>
                              )}
                            </td>
                          )}
                          {visibleColumns.dateIssue && (
                            <td className="px-3 py-1.5 text-xs text-gray-600 border-r-[0.5px] border-gray-200 whitespace-nowrap">
                              {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                          )}
                          {visibleColumns.billed && (
                            <td className="px-3 py-1.5 text-xs font-medium text-gray-900 border-r-[0.5px] border-gray-200 text-right w-24">
                              {Number(invoice.totalAmount).toLocaleString()}
                            </td>
                          )}
                          {visibleColumns.paid && (
                            <td className="px-3 py-1.5 text-xs font-medium text-green-600 border-r-[0.5px] border-gray-200 text-right w-24">
                              {Number(invoice.paidAmount).toLocaleString()}
                            </td>
                          )}
                          {visibleColumns.waived && (
                            <td className="px-3 py-1.5 border-r-[0.5px] border-gray-200 text-right w-24">
                              <div className="text-xs font-medium text-teal-600">
                                {(invoice.waivers || [])
                                  .filter(w => w.status === 'APPROVED')
                                  .reduce((acc, w) => acc + Number(w.amountWaived), 0).toLocaleString()}
                              </div>
                              {invoice.waivers?.some(w => w.status === 'PENDING') && (
                                <span className="block mt-0.5 text-[9px] font-medium text-amber-600">
                                  PENDING
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.balance && (
                            <td className="px-3 py-1.5 text-xs font-medium text-red-600 border-r-[0.5px] border-gray-200 text-right w-24">
                              {invoice.balance > 0 ? Number(invoice.balance).toLocaleString() : '0'}
                            </td>
                          )}
                          {visibleColumns.overpaid && (
                            <td className="px-3 py-1.5 text-xs font-medium text-purple-600 border-r-[0.5px] border-gray-200 text-right w-24">
                              {Number(invoice.paidAmount) > Number(invoice.totalAmount)
                                ? (Number(invoice.paidAmount) - Number(invoice.totalAmount)).toLocaleString()
                                : '0'}
                            </td>
                          )}

                          {visibleColumns.status && (
                            <td className="px-3 py-1.5 border-r-[0.5px] border-gray-200 whitespace-nowrap">
                              <div className="scale-90 origin-left">{getStatusBadge(invoice.status)}</div>
                            </td>
                          )}
                          {visibleColumns.paymentMode && (
                            <td className="px-3 py-1.5 border-r-[0.5px] border-gray-200 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {Number(invoice.paidAmount) > 0 ? (
                                <div className={`flex items-center gap-1.5 text-[9px] font-semibold uppercase px-2 py-1 rounded-md border w-fit shadow-inner-sm ${recentMode === 'MPESA' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${recentMode === 'MPESA' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                                  {recentMode.replace('_', ' ')}
                                  {invoice.status !== 'PAID' && <span className="ml-1 text-[8px] opacity-60">(Partial)</span>}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => navigateTo('fees-record-payment', { invoice, initialMode: 'MPESA' })}
                                    className={`px-2 py-0.5 text-[9px] font-semibold rounded transition-all border ${recentMode === 'MPESA' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                                  >
                                    MPESA
                                  </button>
                                  <button
                                    onClick={() => navigateTo('fees-record-payment', { invoice, initialMode: 'CASH' })}
                                    className={`px-2 py-0.5 text-[9px] font-semibold rounded transition-all border ${recentMode === 'CASH' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'}`}
                                  >
                                    CASH
                                  </button>
                                  <button
                                    onClick={() => navigateTo('fees-record-payment', { invoice, initialMode: 'BANK_TRANSFER' })}
                                    className="px-2 py-0.5 text-[9px] font-semibold rounded border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all"
                                  >
                                    BANK
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                          {visibleColumns.actions && (
                            <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end">
                                {invoice.status !== 'PAID' && invoice.status !== 'WAIVED' && (
                                  <button
                                    onClick={() => navigateTo('fees-record-payment', { invoice })}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                    title="Record Payment"
                                  >
                                    <DollarSign size={14} />
                                  </button>
                                )}


                                {/* Record Pledge Button */}
                                {invoice.status !== 'PAID' && (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowPledgeModal(true);
                                    }}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                                    title="Record Payment Pledge"
                                  >
                                    <Clock size={14} />
                                  </button>
                                )}

                                {/* Fee Waiver Button */}
                                {['PENDING', 'PARTIAL'].includes(invoice.status) && (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowWaiverModal(true);
                                    }}
                                    className="p-1.5 text-[#00A09D] hover:bg-[#00A09D]/15 rounded"
                                    title="Request Fee Waiver"
                                  >
                                    <Gift size={14} />
                                  </button>
                                )}

                                {/* Quick Approve Waiver Button */}
                                {invoice.waivers?.some(w => w.status === 'PENDING') && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                                  <button
                                    onClick={(e) => handleQuickApproveWaiver(e, invoice)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-100 rounded"
                                    title="Quick Approve Pending Waiver"
                                  >
                                    <ThumbsUp size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>

                {/* Table Totals Footer */}
                <tfoot className="bg-gray-50 border-t-[0.5px] border-gray-200">
                  <tr className="font-medium text-gray-900">
                    <td className="px-3 py-3 border-r-[0.5px] border-gray-200"></td>
                    {visibleColumns.invoiceNumber && <td className="px-3 py-3 border-r-[0.5px] border-gray-200"></td>}
                    {visibleColumns.student && (
                      <td className="px-3 py-3 border-r-[0.5px] border-gray-200 text-xs">
                        <div className="flex flex-col">
                          <span className="uppercase tracking-wider text-[10px] text-gray-500">Totals</span>
                          <span className="text-gray-400 font-medium text-[9px]">Entire Filtered List</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.grade && <td className="px-3 py-3 border-r-[0.5px] border-gray-200"></td>}
                    {visibleColumns.feeType && <td className="px-3 py-3 border-r-[0.5px] border-gray-200"></td>}
                    {visibleColumns.dateIssue && <td className="px-3 py-3 border-r-[0.5px] border-gray-200"></td>}

                    {visibleColumns.billed && (
                      <td className="px-3 py-3 text-xs font-semibold text-gray-900 border-r-[0.5px] border-gray-200 text-right">
                        {Number(listTotals.totalBilled || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.paid && (
                      <td className="px-3 py-3 text-xs font-semibold text-emerald-600 border-r-[0.5px] border-gray-200 text-right">
                        {Number(listTotals.totalPaid || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.waived && (
                      <td className="px-3 py-3 text-xs font-semibold text-teal-600 border-r-[0.5px] border-gray-200 text-right">
                        {Number(listTotals.totalWaived || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.balance && (
                      <td className="px-3 py-3 text-xs font-semibold text-red-600 border-r-[0.5px] border-gray-200 text-right">
                        {Number(listTotals.totalBalance || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.overpaid && (
                      <td className="px-3 py-3 text-xs font-semibold text-purple-600 border-r-[0.5px] border-gray-200 text-right">
                        {Number(listTotals.totalOverpaid || 0).toLocaleString()}
                      </td>
                    )}


                    {visibleColumns.status && <td className="px-3 py-3 border-r-[0.5px] border-gray-200"></td>}
                    {visibleColumns.paymentMode && <td className="px-3 py-3 border-r-[0.5px] border-gray-200"></td>}
                    {visibleColumns.actions && <td className="px-2 py-3"></td>}
                  </tr>
                  {/* Footnote Message */}
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(v => v).length + 1} className="px-6 py-2 bg-blue-50/50">
                      <div className="flex items-center gap-2 text-[10px] font-medium text-blue-600 uppercase tracking-widest">
                        <Info size={12} />
                        Note: This is the total of the ({totalPages} page{totalPages !== 1 ? 's' : ''})
                      </div>
                    </td>
                  </tr>
                </tfoot>
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
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium shadow-sm hover:bg-[#00A09D] hover:text-white hover:border-[#00A09D] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium shadow-sm hover:bg-[#00A09D] hover:text-white hover:border-[#00A09D] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200 transition-all"
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
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Send Reminders:</span>
                <button
                  onClick={() => handleBulkReminders('SMS')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                >
                  <FileText size={16} /> SMS
                </button>
                <button
                  onClick={() => handleBulkReminders('WHATSAPP')}
                  disabled={loading || whatsappStatus.status !== 'authenticated'}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${whatsappStatus.status === 'authenticated' ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
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
                  <h3 className="text-lg font-medium">Create New Invoice</h3>
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
                      <SmartLearnerSearch
                        learners={allLearners}
                        selectedLearnerId={newInvoice.learnerId}
                        onSelect={(id) => setNewInvoice({ ...newInvoice, learnerId: id || '' })}
                        placeholder="Search student by name, adm no..."
                        compact
                        className="w-full"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {allLearners.find(l => l.id === searchLearnerId)?.firstName} {allLearners.find(l => l.id === searchLearnerId)?.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {allLearners.find(l => l.id === searchLearnerId)?.admissionNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => setSearchLearnerId(null)}
                          className="text-[#00A09D] text-xs font-medium hover:underline transition-all"
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
                          const matchGrade = !learner || fs.grade === learner.grade;
                          const matchTerm = fs.term === newInvoice.term;
                          const matchYear = Number(fs.academicYear) === Number(newInvoice.academicYear);
                          return matchGrade && matchTerm && matchYear;
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
                      const matchGrade = learner && fs.grade === learner.grade;
                      const matchTerm = fs.term === newInvoice.term;
                      const matchYear = Number(fs.academicYear) === Number(newInvoice.academicYear);
                      return matchGrade && matchTerm && matchYear;
                    }).length === 0 && (newInvoice.learnerId || searchLearnerId) && (
                        <p className="text-[10px] font-medium text-rose-500 mt-1 uppercase">
                          No active-term fee structure found for student grade.
                        </p>
                      )}
                  </div>



                  {/* Form Grid for Term/Year/Due Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Term *</label>
                      <select
                        value={newInvoice.term}
                        onChange={(e) => setNewInvoice({ ...newInvoice, term: e.target.value })}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
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
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
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
                      className="flex-1 bg-[#00A09D] text-white px-6 py-3 rounded-xl hover:bg-[#008c89] hover:shadow-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 size={18} className="animate-spin" />}
                      <span>{loading ? 'Processing...' : 'Create Invoice'}</span>
                    </button>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-all"
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

          {/* Fee Action Modals */}
          {selectedInvoice && (
            <>
              <FeeWaiverModal
                invoice={selectedInvoice}
                isOpen={showWaiverModal}
                onClose={() => {
                  setShowWaiverModal(false);
                  setSelectedInvoice(null);
                }}
                onSuccess={() => {
                  fetchInvoices();
                  fetchStatsInvoices();
                }}
              />
              <FeeNoteModal
                invoice={selectedInvoice}
                isOpen={showNoteModal}
                onClose={() => {
                  setShowNoteModal(false);
                  setSelectedInvoice(null);
                }}
                onSuccess={(msg) => {
                  showSuccess(msg);
                  fetchInvoices();
                }}
              />
              <FeePledgeModal
                invoice={selectedInvoice}
                isOpen={showPledgeModal}
                onClose={() => {
                  setShowPledgeModal(false);
                  setSelectedInvoice(null);
                }}
                onSuccess={(msg) => {
                  showSuccess(msg);
                  fetchInvoices();
                }}
              />
            </>
          )}




          {/* Reset Confirmation Modal */}
          {showResetModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 px-6 py-4 flex items-center gap-3 text-white">
                  <Trash2 size={22} />
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Reset Fee Invoices</h3>
                    <p className="text-red-200 text-xs font-semibold">This action permanently deletes invoices &amp; payments</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
                    ⚠️ Only invoices and payments matching the selected <strong>Term</strong> and <strong>Year</strong> will be deleted. This cannot be undone.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Academic Year</label>
                      <select
                        value={resetScope.academicYear}
                        onChange={(e) => setResetScope(prev => ({ ...prev, academicYear: e.target.value }))}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl font-medium focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                      >
                        {[2024, 2025, 2026, 2027].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</label>
                      <select
                        value={resetScope.term}
                        onChange={(e) => setResetScope(prev => ({ ...prev, term: e.target.value }))}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl font-medium focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
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
                      className="flex-1 py-3 px-4 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReset}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95 transform"
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

          {/* Export Modal */}
          {showExportModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-blue-600 px-6 py-4 flex items-center gap-3 text-white">
                  <Download size={22} />
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Export Fee Data</h3>
                    <p className="text-blue-200 text-xs font-semibold">Generate an Excel-compatible CSV report</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <Info size={20} className="text-blue-500 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1 border-b border-blue-200 pb-1">Current Filters Applied:</p>
                      <ul className="space-y-1 list-disc list-inside text-xs opacity-90">
                        <li>Grade: <span className="font-medium">{gradeFilter === 'all' ? 'All Classes' : gradeFilter}</span></li>
                        <li>Term: <span className="font-medium">{termFilter === 'all' ? 'All Terms' : termFilter}</span></li>
                        <li>Status: <span className="font-medium capitalize">{statusFilter}</span></li>
                        {startDate && <li>From: <span className="font-medium">{startDate}</span></li>}
                        {endDate && <li>To: <span className="font-medium">{endDate}</span></li>}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleExportExcel}
                      disabled={exporting}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {exporting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Generating Report...</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span>Download Excel (.csv)</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowExportModal(false)}
                      disabled={exporting}
                      className="w-full px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-all"
                    >
                      Close
                    </button>
                  </div>
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
      )}
    </div>
  );
};

export default FeeCollectionPage;
