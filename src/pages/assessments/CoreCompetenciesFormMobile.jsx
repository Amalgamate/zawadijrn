import React, { useState } from 'react';
import { ArrowLeft, Check, AlertCircle, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { DatePicker } from '../../components/ui/date-picker';
import { useCoreCompetencies } from '../../hooks/useCoreCompetencies';

const CoreCompetenciesFormMobile = ({ onBack, onSuccess }) => {
  const {
    formData,
    errors,
    saveStatus,
    loading,
    ratingScale,
    grades,
    terms,
    academicYears,
    handleInputChange,
    handleCompetencyChange,
    handleSubmit: originalHandleSubmit
  } = useCoreCompetencies();

  const [expandedCompetency, setExpandedCompetency] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await originalHandleSubmit(e);
      if (result && onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const toggleCompetency = (id) => {
    setExpandedCompetency(expandedCompetency === id ? null : id);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50 w-screen h-screen">
      {/* Header - Fixed */}
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
            <h1 className="text-lg font-bold text-gray-900">Core Competencies</h1>
          </div>
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 text-green-600">
              <Check size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Main Form - Scrollable */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4 space-y-4">
          {/* Error Alert */}
          {saveStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-900">Error Saving</p>
                  <p className="text-xs text-red-700">{errors.submit || 'Please check all required fields'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Student Info Section */}
          <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Student Information</h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Student ID<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${errors.studentId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                placeholder="e.g., STU001"
              />
              {errors.studentId && (
                <p className="text-red-600 text-xs mt-1">{errors.studentId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Student Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${errors.studentName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                placeholder="Full name"
              />
              {errors.studentName && (
                <p className="text-red-600 text-xs mt-1">{errors.studentName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Grade<span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 transition ${errors.grade ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select</option>
                  {grades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="text-red-600 text-xs mt-1">{errors.grade}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Term<span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => handleInputChange('term', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 transition ${errors.term ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select</option>
                  {terms.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.term && (
                  <p className="text-red-600 text-xs mt-1">{errors.term}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Academic Year<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) => handleInputChange('academicYear', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-base focus:ring-2 focus:ring-blue-500 transition ${errors.academicYear ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
              >
                <option value="">Select</option>
                {academicYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.academicYear && (
                <p className="text-red-600 text-xs mt-1">{errors.academicYear}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Assessment Date
              </label>
              <DatePicker
                value={formData.assessmentDate}
                onChange={(date) => handleInputChange('assessmentDate', date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '')}
                className="w-full"
              />
            </div>
          </div>

          {/* Competencies Section */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 px-4">Core Competencies</h2>
            <p className="text-xs text-gray-600 px-4 mb-2">Tap to expand and rate each competency</p>

            {formData.competencies.map((competency) => (
              <div key={competency.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Competency Header - Clickable to expand */}
                <button
                  type="button"
                  onClick={() => toggleCompetency(competency.id)}
                  className="w-full px-4 py-3 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{competency.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{competency.descriptor}</p>

                    {/* Show selected rating */}
                    {competency.rating && (
                      <div className="mt-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded inline-block ${competency.rating === 'EE' ? 'bg-green-100 text-green-800' :
                            competency.rating === 'ME' ? 'bg-blue-100 text-blue-800' :
                              competency.rating === 'AP' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {ratingScale.find(r => r.value === competency.rating)?.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 ml-2 mt-0.5">
                    {expandedCompetency === competency.id ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedCompetency === competency.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-200 bg-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Rating */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Rating<span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ratingScale.map(rating => (
                          <button
                            key={rating.value}
                            type="button"
                            onClick={() => handleCompetencyChange(competency.id, 'rating', rating.value)}
                            className={`p-2.5 rounded-lg text-xs font-medium text-center border-2 transition ${competency.rating === rating.value
                                ? `${rating.color} border-current shadow-sm`
                                : 'border-gray-300 hover:border-gray-400 bg-white'
                              }`}
                          >
                            <div className="font-semibold">{rating.value}</div>
                            <div className="text-xs">{rating.label.split(' ')[0]}</div>
                          </button>
                        ))}
                      </div>
                      {errors[`competency_${competency.id}_rating`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`competency_${competency.id}_rating`]}</p>
                      )}
                    </div>

                    {/* Evidence */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Evidence<span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={competency.evidence}
                        onChange={(e) => handleCompetencyChange(competency.id, 'evidence', e.target.value)}
                        placeholder="Describe evidence supporting this rating..."
                        className={`w-full px-3 py-2.5 border rounded-lg text-base resize-none h-24 focus:ring-2 focus:ring-blue-500 transition ${errors[`competency_${competency.id}_evidence`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                      />
                      {errors[`competency_${competency.id}_evidence`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`competency_${competency.id}_evidence`]}</p>
                      )}
                    </div>

                    {/* Teacher Comment */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Teacher Comment <span className="text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        value={competency.teacherComment}
                        onChange={(e) => handleCompetencyChange(competency.id, 'teacherComment', e.target.value)}
                        placeholder="Additional comments..."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base resize-none h-20 focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Overall Comments */}
          <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Overall Assessment</h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Overall Comment<span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.overallComment}
                onChange={(e) => handleInputChange('overallComment', e.target.value)}
                placeholder="Provide overall assessment summary..."
                className={`w-full px-3 py-2.5 border rounded-lg text-base resize-none h-24 focus:ring-2 focus:ring-blue-500 transition ${errors.overallComment ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
              />
              {errors.overallComment && (
                <p className="text-red-600 text-xs mt-1">{errors.overallComment}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Next Steps <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                value={formData.nextSteps}
                onChange={(e) => handleInputChange('nextSteps', e.target.value)}
                placeholder="Recommendations for next term..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base resize-none h-20 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Spacing for sticky footer */}
          <div className="h-4" />
        </div>
      </form>

      {/* Footer - Sticky */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 z-30 shadow-lg">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:bg-gray-100 disabled:text-gray-400"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || saveStatus === 'saving'}
          className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {loading || saveStatus === 'saving' ? (
            <>
              <Loader size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            'Save Assessment'
          )}
        </button>
      </div>
    </div>
  );
};

export default CoreCompetenciesFormMobile;
