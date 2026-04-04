/**
 * Values Assessment Form
 * Assess the 7 national values for CBC
 * Redesigned with Compact Context Header Pattern (Setup -> Assess)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Save, Edit3, ArrowRight } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';
import { CBC_RATINGS } from '../../../constants/ratings';
import { useAssessmentSetup } from '../hooks/useAssessmentSetup';
import { useLearnerSelection } from '../hooks/useLearnerSelection';
import { useRatings } from '../hooks/useRatings';
import { useTeacherWorkload } from '../hooks/useTeacherWorkload';
import { validateValuesAssessment, formatValidationErrors } from '../../../utils/validation/assessmentValidators';

const DEFAULT_BULK_VALUE_RATINGS = {
  love: 'ME1',
  responsibility: 'ME1',
  respect: 'ME1',
  unity: 'ME1',
  peace: 'ME1',
  patriotism: 'ME1',
  integrity: 'ME1'
};

const ValuesAssessment = ({ learners }) => {
  const { showSuccess, showError } = useNotifications();

  // Use centralized hooks for assessment state management
  const setup = useAssessmentSetup({ defaultTerm: 'TERM_1' });
  const teacherWorkload = useTeacherWorkload();

  // Filter learners by teacher's assigned grades if they are a teacher
  const filteredLearnersByRole = React.useMemo(() => {
    if (!teacherWorkload.isTeacher) return learners || [];
    return (learners || []).filter(l => teacherWorkload.assignedGrades.includes(l.grade));
  }, [learners, teacherWorkload.isTeacher, teacherWorkload.assignedGrades]);

  const selection = useLearnerSelection(filteredLearnersByRole, { status: ['ACTIVE', 'Active'] });
  const ratings = useRatings({
    love: 'ME1',
    responsibility: 'ME1',
    respect: 'ME1',
    unity: 'ME1',
    peace: 'ME1',
    patriotism: 'ME1',
    integrity: 'ME1'
  });

  const [viewMode, setViewMode] = useState('setup'); // 'setup' | 'assess'
  const [saving, setSaving] = useState(false);
  const [bulkEntries, setBulkEntries] = useState({});

  const initializeBulkEntries = useCallback(() => {
    const entries = {};
    selection.filteredLearners.forEach(learner => {
      entries[learner.id] = {
        ...DEFAULT_BULK_VALUE_RATINGS,
        comment: ''
      };
    });
    setBulkEntries(entries);
  }, [selection.filteredLearners]);

  useEffect(() => {
    if (viewMode === 'bulk') {
      initializeBulkEntries();
    }
  }, [viewMode, initializeBulkEntries]);

  const updateBulkEntry = (learnerId, field, value) => {
    setBulkEntries(prev => ({
      ...prev,
      [learnerId]: {
        ...prev[learnerId],
        [field]: value
      }
    }));
  };

  const handleBulkSave = async () => {
    if (selection.filteredLearners.length === 0) {
      showError('No learners found for the selected grade and stream');
      return;
    }

    const records = selection.filteredLearners.map(learner => {
      const entry = bulkEntries[learner.id] || DEFAULT_BULK_VALUE_RATINGS;
      return {
        learnerId: learner.id,
        term: setup.selectedTerm,
        academicYear: setup.academicYear,
        love: entry.love,
        responsibility: entry.responsibility,
        respect: entry.respect,
        unity: entry.unity,
        peace: entry.peace,
        patriotism: entry.patriotism,
        integrity: entry.integrity,
        comment: entry.comment || ''
      };
    });

    setSaving(true);
    try {
      const response = await api.cbc.saveValuesBulk({ records });
      if (response.success) {
        showSuccess('Bulk values records saved successfully');
        setViewMode('setup');
      } else {
        throw new Error(response.message || 'Failed to save bulk values');
      }
    } catch (error) {
      showError(error.message || 'Failed to save bulk values');
    } finally {
      setSaving(false);
    }
  };

  // National values definitions (component-specific)
  const valueDefinitions = {
    love: { name: 'Love', description: 'Showing care, compassion and kindness to others', icon: '❤️' },
    responsibility: { name: 'Responsibility', description: 'Being accountable and reliable in duties and actions', icon: '🎯' },
    respect: { name: 'Respect', description: 'Valuing others, their rights and dignity', icon: '🙏' },
    unity: { name: 'Unity', description: 'Working together harmoniously with others', icon: '🤲' },
    peace: { name: 'Peace', description: 'Promoting harmony and resolving conflicts peacefully', icon: '☮️' },
    patriotism: { name: 'Patriotism', description: 'Love and loyalty to one\'s country', icon: '🇰🇪' },
    integrity: { name: 'Integrity', description: 'Being honest and having strong moral principles', icon: '⚖️' }
  };

  // Load existing values when learner/term changes
  const loadExistingValues = useCallback(async () => {
    if (!selection.selectedLearnerId || !setup.selectedTerm) return;

    try {
      const response = await api.cbc.getValues(selection.selectedLearnerId, {
        term: setup.selectedTerm,
        academicYear: setup.academicYear
      });

      if (response.success && response.data) {
        ratings.setRatings({
          love: response.data.love || 'ME1',
          responsibility: response.data.responsibility || 'ME1',
          respect: response.data.respect || 'ME1',
          unity: response.data.unity || 'ME1',
          peace: response.data.peace || 'ME1',
          patriotism: response.data.patriotism || 'ME1',
          integrity: response.data.integrity || 'ME1'
        });
        if (response.data.comment) {
          ratings.setComment('general', response.data.comment);
        }
        showSuccess('Loaded existing assessment');
      }
    } catch (error) {
      console.log('No existing assessment found');
      // Silently fail - use defaults
    }
  }, [selection.selectedLearnerId, setup.selectedTerm, setup.academicYear, ratings, showSuccess]);

  useEffect(() => {
    if (viewMode === 'assess') {
      loadExistingValues();
    }
  }, [viewMode, loadExistingValues]);

  // Alert teacher if they have no assignments
  useEffect(() => {
    if (!teacherWorkload.loading && teacherWorkload.isTeacher && !teacherWorkload.hasAnyAssignments) {
      showError('You are not currently assigned to any classes. Please consult with the Head Teacher.');
    }
  }, [teacherWorkload.loading, teacherWorkload.isTeacher, teacherWorkload.hasAnyAssignments, showError]);

  // Save values assessment
  const handleSave = async () => {
    if (!selection.selectedLearnerId) {
      showError('Please select a learner');
      return;
    }

    // Validate before saving
    const validationError = validateValuesAssessment({
      learnerId: selection.selectedLearnerId,
      term: setup.selectedTerm,
      academicYear: setup.academicYear,
      ratings: ratings.ratings
    });

    if (validationError.length > 0) {
      showError(formatValidationErrors(validationError)[0].message);
      return;
    }

    setSaving(true);
    try {
      const response = await api.cbc.saveValues({
        learnerId: selection.selectedLearnerId,
        term: setup.selectedTerm,
        academicYear: setup.academicYear,
        ...ratings.ratings,
        comment: ratings.comments.general || ''
      });

      if (response.success) {
        showSuccess('Values assessment saved successfully!');
      } else {
        throw new Error(response.message || 'Failed to save');
      }
    } catch (error) {
      showError(error.message || 'Failed to save values assessment');
    } finally {
      setSaving(false);
    }
  };

  // Start assessment after learner selection
  const handleStartAssessment = () => {
    if (!selection.selectedLearnerId) {
      showError('Please select a learner first');
      return;
    }
    setViewMode('assess');
    window.scrollTo(0, 0);
  };

  // Get color for rating display
  const getRatingColor = (rating) => {
    if (rating.startsWith('EE')) return 'bg-green-100 border-green-300 text-green-800';
    if (rating.startsWith('ME')) return 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple';
    if (rating.startsWith('AE')) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (rating.startsWith('BE')) return 'bg-red-100 border-red-300 text-red-800';
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  return (
    <div className="space-y-6">

      {/* SETUP MODE */}
      {viewMode === 'setup' && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-3xl mx-auto mt-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-purple/10 to-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-purple">
              <Heart size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">National Values Assessment</h2>
            <p className="text-gray-500">Select a learner to begin assessing values</p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Learner</label>
              <SmartLearnerSearch
                learners={selection.filteredLearners}
                selectedLearnerId={selection.selectedLearnerId}
                onSelect={selection.selectLearner}
                placeholder="Search by name, adm no..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Term</label>
                <select
                  value={setup.selectedTerm}
                  onChange={(e) => setup.updateTerm(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                >
                  {setup.terms.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={setup.academicYear}
                  onChange={(e) => setup.updateAcademicYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {selection.filteredLearners.length > 0
                ? `${selection.filteredLearners.length} learner${selection.filteredLearners.length > 1 ? 's' : ''} available for bulk entry`
                : 'Select grade and stream to enable bulk entry'}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setViewMode('bulk')}
                disabled={!setup.selectedGrade || !setup.selectedStream || selection.filteredLearners.length === 0}
                className="flex items-center gap-2 px-6 py-3 border border-brand-purple text-brand-purple rounded-xl hover:bg-brand-purple/10 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bulk Entry
              </button>
              <button
                onClick={handleStartAssessment}
                disabled={!selection.selectedLearnerId}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-purple to-brand-teal text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Start Assessment
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'bulk' && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-6xl mx-auto mt-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-purple/10 to-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-purple">
              <Heart size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Bulk Values Entry</h2>
            <p className="text-gray-500">Enter national values for all learners in the selected grade and stream without leaving the page.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest text-gray-500">Grade / Stream</p>
              <p className="font-bold text-gray-800">{setup.selectedGrade || 'N/A'}{setup.selectedStream ? ` / ${setup.selectedStream}` : ''}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest text-gray-500">Term</p>
              <p className="font-bold text-gray-800">{setup.terms.find(t => t.value === setup.selectedTerm)?.label || setup.selectedTerm}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest text-gray-500">Year</p>
              <p className="font-bold text-gray-800">{setup.academicYear}</p>
            </div>
          </div>

          {selection.filteredLearners.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No learners found for the selected grade and stream.</div>
          ) : (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {selection.filteredLearners.map((learner) => {
                const entry = bulkEntries[learner.id] || DEFAULT_BULK_VALUE_RATINGS;
                return (
                  <div key={learner.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">{learner.admissionNumber}</p>
                        <h3 className="font-bold text-gray-800">{learner.firstName} {learner.lastName}</h3>
                      </div>
                      <div className="text-sm text-gray-500">Learner {selection.filteredLearners.indexOf(learner) + 1} of {selection.filteredLearners.length}</div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {Object.entries(valueDefinitions).map(([key, definition]) => (
                        <div key={key} className="space-y-2">
                          <label className="block text-xs font-semibold uppercase text-gray-500">{definition.name}</label>
                          <select
                            value={entry[key] || 'ME1'}
                            onChange={(e) => updateBulkEntry(learner.id, key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-brand-purple focus:ring-brand-purple"
                          >
                            {CBC_RATINGS.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">General comment</label>
                      <textarea
                        value={entry.comment || ''}
                        onChange={(e) => updateBulkEntry(learner.id, 'comment', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-brand-purple focus:ring-brand-purple resize-none"
                        placeholder="Optional comment for this learner"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6 border-t border-gray-100">
            <button
              onClick={() => setViewMode('setup')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              Back to Single Entry
            </button>
            <button
              onClick={handleBulkSave}
              disabled={saving || selection.filteredLearners.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-brand-purple to-brand-teal text-white rounded-xl hover:opacity-90 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Bulk Records'}
            </button>
          </div>
        </div>
      )}

      {/* ASSESS MODE */}
      {viewMode === 'assess' && selection.selectedLearner && (
        <>
          {/* Compact Context Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-brand-purple/10 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-teal rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {selection.selectedLearner.firstName[0]}{selection.selectedLearner.lastName[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg line-clamp-1">
                  {selection.selectedLearner.firstName} {selection.selectedLearner.lastName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                  <span>{selection.selectedLearner.admissionNumber}</span>
                  <span className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {setup.terms.find(t => t.value === setup.selectedTerm)?.label} {setup.academicYear}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('setup')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Edit3 size={16} />
                Change Learner
              </button>
              <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition shadow-sm font-bold disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Assessment'}
                <Save size={18} />
              </button>
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(valueDefinitions).map(([key, definition]) => (
              <div key={key} className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100 hover:border-brand-purple/20 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl filter drop-shadow-sm">{definition.icon}</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{definition.name}</h4>
                    <p className="text-sm text-gray-500">{definition.description}</p>
                  </div>
                </div>

                <div>
                  <select
                    value={ratings.ratings[key] || 'ME1'}
                    onChange={(e) => ratings.setRating(key, e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-brand-purple font-bold text-sm transition-all cursor-pointer appearance-none ${getRatingColor(ratings.ratings[key] || 'ME1')}`}
                  >
                    {CBC_RATINGS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* General Comment */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Edit3 size={16} className="text-gray-400" />
              General Observations
            </label>
            <textarea
              value={ratings.comments.general || ''}
              onChange={(e) => ratings.setComment('general', e.target.value)}
              placeholder="Add overall observations about the learner's demonstration of values..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-brand-purple resize-none transition-all font-medium"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-4 pb-12">
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-white border-2 border-brand-purple/20 text-brand-purple font-bold rounded-xl hover:bg-brand-purple/5 transition"
            >
              Save & Stay
            </button>
            <button
              onClick={() => {
                handleSave();
                setViewMode('setup');
                selection.clearSelection();
                window.scrollTo(0, 0);
              }}
              className="px-8 py-3 bg-brand-purple text-white font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2 shadow-lg"
            >
              Finish & Next Learner
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ValuesAssessment;
