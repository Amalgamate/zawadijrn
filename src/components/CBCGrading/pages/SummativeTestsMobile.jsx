/**
 * SummativeTests Mobile
 * Card-based interface for managing tests on mobile
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Eye, Loader, Search, Edit, ArrowLeft } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import { assessmentAPI } from '../../../services/api';
import SummativeTestForm from '../../../pages/assessments/SummativeTestForm';
import EmptyState from '../shared/EmptyState';
import ConfirmDialog from '../shared/ConfirmDialog';

const SummativeTestsMobile = ({ onNavigate, onBack }) => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});
  const [deleting, setDeleting] = useState(false);

  // Handle back - navigate away from full-screen
  const handleBackToSidebar = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Fetch Tests
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assessmentAPI.getTests({});
      let testsData = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setTests(testsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error loading tests:', error);
      showError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Filter tests
  const filteredTests = useMemo(() => {
    return tests.filter(t =>
      (t.title || t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.grade || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tests, searchQuery]);

  // Group by status
  const groupedTests = useMemo(() => {
    const grouped = {};
    filteredTests.forEach(test => {
      const status = (test.status || 'DRAFT').toUpperCase();
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(test);
    });
    return grouped;
  }, [filteredTests]);

  // Get status badge
  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  // Delete test
  const handleDeleteTest = (testId) => {
    const test = tests.find(t => t.id === testId);
    setConfirmConfig({
      title: 'Delete Test',
      message: `Delete "${test?.title || 'this test'}"?`,
      onConfirm: async () => {
        setShowConfirm(false);
        setDeleting(true);
        try {
          const response = await assessmentAPI.deleteTest(testId);
          if (response.success) {
            showSuccess('Test deleted successfully');
            setTests(prev => prev.filter(t => t.id !== testId));
          } else {
            showError(response.message || 'Failed to delete test');
          }
        } catch (error) {
          showError('Failed to delete test');
        } finally {
          setDeleting(false);
        }
      }
    });
    setShowConfirm(true);
  };

  // CREATE/EDIT VIEW
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50">
        <SummativeTestForm
          test={selectedTest}
          onBack={() => {
            setViewMode('list');
            setSelectedTest(null);
            fetchTests();
          }}
        />
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToSidebar}
              className="text-teal-600 hover:text-teal-700 flex-shrink-0 p-1 hover:bg-gray-100 rounded"
              title="Back to Menu"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Tests</h1>
          </div>
          <button
            onClick={() => {
              setSelectedTest(null);
              setViewMode('create');
            }}
            className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative pointer-events-auto">
          <Search size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent pointer-events-auto"
            style={{ touchAction: 'manipulation' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 pb-20 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={32} className="animate-spin text-teal-600" />
          </div>
        ) : tests.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No Tests Yet"
            message="Create your first summative test"
          />
        ) : Object.keys(groupedTests).length === 0 ? (
          <EmptyState
            icon={Search}
            title="No Results"
            message="No tests match your search"
          />
        ) : (
          Object.entries(groupedTests).map(([status, statusTests]) => (
            <div key={status}>
              {/* Status Header */}
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(status)}`}>
                  {status}
                </span>
                <span className="text-xs text-gray-500">{statusTests.length}</span>
              </div>

              {/* Test Cards */}
              <div className="space-y-2 mb-4">
                {statusTests.map(test => (
                  <div
                    key={test.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 active:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{test.title || test.name}</h3>
                        <p className="text-xs text-gray-500">{test.grade || 'All Grades'}</p>
                      </div>
                      <div className="ml-2 text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-700">
                          {test.totalQuestions || 0} Q
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="text-xs text-gray-600 mb-3 space-y-0.5">
                      {test.subject && <p>Subject: {test.subject}</p>}
                      {test.maxMark && <p>Max: {test.maxMark} marks</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setViewMode('view');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setViewMode('edit');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        disabled={deleting}
                        className="flex items-center justify-center py-1.5 px-3 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          {...confirmConfig}
          isOpen={showConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

export default SummativeTestsMobile;
