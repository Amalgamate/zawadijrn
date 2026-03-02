import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { gradingAPI } from '../../../services/api';
import { getLearningAreasByGrade } from '../../../constants/learningAreas';

const CreateTestPage = ({ onSave, onCancel, initialData, availableGrades }) => {
  const [formData, setFormData] = useState({
    title: '',
    testType: 'Monthly Test', // Default from screenshot options
    month: new Date().toLocaleString('default', { month: 'long' }),
    grade: '',
    term: 'Term 1',
    subject: '',
    performanceScale: '',
    year: new Date().getFullYear().toString(),
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    totalMarks: 100,
    passMarks: 40,
    instructions: '',
    weight: 1.0,
    ...initialData
  });

  const [scales, setScales] = useState([]);

  useEffect(() => {
    const fetchScales = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let schoolId = user?.school?.id || user?.schoolId || localStorage.getItem('currentSchoolId');

        // Fallback to default school if no schoolId found
        if (!schoolId) {
          schoolId = 'default-school-e082e9a4';
        }

        console.log('🏫 Fetching scales for schoolId:', schoolId);

        const systems = await gradingAPI.getSystems(schoolId);
        const relevantScales = systems ? systems.filter(s => s.type === 'SUMMATIVE') : [];
        setScales(relevantScales.length > 0 ? relevantScales : systems || []);
        console.log('✅ Loaded', relevantScales.length, 'SUMMATIVE scales');
      } catch (error) {
        console.error('❌ Error fetching scales:', error);
        setScales([]);
      }
    };
    fetchScales();
  }, []);

  // Filter and group scales
  const filteredAndGroupedScales = useMemo(() => {
    if (scales.length === 0) {
      return {};
    }

    // Helper to extract grade from scale name or grade field
    const getScaleGrade = (scale) => {
      // First try the grade field
      if (scale.grade) return scale.grade;

      // Then try to extract from name (e.g., "PLAYGROUP - MATH" -> "PLAYGROUP")
      const nameParts = scale.name.split(' - ');
      if (nameParts.length > 1) {
        const possibleGrade = nameParts[0].trim();
        // Check if it looks like a grade
        if (possibleGrade.includes('GRADE') ||
          possibleGrade.includes('PLAYGROUP') ||
          possibleGrade.includes('PP') ||
          possibleGrade.includes('PRE-PRIMARY')) {
          return possibleGrade;
        }
      }

      // Default category for scales without a clear grade
      return 'General Scales';
    };

    // Group all scales by grade
    const grouped = {};
    scales.forEach(scale => {
      const gradeKey = getScaleGrade(scale);
      if (!grouped[gradeKey]) {
        grouped[gradeKey] = [];
      }
      grouped[gradeKey].push(scale);
    });

    // If a grade is selected, we want to ensure its group appears first (optional UI enhancement)
    // But since object key order isn't guaranteed in all JS environments (though mostly is for strings),
    // we rely on the render order. The render uses Object.entries().
    // We can't easily force order in a plain object, but we can return the object as is.
    // The key change here is REMOVING the filtering that hid other grades' scales.

    return grouped;
  }, [formData.grade, scales]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== SUBMITTING TEST FORM ===');
    console.log('Form Data:', formData);

    // Validation
    if (!formData.title || !formData.grade || !formData.performanceScale || !formData.subject) {
      console.log('Validation failed:');
      console.log('- Title:', formData.title);
      console.log('- Grade:', formData.grade);
      console.log('- Subject:', formData.subject);
      console.log('- Scale:', formData.performanceScale);
      alert('Please fill in all required fields (Test Name, Grade, Subject, Performance Level Scale)');
      return;
    }

    console.log('Validation passed, calling onSave...');

    try {
      await onSave(formData);
      console.log('✅ Save successful!');
    } catch (error) {
      console.error('❌ Save failed:', error);
      alert('Failed to save test: ' + error.message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
            {initialData && initialData.id ? 'Edit Test Configuration' : 'Create New Test'}
          </h1>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600">Test Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Test Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Test Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Mathematics Opener"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all placeholder-gray-400"
                required
              />
            </div>

            {/* Grid Layout for other fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Type */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Test Type
                </label>
                <div className="relative">
                  <select
                    value={formData.testType}
                    onChange={(e) => handleChange('testType', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="Opener">Opener</option>
                    <option value="Midterm">Midterm</option>
                    <option value="End Term">End Term</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Random">Random</option>
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Month (Conditional) */}
              {formData.testType === 'Monthly Test' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Month
                  </label>
                  <div className="relative">
                    <select
                      value={formData.month}
                      onChange={(e) => {
                        const newMonth = e.target.value;
                        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        const monthIndex = months.indexOf(newMonth);

                        setFormData(prev => {
                          const updates = { month: newMonth };
                          if (monthIndex >= 0) {
                            const year = parseInt(prev.year) || new Date().getFullYear();
                            const monthStr = (monthIndex + 1).toString().padStart(2, '0');
                            updates.date = `${year}-${monthStr}-01`;
                          }
                          return { ...prev, ...updates };
                        });
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Grade */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Grade Level
                </label>
                <div className="relative">
                  <select
                    value={formData.grade}
                    onChange={(e) => handleChange('grade', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Grade</option>
                    {availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Academic Term */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Term
                </label>
                <div className="relative">
                  <select
                    value={formData.term}
                    onChange={(e) => handleChange('term', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject / Learning Area */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Learning Area (Subject)<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  required
                  disabled={!formData.grade}
                >
                  <option value="">{formData.grade ? 'Select Learning Area' : 'Select Grade first'}</option>
                  {formData.grade && getLearningAreasByGrade(formData.grade).map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Performance Level Scale - Full Width */}
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Performance Level Scale
              </label>
              <div className="relative">
                <select
                  value={formData.performanceScale}
                  onChange={(e) => handleChange('performanceScale', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Scale</option>
                  {Object.keys(filteredAndGroupedScales).length > 0 ? (
                    Object.entries(filteredAndGroupedScales)
                      .sort(([gradeA], [gradeB]) => {
                        // Prioritize the selected grade group
                        if (formData.grade) {
                          const normSelected = formData.grade.toUpperCase().replace(/[\s-]/g, '');
                          const normA = gradeA.toUpperCase().replace(/[\s-]/g, '');
                          const normB = gradeB.toUpperCase().replace(/[\s-]/g, '');

                          if (normA === normSelected) return -1;
                          if (normB === normSelected) return 1;

                          // Also try partial match
                          if (normA.includes(normSelected)) return -1;
                          if (normB.includes(normSelected)) return 1;
                        }
                        return gradeA.localeCompare(gradeB);
                      })
                      .map(([grade, gradeScales]) => (
                        <optgroup key={grade} label={grade}>
                          {gradeScales.map(scale => (
                            <option key={scale.id} value={scale.name}>{scale.name}</option>
                          ))}
                        </optgroup>
                      ))
                  ) : (
                    <option disabled>No scales available for this grade</option>
                  )}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {formData.grade && Object.values(filteredAndGroupedScales).flat().length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ No performance scales found for {formData.grade}. You can still create the test and assign a scale later.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1a237e] text-white font-semibold rounded-lg hover:bg-[#151b60] transition-colors shadow-sm flex items-center gap-2 text-sm"
              >
                <Save size={16} />
                Save Configuration
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTestPage;
