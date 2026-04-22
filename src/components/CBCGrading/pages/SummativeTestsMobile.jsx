import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Eye, Loader, Search, Edit, ArrowLeft, RefreshCw, ChevronRight, BookOpen } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../../../hooks/useAuth';
import { assessmentAPI } from '../../../services/api';
import SummativeTestForm from '../../../pages/assessments/SummativeTestForm';
import ResetUtility from '../../../pages/assessments/ResetUtility';
import EmptyState from '../shared/EmptyState';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useInstitutionLabels } from '../../../hooks/useInstitutionLabels';
import { cn } from '../../../utils/cn';

const SummativeTestsMobile = ({ onNavigate, onBack }) => {
  const { showSuccess, showError } = useNotifications();
  const { user } = useAuth();
  const labels = useInstitutionLabels();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});
  const [deleting, setDeleting] = useState(false);

  const handleBackToSidebar = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assessmentAPI.getTests({});
      let testsData = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setTests(testsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
       showError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const filteredTests = useMemo(() => {
    return tests.filter(t =>
      (t.title || t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.grade || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.learningArea || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tests, searchQuery]);

  const groupedData = useMemo(() => {
    const grouped = {};
    filteredTests.forEach(test => {
      const gradeKey = test.grade || 'UNASSIGNED';
      if (!grouped[gradeKey]) grouped[gradeKey] = [];
      grouped[gradeKey].push(test);
    });
    return grouped;
  }, [filteredTests]);

  const handleDeleteTest = (testId) => {
    const test = tests.find(t => t.id === testId);
    setConfirmConfig({
      title: 'Delete Assessment',
      message: `Are you sure you want to delete "${test?.title}"? This cannot be undone.`,
      onConfirm: async () => {
        setShowConfirm(false);
        setDeleting(true);
        try {
          const response = await assessmentAPI.deleteTest(testId);
          if (response.success) {
            showSuccess('Test removed successfully');
            setTests(prev => prev.filter(t => t.id !== testId));
          } else {
            showError(response.message || 'Failed to delete');
          }
        } catch (error) {
          showError('Internal Error Occurred');
        } finally {
          setDeleting(false);
        }
      }
    });
    setShowConfirm(true);
  };

  if (viewMode === 'reset') {
    return (
      <div className="fixed inset-0 bg-white z-[120] overflow-y-auto font-sans">
        <div className="bg-white border-b border-gray-100 p-5 sticky top-0 z-10 flex items-center gap-4">
          <button 
             onClick={() => setViewMode('list')}
             className="p-2 border border-gray-100 rounded-xl active:scale-90 transition-all"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Database Tools</h1>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">Assessment Cleanup</p>
          </div>
        </div>
        <div className="p-5">
          <ResetUtility />
        </div>
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="fixed inset-0 bg-white z-[120]">
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

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-[110] font-sans">
      <div className="bg-white border-b border-gray-100 px-5 pt-8 pb-5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
               onClick={handleBackToSidebar}
               className="p-2.5 hover:bg-gray-100 rounded-2x active:scale-95 transition-all outline-none"
            >
              <ArrowLeft size={22} className="text-gray-900" />
            </button>
            <div>
               <h1 className="text-xl font-semibold text-gray-900 tracking-tight leading-none">Manage Tests</h1>
               <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">Master Repository</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {user?.role !== 'TEACHER' && (
                <button
                  onClick={() => setViewMode('reset')}
                  className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-2xl active:scale-90 transition-all border border-red-100"
                >
                  <RefreshCw size={20} />
                </button>
             )}
              <button
                onClick={() => {
                   setSelectedTest(null);
                   setViewMode('create');
                }}
                className="w-10 h-10 flex items-center justify-center bg-[var(--brand-purple)] text-white rounded-2xl shadow-lg shadow-purple-100 active:scale-90 transition-all"
              >
                <Plus size={22} strokeWidth={3} />
              </button>
          </div>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder={`Search by ${labels.grade} or ${labels.subject}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-10 h-10 border-4 border-purple-50 border-t-purple-500 rounded-full animate-spin" />
             <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Loading Tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="py-20 px-10 text-center space-y-6">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <BookOpen size={40} className="text-gray-200" />
             </div>
             <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest">No Tests Defined</h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">It seems you haven\'t created any assessments for this academic session yet.</p>
             </div>
             <button
                 onClick={() => setViewMode('create')}
                 className="px-6 py-3 bg-[var(--brand-purple)] text-white text-[10px] font-semibold uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-50"
             >
                Create Initial Test
             </button>
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="py-20 text-center">
             <Search size={40} className="mx-auto text-gray-200 mb-4" />
             <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">No Search Results</p>
          </div>
        ) : (
          Object.entries(groupedData)
            .sort()
            .map(([gradeKey, gradeTests]) => (
              <div key={gradeKey} className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                   <div className="w-8 h-8 rounded-2xl bg-gray-50 flex items-center justify-center text-[10px] font-semibold text-gray-800 shadow-inner">
                      {gradeKey.substring(0, 2).toUpperCase()}
                   </div>
                   <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em]">
                      {gradeKey.replace(/_/g, ' ')}
                   </span>
                </div>

                <div className="grid gap-4">
                   {gradeTests.map(test => (
                    <div key={test.id} className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-5">
                       <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                             <h4 className="text-base font-semibold text-gray-900 leading-tight mb-1">{test.title}</h4>
                             <div className="flex items-center gap-2">
                                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-tight">Active</span>
                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{test.totalMarks} Points Max</span>
                             </div>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                             <BookOpen size={18} className="text-[var(--brand-purple)]" />
                          </div>
                       </div>

                       <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedTest(test);
                              setViewMode('edit');
                            }}
                            className="flex-1 py-3 bg-gray-50 border border-transparent text-gray-700 rounded-2xl text-[10px] font-semibold uppercase tracking-widest hover:bg-white hover:border-gray-100 transition-all active:scale-95"
                          >
                             Configure
                          </button>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            disabled={deleting}
                            className="w-14 py-3 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 border border-red-100"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

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
