/**
 * Promotion Page
 * Promote learners to next grade level
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, Users } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import { useAuth } from '../../../hooks/useAuth';
import api, { configAPI } from '../../../services/api';

const PromotionPage = ({ onPromote, showNotification }) => {
  const { user } = useAuth();
  const [sourceGrade, setSourceGrade] = useState('');
  const [sourceStream, setSourceStream] = useState('all');
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [availableStreams, setAvailableStreams] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);

  // Format help
  const formatGrade = (grade) => {
    if (!grade) return '';
    return grade.replace(/_/g, ' ')
      .replace('GRADE', 'Grade')
      .replace('PP', 'PP') // Keep PP1/PP2 as is
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) // Title Case
      .replace('Pp', 'PP') // Fix Map PP back if needed or just handle specific cases
      .replace('Grade', 'Grade '); // Ensure space if missing (though replace _ gave it)
  };

  // Custom formatter to be safer
  const getGradeLabel = (g) => {
    if (!g) return '';
    if (g.startsWith('GRADE_')) return g.replace('GRADE_', 'Grade ');
    if (g === 'PP1') return 'PP1';
    if (g === 'PP2') return 'PP2';
    return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase().replace('_', ' ');
  };

  // Local learners state since we shouldn't rely on the global paginated list
  const [classLearners, setClassLearners] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch configs (streams and grades)
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        if (user?.schoolId) {
          const streamResp = await configAPI.getStreamConfigs(user.schoolId);
          setAvailableStreams(streamResp?.data?.filter(s => s.active !== false) || []);
        }

        const gradesResp = await configAPI.getGrades();
        if (gradesResp?.data) {
          setAvailableGrades(gradesResp.data);
          // Set default grade if available
          if (gradesResp.data.length > 0 && !sourceGrade) {
            // Default to something reasonable if possible, or just first
            // Maybe Grade 1 or similar if exists
            const defaultG = gradesResp.data.find(g => g === 'GRADE_1') || gradesResp.data[0];
            setSourceGrade(defaultG);
          }
        }
      } catch (error) {
        console.error('Failed to fetch configs:', error);
      }
    };
    fetchConfigs();
  }, [user?.schoolId]);

  // Fetch learners when filters change
  useEffect(() => {
    const fetchClassLearners = async () => {
      if (!sourceGrade) return;

      try {
        setLoading(true);
        console.log(`Fetching learners for Grade: ${sourceGrade}, Stream: ${sourceStream}`);
        // Fetch all learners for this grade/stream without pagination (or large limit)
        // Adjust limit as needed, assuming 100 is enough for a class, or handle pagination if needed.
        // For promotion, usually we want to see the whole class.
        const params = {
          grade: sourceGrade,
          stream: sourceStream === 'all' ? undefined : sourceStream,
          status: 'ACTIVE',
          limit: 200 // Fetch up to 200 students per class
        };

        const response = await api.learners.getAll(params);
        if (response.success) {
          // Check if response.data is an array (handle paginated structure if API returns object)
          const data = Array.isArray(response.data) ? response.data :
            (response.data && Array.isArray(response.data.data)) ? response.data.data : [];

          // Transform data if needed to match UI expectations (consistent with useLearners hook)
          const transformed = data.map(l => ({
            id: l.id,
            firstName: l.firstName,
            lastName: l.lastName,
            admNo: l.admissionNumber,
            grade: l.grade,
            stream: l.stream,
            avatar: l.photoUrl || l.avatar
          }));
          setClassLearners(transformed);
        } else {
          console.error('Fetch failed:', response);
          setClassLearners([]);
        }
      } catch (error) {
        console.error('Failed to fetch learners:', error);
        setClassLearners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassLearners();
  }, [sourceGrade, sourceStream]);

  // Toggle learner selection
  const toggleLearner = (learnerId) => {
    setSelectedLearners(prev =>
      prev.includes(learnerId)
        ? prev.filter(id => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  // Select all learners
  const selectAll = () => {
    if (selectedLearners.length === classLearners.length) {
      setSelectedLearners([]); // Deselect all if all are selected
    } else {
      setSelectedLearners(classLearners.map(l => l.id));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedLearners([]);
  };

  // Get next grade logic
  const getNextGrade = (currentGrade) => {
    const mapping = {
      'CRECHE': 'RECEPTION',
      'RECEPTION': 'TRANSITION',
      'TRANSITION': 'PLAYGROUP', // Assuming order
      // Actually check schema order: Creche, Reception, Transition, Playgroup, PP1...
      // Wait, schema order: CRECHE, RECEPTION, TRANSITION, PLAYGROUP, PP1, PP2, GRADE_1...
      'PLAYGROUP': 'PP1',
      'PP1': 'PP2',
      'PP2': 'GRADE_1'
    };

    if (mapping[currentGrade]) return mapping[currentGrade];

    if (currentGrade.startsWith('GRADE_')) {
      const num = parseInt(currentGrade.split('_')[1]);
      if (num >= 12) return 'GRADUATED';
      return `GRADE_${num + 1}`;
    }

    return currentGrade;
  };

  // Handle promotion
  const handlePromote = () => {
    if (selectedLearners.length === 0) {
      showNotification('Please select learners to promote', 'warning');
      return;
    }

    const nextGrade = getNextGrade(sourceGrade);
    onPromote(selectedLearners, nextGrade);
    setSelectedLearners([]);
    // showNotification success is handled by parent or after promise resolves
  };

  return (
    <div className="space-y-6">

      {/* Step 1: Select Source Class */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-black mb-4 text-brand-purple uppercase tracking-widest">Step 1: Select Source Class</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Grade Level</label>
            <div className="relative">
              <select
                value={sourceGrade}
                onChange={(e) => {
                  setSourceGrade(e.target.value);
                  setSelectedLearners([]);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-white appearance-none"
              >
                {!availableGrades.length && <option value="">Loading grades...</option>}
                {availableGrades.map(g => (
                  <option key={g} value={g}>{getGradeLabel(g)}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stream / Class</label>
            <div className="relative">
              <select
                value={sourceStream}
                onChange={(e) => {
                  setSourceStream(e.target.value);
                  setSelectedLearners([]);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-white appearance-none"
              >
                <option value="all">All Streams</option>
                {availableStreams.map(stream => (
                  <option key={stream.id} value={stream.name}>
                    {stream.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex gap-3">
            <button
              onClick={selectAll}
              disabled={classLearners.length === 0}
              className={`flex-1 px-4 py-3 rounded-lg transition shadow-md font-bold text-sm uppercase tracking-wide ${classLearners.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                selectedLearners.length === classLearners.length ? 'bg-gray-600 text-white' : 'bg-brand-teal text-white hover:bg-brand-teal/90'
                }`}
            >
              {selectedLearners.length === classLearners.length && classLearners.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={clearSelection}
              disabled={selectedLearners.length === 0}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Select Learners */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-black mb-4 text-brand-purple uppercase tracking-widest flex justify-between items-center">
          <span>Step 2: Select Learners to Promote</span>
          <span className="text-sm bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full">
            {selectedLearners.length} / {classLearners.length} Selected
          </span>
        </h3>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
          </div>
        ) : classLearners.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Learners Found"
            message="No eligible learners found for promotion in this class"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classLearners.map((learner) => {
              const nextGrade = getNextGrade(learner.grade);
              const isSelected = selectedLearners.includes(learner.id);

              return (
                <div
                  key={learner.id}
                  onClick={() => toggleLearner(learner.id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 group ${isSelected
                    ? 'bg-brand-teal/5 ring-2 ring-brand-teal shadow-md'
                    : 'bg-white border border-gray-100 hover:border-brand-teal/50 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    {/* Checkbox UI for clarity */}
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-teal border-brand-teal' : 'border-gray-300 bg-white'}`}>
                      {isSelected && <CheckCircle size={14} className="text-white" />}
                    </div>

                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${isSelected ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-teal/10 group-hover:text-brand-teal'
                      }`}>
                      {learner.avatar || learner.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{learner.firstName} {learner.lastName}</p>
                      <p className="text-xs text-gray-500 font-medium tracking-wide">{learner.admNo}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 mt-2">
                    <span className="font-semibold text-gray-500">{learner.grade}</span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="font-bold text-brand-teal">{nextGrade}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Promote Button */}
      {selectedLearners.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 md:static md:bg-transparent md:border-t-0 md:shadow-none md:p-0 flex justify-end">
          <button
            onClick={handlePromote}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition shadow-lg hover:shadow-xl font-bold text-lg transform active:scale-95 duration-150"
          >
            <CheckCircle size={24} />
            <span>Promote {selectedLearners.length} Learner{selectedLearners.length !== 1 ? 's' : ''}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PromotionPage;
