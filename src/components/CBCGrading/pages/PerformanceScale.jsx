/**
 * Performance Scale Management - Scale Group System  
 * Create one scale, auto-generate for all learning areas
 * Redesigned with premium Shadcn UI and brand colors (Purple & Teal)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, Plus, Trash2, Loader, Search,
  ChevronDown, ChevronRight, CheckCircle, Info, Database,
  ListChecks, Settings2, RefreshCw, Zap, GraduationCap,
  Layers, LayoutPanelLeft, ShieldCheck, Gauge, AlertCircle
} from 'lucide-react';
import { gradingAPI, configAPI } from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { getLearningAreasByGrade } from '../../../constants/learningAreas';
import EmptyState from '../shared/EmptyState';
import ConfirmDialog from '../shared/ConfirmDialog';

// Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

// ---- Constants outside to prevent initialization issues ----
const GRADE_GROUPS = [
  {
    id: 'playgroup',
    name: 'Playgroup (PG)',
    grades: ['PLAYGROUP']
  },
  {
    id: 'pre_primary',
    name: 'Pre-Primary',
    grades: ['PP1', 'PP2']
  },
  {
    id: 'lower_primary',
    name: 'Lower Primary',
    grades: ['GRADE_1', 'GRADE_2', 'GRADE_3']
  },
  {
    id: 'upper_primary',
    name: 'Upper Primary',
    grades: ['GRADE_4', 'GRADE_5', 'GRADE_6']
  },
  {
    id: 'junior_school',
    name: 'Junior School',
    grades: ['GRADE_7', 'GRADE_8', 'GRADE_9']
  }
];

const GRADES_FLAT = GRADE_GROUPS.flatMap(group => group.grades);

const EIGHT_POINT_TEMPLATE = [
  { mark: 90, score: 8, rating: 'EE1', title: 'Exceeding Expectations 1', desc: 'The learner has achieved the learning outcome perfectly and can apply the skill/content in novel situations' },
  { mark: 75, score: 7, rating: 'EE2', title: 'Exceeding Expectations 2', desc: 'The learner has achieved the learning outcome very well and can apply the skill/content in most situations' },
  { mark: 58, score: 6, rating: 'ME1', title: 'Meeting Expectations 1', desc: 'The learner has achieved the learning outcome and can apply the skill/content in most situations with some support' },
  { mark: 41, score: 5, rating: 'ME2', title: 'Meeting Expectations 2', desc: 'The learner has achieved the learning outcome and can apply the skill/content in familiar situations with support' },
  { mark: 31, score: 4, rating: 'AE1', title: 'Approaching Expectations 1', desc: 'The learner has partially achieved the learning outcome and is beginning to apply the skill/content in familiar situations' },
  { mark: 21, score: 3, rating: 'AE2', title: 'Approaching Expectations 2', desc: 'The learner has partially achieved the learning outcome and requires considerable support to apply the skill/content' },
  { mark: 11, score: 2, rating: 'BE1', title: 'Below Expectations 1', desc: 'The learner has not achieved the learning outcome and requires substantial support to demonstrate the skill/content' },
  { mark: 1, score: 1, rating: 'BE2', title: 'Below Expectations 2', desc: 'The learner has not achieved the learning outcome and demonstrates minimal understanding of the skill/content' }
];

const PerformanceScale = () => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingTests, setCreatingTests] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState([]);
  const [expandedMajorGrades, setExpandedMajorGrades] = useState([]); // Tracks which grades are expanded

  // Form State
  const [scaleName, setScaleName] = useState('');
  const [selectedGrades, setSelectedGrades] = useState(['GRADE_1']);
  const [ranges, setRanges] = useState(EIGHT_POINT_TEMPLATE.map(t => ({
    mark: t.mark,
    score: t.score,
    description: t.desc,
    rating: t.rating,
    title: t.title
  })));
  const [isRubricExpanded, setIsRubricExpanded] = useState(false);
  const [isGradesExpanded, setIsGradesExpanded] = useState(true);

  // Data State
  const [scaleGroups, setScaleGroups] = useState([]);
  const [gradingSystems, setGradingSystems] = useState([]);
  const [dbLearningAreas, setDbLearningAreas] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => { } });

  const [schoolId] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user?.schoolId || user?.school?.id || localStorage.getItem('currentSchoolId');
    } catch (e) {
      return null;
    }
  });

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [groups, systems, areasData] = await Promise.all([
        gradingAPI.getScaleGroups(),
        gradingAPI.getSystems(schoolId),
        configAPI.getLearningAreas(schoolId)
      ]);

      setScaleGroups(groups.data || []);
      setGradingSystems(systems || []);
      setDbLearningAreas(Array.isArray(areasData) ? areasData : (areasData?.data || []));
    } catch (err) {
      showError('Failed to load performance scales: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGradeToggle = (gradeValue) => {
    setSelectedGrades(prev => {
      if (prev.includes(gradeValue)) {
        return prev.filter(g => g !== gradeValue);
      } else {
        return [...prev, gradeValue];
      }
    });
  };

  const handleSelectGroup = (groupGrades) => {
    const allSelected = groupGrades.every(g => selectedGrades.includes(g));
    if (allSelected) {
      setSelectedGrades(prev => prev.filter(g => !groupGrades.includes(g)));
    } else {
      setSelectedGrades(prev => Array.from(new Set([...prev, ...groupGrades])));
    }
  };

  const handleSelectAllGrades = () => {
    if (selectedGrades.length === GRADES_FLAT.length) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades([...GRADES_FLAT]);
    }
  };

  const handleCreateScale = async () => {
    if (!scaleName.trim()) {
      showError('Please enter a scale name');
      return;
    }

    if (selectedGrades.length === 0) {
      showError('Please select at least one grade level');
      return;
    }

    setSaving(true);
    try {
      const groupResponse = await gradingAPI.createScaleGroup({
        name: scaleName,
        description: `Standardized scale applied to ${selectedGrades.length} grade levels`
      });

      const scaleGroupId = groupResponse.data.id;

      const sortedRanges = [...ranges].sort((a, b) => b.mark - a.mark);
      const apiRanges = sortedRanges.map((range, index, arr) => {
        const prevRange = arr[index - 1];
        return {
          label: range.title,
          minPercentage: parseFloat(range.mark),
          maxPercentage: prevRange ? parseFloat(prevRange.mark) - 0.01 : 100,
          points: parseInt(range.score),
          description: range.description,
          rubricRating: range.rating
        };
      });

      await gradingAPI.generateGradesForGroup(scaleGroupId, {
        grades: selectedGrades,
        ranges: apiRanges
      });

      showSuccess(`✓ Created "${scaleName}" performance scale successfully!`);
      
      // AUTO-TRIGGER TEST CREATION (SILENT STEP)
      showSuccess(`Creating summative tests for all subjects...`);
      await handleCreateTests(true); // Signal it's an auto-trigger
      
    } catch (err) {
      console.error('Error creating scale:', err);
      showError('Failed to create scale: ' + (err.message || 'Internal error'));
      setSaving(false); // Reset state only on error since success chains to test creation
    }
  };

  const handleDeleteScale = async (scaleGroupId, scaleName, force = false) => {
    setConfirmConfig({
      title: force ? 'Force Delete Scale Group' : 'Delete Performance Scale',
      message: force 
        ? `This scale group has active tests. Deleting it will also archive all associated tests. This action cannot be undone. Are you sure?`
        : `Are you sure you want to delete "${scaleName}"? This will remove the grading configuration for all associated subjects.`,
      confirmText: force ? 'Force Delete Everything' : 'Delete Scale',
      onConfirm: async () => {
        setShowConfirm(false);
        setLoading(true);
        try {
          await gradingAPI.deleteScaleGroup(scaleGroupId, force ? { force: true } : {});
          showSuccess(force ? 'Scale group and associated tests deleted' : 'Performance scale deleted successfully');
          await loadData();
        } catch (err) {
          if (err.message.includes('409') || err.message.toLowerCase().includes('using these grading scales')) {
            // Trigger force delete confirmation
            handleDeleteScale(scaleGroupId, scaleName, true);
          } else {
            showError('Failed to delete scale: ' + err.message);
          }
        } finally {
          setLoading(false);
        }
      }
    });
    setShowConfirm(true);
  };

  // Create tests for all grades after scales are created
  const handleCreateTests = async (isAutoTrigger = false) => {
    setCreatingTests(true);
    try {
      const response = await gradingAPI.createTestsForScales({
        term: 'TERM_1',
        academicYear: new Date().getFullYear(),
        overwrite: false
      });
      
      showSuccess(`✓ Created ${response.data.created} summative tests! All tests are now pre-linked to their grading scales.`);
      setViewMode('list');
      setScaleName('');
      setSelectedGrades(['GRADE_1']);
      await loadData();
    } catch (err) {
      showError('Failed to create tests: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingTests(false);
      setSaving(false); // Ensure both loaders are cleared
    }
  };

  const getColorForScore = (score) => {
    const map = {
      8: '#1e3a8a', 7: '#1d4ed8',
      6: '#047857', 5: '#059669',
      4: '#b45309', 3: '#d97706',
      2: '#b91c1c', 1: '#dc2626'
    };
    return map[score] || '#6b7280';
  };

  const formatGradeDisplay = (grade) => {
    return grade.replace('GRADE_', 'Grade ').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculation for preview
  const totalImpactedAreas = useMemo(() => {
    return selectedGrades.reduce((count, grade) => {
      const areas = getLearningAreasByGrade(grade);
      return count + areas.length;
    }, 0);
  }, [selectedGrades]);

  const groupedData = useMemo(() => {
    const data = {};
    const filteredSystems = gradingSystems.filter(s =>
      s.grade && (searchTerm === '' ||
        s.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.learningArea?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filteredSystems.forEach(system => {
      const gradeKey = system.grade;
      if (!data[gradeKey]) data[gradeKey] = {};

      const scaleGroup = scaleGroups.find(g => g.id === system.scaleGroupId);
      const scaleGroupName = scaleGroup?.name || 'Individual Scales';

      if (!data[gradeKey][scaleGroupName]) {
        data[gradeKey][scaleGroupName] = {
          scaleGroupId: system.scaleGroupId,
          learningAreas: []
        };
      }
      data[gradeKey][scaleGroupName].learningAreas.push(system);
    });
    return data;
  }, [gradingSystems, scaleGroups, searchTerm]);

  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-[#fcfdff] pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-purple-100 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-full hover:bg-purple-50 hover:text-brand-purple border-purple-100"
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Scale Group Creator</h1>
                <div className="flex items-center gap-2 text-[10px] text-brand-purple font-black uppercase tracking-widest">
                  <ShieldCheck size={12} className="fill-brand-purple/10" />
                  <span>Standardized Assessment</span>
                </div>
              </div>

              {/* Minimalistic Metrics */}
              <div className="hidden lg:flex items-center gap-8 ml-8 pl-8 border-l border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subject Links</span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">{totalImpactedAreas}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Levels</span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">{selectedGrades.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rubric Steps</span>
                  <span className="text-xl font-black text-brand-teal tabular-nums">8-Pt</span>
                </div>
                {selectedGrades.length > 0 && (
                  <div className="flex flex-col max-w-[200px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Distribution</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedGrades.slice(0, 3).map(grade => (
                        <span key={grade} className="text-[10px] font-bold text-brand-purple bg-purple-50 px-1.5 py-0.5 rounded-md">
                          {grade.replace('GRADE_', 'G')}
                        </span>
                      ))}
                      {selectedGrades.length > 3 && <span className="text-[10px] font-bold text-slate-400">+{selectedGrades.length - 3}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setScaleName('');
                  setSelectedGrades(['GRADE_1']);
                  setViewMode('list');
                }}
                className="hidden md:flex text-slate-500 font-bold"
              >
                Cancel
              </Button>

              <Button
                onClick={handleCreateScale}
                disabled={saving || creatingTests || !scaleName.trim() || selectedGrades.length === 0}
                className="bg-brand-purple hover:bg-brand-purple/90 text-white px-6 h-10 rounded-xl shadow-lg shadow-brand-purple/20 transition-all active:scale-95 disabled:opacity-50 text-[11px] font-black uppercase tracking-widest"
              >
                {saving || creatingTests ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={14} />
                    <span>{saving ? 'Deploying...' : 'Building...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="mr-2" size={14} />
                    <span>Deploy Scale Group</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="space-y-12">
            {/* 1. SCALE IDENTITY */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-brand-purple rounded-full" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">1. Name your Scale Group</h2>
              </div>
              <div className="relative">
                <Input
                  placeholder="e.g., End Term 1 2026 Primary Scale"
                  value={scaleName}
                  onChange={(e) => setScaleName(e.target.value)}
                  className="h-14 text-xl font-bold border-slate-200 focus-visible:ring-brand-purple bg-white rounded-2xl pl-6 shadow-sm transition-all placeholder:text-slate-200"
                />
                <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-[9px] ml-4">
                  Internal identifier for report generation.
                </p>
              </div>
            </section>

            {/* 2. RUBRIC CALIBRATION */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-brand-teal rounded-full" />
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">2. Calibrate Performance Levels</h2>
                  <p className="text-slate-500 font-bold text-[11px] mt-0.5">Map marks to rubric points and expectations.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-12 px-4 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="col-span-3">Min Mark %</div>
                  <div className="col-span-2 text-center">Score</div>
                  <div className="col-span-7 pl-4">Description</div>
                </div>

                <div className="space-y-2">
                  {ranges.map((range, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-3 p-2 bg-slate-50/50 hover:bg-white border border-transparent hover:border-brand-teal/30 rounded-xl transition-all items-center group"
                    >
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={range.mark}
                          onChange={(e) => {
                            const newRanges = [...ranges];
                            newRanges[index].mark = e.target.value;
                            setRanges(newRanges);
                          }}
                          className="h-11 text-lg text-center font-bold border-slate-200 focus-visible:ring-brand-teal bg-white rounded-xl shadow-sm"
                        />
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <div className="h-11 w-11 rounded-xl flex flex-col items-center justify-center font-black bg-white border border-slate-100 shadow-sm text-brand-teal">
                          <span className="text-[10px]">{range.score}</span>
                        </div>
                      </div>
                      <div className="col-span-7">
                        <Input
                          value={range.title}
                          onChange={(e) => {
                            const newRanges = [...ranges];
                            newRanges[index].title = e.target.value;
                            setRanges(newRanges);
                          }}
                          className="h-11 text-sm font-bold border-slate-200 focus-visible:ring-brand-purple bg-white rounded-xl pl-4 shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. TARGET GRADES */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-brand-purple rounded-full" />
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">3. Select Target Levels</h2>
                    <p className="text-slate-500 font-bold text-[11px] mt-0.5">Choose the grades that will adopt this scale.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllGrades}
                  className="rounded-full border-purple-100 text-brand-purple font-black uppercase tracking-widest text-[9px] h-8 px-4"
                >
                  {selectedGrades.length === GRADES_FLAT.length ? 'Reset' : 'Select All'}
                </Button>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm space-y-6">
                {GRADE_GROUPS.map(group => {
                  const isGroupFull = group.grades.every(g => selectedGrades.includes(g));
                  return (
                    <div key={group.id} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{group.name}</h4>
                        <button
                          onClick={() => handleSelectGroup(group.grades)}
                          className="text-[10px] font-bold text-brand-purple hover:underline"
                        >
                          {isGroupFull ? 'Remove' : 'Add Group'}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {group.grades.map(grade => {
                          const isSelected = selectedGrades.includes(grade);
                          return (
                            <button
                              key={grade}
                              onClick={() => handleGradeToggle(grade)}
                              className={`
                                h-11 min-w-[80px] px-4 rounded-xl text-xs font-black transition-all border-2
                                ${isSelected
                                  ? 'bg-brand-purple border-brand-purple text-white shadow-lg shadow-brand-purple/10'
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                }
                              `}
                            >
                              {formatGradeDisplay(grade)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* FOOTER SPACING */}
            <div className="pt-10 flex flex-col items-center">
              <p className="text-slate-400 text-[9px] font-bold text-center max-w-xs leading-relaxed uppercase tracking-widest opacity-50">
                Standardizes assessment logic school-wide.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="min-h-screen bg-[#fcfdff] pb-20">
      <div className="bg-white border-b border-slate-100 px-6 py-6 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Gauge className="text-brand-purple" size={24} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Performance Scaling</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm">Design and deploy assessment rubrics across the school curriculum.</p>
          </div>

          <div className="flex gap-4">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-purple transition-colors" size={18} />
              <Input
                placeholder="Filter by grade or logic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-slate-50/50 border-slate-100 group-focus-within:bg-white rounded-2xl transition-all"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => handleCreateTests()}
              disabled={creatingTests || loading}
              className="h-12 px-6 border-purple-100 text-brand-purple hover:bg-purple-50 rounded-2xl font-black transition-all active:scale-95 flex items-center gap-2"
            >
              {creatingTests ? <RefreshCw className="animate-spin" size={18} /> : <ListChecks size={20} />}
              <span>Sync All Tests</span>
            </Button>
            <Button
              onClick={() => setViewMode('create')}
              className="h-12 px-6 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-2xl font-black shadow-lg shadow-brand-purple/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Create Scale</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-brand-purple/20 border-t-brand-purple"></div>
            <p className="text-slate-400 mt-6 font-black uppercase tracking-widest text-xs">Synchronizing Scaling Engines...</p>
          </div>
        ) : Object.keys(groupedData).length === 0 ? (
          <div className="py-20">
            <EmptyState
              title="No Scaling Systems Configured"
              message={searchTerm ? "No results match your current filter." : "Deploy standardized grading logic to start assessing your learners."}
              actionText={searchTerm ? "Reset Filter" : "Start Configuration"}
              onAction={() => searchTerm ? setSearchTerm('') : setViewMode('create')}
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Level / Grade</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scaling Logic</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Matrices</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Object.entries(groupedData)
                  .sort((a, b) => {
                    const valA = GRADES_FLAT.findIndex(g => g === a[0]);
                    const valB = GRADES_FLAT.findIndex(g => g === b[0]);
                    return valA - valB;
                  })
                  .map(([gradeValue, groups]) => {
                    const isGradeExpanded = expandedMajorGrades.includes(gradeValue);
                    const totalScales = Object.keys(groups).length;
                    
                    return (
                      <React.Fragment key={gradeValue}>
                        {/* Grade Header Row (Accordion Trigger) */}
                        <tr 
                          onClick={() => setExpandedMajorGrades(prev => 
                            prev.includes(gradeValue) ? prev.filter(g => g !== gradeValue) : [...prev, gradeValue]
                          )}
                          className={`cursor-pointer transition-all border-b border-slate-100 ${isGradeExpanded ? 'bg-slate-50/80' : 'bg-white hover:bg-slate-50/50'}`}
                        >
                          <td colSpan={4} className="px-8 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isGradeExpanded ? 'bg-indigo-600' : 'bg-indigo-50 border border-indigo-100/50'}`}>
                                  <GraduationCap className={isGradeExpanded ? 'text-white' : 'text-indigo-600'} size={16} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                                    {formatGradeDisplay(gradeValue)}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {totalScales} Scaling {totalScales === 1 ? 'Logic' : 'Logics'} Deployed
                                  </span>
                                </div>
                              </div>
                              <div className={`transition-transform duration-300 ${isGradeExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown className="text-slate-300" size={18} />
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Scale Rows (Visible when Grade is expanded) */}
                        {isGradeExpanded && Object.entries(groups).map(([scaleName, data], groupIdx) => (
                          <React.Fragment key={`${gradeValue}-${scaleName}`}>
                            <tr className="hover:bg-slate-50/30 transition-all group animate-in slide-in-from-top-2 duration-200">
                              <td className="px-8 py-5 border-l-4 border-indigo-500/20">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100/50">
                                    <Settings2 className="text-slate-400" size={14} />
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Variation {groupIdx + 1}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-800 leading-none">{scaleName}</span>
                                  <div className="flex items-center gap-1 mt-2">
                                    {data.learningAreas[0]?.ranges?.slice(0, 5).map((r, rIdx) => (
                                      <div
                                        key={rIdx}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: getColorForScore(r.points) }}
                                        title={r.label}
                                      />
                                    ))}
                                    <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase">8-Pt Logic</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <Badge className="border-transparent bg-brand-purple/10 text-brand-purple px-2 py-0.5 font-black text-[10px] uppercase tracking-wider">
                                  {data.learningAreas.length} Subjects
                                </Badge>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCreateTests()}
                                    disabled={creatingTests}
                                    title="Regenerate tests for this scale"
                                    className="h-9 w-9 p-0 text-brand-purple hover:bg-purple-50 rounded-xl"
                                  >
                                    {creatingTests ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedGrades(prev => 
                                      prev.includes(`${gradeValue}-${scaleName}`) ? prev.filter(g => g !== `${gradeValue}-${scaleName}`) : [...prev, `${gradeValue}-${scaleName}`]
                                    )}
                                    className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-purple rounded-xl"
                                  >
                                    {expandedGrades.includes(`${gradeValue}-${scaleName}`) ? 'Hide Areas' : 'View Areas'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteScale(data.scaleGroupId, scaleName)}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-9 w-9"
                                  >
                                    <Trash2 size={18} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {/* Expanded View for Learning Areas */}
                            {expandedGrades.includes(`${gradeValue}-${scaleName}`) && (
                              <tr key={`${gradeValue}-${scaleName}-expanded`} className="bg-slate-50/10">
                                <td colSpan={4} className="px-12 py-6 border-l-4 border-indigo-500/20">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {data.learningAreas.map((area, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <span className="text-[11px] font-bold text-slate-600 truncate mr-2">{area.learningArea}</span>
                                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                          <LayoutPanelLeft size={12} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        show={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText || 'Confirm'}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default PerformanceScale;
