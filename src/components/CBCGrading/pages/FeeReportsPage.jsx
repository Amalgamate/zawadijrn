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
  Users, ArrowRight, Loader2
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
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterTerm, setFilterTerm] = useState('all');
  const [exporting, setExporting] = useState(false);
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Start Date</label>
            <input
              type="date"
              value={toInputDate(dateRange.startDate)}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">End Date</label>
            <input
              type="date"
              value={toInputDate(dateRange.endDate)}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Grade</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
            >
              <option value="all">All Grades</option>
              {fetchedGrades.map(grade => (
                <option key={grade} value={grade}>{grade.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Term</label>
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
            >
              <option value="all">All Terms</option>
              {terms.map(term => (
                <option key={term} value={term}>{term.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
          >
            <option value="summary">Summary Report</option>
            <option value="detailed">Detailed Report</option>
            <option value="collection">Collection Report</option>
            <option value="defaulters">Defaulters Report</option>
            <option value="learner">Learner Report</option>
          </select>
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
          <table className="w-full">
            <thead className="border-b border-[color:var(--table-border)]">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Grade</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Students</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Expected</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Collected</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Outstanding</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-[color:var(--table-header-fg)] uppercase">Rate</th>
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
                  <td className="px-3 py-2 font-semibold text-blue-700 text-xs group-hover:underline flex items-center gap-1">
                    {grade.grade}
                    <ArrowRight size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{grade.studentCount}</td>
                  <td className="px-3 py-2 text-gray-900 text-xs">{fmtKES(grade.expected)}</td>
                  <td className={`px-3 py-2 text-xs ${collectedClass(grade.collected)}`}>
                    {fmtKES(grade.collected)}
                  </td>
                  <td className={`px-3 py-2 text-xs ${outstandingClass(grade.outstanding)}`}>
                    {fmtKES(grade.outstanding)}
                  </td>
                  <td className="px-3 py-2">
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
                    <td className="px-3 py-2 text-xs font-bold text-gray-700">TOTAL</td>
                    <td className="px-3 py-2 text-xs font-bold text-gray-700">{totals.students}</td>
                    <td className="px-3 py-2 text-xs font-bold text-gray-900">{fmtKES(totals.expected)}</td>
                    <td className={`px-3 py-2 text-xs font-bold ${collectedClass(totals.collected)}`}>{fmtKES(totals.collected)}</td>
                    <td className={`px-3 py-2 text-xs font-bold ${outstandingClass(totals.outstanding)}`}>{fmtKES(totals.outstanding)}</td>
                    <td className="px-3 py-2 text-xs font-bold text-gray-700">{totalRate}%</td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>

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
