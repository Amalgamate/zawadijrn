import React, { useState } from 'react';
import { Save, FileText, AlertCircle } from 'lucide-react';
import { cbcAPI } from '../../services/api';
import { useSchoolData } from '../../contexts/SchoolDataContext';

const TERM_OPTIONS = [
  { value: 'TERM_1', label: 'Term 1' },
  { value: 'TERM_2', label: 'Term 2' },
  { value: 'TERM_3', label: 'Term 3' },
];

const EMPTY_FORM = {
  learnerId: '',
  term: '',
  academicYear: new Date().getFullYear(),
  classTeacherComment: '',
  classTeacherName: '',
  classTeacherSignature: '',
  headTeacherComment: '',
  headTeacherName: '',
  headTeacherSignature: '',
  nextTermOpens: '',
};

const TermlyReportCommentsForm = ({ onBack, onSuccess, prefill }) => {
  const [formData, setFormData] = useState({ ...EMPTY_FORM, ...prefill });
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.learnerId?.trim()) newErrors.learnerId = 'Learner ID is required';
    if (!formData.term) newErrors.term = 'Term is required';
    if (!formData.academicYear) newErrors.academicYear = 'Academic year is required';
    if (!formData.classTeacherComment?.trim()) newErrors.classTeacherComment = 'Class teacher comment is required';
    if (!formData.classTeacherName?.trim()) newErrors.classTeacherName = 'Class teacher name is required';
    if (!formData.nextTermOpens?.trim()) newErrors.nextTermOpens = 'Next term opening date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { setSaveStatus('error'); return; }

    setSaveStatus('saving');
    try {
      const payload = {
        learnerId: formData.learnerId,
        term: formData.term,
        academicYear: parseInt(formData.academicYear),
        classTeacherComment: formData.classTeacherComment,
        classTeacherName: formData.classTeacherName,
        classTeacherSignature: formData.classTeacherSignature || undefined,
        headTeacherComment: formData.headTeacherComment || undefined,
        headTeacherName: formData.headTeacherName || undefined,
        headTeacherSignature: formData.headTeacherSignature || undefined,
        nextTermOpens: formData.nextTermOpens,
      };

      const response = await cbcAPI.saveComments(payload);
      setSaveStatus('success');
      if (onSuccess) onSuccess(response?.data || response);
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving report comments:', error);
      setErrors({ submit: error.message || 'Failed to save report comments' });
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Termly Report Comments</h1>
          </div>
          <div className="flex items-center justify-between">
            {onBack && (
              <button onClick={onBack} className="text-blue-600 hover:text-blue-700 text-sm font-medium">← Back</button>
            )}
            {saveStatus === 'success' && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
          </div>
          <p className="text-gray-600 text-sm mt-1">Record class teacher and head teacher comments for the term report</p>
        </div>

        {saveStatus === 'error' && errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Learner &amp; Term</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learner ID *</label>
                <input
                  type="text"
                  value={formData.learnerId}
                  onChange={e => handleChange('learnerId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.learnerId ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Learner UUID"
                />
                {errors.learnerId && <p className="text-xs text-red-600 mt-1">{errors.learnerId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                <select
                  value={formData.term}
                  onChange={e => handleChange('term', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.term ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select term</option>
                  {TERM_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {errors.term && <p className="text-xs text-red-600 mt-1">{errors.term}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input
                  type="number"
                  value={formData.academicYear}
                  onChange={e => handleChange('academicYear', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.academicYear ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. 2026"
                />
                {errors.academicYear && <p className="text-xs text-red-600 mt-1">{errors.academicYear}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Teacher</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name *</label>
                <input
                  type="text"
                  value={formData.classTeacherName}
                  onChange={e => handleChange('classTeacherName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.classTeacherName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Full name"
                />
                {errors.classTeacherName && <p className="text-xs text-red-600 mt-1">{errors.classTeacherName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature (optional)</label>
                <input
                  type="text"
                  value={formData.classTeacherSignature}
                  onChange={e => handleChange('classTeacherSignature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Type name to sign"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment *</label>
                <textarea
                  value={formData.classTeacherComment}
                  onChange={e => handleChange('classTeacherComment', e.target.value)}
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.classTeacherComment ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Overall comment on learner's performance, attitude, and development..."
                />
                {errors.classTeacherComment && <p className="text-xs text-red-600 mt-1">{errors.classTeacherComment}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Head Teacher (optional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head Teacher Name</label>
                <input
                  type="text"
                  value={formData.headTeacherName}
                  onChange={e => handleChange('headTeacherName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                <input
                  type="text"
                  value={formData.headTeacherSignature}
                  onChange={e => handleChange('headTeacherSignature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Type name to sign"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={formData.headTeacherComment}
                  onChange={e => handleChange('headTeacherComment', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Head teacher's overall remarks..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Term Opening Date *</label>
            <input
              type="date"
              value={formData.nextTermOpens}
              onChange={e => handleChange('nextTermOpens', e.target.value)}
              className={`w-full sm:w-64 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.nextTermOpens ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.nextTermOpens && <p className="text-xs text-red-600 mt-1">{errors.nextTermOpens}</p>}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex justify-end gap-3">
            {onBack && (
              <button type="button" onClick={onBack} className="px-5 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400"
            >
              <Save size={15} />
              {saveStatus === 'saving' ? 'Saving...' : 'Save Comments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TermlyReportCommentsForm;
