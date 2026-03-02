/**
 * Summative Test Creation Page - Single Test Form
 * Redesigned with premium Shadcn UI and Brand Colors (Purple & Teal)
 */

import React from 'react';
import {
  ArrowLeft, Check, AlertCircle, RefreshCw,
  ClipboardList, Layers, Clock,
  Database, Zap, ShieldCheck, ListChecks,
  Target, FileText
} from 'lucide-react';
import { useSummativeTestForm } from '../../hooks/useSummativeTestForm';

// Premium UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const SummativeTestFormDesktop = ({ onBack, onSuccess }) => {
  const {
    formData,
    scales,
    grades,
    terms,
    errors,
    saveStatus,
    saving,
    loadingScales,
    loadingGrades,
    testTypes,
    availableLearningAreas,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    getSelectedScale
  } = useSummativeTestForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const createdTest = await originalHandleSubmit(e);
      if (createdTest && onSuccess) {
        onSuccess(createdTest);
      }
    } catch (error) {
      // Error managed in hook
    }
  };

  const selectedScale = getSelectedScale();

  return (
    <div className="min-h-screen bg-[#fcfdff] pb-20">
      {/* Sticky Action Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-purple-100 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="rounded-full hover:bg-purple-50 hover:text-brand-purple border-purple-100 transition-all"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Construct New Test</h1>
              <div className="flex items-center gap-2 text-[10px] text-brand-purple font-black uppercase tracking-widest">
                <FileText size={12} className="fill-brand-purple/10" />
                <span>Summative Assessment Engine</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-brand-teal bg-brand-teal/5 px-4 py-1.5 rounded-full border border-brand-teal/20 animate-in fade-in zoom-in duration-300">
                <Check size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Saved Successfully</span>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={onBack}
              className="hidden md:flex text-slate-500 font-bold"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-brand-purple hover:bg-brand-purple/90 text-white px-8 rounded-full shadow-lg shadow-brand-purple/20 transition-all active:scale-95 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Deploy Test</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Configuration Form */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. Core Identity Section */}
            <Card className="border-purple-100 shadow-sm overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-purple group-hover:w-2.5 transition-all" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <ClipboardList className="text-brand-purple" size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Evaluation Identity</CardTitle>
                    <CardDescription>Define the primary identification of this assessment.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    Test Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Mathematics End Term 1 Evaluation"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`h-12 text-lg font-bold border-slate-200 focus-visible:ring-brand-purple ${errors.title ? 'border-red-400' : ''}`}
                  />
                  {errors.title && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-black text-xs uppercase tracking-wider">Assessment Type</Label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-purple outline-none text-sm font-bold shadow-sm"
                    >
                      <option value="">Select Type</option>
                      {testTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {errors.type && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-black text-xs uppercase tracking-wider">Academic Term</Label>
                    <select
                      value={formData.term}
                      onChange={(e) => handleInputChange('term', e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-purple outline-none text-sm font-bold shadow-sm"
                      disabled={loadingGrades}
                    >
                      <option value="">Select Term</option>
                      {terms.map(term => (
                        <option key={term.value} value={term.value}>{term.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Target Section */}
            <Card className="border-purple-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 rounded-xl">
                    <Target className="text-brand-teal" size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Curriculum Alignment</CardTitle>
                    <CardDescription>Select the specific grade and learning area.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-black text-xs uppercase tracking-wider">Target Grade</Label>
                  <select
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none font-black text-slate-700 shadow-sm transition-all"
                    disabled={loadingGrades}
                  >
                    <option value="">Choose Level</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>
                        {grade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  {errors.grade && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors.grade}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-black text-xs uppercase tracking-wider">Learning Area / Subject</Label>
                  <select
                    value={formData.learningArea}
                    onChange={(e) => handleInputChange('learningArea', e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-teal outline-none font-black text-slate-700 shadow-sm transition-all"
                    disabled={!formData.grade}
                  >
                    <option value="">{formData.grade ? 'Select Activity' : 'Select Grade first'}</option>
                    {formData.grade && availableLearningAreas.map(area => (
                      <option key={area.id || area.name} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                  {errors.learningArea && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors.learningArea}</p>}
                </div>
              </CardContent>
            </Card>

            {/* 3. Grading Specs Section */}
            <Card className="border-purple-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <ListChecks className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Evaluation Metrics</CardTitle>
                    <CardDescription>Setup scoring parameters and grading logic.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Weight</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={formData.totalMarks}
                        onChange={(e) => handleInputChange('totalMarks', e.target.value)}
                        className="h-10 text-xl font-black border-slate-200 bg-white rounded-xl text-brand-purple"
                      />
                      <span className="text-slate-400 font-bold text-xs">PTS</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Pass Threshold</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={formData.passMarks}
                        onChange={(e) => handleInputChange('passMarks', e.target.value)}
                        className="h-10 text-xl font-black border-slate-200 bg-white rounded-xl text-brand-purple"
                      />
                      <span className="text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <Label className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Time Limit</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={formData.duration}
                          onChange={(e) => handleInputChange('duration', e.target.value)}
                          className="h-10 text-xl font-black border-slate-200 bg-white rounded-xl pl-10 text-brand-purple"
                        />
                        <Clock className="absolute left-3 top-2.5 text-slate-300" size={18} />
                      </div>
                      <span className="text-slate-400 font-bold text-xs">MIN</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-gradient-to-br from-purple-50/50 to-white p-6 rounded-3xl border border-purple-100">
                  <Label className="text-brand-purple font-black text-xs uppercase tracking-[0.2em] mb-3 block">Performance Scale Profile</Label>
                  <div className="relative">
                    <select
                      value={formData.scaleId}
                      onChange={(e) => handleInputChange('scaleId', e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-purple-100 rounded-2xl focus:ring-2 focus:ring-brand-purple outline-none appearance-none font-bold text-slate-700 shadow-sm"
                      disabled={loadingScales}
                    >
                      <option value="">Select Scale Protocol</option>
                      {scales
                        .filter(s => {
                          const isSummative = s.type === 'SUMMATIVE';
                          if (!isSummative) return false;
                          if (!formData.grade) return true;
                          const gradeMatches = s.grade === formData.grade ||
                            (s.name && s.name.toUpperCase().includes(formData.grade.toUpperCase().replace(/_/g, ' ')));
                          return gradeMatches;
                        })
                        .map(scale => (
                          <option key={scale.id} value={scale.id}>{scale.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-3.5 pointer-events-none text-brand-purple opacity-50">
                      {loadingScales ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} />}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic">Link this test to a predefined grading rubric to automate result analysis.</p>
                </div>
              </CardContent>
            </Card>

            {/* 4. Descriptions & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <Card className="border-slate-100 bg-white/50 backdrop-blur-sm shadow-none h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-black uppercase text-slate-400">Public Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none transition-all min-h-[120px]"
                    placeholder="Visible to parents and students..."
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-100 bg-white/50 backdrop-blur-sm shadow-none h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-black uppercase text-slate-400">Teacher Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none transition-all min-h-[120px]"
                    placeholder="Internal administration guidelines..."
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW SUMMARY */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">

              {/* Deployment Preview Card */}
              <Card className="border-none bg-slate-900 shadow-2xl shadow-purple-200/50 text-white overflow-hidden rounded-[2.5rem]">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Zap size={160} />
                </div>

                <CardHeader className="border-b border-white/5 pb-6 pt-10 px-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand-purple/20 rounded-2xl flex items-center justify-center border border-brand-purple/30">
                      <Zap className="text-brand-purple" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Draft Preview</CardTitle>
                      <CardDescription className="text-indigo-200 opacity-60">Real-time configuration audit</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-8 pt-8 space-y-10">
                  {/* Big Stats */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={12} /> Target Grade
                    </p>
                    <div className="text-4xl font-black tracking-tighter tabular-nums text-white truncate h-12">
                      {formData.grade ? formData.grade.replace(/_/g, ' ') : '—'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Max Score</p>
                      <p className="text-3xl font-black text-brand-teal">{formData.totalMarks}<span className="text-xs ml-1 opacity-50">PTS</span></p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Pass %</p>
                      <p className="text-3xl font-black text-brand-teal">{formData.passMarks}%</p>
                    </div>
                  </div>

                  {/* Summary List */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                      <span className="text-xs font-bold text-indigo-100">Learning Area</span>
                      <Badge className="bg-brand-purple text-white border-none font-black text-[9px] max-w-[120px] truncate">
                        {formData.learningArea || 'Unassigned'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                      <span className="text-xs font-bold text-indigo-100">Scale Profile</span>
                      <Badge variant="outline" className={`border-brand-teal/50 text-brand-teal font-black text-[9px] max-w-[120px] truncate ${!selectedScale ? 'opacity-30 grayscale' : ''}`}>
                        {selectedScale?.name || 'Manual Result'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="px-8 pb-10 pt-4">
                  <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 items-start">
                    <ShieldCheck className="text-brand-teal shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-indigo-100/50 font-medium leading-relaxed">
                      This test will be deployed to the **Summative Result Center** once approved by the administrator.
                    </p>
                  </div>
                </CardFooter>
              </Card>

              {/* Help Alert */}
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="text-amber-600" size={20} />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-black text-amber-900">Resource Tip</h5>
                  <p className="text-xs text-amber-800/70 font-medium leading-relaxed">
                    Selecting a **Scale Protocol** allows the system to auto-generate performance levels (EE, ME, etc.) for student reports.
                  </p>
                </div>
              </div>

              {/* Mobile Submit Fallback */}
              <div className="lg:hidden">
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full h-14 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-2xl shadow-xl font-black text-lg"
                >
                  DEPLOY TEST NOW
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Errors */}
      {errors.submit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-500">
          <div className="bg-red-950 text-white border border-red-900/50 p-6 rounded-[2rem] shadow-2xl flex items-center gap-6 max-w-xl">
            <div className="h-12 w-12 bg-red-900/50 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-black uppercase text-red-200 tracking-widest">Initialization Blocked</h4>
              <p className="text-xs font-medium text-red-300 leading-relaxed">{errors.submit}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleInputChange('submit', null)}
              className="text-white hover:bg-white/10"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummativeTestFormDesktop;
