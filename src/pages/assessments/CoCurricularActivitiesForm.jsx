import React, { useState } from 'react';
import { Save, Plus, Trash2, AlertCircle, Award } from 'lucide-react';
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

const ACTIVITY_TYPES = [
  'Sports & Athletics', 'Creative Arts', 'Music & Performing Arts',
  'Clubs & Societies', 'Leadership & Service', 'Academic Competitions',
  'Technology & Innovation', 'Other',
];

const makeActivity = () => ({
  _id: Date.now(),
  activityName: '',
  activityType: '',
  performance: '',
  achievements: '',
  remarks: '',
});

const CoCurricularActivitiesForm = ({ onBack, onSuccess }) => {
  const [learnerId, setLearnerId] = useState('');
  const [term, setTerm] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [activities, setActivities] = useState([makeActivity()]);
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  const addActivity = () => setActivities(prev => [...prev, makeActivity()]);

  const removeActivity = (id) => setActivities(prev => prev.filter(a => a._id !== id));

  const updateActivity = (id, field, value) =>
    setActivities(prev => prev.map(a => a._id === id ? { ...a, [field]: value } : a));

  const validate = () => {
    const newErrors = {};
    if (!learnerId.trim()) newErrors.learnerId = 'Learner ID is required';
    if (!term) newErrors.term = 'Term is required';
    if (!academicYear) newErrors.academicYear = 'Academic year is required';
    activities.forEach(a => {
      if (!a.activityName.trim()) newErrors[`name_${a._id}`] = 'Activity name is required';
      if (!a.activityType) newErrors[`type_${a._id}`] = 'Activity type is required';
      if (!a.performance) newErrors[`perf_${a._id}`] = 'Performance rating is required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { setSaveStatus('error'); return; }

    setSaveStatus('saving');
    setSavedCount(0);

    const results = { saved: 0, failed: 0, errors: [] };

    for (const activity of activities) {
      try {
        await cbcAPI.createCoCurricular({
          learnerId,
          term,
          academicYear: parseInt(academicYear),
          activityName: activity.activityName,
          activityType: activity.activityType,
          performance: activity.performance,
          achievements: activity.achievements || undefined,
          remarks: activity.remarks || undefined,
        });
        results.saved++;
        setSavedCount(results.saved);
      } catch (err) {
        results.failed++;
        results.errors.push(`${activity.activityName}: ${err.message}`);
      }
    }

    if (results.failed === 0) {
      setSaveStatus('success');
      if (onSuccess) onSuccess({ saved: results.saved });
      setTimeout(() => setSaveStatus(''), 3000);
    } else {
      setSaveStatus('error');
      setErrors({ submit: `${results.saved} saved, ${results.failed} failed: ${results.errors.join('; ')}` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Award size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Co-Curricular Activities Assessment</h1>
          </div>
          {onBack && (
            <button onClick={onBack} className="text-blue-600 hover:text-blue-700 text-sm font-medium">← Back</button>
          )}
          {saveStatus === 'success' && (
            <span className="ml-4 text-green-600 text-sm font-medium">✓ {savedCount} activity records saved</span>
          )}
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
                  value={learnerId}
                  onChange={e => { setLearnerId(e.target.value); if (errors.learnerId) setErrors(p => { const c = { ...p }; delete c.learnerId; return c; }); }}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.learnerId ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Learner UUID"
                />
                {errors.learnerId && <p className="text-xs text-red-600 mt-1">{errors.learnerId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                <select
                  value={term}
                  onChange={e => setTerm(e.target.value)}
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
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${errors.academicYear ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. 2026"
                />
                {errors.academicYear && <p className="text-xs text-red-600 mt-1">{errors.academicYear}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
              <button type="button" onClick={addActivity} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-1.5">
                <Plus size={14} /> Add Activity
              </button>
            </div>

            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div key={activity._id} className="border border-gray-200 rounded-lg p-4 relative">
                  <div className="absolute top-3 right-3">
                    {activities.length > 1 && (
                      <button type="button" onClick={() => removeActivity(activity._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Activity {idx + 1}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Activity Name *</label>
                      <input
                        type="text"
                        value={activity.activityName}
                        onChange={e => updateActivity(activity._id, 'activityName', e.target.value)}
                        className={`w-full px-3 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors[`name_${activity._id}`] ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="e.g. Basketball Team"
                      />
                      {errors[`name_${activity._id}`] && <p className="text-xs text-red-600 mt-1">{errors[`name_${activity._id}`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Activity Type *</label>
                      <select
                        value={activity.activityType}
                        onChange={e => updateActivity(activity._id, 'activityType', e.target.value)}
                        className={`w-full px-3 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors[`type_${activity._id}`] ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Select type</option>
                        {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors[`type_${activity._id}`] && <p className="text-xs text-red-600 mt-1">{errors[`type_${activity._id}`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Performance Rating *</label>
                      <select
                        value={activity.performance}
                        onChange={e => updateActivity(activity._id, 'performance', e.target.value)}
                        className={`w-full px-3 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${errors[`perf_${activity._id}`] ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Select rating</option>
                        {RATING_SCALE.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                      </select>
                      {errors[`perf_${activity._id}`] && <p className="text-xs text-red-600 mt-1">{errors[`perf_${activity._id}`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Achievements (optional)</label>
                      <input
                        type="text"
                        value={activity.achievements}
                        onChange={e => updateActivity(activity._id, 'achievements', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Awards, certificates, etc."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Remarks (optional)</label>
                      <textarea
                        value={activity.remarks}
                        onChange={e => updateActivity(activity._id, 'remarks', e.target.value)}
                        rows="2"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Teacher observations..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              {saveStatus === 'saving' ? `Saving ${savedCount}/${activities.length}...` : 'Save Activities'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoCurricularActivitiesForm;
