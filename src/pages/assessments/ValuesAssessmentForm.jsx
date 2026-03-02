import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { DatePicker } from '../../components/ui/date-picker';

const ValuesAssessmentForm = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    grade: '',
    term: '',
    academicYear: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    values: [
      {
        id: 1,
        name: 'Patriotism',
        descriptor: 'Love for country, national pride, and civic responsibility',
        indicators: [
          'Participates in national celebrations and events',
          'Shows respect for national symbols and anthem',
          'Demonstrates knowledge of Kenyan history and culture',
          'Exhibits pride in being Kenyan'
        ],
        rating: '',
        observations: '',
        evidence: ''
      },
      {
        id: 2,
        name: 'Respect',
        descriptor: 'Showing regard for self, others, and the environment',
        indicators: [
          'Uses polite language and manners',
          'Listens when others are speaking',
          'Values diversity and different opinions',
          'Cares for school property and environment'
        ],
        rating: '',
        observations: '',
        evidence: ''
      },
      {
        id: 3,
        name: 'Unity',
        descriptor: 'Working together harmoniously with others',
        indicators: [
          'Collaborates well in group activities',
          'Resolves conflicts peacefully',
          'Supports classmates and team members',
          'Promotes inclusivity and togetherness'
        ],
        rating: '',
        observations: '',
        evidence: ''
      },
      {
        id: 4,
        name: 'Responsibility',
        descriptor: 'Being accountable for one\'s actions and duties',
        indicators: [
          'Completes assigned tasks on time',
          'Takes ownership of mistakes',
          'Follows school rules and procedures',
          'Shows initiative in helping others'
        ],
        rating: '',
        observations: '',
        evidence: ''
      },
      {
        id: 5,
        name: 'Peace',
        descriptor: 'Promoting harmony and resolving conflicts constructively',
        indicators: [
          'Maintains calm in challenging situations',
          'Mediates conflicts among peers',
          'Promotes understanding and cooperation',
          'Practices empathy and kindness'
        ],
        rating: '',
        observations: '',
        evidence: ''
      },
      {
        id: 6,
        name: 'Love',
        descriptor: 'Showing care, compassion, and concern for others',
        indicators: [
          'Shows kindness to classmates and staff',
          'Helps those in need',
          'Demonstrates empathy and understanding',
          'Creates positive relationships'
        ],
        rating: '',
        observations: '',
        evidence: ''
      },
      {
        id: 7,
        name: 'Integrity',
        descriptor: 'Honesty and strong moral principles',
        indicators: [
          'Tells the truth even when difficult',
          'Resists peer pressure to do wrong',
          'Returns lost items',
          'Admits mistakes honestly'
        ],
        rating: '',
        observations: '',
        evidence: ''
      },
      {
        id: 8,
        name: 'Social Justice',
        descriptor: 'Fairness and advocacy for what is right',
        indicators: [
          'Stands up against bullying and injustice',
          'Treats everyone fairly',
          'Speaks out for those who cannot',
          'Promotes equality and fairness'
        ],
        rating: '',
        observations: '',
        evidence: ''
      }
    ],
    overallAssessment: '',
    strengthsIdentified: '',
    areasForDevelopment: '',
    parentGuardianFeedback: '',
    teacherName: '',
    teacherSignature: '',
    parentSignature: '',
    parentDate: ''
  });

  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  const ratingScale = [
    { value: 'CE', label: 'Consistently Evident', color: 'bg-green-100 border-green-400', description: 'Regularly demonstrates this value' },
    { value: 'FE', label: 'Frequently Evident', color: 'bg-blue-100 border-blue-400', description: 'Often shows this value' },
    { value: 'OE', label: 'Occasionally Evident', color: 'bg-yellow-100 border-yellow-400', description: 'Sometimes displays this value' },
    { value: 'RE', label: 'Rarely Evident', color: 'bg-red-100 border-red-400', description: 'Seldom shows this value' }
  ];

  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
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

  const handleValueChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.map(val =>
        val.id === id ? { ...val, [field]: value } : val
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

    const hasRatings = formData.values.some(val => val.rating);
    if (!hasRatings) {
      newErrors.values = 'Please rate at least one value';
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
      console.log('Saving values assessment:', formData);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            National Values Assessment Form
          </h1>
          <p className="text-gray-600">
            Assess student development in Kenya's national values and principles of governance
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

          {/* Rating Scale */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating Scale</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ratingScale.map(rating => (
                <div key={rating.value} className={`p-3 border-2 rounded-lg ${rating.color}`}>
                  <div className="font-semibold text-gray-900">{rating.value}</div>
                  <div className="text-sm font-medium text-gray-800">{rating.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{rating.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Values Assessment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Values Assessment</h2>
            {errors.values && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-800">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                {errors.values}
              </div>
            )}

            <div className="space-y-6">
              {formData.values.map((value, index) => (
                <div key={value.id} className="border border-gray-200 rounded-lg p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {index + 1}. {value.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{value.descriptor}</p>
                  </div>

                  {/* Indicators */}
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Key Indicators:</h4>
                    <ul className="space-y-1">
                      {value.indicators.map((indicator, idx) => (
                        <li key={idx} className="text-sm text-blue-800 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex flex-wrap gap-2">
                      {ratingScale.map(rating => (
                        <button
                          key={rating.value}
                          type="button"
                          onClick={() => handleValueChange(value.id, 'rating', rating.value)}
                          className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${value.rating === rating.value
                              ? rating.color + ' ring-2 ring-blue-500'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}
                        >
                          <div className="text-sm">{rating.value}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Observations */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observations
                    </label>
                    <textarea
                      value={value.observations}
                      onChange={(e) => handleValueChange(value.id, 'observations', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe specific behaviors or situations demonstrating this value..."
                    />
                  </div>

                  {/* Evidence */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evidence / Examples
                    </label>
                    <textarea
                      value={value.evidence}
                      onChange={(e) => handleValueChange(value.id, 'evidence', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide concrete examples or documented evidence..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Assessment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  General Assessment Summary
                </label>
                <textarea
                  value={formData.overallAssessment}
                  onChange={(e) => handleInputChange('overallAssessment', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide an overall summary of the student's demonstration of values..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strengths Identified
                </label>
                <textarea
                  value={formData.strengthsIdentified}
                  onChange={(e) => handleInputChange('strengthsIdentified', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Highlight values the student demonstrates particularly well..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Areas for Development
                </label>
                <textarea
                  value={formData.areasForDevelopment}
                  onChange={(e) => handleInputChange('areasForDevelopment', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Identify values that need more attention and support..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent/Guardian Feedback (Optional)
                </label>
                <textarea
                  value={formData.parentGuardianFeedback}
                  onChange={(e) => handleInputChange('parentGuardianFeedback', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Space for parent/guardian comments..."
                />
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Signatures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Teacher</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.teacherName}
                    onChange={(e) => handleInputChange('teacherName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.teacherName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter teacher name"
                  />
                  {errors.teacherName && <p className="mt-1 text-sm text-red-600">{errors.teacherName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <input
                    type="text"
                    value={formData.teacherSignature}
                    onChange={(e) => handleInputChange('teacherSignature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your name to sign"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Parent/Guardian</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <input
                    type="text"
                    value={formData.parentSignature}
                    onChange={(e) => handleInputChange('parentSignature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Type name to acknowledge"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <DatePicker
                    value={formData.parentDate}
                    onChange={(date) => handleInputChange('parentDate', date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '')}
                    className="w-full"
                  />
                </div>
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

export default ValuesAssessmentForm;
