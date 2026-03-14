/**
 * Summative Tests Page
 * Create and manage summative tests
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, Loader, CheckCircle, Database, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import { assessmentAPI, classAPI, workflowAPI } from '../../../services/api';
import SummativeTestForm from '../../../pages/assessments/SummativeTestForm';
import BulkCreateTest from './BulkCreateTest';
import ConfirmDialog from '../shared/ConfirmDialog';
import EmptyState from '../shared/EmptyState';

const SummativeTests = ({ onNavigate }) => {
  const { showSuccess, showError } = useNotifications();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // View State: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState('list');

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => { } });

  // Approve All dialog state (exam groups = "series" groups)
  const [showApproveAll, setShowApproveAll] = useState(false);
  const [approveAllQuery, setApproveAllQuery] = useState('');
  const [selectedGroupKeys, setSelectedGroupKeys] = useState(() => new Set());
  const [approvingAll, setApprovingAll] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await classAPI.getAll();
      let classes = [];

      if (Array.isArray(response)) {
        classes = response;
      } else if (response && Array.isArray(response.data)) {
        classes = response.data;
      }

      if (classes.length > 0) {
        // Extract unique grades from classes
        const uniqueGrades = [...new Set(classes.map(c => c.grade))].filter(Boolean).sort();
        if (uniqueGrades.length > 0) {
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await assessmentAPI.getTests();

      // Handle different response formats
      let testsData = [];
      if (response && response.data && Array.isArray(response.data)) {
        testsData = response.data;
      } else if (Array.isArray(response)) {
        testsData = response;
      }

      setTests(testsData);
      console.log('✅ Loaded tests from database:', testsData.length);
    } catch (error) {
      console.error('❌ Error fetching tests:', error);
      showError('Failed to load tests from database');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchTests();
    fetchClasses();
  }, [fetchTests, fetchClasses]);

  const handleAdd = () => {
    setViewMode('bulk_create');
  };

  const handleAddSingleTest = () => {
    setViewMode('create');
  };

  const handleDelete = async (id) => {
    // Check if id is an object (test) or just id string
    const testId = typeof id === 'object' ? id.id : id;
    const test = tests.find(t => t.id === testId);

    setConfirmConfig({
      title: 'Delete Assessment',
      message: `Are you sure you want to delete "${test?.title || 'this test'}"?\n\nIf this test has associated results, it will be archived instead of permanently deleted.`,
      confirmText: 'Delete Test',
      onConfirm: async () => {
        // Close FIRST to prevent stuck popup
        setShowConfirm(false);
        try {
          const response = await assessmentAPI.deleteTest(testId);
          if (response.success) {
            if (response.message.includes('archived')) {
              showSuccess(response.message);
              setTests(prev => prev.map(t => t.id === testId ? { ...t, archived: true, status: 'ARCHIVED' } : t));
            } else {
              showSuccess('Test permanently deleted successfully!');
              setTests(prev => prev.filter(t => t.id !== testId));
            }
            setSelectedIds(prev => prev.filter(i => i !== testId));
          } else {
            showError(response.message || 'Failed to delete test');
          }
        } catch (error) {
          console.error('Error deleting test:', error);
          showError('Failed to delete test: ' + error.message);
        } finally {
          fetchTests();
        }
      }
    });
    setShowConfirm(true);
  };

  const getStatusBadgeStyles = (status) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'PUBLISHED': return 'bg-brand-teal/10 text-brand-teal border-brand-teal/20';
      case 'APPROVED': return 'bg-brand-purple/10 text-brand-purple border-brand-purple/20';
      case 'SUBMITTED': return 'bg-brand-purple/5 text-brand-purple/80 border-brand-purple/10';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const [expandedGrades, setExpandedGrades] = useState([]);
  const toggleGrade = (grade) => {
    setExpandedGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const formatGradeDisplay = (grade) => {
    return grade?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Grade';
  };

  const groupedData = useMemo(() => {
    const grouped = {};
    tests.forEach(test => {
      const gradeKey = test.grade || 'UNASSIGNED';
      if (!grouped[gradeKey]) {
        grouped[gradeKey] = {};
      }

      // Group by "Series" which is the prefix of the title before the first parenthesis
      // E.g., "Term 1 Opening (Math)" -> "Term 1 Opening"
      const seriesMatch = (test.title || test.name || '').match(/^(.*) \(/);
      const seriesName = seriesMatch ? seriesMatch[1] : (test.title || test.name || 'Individual Tests');

      if (!grouped[gradeKey][seriesName]) {
        grouped[gradeKey][seriesName] = {
          name: seriesName,
          tests: []
        };
      }
      grouped[gradeKey][seriesName].tests.push(test);
    });
    return grouped;
  }, [tests]);

  const unapprovedGroups = useMemo(() => {
    // Group key: "GRADE||SERIES"
    const groups = [];
    for (const [gradeKey, seriesGroups] of Object.entries(groupedData)) {
      for (const [seriesName, data] of Object.entries(seriesGroups)) {
        const groupTests = data.tests || [];
        const actionable = groupTests.filter(t => ['DRAFT', 'Draft', 'SUBMITTED', 'Submitted'].includes(t.status));
        if (actionable.length === 0) continue;

        const draftCount = actionable.filter(t => ['DRAFT', 'Draft'].includes(t.status)).length;
        const submittedCount = actionable.filter(t => ['SUBMITTED', 'Submitted'].includes(t.status)).length;

        groups.push({
          key: `${gradeKey}||${seriesName}`,
          gradeKey,
          seriesName,
          totalActionable: actionable.length,
          draftCount,
          submittedCount,
          tests: actionable
        });
      }
    }

    const q = approveAllQuery.trim().toLowerCase();
    const filtered = q
      ? groups.filter(g =>
        `${g.gradeKey} ${g.seriesName}`.toLowerCase().includes(q)
      )
      : groups;

    // Stable, readable sorting
    return filtered.sort((a, b) => {
      const gradeCmp = (a.gradeKey || '').localeCompare(b.gradeKey || '');
      if (gradeCmp !== 0) return gradeCmp;
      return (a.seriesName || '').localeCompare(b.seriesName || '');
    });
  }, [groupedData, approveAllQuery]);

  const canApproveAll = useMemo(
    () => ['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role),
    [user?.role]
  );

  const toggleGroupKey = (key) => {
    setSelectedGroupKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setAllVisibleGroupsSelected = (checked) => {
    setSelectedGroupKeys(prev => {
      const next = new Set(prev);
      if (checked) {
        unapprovedGroups.forEach(g => next.add(g.key));
      } else {
        unapprovedGroups.forEach(g => next.delete(g.key));
      }
      return next;
    });
  };

  const handleApproveAllSelectedGroups = async () => {
    if (!canApproveAll) {
      showError('You do not have permission to approve tests.');
      return;
    }

    const selected = unapprovedGroups.filter(g => selectedGroupKeys.has(g.key));
    if (selected.length === 0) {
      showError('Select at least one exam group to approve.');
      return;
    }

    const selectedTests = selected.flatMap(g => g.tests);
    if (selectedTests.length === 0) {
      showError('No unapproved tests found in the selected groups.');
      return;
    }

    setApprovingAll(true);
    try {
      // 1) Submit any drafts first (workflow expects SUBMITTED before approval)
      const draftTests = selectedTests.filter(t => ['DRAFT', 'Draft'].includes(t.status));
      for (const t of draftTests) {
        // eslint-disable-next-line no-await-in-loop
        await workflowAPI.submit({ assessmentId: t.id, assessmentType: 'summative', comments: 'Bulk submit (Approve All)' });
      }

      // 2) Bulk approve (submitted + newly-submitted drafts)
      const idsToApprove = selectedTests.map(t => t.id);
      const response = await workflowAPI.approveBulk(idsToApprove, 'summative', 'Bulk approved (Approve All)');

      showSuccess(response?.message || `Approved ${idsToApprove.length} tests`);
      setShowApproveAll(false);
      setApproveAllQuery('');
      setSelectedGroupKeys(new Set());
      fetchTests();
    } catch (error) {
      console.error('Approve All failed:', error);
      showError('Failed to approve selected groups: ' + (error?.details || error?.message || 'Unknown error'));
    } finally {
      setApprovingAll(false);
    }
  };

  // eslint-disable-next-line no-unused-vars -- reserved for SummativeTestForm integration
  const handleSaveTest = async (formData) => {
    console.log('=== SAVING TEST ===');
    console.log('View mode:', viewMode);
    console.log('Form data:', formData);

    try {
      // Ensure testDate is present (backend expects testDate, frontend uses date)
      const payload = {
        ...formData,
        testDate: formData.date || formData.testDate || new Date().toISOString(),
        id: viewMode === 'create' ? Date.now().toString() : selectedTest?.id,
        createdAt: viewMode === 'create' ? new Date().toISOString() : selectedTest?.createdAt,
        updatedAt: new Date().toISOString()
      };

      // Try API first, fall back to localStorage
      if (viewMode === 'create') {
          const newStatus = user?.role === 'SUPER_ADMIN' ? 'APPROVED' : 'DRAFT';
          const newTest = await assessmentAPI.createTest({ ...payload, status: newStatus });
          setTests(prev => [...prev, newTest.data || newTest]);
          showSuccess(newStatus === 'APPROVED' ? 'Test created and approved!' : 'Test created successfully!');
        } else {
          const updatedTest = await assessmentAPI.updateTest(selectedTest.id, payload);
          setTests(prev => prev.map(t => t.id === selectedTest.id ? (updatedTest.data || updatedTest) : t));
          showSuccess('Test updated successfully!');
        }
        fetchTests();

      console.log('✅ Save completed');
      setViewMode('list');
    } catch (error) {
      console.error('❌ Save failed:', error);
      showError('Failed to save test: ' + error.message);
      throw error; // Re-throw so CreateTestPage can catch it
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setConfirmConfig({
      title: 'Bulk Delete Tests',
      message: `Are you sure you want to delete ${selectedIds.length} selected tests? Tests with recorded results will be archived instead of permanently deleted.`,
      onConfirm: async () => {
        setShowConfirm(false);
        try {
          const response = await assessmentAPI.deleteTestsBulk(selectedIds);
          showSuccess(response.message || 'Bulk action completed');
          setSelectedIds([]);
          fetchTests();
        } catch (error) {
          console.error('Bulk delete failed:', error);
          showError('Failed to process bulk deletion: ' + error.message);
        }
      }
    });
    setShowConfirm(true);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    setConfirmConfig({
      title: 'Bulk Approve Tests',
      message: `Are you sure you want to approve ${selectedIds.length} selected tests? Only tests in 'Submitted' status can be approved.`,
      onConfirm: async () => {
        setShowConfirm(false);
        try {
          const response = await workflowAPI.approveBulk(selectedIds, 'summative', 'Bulk approved by Admin');
          showSuccess(response.message || 'Bulk approval completed');
          setSelectedIds([]);
          fetchTests();
        } catch (error) {
          console.error('Bulk approve failed:', error);
          showError('Failed to process bulk approval: ' + (error.details || error.message));
        }
      }
    });
    setShowConfirm(true);
  };

  const stats = useMemo(() => ({
    total: tests.length,
    draft: tests.filter(t => ['Draft', 'DRAFT'].includes(t.status)).length,
    published: tests.filter(t => ['Published', 'PUBLISHED'].includes(t.status)).length,
    completed: tests.filter(t => ['Completed', 'COMPLETED', 'Locked', 'LOCKED'].includes(t.status)).length
  }), [tests]);

  const handleStatusClick = async (test) => {
    const status = test.status?.toUpperCase();

    // Check permissions
    const canSubmit = ['TEACHER', 'HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role);
    const canApprove = ['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role);
    const canPublish = ['ADMIN', 'HEAD_TEACHER', 'SUPER_ADMIN'].includes(user?.role);
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

    try {
      if (status === 'DRAFT' && canSubmit) {
        // Admins can auto-approve their own tests
        if (isAdmin) {
          // Submit first
          await workflowAPI.submit({ assessmentId: test.id, assessmentType: 'summative', comments: 'Auto-submitted by Admin' });
          // Then Approve
          await workflowAPI.approve('summative', test.id, { comments: 'Self-approved by Admin' });

          setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'Approved' } : t));
          showSuccess(`${test.title} auto-approved!`);
        } else {
          // Teachers and Head Teachers must submit for approval
          await workflowAPI.submit({ assessmentId: test.id, assessmentType: 'summative', comments: 'Submitted for approval' });
          setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'Submitted' } : t));
          showSuccess(`${test.title} submitted for review!`);
        }
      } else if (status === 'SUBMITTED' && canApprove) {
        // All admins can approve their own tests, others cannot
        const isOwnTest = test.submittedBy === user?.userId;

        // Debug logging
        console.log('=== APPROVAL CHECK DEBUG ===');
        console.log('User ID:', user?.userId);
        console.log('User Role:', user?.role);
        console.log('Test submittedBy:', test.submittedBy);
        console.log('Is own test:', isOwnTest);
        console.log('Is admin:', isAdmin);
        console.log('Can approve:', canApprove);
        console.log('==========================');

        if (isOwnTest && !isAdmin) {
          showError('You cannot approve your own test. Please wait for an administrator to review it.');
          return;
        }

        await workflowAPI.approve('summative', test.id, { comments: isAdmin && isOwnTest ? 'Self-approved by Admin' : 'Approved' });
        setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'Approved' } : t));
        showSuccess(`${test.title} approved!`);
      } else if (status === 'APPROVED' && canPublish) {
        await workflowAPI.publish('summative', test.id);
        setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'Published' } : t));
        showSuccess(`${test.title} published!`);
      }
    } catch (error) {
      console.error('Workflow action failed:', error);
      showError('Action failed: ' + (error.message || 'Unknown error'));
    }
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <SummativeTestForm
        onBack={() => setViewMode('list')}
        onSuccess={(createdTest, selectedLearners) => {
          console.log('Test created:', createdTest);
          console.log('Selected learners:', selectedLearners);
          fetchTests(); // Refresh the tests list
          setViewMode('list');
          showSuccess('Test created successfully!');
        }}
      />
    );
  }

  if (viewMode === 'bulk_create') {
    return (
      <BulkCreateTest
        onBack={() => setViewMode('list')}
        onSuccess={() => {
          fetchTests(); // Refresh the tests list
          setViewMode('list');
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Toolbar with Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-4 bg-brand-purple/5 px-4 py-2 rounded-lg border border-brand-purple/10 flex-1">
              <span className="text-sm font-bold text-brand-purple">{selectedIds.length} Selected</span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 transition"
                >
                  <Trash2 size={14} /> Bulk Delete
                </button>
                {['HEAD_TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                  <button
                    onClick={handleBulkApprove}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 transition"
                  >
                    <CheckCircle size={14} /> Bulk Approve
                  </button>
                )}
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 bg-white text-gray-600 text-xs font-bold rounded-md border border-gray-200 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0">
              <div className="text-right border-r pr-4 border-gray-200 min-w-[80px]">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Tests</p>
                <p className="text-xl font-bold text-gray-800 leading-none">{stats.total}</p>
              </div>
              <div className="text-right border-r pr-4 border-gray-200 min-w-[60px]">
                <p className="text-[10px] text-orange-600 uppercase font-bold tracking-wider">Draft</p>
                <p className="text-xl font-bold text-orange-700 leading-none">{stats.draft}</p>
              </div>
              <div className="text-right border-r pr-4 border-gray-200 min-w-[80px]">
                <p className="text-[10px] text-green-600 uppercase font-bold tracking-wider">Published</p>
                <p className="text-xl font-bold text-green-700 leading-none">{stats.published}</p>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Completed</p>
                <p className="text-xl font-bold text-gray-800 leading-none">{stats.completed}</p>
              </div>
            </div>
          )}

          {/* Actions - Hidden as per user request to favor automated setup */}
          {/* 
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
              {canApproveAll && (
                <button
                  onClick={() => setShowApproveAll(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition shadow-sm font-bold"
                  title="Approve tests by exam group"
                >
                  <CheckCircle size={20} /> <span className="hidden sm:inline">Approve All</span><span className="inline sm:hidden">Approve</span>
                </button>
              )}
              <button
                onClick={handleAddSingleTest}
                className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition shadow-sm font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={user?.role === 'TEACHER'}
                title={user?.role === 'TEACHER' ? "Please consult with the Head Teacher to create new tests" : "Create a single test"}
              >
                <Plus size={16} /> <span className="hidden sm:inline">New Test</span><span className="inline sm:hidden">+</span>
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-brand-teal/70 text-white rounded-lg hover:bg-brand-teal/80 transition shadow-sm font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={user?.role === 'TEACHER'}
                title={user?.role === 'TEACHER' ? "Please consult with the Head Teacher to create new tests" : "Create all tests for a series"}
              >
                <Plus size={16} /> <span className="hidden sm:inline">Create all</span><span className="inline sm:hidden">Create all</span>
              </button>
            </div>
          </div>
          */}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-brand-teal" size={32} />
        </div>
      ) : Object.keys(groupedData).length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedData).map(([gradeKey, seriesGroups]) => {
              const isExpanded = expandedGrades.includes(gradeKey);
              const testCount = Object.values(seriesGroups).reduce((acc, g) => acc + g.tests.length, 0);

              return (
                <div key={gradeKey}>
                  <div
                    onClick={() => toggleGrade(gradeKey)}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                      <h3 className="font-bold text-gray-800 text-lg">{formatGradeDisplay(gradeKey)}</h3>
                      <span className="text-xs font-bold bg-brand-purple/10 text-brand-purple px-2 py-1 rounded-full border border-brand-purple/20">
                        {testCount} {testCount === 1 ? 'Test' : 'Tests'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50/50 px-6 pb-4 pt-2">
                      {Object.entries(seriesGroups).map(([seriesName, data]) => (
                        <div key={seriesName} className="mb-4 last:mb-0">
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 bg-gradient-to-r from-brand-purple/5 to-brand-teal/5 border-b border-gray-200 flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-gray-800">{seriesName}</h4>
                                <p className="text-xs text-gray-600 mt-1">
                                  {data.tests.length} assessment {data.tests.length === 1 ? 'area' : 'areas'}
                                </p>
                              </div>
                            </div>

                            <div className="p-0">
                              <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 w-10">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                                        onChange={(e) => {
                                          const testIds = data.tests.map(t => t.id);
                                          if (e.target.checked) {
                                            setSelectedIds(prev => [...new Set([...prev, ...testIds])]);
                                          } else {
                                            setSelectedIds(prev => prev.filter(id => !testIds.includes(id)));
                                          }
                                        }}
                                        checked={data.tests.every(t => selectedIds.includes(t.id))}
                                      />
                                    </th>
                                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Learning Area</th>
                                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-center">Marks</th>
                                    <th className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {data.tests.map(test => (
                                    <tr key={test.id} className={`hover:bg-brand-purple/5 transition ${selectedIds.includes(test.id) ? 'bg-brand-purple/10' : ''}`}>
                                      <td className="px-4 py-3">
                                        <input
                                          type="checkbox"
                                          className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                                          checked={selectedIds.includes(test.id)}
                                          onChange={() => toggleSelect(test.id)}
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <div>
                                          <p className="font-bold text-gray-800 text-sm">
                                            {test.learningArea}
                                          </p>
                                          {test.testType && (
                                            <p className="text-[10px] text-gray-500 font-medium">{test.testType}</p>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <button
                                          onClick={() => handleStatusClick(test)}
                                          className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${getStatusBadgeStyles(test.status)}`}
                                        >
                                          {test.status}
                                        </button>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                          <span className="text-sm font-bold text-gray-700">{test.totalMarks}</span>
                                          <span className="text-[10px] text-gray-400">marks</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                          <button
                                            onClick={() => onNavigate('summative-results', { testId: test.id })}
                                            className="p-1.5 text-brand-teal hover:bg-brand-teal/10 rounded transition"
                                            title="View Results"
                                          >
                                            <Eye size={16} />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedTest(test);
                                              setViewMode('edit');
                                            }}
                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                            title="Edit Test"
                                          >
                                            <Edit size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleDelete(test)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                            title="Delete Test"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Database}
          title="No Summative Tests Found"
          message="Your assessment repository is currently empty. Start by creating a new summative test architecture for your classes."
          actionText="Create New Test"
          onAction={handleAdd}
        />
      )}

      <ConfirmDialog
        show={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText || 'Confirm'}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setShowConfirm(false)}
        confirmButtonClass={confirmConfig.title?.includes('Delete') ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-teal hover:bg-brand-teal/90'}
      />

      {/* Approve All Dialog */}
      {showApproveAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 animate-scale-in overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Approve All</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select the unapproved exam groups (series) you want to approve. Draft tests will be submitted first, then approved.
                </p>
              </div>
              <button
                onClick={() => {
                  if (approvingAll) return;
                  setShowApproveAll(false);
                  setApproveAllQuery('');
                  setSelectedGroupKeys(new Set());
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-bold text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={approveAllQuery}
                      onChange={(e) => setApproveAllQuery(e.target.value)}
                      placeholder="Search grade or exam group..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                      disabled={approvingAll}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                    checked={unapprovedGroups.length > 0 && unapprovedGroups.every(g => selectedGroupKeys.has(g.key))}
                    onChange={(e) => setAllVisibleGroupsSelected(e.target.checked)}
                    disabled={approvingAll || unapprovedGroups.length === 0}
                  />
                  Select all
                </label>
              </div>

              {unapprovedGroups.length === 0 ? (
                <div className="bg-brand-teal/10 border border-brand-teal/20 text-brand-teal rounded-lg p-4 text-sm font-bold">
                  No unapproved exam groups found.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-[52vh] overflow-auto divide-y divide-gray-100">
                    {unapprovedGroups.map(group => (
                      <label key={group.key} className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                          checked={selectedGroupKeys.has(group.key)}
                          onChange={() => toggleGroupKey(group.key)}
                          disabled={approvingAll}
                        />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="font-bold text-gray-900">
                                {formatGradeDisplay(group.gradeKey)} • {group.seriesName}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {group.totalActionable} pending • {group.submittedCount} submitted • {group.draftCount} draft
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {group.submittedCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                                  SUBMITTED {group.submittedCount}
                                </span>
                              )}
                              {group.draftCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                                  DRAFT {group.draftCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-bold text-gray-800">{selectedGroupKeys.size}</span>
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (approvingAll) return;
                    setShowApproveAll(false);
                    setApproveAllQuery('');
                    setSelectedGroupKeys(new Set());
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-bold"
                  disabled={approvingAll}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveAllSelectedGroups}
                  className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={approvingAll || selectedGroupKeys.size === 0}
                >
                  {approvingAll ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  Approve selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummativeTests;
