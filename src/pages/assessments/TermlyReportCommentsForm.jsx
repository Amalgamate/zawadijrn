import React, { useState } from 'react';
import { Save, FileText, Lightbulb } from 'lucide-react';
import { DatePicker } from '../../components/ui/date-picker';
import { useSchoolData } from '../../contexts/SchoolDataContext';

const TermlyReportCommentsForm = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    grade: '',
    term: '',
    academicYear: '',
    reportDate: new Date().toISOString().split('T')[0],

    // Subject-specific comments
    subjectComments: {
      english: { strengths: '', areasForDevelopment: '', generalComment: '' },
      kiswahili: { strengths: '', areasForDevelopment: '', generalComment: '' },
      mathematics: { strengths: '', areasForDevelopment: '', generalComment: '' },
      science: { strengths: '', areasForDevelopment: '', generalComment: '' },
      socialStudies: { strengths: '', areasForDevelopment: '', generalComment: '' },
      religious: { strengths: '', areasForDevelopment: '', generalComment: '' },
      creative: { strengths: '', areasForDevelopment: '', generalComment: '' },
      physical: { strengths: '', areasForDevelopment: '', generalComment: '' }
    },

    // Overall comments
    classTeacherComment: '',
    headTeacherComment: '',

    // Performance summary
    academicStrengths: '',
    academicWeaknesses: '',
    behaviorConduct: '',
    attendance: '',
    punctuality: '',

    // Recommendations
    parentsAdvice: '',
    nextTermGoals: '',

    // Signatures
    classTeacherName: '',
    classTeacherSignature: '',
    headTeacherName: '',
    headTeacherSignature: '',
    parentSignature: '',
    parentDate: ''
  });

  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('english');

  const subjects = [
    { key: 'english', name: 'English Language' },
    { key: 'kiswahili', name: 'Kiswahili' },
    { key: 'mathematics', name: 'Mathematics' },
    { key: 'science', name: 'Science & Technology' },
    { key: 'socialStudies', name: 'Social Studies' },
    { key: 'religious', name: 'Religious Education' },
    { key: 'creative', name: 'Creative Arts' },
    { key: 'physical', name: 'Physical Education' }
  ];

  const { grades } = useSchoolData();
  const terms = ['Term 1', 'Term 2', 'Term 3'];

  const commentSuggestions = {
    strengths: [
      'Demonstrates excellent understanding of key concepts',
      'Shows consistent effort and dedication',
      'Participates actively in class discussions',
      'Completes assignments thoroughly and on time',
      'Shows creativity and original thinking',
      'Works well independently and in groups',
      'Demonstrates strong problem-solving skills',
      'Shows improvement in [specific area]'
    ],
    areasForDevelopment: [
      'Needs to practice [specific skill] more regularly',
      'Should work on time management skills',
      'Could benefit from more active participation',
      'Needs to review foundational concepts',
      'Should focus on attention to detail',
      'Would benefit from additional practice at home',
      'Needs to build confidence in [specific area]',
      'Should work on organizational skills'
    ]
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubjectCommentChange = (subject, field, value) => {
    setFormData(prev => ({
      ...prev,
      subjectComments: {
        ...prev.subjectComments,
        [subject]: {
          ...prev.subjectComments[subject],
          [field]: value
        }
      }
    }));
  };

  const insertSuggestion = (subject, field, suggestion) => {
    const currentValue = formData.subjectComments[subject][field];
    const newValue = currentValue
      ? currentValue + ' ' + suggestion
      : suggestion;
    handleSubjectCommentChange(subject, field, newValue);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId) newErrors.studentId = 'Student ID is required';
    if (!formData.studentName) newErrors.studentName = 'Student name is required';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.term) newErrors.term = 'Term is required';
    if (!formData.academicYear) newErrors.academicYear = 'Academic year is required';
    if (!formData.classTeacherComment) newErrors.classTeacherComment = 'Class teacher comment is required';
    if (!formData.classTeacherName) newErrors.classTeacherName = 'Class teacher name is required';

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
      console.log('Saving report comments:', formData);

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
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Termly Report Comments Form
            </h1>
          </div>
          <p className="text-gray-600">
            Generate comprehensive report card comments for student performance
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                <DatePicker
                  value={formData.reportDate}
                  onChange={(date) => handleInputChange('reportDate', date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '')}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Subject-Specific Comments */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subject-Specific Comments</h2>

            {/* Subject Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject.key}
                    type="button"
                    onClick={() => setSelectedSubject(subject.key)}
                    className={`px-4 py-2 border-b-2 font-medium transition-colors ${selectedSubject === subject.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Subject Comment Fields */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Strengths
                  </label>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-gray-500">Click suggestions to insert</span>
                  </div>
                </div>
                <textarea
                  value={formData.subjectComments[selectedSubject].strengths}
                  onChange={(e) => handleSubjectCommentChange(selectedSubject, 'strengths', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe student's strengths in this subject..."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {commentSuggestions.strengths.slice(0, 4).map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertSuggestion(selectedSubject, 'strengths', suggestion)}
                      className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100 border border-green-200"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Areas for Development
                </label>
                <textarea
                  value={formData.subjectComments[selectedSubject].areasForDevelopment}
                  onChange={(e) => handleSubjectCommentChange(selectedSubject, 'areasForDevelopment', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Identify areas where student needs improvement..."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {commentSuggestions.areasForDevelopment.slice(0, 4).map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertSuggestion(selectedSubject, 'areasForDevelopment', suggestion)}
                      className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100 border border-yellow-200"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  General Comment
                </label>
                <textarea
                  value={formData.subjectComments[selectedSubject].generalComment}
                  onChange={(e) => handleSubjectCommentChange(selectedSubject, 'generalComment', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Overall comment about student's performance in this subject..."
                />
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Strengths
                </label>
                <textarea
                  value={formData.academicStrengths}
                  onChange={(e) => handleInputChange('academicStrengths', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Overall academic strengths across subjects..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Weaknesses
                </label>
                <textarea
                  value={formData.academicWeaknesses}
                  onChange={(e) => handleInputChange('academicWeaknesses', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Areas needing improvement across subjects..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Behavior & Conduct
                </label>
                <textarea
                  value={formData.behaviorConduct}
                  onChange={(e) => handleInputChange('behaviorConduct', e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Comment on student's behavior and conduct..."
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance
                  </label>
                  <input
                    type="text"
                    value={formData.attendance}
                    onChange={(e) => handleInputChange('attendance', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Excellent, 95%, Good"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Punctuality
                  </label>
                  <input
                    type="text"
                    value={formData.punctuality}
                    onChange={(e) => handleInputChange('punctuality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Excellent, Good, Needs Improvement"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Comments */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Teacher Comments</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Teacher's Comment *
                </label>
                <textarea
                  value={formData.classTeacherComment}
                  onChange={(e) => handleInputChange('classTeacherComment', e.target.value)}
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.classTeacherComment ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Provide comprehensive comment on student's overall performance, behavior, and development..."
                />
                {errors.classTeacherComment && (
                  <p className="mt-1 text-sm text-red-600">{errors.classTeacherComment}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Head Teacher's Comment
                </label>
                <textarea
                  value={formData.headTeacherComment}
                  onChange={(e) => handleInputChange('headTeacherComment', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Head teacher's overall remarks..."
                />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations & Next Steps</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advice to Parents/Guardians
                </label>
                <textarea
                  value={formData.parentsAdvice}
                  onChange={(e) => handleInputChange('parentsAdvice', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide guidance on how parents can support their child's learning..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goals for Next Term
                </label>
                <textarea
                  value={formData.nextTermGoals}
                  onChange={(e) => handleInputChange('nextTermGoals', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Outline specific goals and targets for the next term..."
                />
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Signatures</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Class Teacher</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.classTeacherName}
                    onChange={(e) => handleInputChange('classTeacherName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${errors.classTeacherName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter teacher name"
                  />
                  {errors.classTeacherName && (
                    <p className="mt-1 text-sm text-red-600">{errors.classTeacherName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <input
                    type="text"
                    value={formData.classTeacherSignature}
                    onChange={(e) => handleInputChange('classTeacherSignature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Type name to sign"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Head Teacher</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.headTeacherName}
                    onChange={(e) => handleInputChange('headTeacherName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter head teacher name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <input
                    type="text"
                    value={formData.headTeacherSignature}
                    onChange={(e) => handleInputChange('headTeacherSignature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Type name to sign"
                  />
                </div>
              </div>

              <div className="space-y-3">
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
                  type="button"
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Preview Report
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400"
                >
                  <Save className="w-4 h-4" />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Comments'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TermlyReportCommentsForm;
