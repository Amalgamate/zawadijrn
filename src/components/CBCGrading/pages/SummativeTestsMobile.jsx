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

  // Group by Grade then Series
  const groupedData = useMemo(() => {
    const grouped = {};
    filteredTests.forEach(test => {
      const gradeKey = test.grade || 'UNASSIGNED';
      if (!grouped[gradeKey]) grouped[gradeKey] = {};

      // Series Name is the first part before the " - "
      const seriesName = test.title?.split(' - ')[0] || 'Individual Tests';

      if (!grouped[gradeKey][seriesName]) {
        grouped[gradeKey][seriesName] = {
          name: seriesName,
          tests: []
        };
      }
      grouped[gradeKey][seriesName].tests.push(test);
    });
    return grouped;
  }, [filteredTests]);

  // All tests are published — single badge style
  const getStatusBadge = () => 'bg-green-100 text-green-800';

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
          {/* 
          <button
            onClick={() => {
              setSelectedTest(null);
              setViewMode('create');
            }}
            className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700"
          >
            <Plus size={20} />
          </button>
          */}
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
        ) : Object.keys(groupedData).length === 0 ? (
          <EmptyState
            icon={Search}
            title="No Results"
            message="No tests match your search"
          />
        ) : (
          Object.entries(groupedData)
            .sort((a, b) => {
              const grades = ['PLAYGROUP', 'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9'];
              return grades.indexOf(a[0]) - grades.indexOf(b[0]);
            })
            .map(([gradeKey, seriesGroups]) => (
              <div key={gradeKey} className="space-y-4">
                {/* Grade Header */}
                <div className="flex items-center gap-2 px-3 py-1 mt-4">
                  <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-bold">
                    {gradeKey.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {gradeKey.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Series Groups */}
                {Object.entries(seriesGroups).map(([seriesName, data]) => (
                  <div key={seriesName} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight">{seriesName}</h3>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">
                            {data.tests.length} Subjects • {data.tests[0]?.academicYear}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-50 grayscale-[0.5]">
                      {data.tests.map(test => (
                        <div key={test.id} className="p-4 active:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-800 truncate">{test.learningArea}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${getStatusBadge(test.status)}`}>
                                  {test.status}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold">{test.totalMarks} Marks</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedTest(test);
                                setViewMode('view');
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors active:bg-blue-100"
                            >
                              <Eye size={14} />
                              View
                            </button>

                            <button
                              onClick={() => {
                                setSelectedTest(test);
                                setViewMode('edit');
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors active:bg-gray-100"
                            >
                              <Edit size={14} />
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteTest(test.id)}
                              disabled={deleting}
                              className="flex items-center justify-center py-2 px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
