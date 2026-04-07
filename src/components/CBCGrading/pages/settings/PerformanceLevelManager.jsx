/**
 * Performance Level Manager - Refactored for Academic Settings
 * Manage scale groups and performance levels in a unified settings tab
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, Loader, Search, 
  ChevronDown, CheckCircle, Info, Database,
  ListChecks, Settings2, RefreshCw, Zap, GraduationCap,
  LayoutPanelLeft, ShieldCheck, Gauge, AlertCircle
} from 'lucide-react';
import { gradingAPI, configAPI } from '../../../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { getLearningAreasByGrade } from '../../../../constants/learningAreas';
import EmptyState from '../../shared/EmptyState';
import ConfirmDialog from '../../shared/ConfirmDialog';

// Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';

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

const PerformanceLevelManager = () => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingTests, setCreatingTests] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGrades, setExpandedGrades] = useState([]);
  const [expandedMajorGrades, setExpandedMajorGrades] = useState([]);

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

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => { } });


  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groups, systems] = await Promise.all([
        gradingAPI.getScaleGroups(),
        gradingAPI.getSystems()
      ]);
      setScaleGroups(groups?.success ? groups.data : (groups.data || groups || []));
      setGradingSystems(systems?.success ? systems.data : (systems.data || systems || []));
    } catch (err) {
      showError('Failed to load performance scales: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

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
      await handleCreateTests(); 
    } catch (err) {
      console.error('Error creating scale:', err);
      showError('Failed to create scale: ' + (err.message || 'Internal error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScale = async (scaleGroupId, scaleName, force = false) => {
    setConfirmConfig({
      title: force ? 'Force Delete Scale Group' : 'Delete Performance Scale',
      message: force 
        ? `This scale group has active tests. Deleting it will also archive all associated tests.`
        : `Are you sure you want to delete "${scaleName}"?`,
      confirmText: force ? 'Force Delete Everything' : 'Delete Scale',
      onConfirm: async () => {
        setShowConfirm(false);
        setLoading(true);
        try {
          await gradingAPI.deleteScaleGroup(scaleGroupId, force ? { force: true } : {});
          showSuccess(force ? 'Scale group and tests deleted' : 'Performance scale deleted');
          await loadData();
        } catch (err) {
          if (err.message.includes('409') || err.message.toLowerCase().includes('using these grading scales')) {
            handleDeleteScale(scaleGroupId, scaleName, true);
          } else {
            showError('Delete failed: ' + err.message);
          }
        } finally {
          setLoading(false);
        }
      }
    });
    setShowConfirm(true);
  };

  const handleCreateTests = async () => {
    setCreatingTests(true);
    try {
      const response = await gradingAPI.createTestsForScales({
        term: 'TERM_1',
        academicYear: new Date().getFullYear(),
        overwrite: false
      });
      showSuccess(`✓ Created ${response.data.created} summative tests!`);
      setViewMode('list');
      setScaleName('');
      setSelectedGrades(['GRADE_1']);
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
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setViewMode('list')} className="rounded-full">
              <Plus className="rotate-45" size={18} />
            </Button>
            <div>
              <h3 className="text-xl font-bold">Configure Scale Group</h3>
              <p className="text-sm text-gray-500">Define standardized performance levels</p>
            </div>
          </div>
          <Button 
            onClick={handleCreateScale} 
            disabled={saving || creatingTests || !scaleName.trim() || selectedGrades.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving || creatingTests ? <RefreshCw className="animate-spin mr-2" size={14} /> : <Zap className="mr-2" size={14} />}
            Deploy Scale Group
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
              <section className="space-y-3">
                <Label className="font-bold text-gray-700">1. Scale Name</Label>
                <Input 
                  placeholder="e.g., Standard 8-Point Rubric" 
                  value={scaleName} 
                  onChange={(e) => setScaleName(e.target.value)}
                  className="h-12 text-lg font-semibold"
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-gray-700">2. Target Grades</Label>
                  <Button variant="ghost" size="sm" onClick={handleSelectAllGrades} className="text-xs text-indigo-600">
                    {selectedGrades.length === GRADES_FLAT.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                   {GRADE_GROUPS.map(group => (
                     <div key={group.id} className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400">
                          <span>{group.name}</span>
                          <button onClick={() => handleSelectGroup(group.grades)} className="text-indigo-500 hover:underline">Group</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.grades.map(grade => (
                            <button
                              key={grade}
                              onClick={() => handleGradeToggle(grade)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                                selectedGrades.includes(grade) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400'
                              }`}
                            >
                              {formatGradeDisplay(grade)}
                            </button>
                          ))}
                        </div>
                     </div>
                   ))}
                </div>
              </section>
           </div>

           <div className="space-y-6">
              <Label className="font-bold text-gray-700">3. Level Calibration</Label>
              <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-left">
                  <thead className="border-b border-[color:var(--table-border)] text-[10px] uppercase">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-[color:var(--table-header-fg)]">Min %</th>
                      <th className="px-4 py-3 font-semibold text-[color:var(--table-header-fg)]">Pts</th>
                      <th className="px-4 py-3 font-semibold text-[color:var(--table-header-fg)]">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ranges.map((range, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2"><Input type="number" value={range.mark} onChange={(e) => {
                          const n = [...ranges]; n[idx].mark = e.target.value; setRanges(n);
                        }} className="h-8 text-center text-xs w-16" /></td>
                        <td className="p-2 text-center text-xs font-black text-indigo-600">{range.score}</td>
                        <td className="p-2"><Input value={range.title} onChange={(e) => {
                          const n = [...ranges]; n[idx].title = e.target.value; setRanges(n);
                        }} className="h-8 text-xs font-bold" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">Standard school-wide rubric. Deployed scales will automatically update all linked assessment areas for the selected grades.</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Standardized Performance Levels</h3>
          <p className="text-sm text-gray-500">Manage the grading protocols for all learning areas.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleCreateTests()}
            disabled={creatingTests || loading}
            className="flex items-center gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50"
          >
            {creatingTests ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Sync Tests
          </Button>
          <Button onClick={() => setViewMode('create')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus size={18} />
            Create Scale
          </Button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
        <Input
          placeholder="Search by grade or learning area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-11 bg-white border-gray-200 focus:ring-2 focus:ring-indigo-100 transition-all rounded-xl"
        />
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center">
          <Loader className="animate-spin text-indigo-600 mb-4" size={32} />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Scale Systems...</p>
        </div>
      ) : Object.keys(groupedData).length === 0 ? (
        <EmptyState
          title="No Scales Configured"
          message={searchTerm ? "No match found for your search." : "Configure standardized grading scales to start assessing results."}
          actionText={searchTerm ? "Clear Search" : "Create Your First Scale"}
          onAction={() => searchTerm ? setSearchTerm('') : setViewMode('create')}
        />
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-[10px] uppercase text-gray-400 font-black tracking-widest">
                <th className="px-6 py-4">Grade / Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(groupedData)
                .sort((a, b) => GRADES_FLAT.indexOf(a[0]) - GRADES_FLAT.indexOf(b[0]))
                .map(([grade, groups]) => {
                  const isExpanded = expandedMajorGrades.includes(grade);
                  return (
                    <React.Fragment key={grade}>
                      <tr 
                        onClick={() => setExpandedMajorGrades(prev => isExpanded ? prev.filter(g => g !== grade) : [...prev, grade])}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <GraduationCap className={isExpanded ? 'text-indigo-600' : 'text-gray-400'} size={18} />
                            <span className="font-bold text-gray-900">{formatGradeDisplay(grade)}</span>
                            <Badge variant="outline" className="text-[10px] bg-white">{Object.keys(groups).length} Logics</Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronDown className={`inline text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={18} />
                        </td>
                      </tr>
                      {isExpanded && Object.entries(groups).map(([name, data]) => (
                        <tr key={name} className="bg-white hover:bg-indigo-50/10 transition-colors animate-in slide-in-from-top-1 duration-200">
                          <td className="px-10 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-700">{name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 font-medium">Applied to {data.learningAreas.length} subjects</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteScale(data.scaleGroupId, name)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                  <Trash2 size={16} />
                                </Button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        show={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default PerformanceLevelManager;
