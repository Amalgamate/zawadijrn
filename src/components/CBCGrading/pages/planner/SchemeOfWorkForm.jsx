import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { usePermissions } from '../../../../hooks/usePermissions';
import api from '../../../../services/api';
import { Card } from '../../../../components/ui/card';
import { ArrowLeft, Save, Send, AlertCircle, Plus, Trash2, Printer, CheckCircle, XOctagon, FileText } from 'lucide-react'; // Force re-compile

const WEEKS_IN_TERM = 14; 
// Pre-populate empty rows up to the standard 14 weeks. Additional can be added if needed.

const generateEmptyWeeks = () => {
  return Array.from({ length: WEEKS_IN_TERM }, (_, i) => ({
    weekNumber: i + 1,
    strand: '',
    subStrand: '',
    outcomes: '',
    inquiryQuestions: '',
    activities: '',
    coreCompetencies: '',
    values: '',
    pertinentIssues: '',
    resources: '',
    assessment: '',
    remarks: ''
  }));
};

const SchemeOfWorkForm = ({ schemeId, onBack }) => {
  const { user } = useAuth();
  const { role } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Data sources for dropdowns
  const [learningAreas, setLearningAreas] = useState([]);
  const [termConfigs, setTermConfigs] = useState([]);
  const [grades, setGrades] = useState([
    '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ]); // Simplified fallback. Ideally fetched from config.
  
  // Initial / Loaded state
  const [schemeData, setSchemeData] = useState({
    grade: '',
    learningArea: '',
    term: '',
    academicYear: new Date().getFullYear(),
    classId: '',
    title: '',
    status: 'DRAFT',
    weeks: generateEmptyWeeks()
  });

  // Review states (For Head Teacher/Admin)
  const [reviewComment, setReviewComment] = useState('');

  const isTeacher = role === 'TEACHER';
  const isCreatorOrNew = !schemeId || (schemeData.teacherId === user.id);
  const isEditable = isTeacher && isCreatorOrNew && ['DRAFT', 'REJECTED'].includes(schemeData.status);
  const isReviewable = !isTeacher && schemeId && schemeData.status === 'SUBMITTED';
  const isViewOnly = !isEditable && !isReviewable;

  useEffect(() => {
    fetchFormDependencies();
    if (schemeId) {
      fetchScheme();
    }
  }, [schemeId]);

  const fetchFormDependencies = async () => {
    try {
      const [laRes, termRes] = await Promise.all([
        api.config.getLearningAreas(),
        api.config.getTermConfigs()
      ]);
      setLearningAreas(laRes.data || laRes || []);
      
      const terms = termRes.data || termRes || [];
      setTermConfigs(terms);
      
      // Auto-select current term if creating new
      if (!schemeId) {
        const activeTerm = terms.find(t => t.isActive);
        if (activeTerm) {
          setSchemeData(prev => ({ 
            ...prev, 
            term: activeTerm.term,
            academicYear: activeTerm.academicYear 
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    }
  };

  const fetchScheme = async () => {
    setLoading(true);
    try {
      const res = await api.schemesOfWork.getById(schemeId);
      if (res.data) {
        const loaded = res.data;
        // Merge missing weeks if DB returned fewer than standard
        const mergedWeeks = loaded.weeks.length > 0 ? loaded.weeks : generateEmptyWeeks();
        
        setSchemeData({
          ...loaded,
          weeks: mergedWeeks
        });
        setReviewComment(loaded.reviewComment || '');
      }
    } catch (err) {
      setError('Failed to load Scheme of Work');
    } finally {
      setLoading(false);
    }
  };

  const updateHeaderField = (field, value) => {
    if (!isEditable) return;
    setSchemeData(prev => ({ ...prev, [field]: value }));
  };

  const updateWeekRow = (index, field, value) => {
    if (!isEditable) return;
    setSchemeData(prev => {
      const newWeeks = [...prev.weeks];
      newWeeks[index] = { ...newWeeks[index], [field]: value };
      return { ...prev, weeks: newWeeks };
    });
  };

  const addWeek = () => {
    if (!isEditable) return;
    setSchemeData(prev => ({
      ...prev,
      weeks: [...prev.weeks, {
        weekNumber: prev.weeks.length + 1,
        strand: '', subStrand: '', outcomes: '', inquiryQuestions: '',
        activities: '', coreCompetencies: '', values: '', pertinentIssues: '',
        resources: '', assessment: '', remarks: ''
      }]
    }));
  };

  const removeWeek = (index) => {
    if (!isEditable) return;
    setSchemeData(prev => {
      const newWeeks = prev.weeks.filter((_, i) => i !== index);
      // Reindex
      newWeeks.forEach((w, i) => w.weekNumber = i + 1);
      return { ...prev, weeks: newWeeks };
    });
  };

  const handleSave = async (submit = false) => {
    setError('');
    
    // Basic validation
    if (!schemeData.grade || !schemeData.learningArea || !schemeData.term) {
      setError('Grade, Learning Area, and Term are required.');
      window.scrollTo(0, 0);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...schemeData,
        status: submit ? 'SUBMITTED' : schemeData.status,
        academicYear: Number(schemeData.academicYear)
      };

      if (schemeId) {
        await api.schemesOfWork.update(schemeId, payload);
      } else {
        await api.schemesOfWork.create(payload);
      }
      
      onBack();
    } catch (err) {
      setError(err.message || 'Failed to save Scheme of Work');
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (status) => {
    setSaving(true);
    try {
      await api.schemesOfWork.review(schemeId, { status, remarks: reviewComment });
      onBack();
    } catch (err) {
      setError(err.message || `Failed to ${status} Scheme of Work`);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 print:p-0 print:m-0 print:block">
      
      {/* --- Sticky Print Navbar --- */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4 print:hidden shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {schemeId ? `${isViewOnly ? 'View' : 'Edit'} Scheme of Work` : 'New Scheme of Work'}
          </h2>
          {schemeData.status && (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border 
              ${schemeData.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                schemeData.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
                schemeData.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200' :
                'bg-gray-100 text-gray-800 border-gray-200'}`}
            >
              {schemeData.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            <Printer size={18} />
            Print / PDF
          </button>
          
          {isEditable && (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-brand-teal bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition font-medium disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-white bg-brand-teal rounded-lg hover:bg-teal-700 transition font-medium shadow-sm disabled:opacity-50"
              >
                <Send size={18} />
                Submit for Approval
              </button>
            </>
          )}

          {isReviewable && (
            <>
              <button
                onClick={() => handleReview('REJECTED')}
                disabled={saving || !reviewComment.trim()}
                className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50"
                title={!reviewComment.trim() ? "Add a comment before rejecting" : ""}
              >
                <XOctagon size={18} />
                Reject
              </button>
              <button
                onClick={() => handleReview('APPROVED')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition font-medium shadow-sm disabled:opacity-50"
              >
                <CheckCircle size={18} />
                Approve
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 print:hidden">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* --- Print Header --- */}
      <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Scheme of Work</h1>
        <div className="flex justify-center gap-8 text-sm font-semibold">
          <span>Teacher: {schemeData.teacher?.firstName || user.firstName} {schemeData.teacher?.lastName || user.lastName}</span>
          <span>Subject: {schemeData.learningArea}</span>
          <span>Grade: {schemeData.grade}</span>
          <span>Term: {schemeData.term} - {schemeData.academicYear}</span>
        </div>
      </div>

      <div className="px-6 print:px-0">
        
        {/* --- Setup Metadata Card --- */}
        <Card className="p-6 mb-8 print:hidden border-t-4 border-t-brand-teal shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-brand-teal" />
            Scheme Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Learning Area <span className="text-red-500">*</span></label>
              <select
                disabled={!isEditable}
                value={schemeData.learningArea}
                onChange={(e) => updateHeaderField('learningArea', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none disabled:bg-gray-100 disabled:text-gray-600 font-medium"
              >
                <option value="">Select subject...</option>
                {learningAreas.map(la => (
                  <option key={la.id} value={la.name}>{la.name}</option>
                ))}
                {!learningAreas.length && schemeData.learningArea && <option value={schemeData.learningArea}>{schemeData.learningArea}</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level <span className="text-red-500">*</span></label>
              <select
                disabled={!isEditable}
                value={schemeData.grade}
                onChange={(e) => updateHeaderField('grade', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none disabled:bg-gray-100 disabled:text-gray-600 font-medium"
              >
                <option value="">Select grade...</option>
                {grades.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term & Year <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select
                  disabled={!isEditable}
                  value={schemeData.term}
                  onChange={(e) => updateHeaderField('term', e.target.value)}
                  className="w-3/5 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none disabled:bg-gray-100 disabled:text-gray-600 font-medium"
                >
                  <option value="">Term...</option>
                  <option value="TERM_ONE">Term 1</option>
                  <option value="TERM_TWO">Term 2</option>
                  <option value="TERM_THREE">Term 3</option>
                </select>
                <input
                  type="number"
                  disabled={!isEditable}
                  value={schemeData.academicYear}
                  onChange={(e) => updateHeaderField('academicYear', e.target.value)}
                  className="w-2/5 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none disabled:bg-gray-100 disabled:text-gray-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title / Remarks (Optional)</label>
              <input
                type="text"
                disabled={!isEditable}
                placeholder="e.g. Adapted for Term 2"
                value={schemeData.title || ''}
                onChange={(e) => updateHeaderField('title', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none disabled:bg-gray-100 disabled:text-gray-600"
              />
            </div>

          </div>
        </Card>

        {/* --- Admin Review Section --- */}
        {(isReviewable || schemeData.status === 'REJECTED' || (schemeData.status === 'APPROVED' && schemeData.reviewComment)) && (
          <Card className={`p-6 mb-8 print:hidden ${isReviewable ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : 'bg-gray-50'}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Reviewer Comments</h3>
            <textarea
              disabled={!isReviewable}
              placeholder={isReviewable ? "Add constructive feedback or reasons for rejection here..." : "No comments left."}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none disabled:bg-white disabled:text-gray-800 min-h-[100px]"
            />
          </Card>
        )}


        {/* --- The Grid --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full overflow-x-auto print:shadow-none print:border-none">
          <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
            <thead>
              <tr className="bg-gray-800 text-white text-xs tracking-wider border-b border-gray-900 print:bg-gray-200 print:text-black print:border-black">
                <th className="w-12 py-3 px-2 text-center">Wk</th>
                <th className="w-32 py-3 px-3">Strand</th>
                <th className="w-32 py-3 px-3">Sub-Strand</th>
                <th className="w-48 py-3 px-3">Specific Learning Outcomes</th>
                <th className="w-40 py-3 px-3">Key Inquiry Questions</th>
                <th className="w-48 py-3 px-3">Learning Experiences</th>
                <th className="w-32 py-3 px-3">Core Competencies</th>
                <th className="w-32 py-3 px-3">Values & Pertinent Issues</th>
                <th className="w-40 py-3 px-3">Resources</th>
                <th className="w-32 py-3 px-3">Assessment</th>
                <th className="w-32 py-3 px-3">Remarks</th>
                {isEditable && <th className="w-12 py-3 px-2 print:hidden"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schemeData.weeks.map((week, idx) => (
                <tr key={idx} className="group hover:bg-teal-50/30 transition-colors print:hover:bg-transparent">
                  <td className="py-2 px-2 text-center font-bold text-gray-500 bg-gray-50 border-r border-gray-200 print:bg-transparent print:border-black align-top">
                    {week.weekNumber}
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.strand || ''} 
                      onChange={(e) => updateWeekRow(idx, 'strand', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.subStrand || ''} 
                      onChange={(e) => updateWeekRow(idx, 'subStrand', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.outcomes || ''} 
                      placeholder="By the end of the lesson..."
                      onChange={(e) => updateWeekRow(idx, 'outcomes', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.inquiryQuestions || ''} 
                      onChange={(e) => updateWeekRow(idx, 'inquiryQuestions', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.activities || ''} 
                      onChange={(e) => updateWeekRow(idx, 'activities', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.coreCompetencies || ''} 
                      onChange={(e) => updateWeekRow(idx, 'coreCompetencies', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={(week.values ? week.values + '\n' : '') + (week.pertinentIssues || '')} 
                      onChange={(e) => {
                        // Just map it all to 'values' for simplicity, or split appropriately. Let's map to values.
                        updateWeekRow(idx, 'values', e.target.value);
                      }}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.resources || ''} 
                      onChange={(e) => updateWeekRow(idx, 'resources', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 border-r border-gray-200 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.assessment || ''} 
                      onChange={(e) => updateWeekRow(idx, 'assessment', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  <td className="p-0 print:border-black align-top">
                    <textarea 
                      disabled={!isEditable}
                      value={week.remarks || ''} 
                      onChange={(e) => updateWeekRow(idx, 'remarks', e.target.value)}
                      className="w-full h-full min-h-[80px] p-2 text-sm outline-none resize-y bg-transparent disabled:text-gray-900 print:resize-none"
                    />
                  </td>
                  
                  {isEditable && (
                    <td className="p-2 align-middle text-center print:hidden border-l border-gray-100">
                      <button 
                        onClick={() => removeWeek(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove Week"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {isEditable && (
            <div className="bg-gray-50 p-4 border-t border-gray-200 print:hidden text-center">
              <button 
                onClick={addWeek}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Plus size={16} /> Add Week
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemeOfWorkForm;
