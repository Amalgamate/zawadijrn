/**
 * Fee Reports Page
 * Generate and view comprehensive fee collection reports
 *
 * Changes:
 * - Grade table rows are clickable → navigates to fees-collection filtered by grade
 * - Transport metrics section added (student count, expected, collected, rate)
 * - Formula audit: collectionRate = collected / expected × 100 (server-computed, displayed as-is)
 * - Negative collected (overpayments) rendered in amber, not green
 * - Outstanding shown in red only when > 0; green when 0 (fully cleared)
 */

import React, { useState, useEffect } from 'react';
import {
  FileText, Download, TrendingUp, TrendingDown,
  DollarSign, AlertCircle, CheckCircle, RefreshCw, Bus,
  Users, ArrowRight, Loader2, Filter, X
} from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import { toInputDate } from '../utils/dateHelpers';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';
import { useSchoolData } from '../../../contexts/SchoolDataContext';
import { useUIStore } from '../../../store/useUIStore';

const FeeReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [learners, setLearners] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [learnerInvoices, setLearnerInvoices] = useState([]);
  const [learnerLoading, setLearnerLoading] = useState(false);
  const [defaulters, setDefaulters] = useState([]);
  const [defaultersLoading, setDefaultersLoading] = useState(false);
  const [detailedInvoices, setDetailedInvoices] = useState([]);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [collectionEntries, setCollectionEntries] = useState([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterTerm, setFilterTerm] = useState('all');
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isDefaultDate = (range) => {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    const defaultEnd = today.toISOString().split('T')[0];
    return range.startDate === defaultStart && range.endDate === defaultEnd;
  };

  const activeFilterCount = (filterGrade !== 'all' ? 1 : 0) +
    (filterTerm !== 'all' ? 1 : 0) +
    (!isDefaultDate(dateRange) ? 1 : 0);

  const clearAllFilters = () => {
    setFilterGrade('all');
    setFilterTerm('all');
    const today = new Date();
    setDateRange({
      startDate: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };
  const { showSuccess, showError } = useNotifications();
  const { grades: fetchedGrades, classes } = useSchoolData();
  const { setCurrentPage } = useUIStore();

  const uniqueTerms = Array.from(new Set(classes.map(c => c.term).filter(Boolean))).sort();
  const terms = uniqueTerms.length > 0 ? uniqueTerms : ['TERM_1', 'TERM_2', 'TERM_3'];

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      if (filterGrade !== 'all') params.grade = filterGrade;
      if (filterTerm !== 'all') params.term = filterTerm;

      const response = await api.fees.getPaymentStats(params);
      setStats(response.data);

      if (learners.length === 0) {
        const learnersResponse = await api.learners.getAll({ status: 'Active' });
        setLearners(learnersResponse.data || []);
      }
    } catch (error) {
      showError('Failed to load fee statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterGrade, filterTerm, showError, learners.length]);

  // Defaulters tab: invoices that are PENDING or PARTIAL past due date
  const fetchDefaulters = React.useCallback(async () => {
    try {
      setDefaultersLoading(true);
      const params = { status: 'PENDING', startDate: dateRange.startDate, endDate: dateRange.endDate };
      if (filterGrade !== 'all') params.grade = filterGrade;
      if (filterTerm !== 'all') params.term = filterTerm;
      const [pendingRes, partialRes] = await Promise.all([
        api.fees.getAllInvoices({ ...params, status: 'PENDING', limit: 200 }),
        api.fees.getAllInvoices({ ...params, status: 'PARTIAL', limit: 200 })
      ]);
      const all = [...(pendingRes.data || []), ...(partialRes.data || [])];
      const today = new Date();
      setDefaulters(all.filter(inv => inv.dueDate && new Date(inv.dueDate) < today));
    } catch (error) {
      showError('Failed to load defaulters');
    } finally {
      setDefaultersLoading(false);
    }
  }, [dateRange, filterGrade, filterTerm, showError]);

  // Detailed tab: all invoices with full breakdown
  const fetchDetailed = React.useCallback(async () => {
    try {
      setDetailedLoading(true);
      const params = { startDate: dateRange.startDate, endDate: dateRange.endDate, limit: 200 };
      if (filterGrade !== 'all') params.grade = filterGrade;
      if (filterTerm !== 'all') params.term = filterTerm;
      const res = await api.fees.getAllInvoices(params);
      setDetailedInvoices(res.data || []);
    } catch (error) {
      showError('Failed to load detailed invoices');
    } finally {
      setDetailedLoading(false);
    }
  }, [dateRange, filterGrade, filterTerm, showError]);

  // Collection tab: paid/partial invoices showing payment history
  const fetchCollection = React.useCallback(async () => {
    try {
      setCollectionLoading(true);
      const params = { startDate: dateRange.startDate, endDate: dateRange.endDate, limit: 200 };
      if (filterGrade !== 'all') params.grade = filterGrade;
      if (filterTerm !== 'all') params.term = filterTerm;
      const [paidRes, partialRes] = await Promise.all([
        api.fees.getAllInvoices({ ...params, status: 'PAID' }),
        api.fees.getAllInvoices({ ...params, status: 'PARTIAL' })
      ]);
      setCollectionEntries([...(paidRes.data || []), ...(partialRes.data || [])]);
    } catch (error) {
      showError('Failed to load collection data');
    } finally {
      setCollectionLoading(false);
    }
  }, [dateRange, filterGrade, filterTerm, showError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Trigger the right data fetch when tab changes or filters change
  useEffect(() => {
    if (reportType === 'defaulters') fetchDefaulters();
    else if (reportType === 'detailed') fetchDetailed();
    else if (reportType === 'collection') fetchCollection();
    // 'summary' and 'learner' are handled by fetchStats + per-learner fetch below
  }, [reportType, fetchDefaulters, fetchDetailed, fetchCollection]);

  // Fetch individual learner invoices when a learner is selected on the learner tab
  useEffect(() => {
    if (reportType !== 'learner' || !selectedLearnerId) {
      setLearnerInvoices([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLearnerLoading(true);
        const res = await api.fees.getLearnerInvoices(selectedLearnerId);
        if (!cancelled) setLearnerInvoices(res.data || []);
      } catch {
        if (!cancelled) showError('Failed to load learner invoices');
      } finally {
        if (!cancelled) setLearnerLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedLearnerId, reportType, showError]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      if (filterGrade !== 'all') params.grade = filterGrade;
      if (filterTerm !== 'all') params.term = filterTerm;

      const blob = await api.fees.exportInvoices(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fee_invoices_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Navigate to fee collection filtered to the clicked grade
  const handleGradeRowClick = (gradeLabel) => {
    // grade label comes back as "GRADE 4" — convert back to enum "GRADE_4"
    const gradeEnum = gradeLabel.trim().toUpperCase().replace(/\s+/g, '_');
    setCurrentPage('fees-collection', { grade: gradeEnum });
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600 mb-0.5">{title}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color.replace('text', 'bg').replace('600', '100').replace('500', '100')}`}>
          <Icon className={color} size={20} />
        </div>
      </div>
    </div>
  );

  // Formats a KES amount with sign-aware colouring class
  const fmtKES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

  const collectedClass = (n) =>
    n < 0 ? 'text-amber-600 font-semibold' : 'text-green-600 font-semibold';

  const outstandingClass = (n) =>
    Number(n) <= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';

  if (loading) return <LoadingSpinner />;

  const transport = stats?.transport || {};

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Top Bar: Tabs & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-end w-full">
        {/* Navigation Tabs */}
        <div className="flex-1 w-full bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex overflow-x-auto scrollbar-hide">
          {[
            { id: 'summary', label: 'Overview' },
            { id: 'detailed', label: 'All Invoices' },
            { id: 'collection', label: 'Payments' },
            { id: 'defaulters', label: 'Overdue' },
            { id: 'learner', label: 'By Student' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex-1 min-w-[100px] text-xs font-bold py-2 px-3 rounded-lg transition-all ${
                reportType === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowGlobalFilters(!showGlobalFilters)}
            className={`px-5 py-2.5 border rounded-xl font-bold flex items-center gap-2 transition-all ${activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50 text-gray-700 bg-white shadow-sm'}`}
          >
            <Filter size={18} className={activeFilterCount > 0 ? "text-blue-600" : "text-gray-500"} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter Popover Drawer */}
          {showGlobalFilters && (
            <div className="absolute right-0 top-full mt-2 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Filter size={16} className="text-blue-600" /> Report Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
                    Clear All
                  </button>
                )}
              </div>

              <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Academic Context */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-blue-500 uppercase tracking-widest mb-3">Academic Term</h4>
                  <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Grade Level</label>
                      <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full outline-blue-500">
                        <option value="all">All Grades</option>
                        {fetchedGrades.map(g => <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Term</label>
                      <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full outline-blue-500">
                        <option value="all">All Terms</option>
                        {terms.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-blue-500 uppercase tracking-widest mb-3">Date Range</h4>
                  <div className="flex gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">Start</label>
                      <input type="date" value={toInputDate(dateRange.startDate)} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full outline-blue-500" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">End</label>
                      <input type="date" value={toInputDate(dateRange.endDate)} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full outline-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 justify-end">
                <button onClick={() => setShowGlobalFilters(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg">Close</button>
                <button onClick={() => { setShowGlobalFilters(false); fetchStats(); }} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2">
                  <RefreshCw size={14} /> Apply & Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Learner Search for Learner Report */}
      {reportType === 'learner' && (
        <div className="bg-white rounded-lg shadow p-3 animate-fade-in">
          <label className="block text-xs font-semibold mb-2 text-gray-700">Select Learner for Individual Report</label>
          <div className="max-w-md">
            <SmartLearnerSearch
              learners={learners}
              selectedLearnerId={selectedLearnerId}
              onSelect={setSelectedLearnerId}
              placeholder="Search learner by name or admission number..."
            />
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Expected"
          value={fmtKES(stats?.totalExpected)}
          icon={DollarSign}
          color="text-blue-600"
        />
        <StatCard
          title="Total Collected"
          value={fmtKES(stats?.totalCollected)}
          icon={CheckCircle}
          color="text-green-600"
          trend="up"
          trendValue={`${stats?.collectionRate || 0}% collection rate`}
        />
        <StatCard
          title="Outstanding Balance"
          value={fmtKES(stats?.totalOutstanding)}
          icon={AlertCircle}
          color="text-red-600"
        />
        <StatCard
          title="Active Invoices"
          value={stats?.totalInvoices || 0}
          icon={FileText}
          color="text-purple-600"
        />
      </div>

      {/* Transport Metrics */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center gap-2 mb-3">
          <Bus size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-800">Transport Fee Metrics</h3>
          <span className="ml-auto text-[10px] text-gray-400 italic">Transport students only</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-indigo-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Students</p>
            <div className="flex items-center justify-center gap-1">
              <Users size={12} className="text-indigo-500" />
              <p className="text-lg font-bold text-indigo-700">{transport.studentCount ?? 0}</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Expected</p>
            <p className="text-sm font-bold text-blue-700">{fmtKES(transport.expected)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Collected</p>
            <p className="text-sm font-bold text-green-700">{fmtKES(transport.collected)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Outstanding</p>
            <p className="text-sm font-bold text-red-700">{fmtKES(transport.outstanding)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center col-span-2 md:col-span-1">
            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Collection Rate</p>
            <p className="text-lg font-bold text-indigo-700">{transport.collectionRate ?? 0}%</p>
            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min(transport.collectionRate ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Collection Rate Chart */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Overall Collection Rate</h3>
          <span className="text-xl font-bold text-blue-600">{stats?.collectionRate || 0}%</span>
        </div>
        <div className="relative pt-1">
          <div className="flex mb-1 items-center justify-between">
            <span className="text-[10px] font-semibold text-blue-600">
              Collected: {fmtKES(stats?.totalCollected)}
            </span>
            <span className="text-[10px] font-semibold text-gray-600">
              Expected: {fmtKES(stats?.totalExpected)}
            </span>
          </div>
          <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${Math.min(stats?.collectionRate || 0, 100)}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods & Invoice Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg shadow p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Payment Methods</h3>
          <div className="space-y-2">
            {stats?.paymentMethods?.length > 0 ? stats.paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="text-blue-600" size={16} />
                  </div>
                  <span className="font-medium text-xs">{method.method}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 text-xs">{fmtKES(method.amount)}</p>
                  <p className="text-[10px] text-gray-500">{method.count} txns</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4 text-xs">No payment data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Invoice Status</h3>
          <div className="space-y-2">
            {[
              { status: 'Paid',    count: stats?.paidInvoices    || 0, color: 'green' },
              { status: 'Partial', count: stats?.partialInvoices || 0, color: 'blue' },
              { status: 'Pending', count: stats?.pendingInvoices || 0, color: 'yellow' },
              { status: 'Overdue', count: stats?.overdueInvoices || 0, color: 'red' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 bg-${item.color}-100 rounded-full flex items-center justify-center`}>
                    <FileText className={`text-${item.color}-600`} size={16} />
                  </div>
                  <span className="font-medium text-xs">{item.status} Invoices</span>
                </div>
                <span className="font-bold text-gray-800 text-xs">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade-wise Collection — rows are clickable */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-bold text-gray-800">Collection by Grade</h3>
          <span className="ml-auto text-[10px] text-gray-400 italic flex items-center gap-1">
            <ArrowRight size={10} /> Click a row to view class records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-[color:var(--table-border)]">
              <tr>
                <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Grade</th>
                <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Students</th>
                <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Expected</th>
                <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Collected</th>
                <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Outstanding</th>
                <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.gradeWiseCollection?.length > 0 ? stats.gradeWiseCollection.map((grade, index) => (
                <tr
                  key={index}
                  onClick={() => handleGradeRowClick(grade.grade)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors group"
                  title={`View ${grade.grade} fee records`}
                >
                  <td className="px-3 py-1.5 border-r border-gray-100 font-semibold text-blue-700 text-xs group-hover:underline flex items-center gap-1">
                    {grade.grade}
                    <ArrowRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-100 text-gray-600 text-xs">{grade.studentCount}</td>
                  <td className="px-3 py-1.5 border-r border-gray-100 text-gray-900 text-xs">{fmtKES(grade.expected)}</td>
                  <td className={`px-3 py-2 text-xs ${collectedClass(grade.collected)}`}>
                    {fmtKES(grade.collected)}
                  </td>
                  <td className={`px-3 py-2 text-xs ${outstandingClass(grade.outstanding)}`}>
                    {fmtKES(grade.outstanding)}
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            grade.collectionRate < 0 ? 'bg-amber-500' :
                            grade.collectionRate < 25 ? 'bg-red-400' :
                            grade.collectionRate < 60 ? 'bg-yellow-400' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(Math.abs(grade.collectionRate), 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        grade.collectionRate < 0 ? 'text-amber-600' :
                        grade.collectionRate < 25 ? 'text-red-500' : 'text-gray-700'
                      }`}>
                        {grade.collectionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-3 py-4 text-center text-xs text-gray-500">
                    No grade-wise data available
                  </td>
                </tr>
              )}
            </tbody>
            {/* Totals footer */}
            {stats?.gradeWiseCollection?.length > 0 && (() => {
              const totals = stats.gradeWiseCollection.reduce(
                (acc, g) => ({
                  students: acc.students + g.studentCount,
                  expected: acc.expected + g.expected,
                  collected: acc.collected + g.collected,
                  outstanding: acc.outstanding + g.outstanding
                }),
                { students: 0, expected: 0, collected: 0, outstanding: 0 }
              );
              const totalRate = totals.expected > 0
                ? Math.round((totals.collected / totals.expected) * 100)
                : 0;
              return (
                <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                  <tr>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">TOTAL</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">{totals.students}</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-900">{fmtKES(totals.expected)}</td>
                    <td className={`px-3 py-2 text-xs font-bold ${collectedClass(totals.collected)}`}>{fmtKES(totals.collected)}</td>
                    <td className={`px-3 py-2 text-xs font-bold ${outstandingClass(totals.outstanding)}`}>{fmtKES(totals.outstanding)}</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">{totalRate}%</td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>

      {/* ── TAB-SPECIFIC CONTENT PANELS ── */}

      {/* DETAILED TAB */}
      {reportType === 'detailed' && (
        <div className="bg-white rounded-lg shadow p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2">All Invoices — Detailed</h3>
          {detailedLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
          ) : detailedInvoices.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-6">No invoices found for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="border-b">
                  <tr className="text-left text-[10px] uppercase text-gray-500 font-semibold">
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Invoice #</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Learner</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Grade</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Term</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Total</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Paid</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Balance</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Status</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {detailedInvoices.map(inv => {
                    const paid = Number(inv.amountPaid || 0);
                    const total = Number(inv.totalAmount || 0);
                    const balance = total - paid;
                    const overdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 border-r border-gray-100 font-mono text-blue-700">{inv.invoiceNumber}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.learner ? `${inv.learner.firstName} ${inv.learner.lastName}` : '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.learner?.grade?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.term?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100 font-semibold">{fmtKES(total)}</td>
                        <td className={`px-3 py-1.5 ${collectedClass(paid)}`}>{fmtKES(paid)}</td>
                        <td className={`px-3 py-1.5 ${outstandingClass(balance)}`}>{fmtKES(balance)}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                            inv.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                            overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{overdue && inv.status !== 'PAID' ? 'OVERDUE' : inv.status}</span>
                        </td>
                        <td className={`px-3 py-1.5 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DEFAULTERS TAB */}
      {reportType === 'defaulters' && (
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-red-500" />
            <h3 className="text-sm font-bold text-gray-800">Defaulters — Overdue Unpaid Invoices</h3>
            {!defaultersLoading && <span className="ml-auto text-xs text-red-600 font-semibold">{defaulters.length} overdue</span>}
          </div>
          {defaultersLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-red-400" /></div>
          ) : defaulters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle size={28} className="text-green-500" />
              <p className="text-xs text-gray-500">No overdue invoices. All payments are up to date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="border-b">
                  <tr className="text-left text-[10px] uppercase text-gray-500 font-semibold">
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Learner</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Grade</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Invoice #</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Total</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Paid</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Balance</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Due Date</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {defaulters.map(inv => {
                    const paid = Number(inv.amountPaid || 0);
                    const total = Number(inv.totalAmount || 0);
                    const balance = total - paid;
                    const daysOverdue = inv.dueDate
                      ? Math.floor((new Date() - new Date(inv.dueDate)) / 86400000)
                      : null;
                    return (
                      <tr key={inv.id} className="hover:bg-red-50">
                        <td className="px-3 py-1.5 border-r border-gray-100 font-medium">
                          {inv.learner ? `${inv.learner.firstName} ${inv.learner.lastName}` : '—'}
                        </td>
                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-600">{inv.learner?.grade?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100 font-mono text-blue-700">{inv.invoiceNumber}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100 font-semibold">{fmtKES(total)}</td>
                        <td className={`px-3 py-1.5 ${collectedClass(paid)}`}>{fmtKES(paid)}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100 text-red-600 font-bold">{fmtKES(balance)}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100 text-red-500 font-semibold">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-1.5 border-r border-gray-100">
                          {daysOverdue !== null ? (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              daysOverdue > 30 ? 'bg-red-200 text-red-800' : 'bg-orange-100 text-orange-700'
                            }`}>{daysOverdue}d</span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-red-50">
                  <tr>
                    <td colSpan={5} className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">TOTAL OUTSTANDING</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-red-700">
                      {fmtKES(defaulters.reduce((s, inv) => s + Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0), 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COLLECTION TAB */}
      {reportType === 'collection' && (
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <h3 className="text-sm font-bold text-gray-800">Collection Report — Paid & Partial Invoices</h3>
            {!collectionLoading && <span className="ml-auto text-xs text-green-600 font-semibold">{collectionEntries.length} entries</span>}
          </div>
          {collectionLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-green-400" /></div>
          ) : collectionEntries.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-6">No paid invoices found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="border-b">
                  <tr className="text-left text-[10px] uppercase text-gray-500 font-semibold">
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Invoice #</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Learner</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Grade</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Term</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Total</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Collected</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Balance</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {collectionEntries.map(inv => {
                    const paid = Number(inv.amountPaid || 0);
                    const total = Number(inv.totalAmount || 0);
                    const balance = total - paid;
                    return (
                      <tr key={inv.id} className="hover:bg-green-50">
                        <td className="px-3 py-1.5 border-r border-gray-100 font-mono text-blue-700">{inv.invoiceNumber}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.learner ? `${inv.learner.firstName} ${inv.learner.lastName}` : '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.learner?.grade?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.term?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100 font-semibold">{fmtKES(total)}</td>
                        <td className={`px-3 py-1.5 ${collectedClass(paid)}`}>{fmtKES(paid)}</td>
                        <td className={`px-3 py-1.5 ${outstandingClass(balance)}`}>{fmtKES(balance)}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>{inv.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-green-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">TOTALS</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-900">{fmtKES(collectionEntries.reduce((s, i) => s + Number(i.totalAmount || 0), 0))}</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-green-700">{fmtKES(collectionEntries.reduce((s, i) => s + Number(i.amountPaid || 0), 0))}</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">{fmtKES(collectionEntries.reduce((s, i) => s + (Number(i.totalAmount || 0) - Number(i.amountPaid || 0)), 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LEARNER TAB */}
      {reportType === 'learner' && selectedLearnerId && (
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-500" />
            <h3 className="text-sm font-bold text-gray-800">Individual Learner Invoice History</h3>
            {!learnerLoading && learnerInvoices.length > 0 && (
              <span className="ml-auto text-xs text-purple-600 font-semibold">{learnerInvoices.length} invoice{learnerInvoices.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          {learnerLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-purple-400" /></div>
          ) : learnerInvoices.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-6">No invoices found for this learner.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="border-b">
                  <tr className="text-left text-[10px] uppercase text-gray-500 font-semibold">
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Invoice #</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Term</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Year</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Total</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Paid</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Balance</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Status</th>
                    <th className="px-3 py-1.5 border-r border-gray-100 text-left text-[11px] font-bold text-[color:var(--table-header-fg)] uppercase border-r border-gray-100">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {learnerInvoices.map(inv => {
                    const paid = Number(inv.amountPaid || 0);
                    const total = Number(inv.totalAmount || 0);
                    const balance = total - paid;
                    const overdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';
                    return (
                      <tr key={inv.id} className="hover:bg-purple-50">
                        <td className="px-3 py-1.5 border-r border-gray-100 font-mono text-blue-700">{inv.invoiceNumber}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.term?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">{inv.academicYear || '—'}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100 font-semibold">{fmtKES(total)}</td>
                        <td className={`px-3 py-1.5 ${collectedClass(paid)}`}>{fmtKES(paid)}</td>
                        <td className={`px-3 py-1.5 ${outstandingClass(balance)}`}>{fmtKES(balance)}</td>
                        <td className="px-3 py-1.5 border-r border-gray-100">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                            inv.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                            overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{overdue && inv.status !== 'PAID' ? 'OVERDUE' : inv.status}</span>
                        </td>
                        <td className={`px-3 py-1.5 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-purple-50">
                  <tr>
                    <td colSpan={3} className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">TOTALS</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-900">{fmtKES(learnerInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0))}</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-green-700">{fmtKES(learnerInvoices.reduce((s, i) => s + Number(i.amountPaid || 0), 0))}</td>
                    <td className="px-3 py-1.5 border-r border-gray-100 text-xs font-bold text-gray-700">{fmtKES(learnerInvoices.reduce((s, i) => s + (Number(i.totalAmount || 0) - Number(i.amountPaid || 0)), 0))}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-2">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Exporting...' : 'Export as CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeReportsPage;

