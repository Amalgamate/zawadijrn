import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, CheckCircle, Loader, Calendar, BookOpen,
    Layers, Clock, ClipboardList, ListChecks, Database,
    Info, GraduationCap, Zap, AlertCircle
} from 'lucide-react';
import { DatePicker } from '../../ui/date-picker';
import { assessmentAPI, gradingAPI } from '../../../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { getLearningAreasByGrade } from '../../../constants/learningAreas';

// Shadcn-like components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

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

const GRADES = GRADE_GROUPS.flatMap(group => group.grades);

const TEST_TYPES = [
    { value: 'OPENER', label: 'Opener Exam' },
    { value: 'MIDTERM', label: 'Midterm Assessment' },
    { value: 'END_TERM', label: 'End of Term Exam' },
    { value: 'MONTHLY', label: 'Monthly Assessment' },
    { value: 'WEEKLY', label: 'Weekly Test' },
    { value: 'RANDOM', label: 'Random Assessment' }
];

const TERMS = [
    { value: 'TERM 1', label: 'Term 1' },
    { value: 'TERM 2', label: 'Term 2' },
    { value: 'TERM 3', label: 'Term 3' }
];

const BulkCreateTest = ({ onBack, onSuccess }) => {
    const { showSuccess, showError } = useNotifications();
    const [saving, setSaving] = useState(false);
    const [loadingScales, setLoadingScales] = useState(false);
    const [scaleGroups, setScaleGroups] = useState([]);
    const [allLearningAreas, setAllLearningAreas] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        testType: 'MONTHLY',
        term: 'TERM 1',
        academicYear: new Date().getFullYear().toString(),
        testDate: new Date().toISOString().split('T')[0],
        totalMarks: '100',
        passMarks: '50',
        duration: '120',
        description: '',
        instructions: '',
        scaleGroupId: '',
        weight: '1.0'
    });

    const [selectedGrades, setSelectedGrades] = useState(['GRADE_6']);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingScales(true);
        try {
            const [scalesRes, areasRes] = await Promise.all([
                gradingAPI.getScaleGroups(),
                assessmentAPI.getLearningAreas()
            ]);
            setScaleGroups(scalesRes?.data || scalesRes || []);
            setAllLearningAreas(areasRes?.data || areasRes || []);
        } catch (err) {
            console.error('Error loading bulk create data:', err);
        } finally {
            setLoadingScales(false);
        }
    };

    const handleGradeToggle = (grade) => {
        setSelectedGrades(prev => {
            if (prev.includes(grade)) {
                return prev.filter(g => g !== grade);
            } else {
                return [...prev, grade];
            }
        });
    };

    const handleSelectGroup = (groupGrades) => {
        const allInGroupSelected = groupGrades.every(g => selectedGrades.includes(g));
        if (allInGroupSelected) {
            setSelectedGrades(prev => prev.filter(g => !groupGrades.includes(g)));
        } else {
            setSelectedGrades(prev => Array.from(new Set([...prev, ...groupGrades])));
        }
    };

    const handleSelectAllGrades = () => {
        if (selectedGrades.length === GRADES.length) {
            setSelectedGrades([]);
        } else {
            setSelectedGrades([...GRADES]);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.title.trim()) {
            showError('Please enter a test series name');
            return;
        }

        if (selectedGrades.length === 0) {
            showError('Please select at least one grade level');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                term: formData.term.replace(' ', '_'),
                grades: selectedGrades
            };

            const response = await assessmentAPI.bulkCreateTests(payload);

            if (response.success) {
                showSuccess(`Successfully created ${response.data.createdCount} tests!`);
                onSuccess && onSuccess();
            } else {
                showError(response.message || 'Failed to create tests');
            }
        } catch (err) {
            console.error('Error bulk creating tests:', err);
            showError('Failed to create tests: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const formatGradeDisplay = (grade) => {
        return grade.replace('GRADE_', 'Grade ').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const totalTests = selectedGrades.reduce((sum, grade) => {
        const areasForGrade = getLearningAreasByGrade(grade);
        return sum + areasForGrade.length;
    }, 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Action Bar */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onBack}
                            className="rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Test Generation</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <Zap size={12} className="text-amber-500 fill-amber-500" />
                                <span>Multi-Grade Automator</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="hidden md:flex text-slate-600 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={saving || !formData.title.trim() || selectedGrades.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-full shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader className="animate-spin mr-2" size={18} />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2" size={18} />
                                    <span>Create & Auto-Generate</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Configuration */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. Core Config Card */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-2 transition-all" />
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <ClipboardList className="text-indigo-600" size={20} />
                                    </div>
                                    <div>
                                        <CardTitle>Test Series Configuration</CardTitle>
                                        <CardDescription>Define the base attributes for the generated tests.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="series-name" className="text-slate-700 font-bold flex items-center gap-1">
                                        Series Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="series-name"
                                        placeholder="e.g., 2026 Term 1 Opening Assessments"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="h-12 text-lg border-slate-200 focus-visible:ring-indigo-500"
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium">This prefix will be prepended to all subject specific tests.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Assessment Type</Label>
                                        <select
                                            value={formData.testType}
                                            onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                                            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-shadow shadow-sm"
                                        >
                                            {TEST_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Grading Standard (Optional)</Label>
                                        <div className="relative">
                                            <select
                                                value={formData.scaleGroupId}
                                                onChange={(e) => setFormData({ ...formData, scaleGroupId: e.target.value })}
                                                className="w-full h-10 px-3 pr-10 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none transition-shadow shadow-sm"
                                                disabled={loadingScales}
                                            >
                                                <option value="">Auto-Assign (Based on grade link)</option>
                                                {scaleGroups.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                                {loadingScales ? <Loader className="animate-spin" size={16} /> : <Database size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-bold">Term</Label>
                                            <select
                                                value={formData.term}
                                                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm"
                                            >
                                                {TERMS.map(term => (
                                                    <option key={term.value} value={term.value}>{term.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-bold">Academic Year</Label>
                                            <Input
                                                type="number"
                                                value={formData.academicYear}
                                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                                className="h-10 border-slate-200 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Target Test Date</Label>
                                        <DatePicker
                                            value={formData.testDate}
                                            onChange={(date) => setFormData({ ...formData, testDate: date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '' })}
                                            className="w-full border-slate-200 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Detailed Specs Card */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <ListChecks className="text-emerald-600" size={20} />
                                    </div>
                                    <div>
                                        <CardTitle>Score & Time Metrics</CardTitle>
                                        <CardDescription>Default scores that will apply to every created test.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <Label className="text-slate-500 text-xs font-black uppercase tracking-wider">Total Marks</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={formData.totalMarks}
                                            onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                                            className="h-10 text-lg font-bold border-slate-200 bg-white"
                                        />
                                        <span className="text-slate-400 font-medium">pts</span>
                                    </div>
                                </div>

                                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <Label className="text-slate-500 text-xs font-black uppercase tracking-wider">Pass Mark</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={formData.passMarks}
                                            onChange={(e) => setFormData({ ...formData, passMarks: e.target.value })}
                                            className="h-10 text-lg font-bold border-slate-200 bg-white"
                                        />
                                        <span className="text-slate-400 font-medium">%</span>
                                    </div>
                                </div>

                                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <Label className="text-slate-500 text-xs font-black uppercase tracking-wider">Duration</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Input
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                className="h-10 text-lg font-bold border-slate-200 bg-white pl-9"
                                            />
                                            <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        </div>
                                        <span className="text-slate-400 font-medium">min</span>
                                    </div>
                                </div>

                                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <Label className="text-slate-500 text-xs font-black uppercase tracking-wider">Assessment Weight</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={formData.weight}
                                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                className="h-10 text-lg font-bold border-slate-200 bg-white pl-9"
                                            />
                                            <Zap className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        </div>
                                        <span className="text-slate-400 font-medium">mult</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Default 1.0. Decimals permitted.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Grade Selection */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <GraduationCap className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                        <CardTitle>Target Grade Levels</CardTitle>
                                        <CardDescription>Select which grades should receive this assessment series.</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAllGrades}
                                    className={`rounded-full transition-all ${selectedGrades.length === GRADES.length ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}
                                >
                                    {selectedGrades.length === GRADES.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {GRADE_GROUPS.map(group => (
                                        <div key={group.id} className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{group.name}</h4>
                                                <button
                                                    onClick={() => handleSelectGroup(group.grades)}
                                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                                                >
                                                    {group.grades.every(g => selectedGrades.includes(g)) ? 'Clear Group' : 'Select Group'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {group.grades.map(grade => {
                                                    const isSelected = selectedGrades.includes(grade);
                                                    return (
                                                        <div
                                                            key={grade}
                                                            onClick={() => handleGradeToggle(grade)}
                                                            className={`
                                                                relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer select-none
                                                                ${isSelected
                                                                    ? 'bg-indigo-50 border-indigo-500 shadow-[0_0_15px_-5px_rgba(79,70,229,0.3)]'
                                                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                                }
                                                            `}
                                                        >
                                                            <div className={`
                                                                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                                ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-105' : 'border-slate-300 bg-white'}
                                                            `}>
                                                                {isSelected && <CheckCircle size={14} className="text-white" />}
                                                            </div>
                                                            <span className={`text-xs font-bold leading-none ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                                {formatGradeDisplay(grade)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Summary & Preview */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 space-y-6">

                            {/* Summary Card */}
                            <Card className="border-indigo-100 shadow-xl shadow-indigo-100/30 overflow-hidden bg-indigo-950 text-white border-none">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Zap size={120} />
                                </div>
                                <CardHeader className="pb-2 border-b border-white/10">
                                    <div className="flex items-center gap-2">
                                        <Layers className="text-indigo-300" size={18} />
                                        <CardTitle className="text-lg text-white">Generation Preview</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Estimated Output</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black tabular-nums tracking-tighter">
                                                {Math.round(totalTests)}
                                            </span>
                                            <span className="text-indigo-300 font-bold">Records</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-wider mb-1">Grade Levels</p>
                                            <p className="text-xl font-black">{selectedGrades.length}</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-wider mb-1">Subjects (Avg)</p>
                                            <p className="text-xl font-black">~12</p>
                                        </div>
                                    </div>

                                    {selectedGrades.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.15em]">Distribution</p>
                                            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                {selectedGrades.map(grade => (
                                                    <Badge
                                                        key={grade}
                                                        variant="secondary"
                                                        className="bg-white/10 hover:bg-white/20 text-white border-white/5 font-bold text-[10px] px-2 py-0.5"
                                                    >
                                                        {formatGradeDisplay(grade)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-4 border-t border-white/10 bg-black/20">
                                    <div className="flex gap-3">
                                        <Info className="text-amber-400 shrink-0" size={16} />
                                        <p className="text-[10px] text-indigo-100/70 font-medium leading-relaxed">
                                            Automation will create one summative test record for every valid learning area in each selected grade.
                                        </p>
                                    </div>
                                </CardFooter>
                            </Card>

                            {/* Help / Tip Card */}
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4">
                                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                    <AlertCircle className="text-amber-600" size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h5 className="text-sm font-bold text-amber-900">Important Note</h5>
                                    <p className="text-xs text-amber-800/80 leading-relaxed">
                                        Ensure your **Terms** and **Academic Year** are correctly configured in Global Settings to avoid reporting conflicts.
                                    </p>
                                </div>
                            </div>

                            {/* Sticky Submit for Mobile */}
                            <div className="lg:hidden">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={saving || !formData.title.trim() || selectedGrades.length === 0}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl font-black text-lg"
                                >
                                    {saving ? 'GENERATING...' : 'GENERATE NOW'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style inset="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};

export default BulkCreateTest;
