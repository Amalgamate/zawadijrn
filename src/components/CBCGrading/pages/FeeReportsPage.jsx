/**
 * Fee Reports Page
 * Generate and view comprehensive fee collection reports
 */

import React, { useState, useEffect } from 'react';
import {
  FileText, Download, TrendingUp, TrendingDown,
  DollarSign, AlertCircle, CheckCircle, RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import { toInputDate } from '../utils/dateHelpers';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';
import { useSchoolData } from '../../../contexts/SchoolDataContext';

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
  const { showSuccess, showError } = useNotifications();
  const { grades: fetchedGrades, classes } = useSchoolData();

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

      // Also fetch learners if not already loaded
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

  const handleExport = async (format) => {
    showSuccess(`Exporting report as CSV...`);

    try {
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
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600 mb-0.5">{title}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color.replace('text', 'bg').replace('600', '100')}`}>
          <Icon className={color} size={20} />
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs"
        >
          <Download size={16} />
          Export CSV
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
          value={`KES ${(stats?.totalExpected || 0).toLocaleString()}`}
          icon={DollarSign}
          color="text-blue-600"
        />
        <StatCard
          title="Total Collected"
          value={`KES ${(stats?.totalCollected || 0).toLocaleString()}`}
          icon={CheckCircle}
          color="text-green-600"
          trend="up"
          trendValue={`${stats?.collectionRate || 0}%`}
        />
        <StatCard
          title="Outstanding Balance"
          value={`KES ${(stats?.totalOutstanding || 0).toLocaleString()}`}
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

      {/* Collection Rate Chart */}
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Collection Rate</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">
              {stats?.collectionRate || 0}%
            </span>
          </div>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-1 items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold inline-block text-blue-600">
                Collected: KES {(stats?.totalCollected || 0).toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold inline-block text-gray-600">
                Expected: KES {(stats?.totalExpected || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${stats?.collectionRate || 0}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg shadow p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Payment Methods</h3>
          <div className="space-y-2">
            {stats?.paymentMethods?.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="text-blue-600" size={16} />
                  </div>
                  <span className="font-medium text-xs">{method.method}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 text-xs">KES {method.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">{method.count} txns</p>
                </div>
              </div>
            )) || (
                <p className="text-gray-500 text-center py-4 text-xs">No payment data available</p>
              )}
          </div>
        </div>

        {/* Invoice Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Invoice Status</h3>
          <div className="space-y-2">
            {[
              { status: 'Paid', count: stats?.paidInvoices || 0, color: 'green' },
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

      {/* Grade-wise Collection */}
      <div className="bg-white rounded-lg shadow p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-2">Collection by Grade</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase">Grade</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase">Students</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase">Expected</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase">Collected</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase">Outstanding</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats?.gradeWiseCollection?.map((grade, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900 text-xs">{grade.grade}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{grade.studentCount}</td>
                  <td className="px-3 py-2 text-gray-900 text-xs">KES {grade.expected.toLocaleString()}</td>
                  <td className="px-3 py-2 text-green-600 font-semibold text-xs">KES {grade.collected.toLocaleString()}</td>
                  <td className="px-3 py-2 text-red-600 font-semibold text-xs">KES {grade.outstanding.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${grade.collectionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{grade.collectionRate}%</span>
                    </div>
                  </td>
                </tr>
              )) || (
                  <tr>
                    <td colSpan="6" className="px-3 py-4 text-center text-xs text-gray-500">
                      No grade-wise data available
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-2">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs"
          >
            <Download size={16} />
            Export as PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs"
          >
            <Download size={16} />
            Export as Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs"
          >
            <Download size={16} />
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeReportsPage;
