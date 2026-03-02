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
    id: 'early_years',
    name: 'Early Years',
    grades: ['CRECHE', 'PLAYGROUP', 'RECEPTION', 'TRANSITION']
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
  },
  {
    id: 'senior_school',
    name: 'Senior School',
    grades: ['GRADE_10', 'GRADE_11', 'GRADE_12']
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
  const [showCreateTestsOption, setShowCreateTestsOption] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState([]);

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
      setScaleName('');
      setSelectedGrades(['GRADE_1']);
      setShowCreateTestsOption(true);
      await loadData();
    } catch (err) {
      console.error('Error creating scale:', err);
      showError('Failed to create scale: ' + (err.message || 'Internal error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScale = async (scaleGroupId, scaleName) => {
    setConfirmConfig({
      title: 'Delete Performance Scale',
      message: `Are you sure you want to delete "${scaleName}"? This will remove the grading configuration for all associated subjects.`,
      confirmText: 'Delete Scale',
      onConfirm: async () => {
        setShowConfirm(false);
        setLoading(true);
        try {
          await gradingAPI.deleteScaleGroup(scaleGroupId);
          showSuccess('Performance scale deleted successfully');
          await loadData();
        } catch (err) {
          showError('Failed to delete scale: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    });
    setShowConfirm(true);
  };

  // Create tests for all grades after scales are created
  const handleCreateTests = async () => {
    setCreatingTests(true);
    try {
      const response = await gradingAPI.createTestsForScales({
        term: 'TERM_1',
        academicYear: new Date().getFullYear(),
        overwrite: false
      });
      
      showSuccess(`✓ Created ${response.data.created} summative tests! All tests are now pre-linked to their grading scales.`);
      setShowCreateTestsOption(false);
      setViewMode('list');
      await loadData();
    } catch (err) {
      showError('Failed to create tests: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingTests(false);
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
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setScaleName('');
                  setSelectedGrades(['GRADE_1']);
                  setShowCreateTestsOption(false);
                  setViewMode('list');
                }}
                className="hidden md:flex text-slate-500 font-bold"
              >
                {showCreateTestsOption ? 'Skip' : 'Cancel'}
              </Button>

              {!showCreateTestsOption ? (
                <Button
                  onClick={handleCreateScale}
                  disabled={saving || !scaleName.trim() || selectedGrades.length === 0}
                  className="bg-brand-purple hover:bg-brand-purple/90 text-white px-8 rounded-full shadow-lg shadow-brand-purple/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={18} />
                      <span>Deploying Scales...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2" size={18} />
                      <span>Generate & Apply Logic</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleCreateTests}
                  disabled={creatingTests}
                  className="bg-brand-teal hover:bg-brand-teal/90 text-white px-8 rounded-full shadow-lg shadow-brand-teal/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {creatingTests ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={18} />
                      <span>Creating Tests...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2" size={18} />
                      <span>Also Create Tests</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: CONFIGURATION */}
            <div className="lg:col-span-8 space-y-8">

              {/* Identity */}
              <Card className="border-purple-100 shadow-sm overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-purple group-hover:w-2.5 transition-all" />
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <Settings2 className="text-brand-purple" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Scale Identity</CardTitle>
                      <CardDescription>Give this grading logic a recognizable name.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-black text-xs uppercase tracking-wider">Internal Reference Name</Label>
                    <Input
                      placeholder="e.g., End Term 1 2026 Primary Scale"
                      value={scaleName}
                      onChange={(e) => setScaleName(e.target.value)}
                      className="h-12 text-lg font-bold border-slate-200 focus-visible:ring-brand-purple"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">This name will be used to group these subjects in the system reports.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Rubric Definition */}
              <Card className="border-purple-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 rounded-xl">
                      <Gauge className="text-brand-teal" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Rubric Calibration</CardTitle>
                      <CardDescription>Define the point-to-mark mapping for the performance levels.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-8">
                  <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-2">Min Mark %</div>
                    <div className="col-span-1 text-center">Pts</div>
                    <div className="col-span-9 pl-4">Expectation / Title</div>
                  </div>
                  <div className="space-y-2.5">
                    {ranges.map((range, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 p-2 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-brand-purple/30 rounded-2xl transition-all items-center group/row"
                      >
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={range.mark}
                            onChange={(e) => {
                              const newRanges = [...ranges];
                              newRanges[index].mark = e.target.value;
                              setRanges(newRanges);
                            }}
                            className="h-10 text-center font-black border-slate-200 focus-visible:ring-brand-teal bg-white rounded-xl"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Badge className="h-8 w-8 rounded-full flex items-center justify-center font-black text-sm border-transparent bg-brand-teal/10 text-brand-teal">
                            {range.score}
                          </Badge>
                        </div>
                        <div className="col-span-9">
                          <Input
                            value={range.title}
                            onChange={(e) => {
                              const newRanges = [...ranges];
                              newRanges[index].title = e.target.value;
                              setRanges(newRanges);
                            }}
                            className="h-10 border-slate-200 focus-visible:ring-brand-purple bg-white rounded-xl font-bold text-slate-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Grade Target Selection */}
              <Card className="border-purple-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <GraduationCap className="text-brand-purple" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Target Grade Groups</CardTitle>
                      <CardDescription>Which levels will use this standardized scale?</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllGrades}
                    className="rounded-full border-purple-100 text-brand-purple font-bold h-8"
                  >
                    {selectedGrades.length === GRADES_FLAT.length ? 'Clear All' : 'Select All Grades'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  {GRADE_GROUPS.map(group => (
                    <div key={group.id} className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.name}</h4>
                        <button
                          onClick={() => handleSelectGroup(group.grades)}
                          className="text-[9px] font-black text-brand-purple hover:text-brand-purple/80 uppercase tracking-widest outline-none"
                        >
                          {group.grades.every(g => selectedGrades.includes(g)) ? 'Reset Group' : 'Check All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {group.grades.map(grade => {
                          const isSelected = selectedGrades.includes(grade);
                          return (
                            <div
                              key={grade}
                              onClick={() => handleGradeToggle(grade)}
                              className={`
                                                                relative flex items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer select-none h-12
                                                                ${isSelected
                                  ? 'bg-purple-50 border-brand-purple shadow-sm'
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                                }
                                                            `}
                            >
                              <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-brand-purple' : 'text-slate-500'}`}>
                                {formatGradeDisplay(grade)}
                              </span>
                              {isSelected && (
                                <div className="absolute top-1 right-1">
                                  <CheckCircle size={10} className="text-brand-purple fill-brand-purple/10" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: SIDEBAR PREVIEW */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <Card className="border-none bg-slate-900 shadow-2xl shadow-indigo-200/50 overflow-hidden text-white">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <RefreshCw size={140} />
                  </div>
                  <CardHeader className="border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <LayoutPanelLeft className="text-brand-teal" size={18} />
                      <CardTitle className="text-lg">Deployment Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Grading Matrix Generation</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black tracking-tighter tabular-nums">
                          {totalImpactedAreas}
                        </span>
                        <p className="text-indigo-300 font-bold mb-2">Subject Links</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Levels</p>
                        <p className="text-2xl font-black text-brand-teal">{selectedGrades.length}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Rubric Steps</p>
                        <p className="text-2xl font-black text-brand-teal">8-Pt</p>
                      </div>
                    </div>

                    {selectedGrades.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Target Distribution</p>
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {selectedGrades.map(grade => (
                            <Badge
                              key={grade}
                              className="border-transparent bg-brand-purple/20 text-indigo-100 font-black text-[9px] px-2 py-0.5"
                            >
                              {formatGradeDisplay(grade)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-white/5 bg-black/10">
                    <div className="flex gap-3 items-start">
                      <Info className="text-amber-400 shrink-0 mt-0.5" size={14} />
                      <p className="text-[10px] text-indigo-100/60 font-medium leading-relaxed">
                        Generating a scale group will create unique grading logic for every subject in the chosen grades at once.
                      </p>
                    </div>
                  </CardFooter>
                </Card>

                <div className="bg-brand-teal/5 border border-brand-teal/10 rounded-2xl p-5 flex gap-4">
                  <div className="h-10 w-10 bg-brand-teal/10 rounded-full flex items-center justify-center shrink-0">
                    <Zap className="text-brand-teal" size={20} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black text-brand-teal">System Optimizer</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Apply changes to **{selectedGrades.length}** grades efficiently without configuring each subject manually.
                    </p>
                  </div>
                </div>
              </div>
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
          <div className="space-y-6">
            {Object.entries(groupedData)
              .sort((a, b) => {
                const valA = GRADES_FLAT.findIndex(g => g === a[0]);
                const valB = GRADES_FLAT.findIndex(g => g === b[0]);
                return valA - valB;
              })
              .map(([gradeValue, groups]) => (
                <Card key={gradeValue} className="border-slate-100 shadow-sm overflow-hidden bg-white">
                  <div
                    className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors group"
                    onClick={() => setExpandedGrades(prev =>
                      prev.includes(gradeValue) ? prev.filter(g => g !== gradeValue) : [...prev, gradeValue]
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                        <Layers className="text-indigo-600" size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{formatGradeDisplay(gradeValue)}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="border-transparent bg-brand-purple/10 text-brand-purple px-1.5 py-0 font-black text-[9px] uppercase tracking-wider">
                            {Object.keys(groups).length} Group{Object.keys(groups).length !== 1 ? 's' : ''}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Active Protocols</span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full transition-all ${expandedGrades.includes(gradeValue) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300'}`}>
                      {expandedGrades.includes(gradeValue) ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                    </div>
                  </div>

                  {expandedGrades.includes(gradeValue) && (
                    <div className="px-6 pb-6 pt-2 divide-y divide-slate-50">
                      {Object.entries(groups).map(([scaleName, data]) => (
                        <div key={scaleName} className="py-8 first:pt-4 last:pb-0">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-1 rounded-full bg-brand-teal"></div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-lg leading-none">{scaleName}</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">{data.learningAreas.length} Associated Subject Matrices</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteScale(data.scaleGroupId, scaleName)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl h-10 w-10 transition-colors"
                            >
                              <Trash2 size={20} />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {data.learningAreas.map((area, idx) => (
                              <div key={idx} className="group relative flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-brand-purple/40 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
                                <div className="flex-1 overflow-hidden pr-4">
                                  <p className="text-xs font-black text-slate-700 truncate tracking-tight">{area.learningArea}</p>
                                  <div className="flex items-center gap-1 mt-2.5">
                                    {area.ranges?.slice(0, 5).map((r, rIdx) => (
                                      <div
                                        key={rIdx}
                                        className="w-1.5 h-1.5 rounded-full ring-2 ring-white"
                                        style={{ backgroundColor: getColorForScore(r.points) }}
                                        title={`${r.label}`}
                                      />
                                    ))}
                                    <span className="text-[10px] text-slate-400 font-bold ml-1">
                                      +{area.ranges?.length - 5 > 0 ? area.ranges.length - 5 : 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                  <LayoutPanelLeft size={16} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
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
