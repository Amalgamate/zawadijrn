/**
 * Core Competencies Assessment Form
 * Assess the 6 core competencies for CBC
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Save, BookOpen, Edit3, ArrowRight } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';
import SmartLearnerSearch from '../shared/SmartLearnerSearch';
import { CBC_RATINGS } from '../../../constants/ratings';
import { useAssessmentSetup } from '../hooks/useAssessmentSetup';
import { useLearnerSelection } from '../hooks/useLearnerSelection';
import { useRatings } from '../hooks/useRatings';
import { useTeacherWorkload } from '../hooks/useTeacherWorkload';
import { validateCompetenciesAssessment, formatValidationErrors } from '../../../utils/validation/assessmentValidators';

const DEFAULT_BULK_COMPETENCY_RATINGS = {
  communication: 'ME1',
  criticalThinking: 'ME1',
  creativity: 'ME1',
  collaboration: 'ME1',
  citizenship: 'ME1',
  learningToLearn: 'ME1'
};

const CoreCompetenciesAssessment = ({ learners }) => {
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
    communication: 'ME1',
    criticalThinking: 'ME1',
    creativity: 'ME1',
    collaboration: 'ME1',
    citizenship: 'ME1',
    learningToLearn: 'ME1'
  });

  // View state for setup/assess workflow
  const [viewMode, setViewMode] = useState('setup');
  const [saving, setSaving] = useState(false);
  const [bulkEntries, setBulkEntries] = useState({});

  const initializeBulkEntries = useCallback(() => {
    const entries = {};
    selection.filteredLearners.forEach(learner => {
      entries[learner.id] = {
        ...DEFAULT_BULK_COMPETENCY_RATINGS,
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
      showError('No learners found for this grade and stream');
      return;
    }

    const records = selection.filteredLearners.map(learner => {
      const entry = bulkEntries[learner.id] || DEFAULT_BULK_COMPETENCY_RATINGS;
      return {
        learnerId: learner.id,
        term: setup.selectedTerm,
        academicYear: setup.academicYear,
        communication: entry.communication,
        communicationComment: entry.comment || '',
        criticalThinking: entry.criticalThinking,
        criticalThinkingComment: entry.comment || '',
        creativity: entry.creativity,
        creativityComment: entry.comment || '',
        collaboration: entry.collaboration,
        collaborationComment: entry.comment || '',
        citizenship: entry.citizenship,
        citizenshipComment: entry.comment || '',
        learningToLearn: entry.learningToLearn,
        learningToLearnComment: entry.comment || ''
      };
    });

    setSaving(true);
    try {
      const response = await api.cbc.saveCompetenciesBulk({ records });
      if (response.success) {
        showSuccess('Bulk core competency records saved successfully');
        setViewMode('setup');
      } else {
        throw new Error(response.message || 'Failed to save bulk competencies');
      }
    } catch (error) {
      showError(error.message || 'Failed to save bulk competencies');
    } finally {
      setSaving(false);
    }
  };


  // Competency definitions (component-specific)
  const competencyDefinitions = {
    communication: { name: 'Communication', description: 'Ability to listen, speak, read, write and use language effectively', icon: '💬' },
    criticalThinking: { name: 'Critical Thinking', description: 'Ability to think logically, analyze and solve problems', icon: '🧠' },
    creativity: { name: 'Creativity & Imagination', description: 'Ability to use imagination and innovation to create new things', icon: '🎨' },
    collaboration: { name: 'Collaboration', description: 'Ability to work effectively with others', icon: '🤝' },
    citizenship: { name: 'Citizenship', description: 'Understanding rights, responsibilities and participating in society', icon: '🏛️' },
    learningToLearn: { name: 'Learning to Learn', description: 'Ability to pursue and persist in learning independently', icon: '📚' }
  };

  // Load existing competencies when learner/term changes
  const loadExistingCompetencies = useCallback(async () => {
    if (!selection.selectedLearnerId || !setup.selectedTerm) return;

    try {
      const response = await api.cbc.getCompetencies(selection.selectedLearnerId, {
        term: setup.selectedTerm,
        academicYear: setup.academicYear
      });

      if (response.success && response.data) {
        ratings.setRatings({
          communication: response.data.communication || 'ME1',
          criticalThinking: response.data.criticalThinking || 'ME1',
          creativity: response.data.creativity || 'ME1',
          collaboration: response.data.collaboration || 'ME1',
          citizenship: response.data.citizenship || 'ME1',
          learningToLearn: response.data.learningToLearn || 'ME1'
        });
        // Load individual comments
        if (response.data.communicationComment) ratings.setComment('communication', response.data.communicationComment);
        if (response.data.criticalThinkingComment) ratings.setComment('criticalThinking', response.data.criticalThinkingComment);
        if (response.data.creativityComment) ratings.setComment('creativity', response.data.creativityComment);
        if (response.data.collaborationComment) ratings.setComment('collaboration', response.data.collaborationComment);
        if (response.data.citizenshipComment) ratings.setComment('citizenship', response.data.citizenshipComment);
        if (response.data.learningToLearnComment) ratings.setComment('learningToLearn', response.data.learningToLearnComment);
        showSuccess('Loaded existing assessment');
      }
    } catch (error) {
      console.log('No existing assessment found');
    }
  }, [selection.selectedLearnerId, setup.selectedTerm, setup.academicYear, ratings, showSuccess]);

  useEffect(() => {
    if (viewMode === 'assess') {
      loadExistingCompetencies();
    }
  }, [viewMode, loadExistingCompetencies]);

  // Alert teacher if they have no assignments
  useEffect(() => {
    if (!teacherWorkload.loading && teacherWorkload.isTeacher && !teacherWorkload.hasAnyAssignments) {
      showError('You are not currently assigned to any classes. Please consult with the Head Teacher.');
    }
  }, [teacherWorkload.loading, teacherWorkload.isTeacher, teacherWorkload.hasAnyAssignments, showError]);

  // Auto-prefill Grade and Stream for teachers
  useEffect(() => {
    if (teacherWorkload.isTeacher && !teacherWorkload.loading && viewMode === 'setup') {
      if (!setup.selectedGrade && teacherWorkload.primaryGrade) {
        setup.setSelectedGrade(teacherWorkload.primaryGrade);
      }
      if (!setup.selectedStream && teacherWorkload.primaryStream) {
        setup.setSelectedStream(teacherWorkload.primaryStream);
      }
    }
  }, [teacherWorkload.isTeacher, teacherWorkload.loading, teacherWorkload.primaryGrade, teacherWorkload.primaryStream, setup, viewMode]);

  // Save competencies assessment
  const handleSave = async () => {
    if (!selection.selectedLearnerId) {
      showError('Please select a learner');
      return;
    }

    // Validate before saving
    const validationError = validateCompetenciesAssessment({
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
      const response = await api.cbc.saveCompetencies({
        learnerId: selection.selectedLearnerId,
        term: setup.selectedTerm,
        academicYear: setup.academicYear,
        ...ratings.ratings,
        communicationComment: ratings.comments.communication || '',
        criticalThinkingComment: ratings.comments.criticalThinking || '',
        creativityComment: ratings.comments.creativity || '',
        collaborationComment: ratings.comments.collaboration || '',
        citizenshipComment: ratings.comments.citizenship || '',
        learningToLearnComment: ratings.comments.learningToLearn || ''
      });

      if (response.success) {
        showSuccess('Core competencies saved successfully!');
      } else {
        throw new Error(response.message || 'Failed to save');
      }
    } catch (error) {
      showError(error.message || 'Failed to save core competencies');
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
    if (rating.startsWith('ME')) return 'bg-blue-100 border-blue-300 text-blue-800';
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
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
              <BookOpen size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Core Competencies Assessment</h2>
            <p className="text-gray-500">Select a learner to begin assessing competencies</p>
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
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                className="flex items-center gap-2 px-6 py-3 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bulk Entry
              </button>
              <button
                onClick={handleStartAssessment}
                disabled={!selection.selectedLearnerId}
                className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
              <BookOpen size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Bulk Core Competencies Entry</h2>
            <p className="text-gray-500">Enter competencies for all learners in the selected grade and stream without leaving the page.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest text-gray-500">Grade / Stream</p>
              <p className="font-bold text-gray-800">{setup.selectedGrade || 'N/A'} {setup.selectedStream ? ` / ${setup.selectedStream}` : ''}</p>
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
                const entry = bulkEntries[learner.id] || DEFAULT_BULK_COMPETENCY_RATINGS;
                return (
                  <div key={learner.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">{learner.admissionNumber}</p>
                        <h3 className="font-bold text-gray-800">{learner.firstName} {learner.lastName}</h3>
                      </div>
                      <div className="text-sm text-gray-500">Learner {selection.filteredLearners.indexOf(learner) + 1} of {selection.filteredLearners.length}</div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {Object.entries(competencyDefinitions).map(([key, definition]) => (
                        <div key={key} className="space-y-2">
                          <label className="block text-xs font-semibold uppercase text-gray-500">{definition.name}</label>
                          <select
                            value={entry[key] || 'ME1'}
                            onChange={(e) => updateBulkEntry(learner.id, key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                          >
                            {CBC_RATINGS.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Learner-specific comment</label>
                      <textarea
                        value={entry.comment || ''}
                        onChange={(e) => updateBulkEntry(learner.id, 'comment', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500 resize-none"
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
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-xl shadow-sm p-4 border border-purple-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {selection.selectedLearner.firstName[0]}{selection.selectedLearner.lastName[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg line-clamp-1">
                  {selection.selectedLearner.firstName} {selection.selectedLearner.lastName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                  <span>{selection.selectedLearner.admissionNumber}</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
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
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-sm font-semibold disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Assessment'}
                <Save size={18} />
              </button>
            </div>
          </div>

          {/* Competencies Grid */}
          <div className="space-y-6">
            {Object.entries(competencyDefinitions).map(([key, definition]) => (
              <div key={key} className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100 hover:border-purple-200 transition-all hover:shadow-md">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl filter drop-shadow-sm">{definition.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-800">{definition.name}</h4>
                    <p className="text-sm text-gray-500">{definition.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rating Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                    <select
                      value={ratings.ratings[key] || 'ME1'}
                      onChange={(e) => ratings.setRating(key, e.target.value)}
                      className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold ${getRatingColor(ratings.ratings[key] || 'ME1')}`}
                    >
                      {CBC_RATINGS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observation / Comment</label>
                    <textarea
                      value={ratings.comments[key] || ''}
                      onChange={(e) => ratings.setComment(key, e.target.value)}
                      placeholder="Add specific observations..."
                      rows={2}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex justify-end gap-4 pb-12">
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-white border-2 border-purple-100 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition"
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
              className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition flex items-center gap-2 shadow-lg"
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

export default CoreCompetenciesAssessment;
