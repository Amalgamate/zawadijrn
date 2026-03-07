import React, { useState } from 'react';
import { Save, Plus, Trash2, AlertCircle, Award, Users } from 'lucide-react';
import { DatePicker } from '../../components/ui/date-picker';
import { useSchoolData } from '../../contexts/SchoolDataContext';

const CoCurricularActivitiesForm = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    grade: '',
    term: '',
    academicYear: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    activities: [],
    overallPerformance: '',
    skillsDeveloped: '',
    areasForImprovement: '',
    recommendations: '',
    teacherName: '',
    teacherSignature: ''
  });

  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  const activityCategories = [
    { value: 'sports', label: 'Sports & Athletics' },
    { value: 'arts', label: 'Creative Arts' },
    { value: 'music', label: 'Music & Performing Arts' },
    { value: 'clubs', label: 'Clubs & Societies' },
    { value: 'leadership', label: 'Leadership & Service' },
    { value: 'academic', label: 'Academic Competitions' },
    { value: 'technology', label: 'Technology & Innovation' },
    { value: 'other', label: 'Other Activities' }
  ];

  const performanceLevels = [
    { value: 'EX', label: 'Excellent', color: 'bg-green-100 border-green-400', description: 'Outstanding performance and dedication' },
    { value: 'VG', label: 'Very Good', color: 'bg-blue-100 border-blue-400', description: 'Consistently good performance' },
    { value: 'GO', label: 'Good', color: 'bg-yellow-100 border-yellow-400', description: 'Satisfactory participation' },
    { value: 'NI', label: 'Needs Improvement', color: 'bg-orange-100 border-orange-400', description: 'Requires more effort' }
  ];

  const participationLevels = [
    'Active participant',
    'Team member',
    'Team leader/Captain',
    'Committee member',
    'Event organizer',
    'Regular attendee',
    'Occasional participant'
  ];

  const { grades } = useSchoolData();
  const terms = ['Term 1', 'Term 2', 'Term 3'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addActivity = () => {
    const newActivity = {
      id: Date.now(),
      category: '',
      activityName: '',
      participationLevel: '',
      performanceRating: '',
      attendanceRate: '',
      achievements: '',
      skillsGained: '',
      teacherObservations: ''
    };
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, newActivity]
    }));
  };

  const removeActivity = (id) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter(act => act.id !== id)
    }));
  };

  const updateActivity = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map(act =>
        act.id === id ? { ...act, [field]: value } : act
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId) newErrors.studentId = 'Student ID is required';
    if (!formData.studentName) newErrors.studentName = 'Student name is required';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.term) newErrors.term = 'Term is required';
    if (!formData.academicYear) newErrors.academicYear = 'Academic year is required';
    if (!formData.teacherName) newErrors.teacherName = 'Teacher name is required';

    if (formData.activities.length === 0) {
      newErrors.activities = 'Please add at least one activity';
    } else {
      formData.activities.forEach((activity, index) => {
        if (!activity.category) {
          newErrors[`activity_${activity.id}_category`] = 'Category is required';
        }
        if (!activity.activityName) {
          newErrors[`activity_${activity.id}_name`] = 'Activity name is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSaveStatus('error');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log('Saving co-curricular assessment:', formData);

      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Co-Curricular Activities Assessment
            </h1>
          </div>
          <p className="text-gray-600">
            Track and evaluate student participation in extracurricular activities
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.studentId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter student ID"
                />
                {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.studentName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter student name"
                />
                {errors.studentName && <p className="mt-1 text-sm text-red-600">{errors.studentName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                <select
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.grade ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select grade</option>
                  {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                </select>
                {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                <select
                  value={formData.term}
                  onChange={(e) => handleInputChange('term', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.term ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select term</option>
                  {terms.map(term => <option key={term} value={term}>{term}</option>)}
                </select>
                {errors.term && <p className="mt-1 text-sm text-red-600">{errors.term}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => handleInputChange('academicYear', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.academicYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., 2024-2025"
                />
                {errors.academicYear && <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Date</label>
                <DatePicker
                  value={formData.assessmentDate}
                  onChange={(date) => handleInputChange('assessmentDate', date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '')}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Performance Rating Scale */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Rating Scale</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {performanceLevels.map(level => (
                <div key={level.value} className={`p-3 border-2 rounded-lg ${level.color}`}>
                  <div className="font-semibold text-gray-900">{level.value}</div>
                  <div className="text-sm font-medium text-gray-800">{level.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{level.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Activities & Participation</h2>
              <button
                type="button"
                onClick={addActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            </div>

            {errors.activities && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-800">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                {errors.activities}
              </div>
            )}

            {formData.activities.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No activities added yet</p>
                <button
                  type="button"
                  onClick={addActivity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Your First Activity
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.activities.map((activity, index) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-5 relative">
                    <div className="absolute top-4 right-4">
                      <button
                        type="button"
                        onClick={() => removeActivity(activity.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Remove activity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Activity {index + 1}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={activity.category}
                          onChange={(e) => updateActivity(activity.id, 'category', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors[`activity_${activity.id}_category`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                          <option value="">Select category</option>
                          {activityCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        {errors[`activity_${activity.id}_category`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`activity_${activity.id}_category`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Activity Name *
                        </label>
                        <input
                          type="text"
                          value={activity.activityName}
                          onChange={(e) => updateActivity(activity.id, 'activityName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors[`activity_${activity.id}_name`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="e.g., Basketball Team, Drama Club"
                        />
                        {errors[`activity_${activity.id}_name`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`activity_${activity.id}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Participation Level
                        </label>
                        <select
                          value={activity.participationLevel}
                          onChange={(e) => updateActivity(activity.id, 'participationLevel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select level</option>
                          {participationLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Attendance Rate
                        </label>
                        <input
                          type="text"
                          value={activity.attendanceRate}
                          onChange={(e) => updateActivity(activity.id, 'attendanceRate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 90%, Excellent, Regular"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Performance Rating
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {performanceLevels.map(level => (
                            <button
                              key={level.value}
                              type="button"
                              onClick={() => updateActivity(activity.id, 'performanceRating', level.value)}
                              className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${activity.performanceRating === level.value
                                ? level.color + ' ring-2 ring-blue-500'
                                : 'bg-white border-gray-300 hover:border-gray-400'
                                }`}
                            >
                              {level.value}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Achievements & Awards
                        </label>
                        <textarea
                          value={activity.achievements}
                          onChange={(e) => updateActivity(activity.id, 'achievements', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="List any awards, medals, certificates, or notable achievements..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skills Developed
                        </label>
                        <textarea
                          value={activity.skillsGained}
                          onChange={(e) => updateActivity(activity.id, 'skillsGained', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Teamwork, leadership, time management, creativity..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teacher/Coach Observations
                        </label>
                        <textarea
                          value={activity.teacherObservations}
                          onChange={(e) => updateActivity(activity.id, 'teacherObservations', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Additional comments about student's participation and progress..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overall Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Summary</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Performance Assessment
                </label>
                <textarea
                  value={formData.overallPerformance}
                  onChange={(e) => handleInputChange('overallPerformance', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide an overall assessment of student's co-curricular participation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Skills Developed
                </label>
                <textarea
                  value={formData.skillsDeveloped}
                  onChange={(e) => handleInputChange('skillsDeveloped', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Summarize the main skills and competencies gained..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Areas for Improvement
                </label>
                <textarea
                  value={formData.areasForImprovement}
                  onChange={(e) => handleInputChange('areasForImprovement', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Identify areas where the student could improve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendations
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Suggest new activities or areas for future participation..."
                />
              </div>
            </div>
          </div>

          {/* Teacher Signature */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Teacher Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher/Coordinator Name *
                </label>
                <input
                  type="text"
                  value={formData.teacherName}
                  onChange={(e) => handleInputChange('teacherName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.teacherName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter teacher/coordinator name"
                />
                {errors.teacherName && (
                  <p className="mt-1 text-sm text-red-600">{errors.teacherName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signature
                </label>
                <input
                  type="text"
                  value={formData.teacherSignature}
                  onChange={(e) => handleInputChange('teacherSignature', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your name to sign"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                {saveStatus === 'success' && (
                  <div className="text-green-600 font-medium">✓ Saved successfully</div>
                )}
                {saveStatus === 'error' && (
                  <div className="text-red-600 font-medium">✗ Please fix errors and try again</div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400"
                >
                  <Save className="w-4 h-4" />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Assessment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoCurricularActivitiesForm;
