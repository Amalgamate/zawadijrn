/**
 * Summative Tests Page
 * Create and manage summative tests
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, Loader, CheckCircle, Database, ChevronDown, ChevronRight, Search, RefreshCw, ListChecks, GraduationCap } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import { assessmentAPI, classAPI, workflowAPI } from '../../../services/api';
import SummativeTestForm from '../../../pages/assessments/SummativeTestForm';
import BulkCreateTest from './BulkCreateTest';
import ConfirmDialog from '../shared/ConfirmDialog';
import EmptyState from '../shared/EmptyState';

// Shadcn UI components
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

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
  const [expandedMajorGrades, setExpandedMajorGrades] = useState([]); // High-level grade accordions
  const toggleGrade = (grade) => {
    setExpandedGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };
  
  const toggleMajorGrade = (grade) => {
    // Only one group open at a time
    setExpandedMajorGrades(prev => prev.includes(grade) ? [] : [grade]);
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
        onSuccess={(msg) => {
          fetchTests();
          setViewMode('list');
          if (msg) showSuccess(msg);
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
            </div>
          )}

          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
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
                <Plus size={16} /> <span className="hidden sm:inline">Bulk Create</span><span className="inline sm:hidden">Bulk</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center">
            <Loader className="animate-spin text-brand-purple mb-4" size={40} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Synchronizing Assessment Matrix...</p>
          </div>
        </div>
      ) : Object.keys(groupedData).length > 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-200 text-brand-purple focus:ring-brand-purple"
                    checked={selectedIds.length > 0 && selectedIds.length === tests.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(tests.map(t => t.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Level / Series</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Coverage</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status Metrics</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(groupedData)
                .sort((a, b) => {
                  const grades = ['PLAYGROUP', 'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9'];
                  return grades.indexOf(a[0]) - grades.indexOf(b[0]);
                })
                .map(([gradeKey, seriesGroups]) => {
                  const isMajorExpanded = expandedMajorGrades.includes(gradeKey);
                  const totalTests = Object.values(seriesGroups).reduce((acc, g) => acc + g.tests.length, 0);
                  const totalSeries = Object.keys(seriesGroups).length;

                  return (
                    <React.Fragment key={gradeKey}>
                      {/* Grade Header Row (Accordion Trigger) */}
                      <tr 
                        onClick={() => toggleMajorGrade(gradeKey)}
                        className={`cursor-pointer transition-all border-b border-slate-100 ${isMajorExpanded ? 'bg-slate-50/80' : 'bg-white hover:bg-slate-50/50'}`}
                      >
                        <td colSpan={5} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isMajorExpanded ? 'bg-brand-purple text-white' : 'bg-brand-purple/5 text-brand-purple border border-brand-purple/10'}`}>
                                <GraduationCap size={16} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">
                                  {formatGradeDisplay(gradeKey)}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                  {totalSeries} Assessment {totalSeries === 1 ? 'Series' : 'Series'} • {totalTests} Total Tests
                                </span>
                              </div>
                            </div>
                            <div className={`transition-transform duration-300 ${isMajorExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown className="text-slate-300" size={18} />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Series Rows (Visible when Grade is expanded) */}
                      {isMajorExpanded && Object.entries(seriesGroups).map(([seriesName, data], seriesIdx) => {
                        const groupKey = `${gradeKey}-${seriesName}`;
                        const isExpanded = expandedGrades.includes(groupKey);
                        const draftCount = data.tests.filter(t => ['Draft', 'DRAFT'].includes(t.status)).length;
                        const approvedCount = data.tests.filter(t => ['Approved', 'APPROVED', 'Published', 'PUBLISHED'].includes(t.status)).length;
                        const submittedCount = data.tests.filter(t => ['Submitted', 'SUBMITTED'].includes(t.status)).length;

                        return (
                          <React.Fragment key={seriesName}>
                            <tr className="hover:bg-slate-50/50 transition-all group animate-in slide-in-from-top-2 duration-200">
                              <td className="px-6 py-5 border-l-4 border-brand-purple/20">
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-200 text-brand-purple focus:ring-brand-purple"
                                  checked={data.tests.every(t => selectedIds.includes(t.id))}
                                  onChange={(e) => {
                                    const testIds = data.tests.map(t => t.id);
                                    if (e.target.checked) {
                                      setSelectedIds(prev => [...new Set([...prev, ...testIds])]);
                                    } else {
                                      setSelectedIds(prev => prev.filter(id => !testIds.includes(id)));
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-800 leading-tight">{seriesName}</span>
                                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Summative Series</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <Badge className="border-transparent bg-slate-100/50 text-slate-500 px-2 py-0.5 font-black text-[9px] uppercase tracking-widest">
                                  {data.tests.length} Assessment Areas
                                </Badge>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">{data.tests.length} Active</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleGrade(groupKey)}
                                  className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-purple rounded-xl"
                                >
                                  {isExpanded ? 'Hide Areas' : 'View Areas'}
                                </Button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/30">
                                <td colSpan={5} className="px-12 py-6 border-l-4 border-brand-purple/20">
                                  <div className="space-y-2">
                                    {data.tests.map(test => (
                                      <div key={test.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-brand-purple/20 transition-all">
                                        <div className="flex items-center gap-4">
                                          <input
                                            type="checkbox"
                                            className="rounded border-slate-200 text-brand-purple focus:ring-brand-purple"
                                            checked={selectedIds.includes(test.id)}
                                            onChange={() => toggleSelect(test.id)}
                                          />
                                          <div>
                                            <p className="text-[11px] font-bold text-slate-800">{test.learningArea}</p>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{test.testType || 'General Assessment'}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">

                                          <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-brand-teal" onClick={() => onNavigate('summative-results', { testId: test.id })}><Eye size={14} /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-green-600" onClick={() => { setSelectedTest(test); setViewMode('edit'); }}><Edit size={14} /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(test)}><Trash2 size={14} /></Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
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


    </div>
  );
};

export default SummativeTests;
