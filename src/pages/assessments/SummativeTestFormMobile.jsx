import React from 'react';
import { ArrowLeft, Check, AlertCircle, Loader } from 'lucide-react';
import { useSummativeTestForm } from '../../hooks/useSummativeTestForm';
import { useAuth } from '../../hooks/useAuth';

const SummativeTestFormMobile = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
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
      // Error already handled in hook
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50 w-screen h-screen">
      {/* Header - Minimal */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900">New Test</h1>
          </div>
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 text-green-600">
              <Check size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Form - Main Content (Scrollable) */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4 space-y-4">
          {/* Status Messages */}
          {saveStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-900">Error Saving</p>
                  <p className="text-xs text-red-700">{errors.submit || 'Please check the form'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="e.g., Math Mid-Term"
            />
            {errors.title && (
              <p className="text-red-600 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Type<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select Type</option>
              {testTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-600 text-xs mt-1">{errors.type}</p>
            )}
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.grade}
              onChange={(e) => handleInputChange('grade', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.grade ? 'border-red-500' : 'border-gray-300'
                }`}
              disabled={loadingGrades}
            >
              {loadingGrades ? (
                <option value="">Loading grades...</option>
              ) : grades.length === 0 ? (
                <option value="">No grades available</option>
              ) : (
                <>
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>
                      {grade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.grade && (
              <p className="text-red-600 text-xs mt-1">{errors.grade}</p>
            )}
          </div>

          {/* Learning Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Area<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.learningArea}
              onChange={(e) => handleInputChange('learningArea', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.learningArea ? 'border-red-500' : 'border-gray-300'
                }`}
              disabled={!formData.grade}
            >
              <option value="">{formData.grade ? 'Select Learning Area' : 'Select Grade first'}</option>
              {formData.grade && availableLearningAreas.map(area => (
                <option key={area.id || area.name} value={area.name}>{area.name}</option>
              ))}
            </select>
            {errors.learningArea && (
              <p className="text-red-600 text-xs mt-1">{errors.learningArea}</p>
            )}
          </div>

          {/* Academic Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Term<span className="text-red-500">*</span>
            </label>
            <select
              value={formData.term}
              onChange={(e) => handleInputChange('term', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.term ? 'border-red-500' : 'border-gray-300'
                }`}
              disabled={loadingGrades}
            >
              {loadingGrades ? (
                <option value="">Loading terms...</option>
              ) : terms.length === 0 ? (
                <option value="">No terms available</option>
              ) : (
                <>
                  <option value="">Select Academic Term</option>
                  {terms.map(term => (
                    <option key={term.value} value={term.value}>{term.label}</option>
                  ))}
                </>
              )}
            </select>
            {errors.term && (
              <p className="text-red-600 text-xs mt-1">{errors.term}</p>
            )}
          </div>

          {/* Scale */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Performance Scale
              </label>
              {user?.role === 'SUPER_ADMIN' && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('pageNavigate', {
                    detail: { page: 'settings-academic', params: { tab: 'performance-levels' } }
                  }))}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Manage in Settings
                </button>
              )}
            </div>
            <select
              value={formData.scaleId}
              onChange={(e) => handleInputChange('scaleId', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingScales}
            >
              {loadingScales ? (
                <option value="">Loading scales...</option>
              ) : scales.length === 0 ? (
                <option value="">No scales available</option>
              ) : (
                <>
                  <option value="">Select Scale</option>
                  {scales
                    .filter(s => {
                      if (s.type !== 'SUMMATIVE') return false;
                      if (!formData.grade) return true;
                      return s.grade === formData.grade ||
                        (s.name && s.name.toUpperCase().includes(formData.grade.toUpperCase().replace(/_/g, ' ')));
                    })
                    .map(scale => (
                      <option key={scale.id} value={scale.id}>{scale.name}</option>
                    ))}
                </>
              )}
            </select>
          </div>

          {/* Optional: Description (collapsible) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional notes about this test"
              rows="3"
            />
          </div>
        </div>
      </form>

      {/* Footer - Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 max-w-full">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure? Unsaved changes will be lost.')) {
              if (onBack) onBack();
            }
          }}
          className="flex-1 px-3 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={saving}
          className={`flex-1 px-3 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm ${saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {saving ? (
            <>
              <Loader size={16} className="animate-spin" />
              Saving
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Check size={16} />
              Done
            </>
          ) : (
            'Save Test'
          )}
        </button>
      </div>
    </div>
  );
};

export default SummativeTestFormMobile;
