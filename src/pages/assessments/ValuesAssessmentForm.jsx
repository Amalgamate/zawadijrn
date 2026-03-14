import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { cbcAPI } from '../../services/api';
import { useSchoolData } from '../../contexts/SchoolDataContext';

const TERM_OPTIONS = [
  { value: 'TERM_1', label: 'Term 1' },
  { value: 'TERM_2', label: 'Term 2' },
  { value: 'TERM_3', label: 'Term 3' },
];

const RATING_SCALE = [
  { value: 'EE1', label: 'EE1', desc: 'Exceeds Expectations (High)' },
  { value: 'EE2', label: 'EE2', desc: 'Exceeds Expectations' },
  { value: 'ME1', label: 'ME1', desc: 'Meets Expectations (High)' },
  { value: 'ME2', label: 'ME2', desc: 'Meets Expectations' },
  { value: 'AE1', label: 'AE1', desc: 'Approaching Expectations (High)' },
  { value: 'AE2', label: 'AE2', desc: 'Approaching Expectations' },
  { value: 'BE1', label: 'BE1', desc: 'Below Expectations (High)' },
  { value: 'BE2', label: 'BE2', desc: 'Below Expectations' },
];

const VALUES_FIELDS = [
  { key: 'love', label: 'Love' },
  { key: 'responsibility', label: 'Responsibility' },
  { key: 'respect', label: 'Respect' },
  { key: 'unity', label: 'Unity' },
  { key: 'peace', label: 'Peace' },
  { key: 'patriotism', label: 'Patriotism' },
  { key: 'integrity', label: 'Integrity' },
];

const EMPTY_FORM = {
  learnerId: '',
  term: '',
  academicYear: new Date().getFullYear(),
  love: '', responsibility: '', respect: '',
  unity: '', peace: '', patriotism: '', integrity: '',
  comment: '',
};

const ValuesAssessmentForm = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const { grades } = useSchoolData();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.learnerId?.trim()) newErrors.learnerId = 'Learner ID is required';
    if (!formData.term) newErrors.term = 'Term is required';
    if (!formData.academicYear) newErrors.academicYear = 'Academic year is required';
    for (const f of VALUES_FIELDS) {
      if (!formData[f.key]) newErrors[f.key] = `${f.label} rating is required`;
    }
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
        love: formData.love,
        responsibility: formData.responsibility,
        respect: formData.respect,
        unity: formData.unity,
        peace: formData.peace,
        patriotism: formData.patriotism,
        integrity: formData.integrity,
        comment: formData.comment || undefined,
      };

      const response = await cbcAPI.saveValues(payload);
      setSaveStatus('success');
      if (onSuccess) onSuccess(response?.data || response);
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving values assessment:', error);
      setErrors({ submit: error.message || 'Failed to save values assessment' });
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            {onBack && (
              <button onClick={onBack} className="text-blue-600 hover:text-blue-700 text-sm font-medium">← Back</button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">National Values Assessment</h1>
            {saveStatus === 'success' && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
          </div>
          <p className="text-gray-600 text-sm">Assess learner demonstration of Kenya's national values</p>
        </div>

        {saveStatus === 'error' && errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Learner Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learner ID *</label>
                <input
                  type="text"
                  value={formData.learnerId}
                  onChange={e => handleChange('learnerId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.learnerId ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="UUID or admission number"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Values Ratings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Value</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Rating *</th>
                  </tr>
                </thead>
                <tbody>
                  {VALUES_FIELDS.map((field, idx) => (
                    <tr key={field.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 font-medium text-gray-800">{field.label}</td>
                      <td className="px-3 py-2">
                        <select
                          value={formData[field.key]}
                          onChange={e => handleChange(field.key, e.target.value)}
                          className={`px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 ${errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        >
                          <option value="">Select</option>
                          {RATING_SCALE.map(r => (
                            <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                          ))}
                        </select>
                        {errors[field.key] && <p className="text-xs text-red-600 mt-1">{errors[field.key]}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall Comment (optional)</label>
            <textarea
              value={formData.comment}
              onChange={e => handleChange('comment', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="General remarks about the learner's demonstration of values..."
            />
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
              {saveStatus === 'saving' ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ValuesAssessmentForm;
