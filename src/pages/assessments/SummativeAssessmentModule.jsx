import React, { useState } from 'react';
import { BookOpen, Scale, FileText } from 'lucide-react';
import ScalesManagement from './ScalesManagement';
import SummativeTestForm from './SummativeTestForm';

const SummativeAssessmentModule = () => {
  const [activeView, setActiveView] = useState('scales');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Summative Assessment Module</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage assessment scales and summative tests
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('scales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'scales'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Scale size={18} />
              Scales Management
            </button>

            <button
              onClick={() => setActiveView('tests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'tests'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={18} />
              Create Test
            </button>

            <button
              onClick={() => setActiveView('info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'info'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen size={18} />
              Quick Guide
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-6">
        {activeView === 'scales' && <ScalesManagement />}
        {activeView === 'tests' && <SummativeTestForm />}
        {activeView === 'info' && <QuickGuide />}
      </div>
    </div>
  );
};

const QuickGuide = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Guide</h2>

        <div className="space-y-6">
          {/* Workflow */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
              Workflow Overview
            </h3>
            <div className="ml-10 space-y-2 text-gray-600">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>Step 0 (Optional):</strong> Set up learning areas in Configuration → Learning Areas (if available)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>Step 1:</strong> Create or manage assessment scales in the "Scales Management" tab</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>Step 2:</strong> Switch to "Create Test" tab to design your summative test</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>Step 3:</strong> Select a scale from the dropdown (populated from your scales)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">→</span>
                <span><strong>Step 4:</strong> Add sections and questions to build your test</span>
              </p>
            </div>
          </div>

          {/* Scales Management */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
              Scales Management
            </h3>
            <div className="ml-10 space-y-2 text-gray-600">
              <p><strong>Purpose:</strong> Define grading scales that will be used across all summative tests</p>
              <p><strong>Default Scales:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Competency Scale:</strong> EE, ME, AP, BE (for competency-based assessments)</li>
                <li><strong>Values Scale:</strong> CE, FE, OE, RE (for values assessments)</li>
                <li><strong>Performance Scale:</strong> EX, VG, GO, NI (for co-curricular activities)</li>
              </ul>
              <p className="mt-3"><strong>Custom Scales:</strong> Create scales specific to your needs (e.g., letter grades A-F, percentage ranges)</p>
            </div>
          </div>

          {/* Test Creation */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
              Creating Tests
            </h3>
            <div className="ml-10 space-y-2 text-gray-600">
              <p><strong>Test Information:</strong> Title, subject, grade, term, academic year, date</p>
              <p><strong>Scale Selection:</strong> Choose from available scales (must create scales first)</p>
              <p><strong>Sections:</strong> Organize test into logical sections (e.g., Multiple Choice, Essay Questions)</p>
              <p><strong>Questions:</strong> Add individual questions with marks and marking rubrics</p>
              <p><strong>Validation:</strong> Required fields are marked with (*) and validated on save</p>
            </div>
          </div>

          {/* Data Storage */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</span>
              Data Storage
            </h3>
            <div className="ml-10 space-y-2 text-gray-600">
              <p><strong>Storage Method:</strong> localStorage (data persists across browser sessions)</p>
              <p><strong>Scales Key:</strong> <code className="bg-gray-100 px-2 py-1 rounded">assessment-scales</code></p>
              <p><strong>Tests Key:</strong> <code className="bg-gray-100 px-2 py-1 rounded">summative-tests</code></p>
              <p className="text-amber-700 bg-amber-50 p-3 rounded-lg mt-3">
                <strong>Note:</strong> Data is stored locally in your browser. For production use, integrate with a backend API.
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">5</span>
              Tips & Best Practices
            </h3>
            <div className="ml-10 space-y-2 text-gray-600">
              <ul className="list-disc list-inside space-y-2">
                <li>Create learning areas first to organize your curriculum (in Configuration → Learning Areas)</li>
                <li>Create scales before creating tests - tests require a scale to be selected</li>
                <li>Use descriptive scale names (e.g., "Grade 5 Mathematics Scale" instead of "Scale 1")</li>
                <li>Define clear level descriptions to ensure consistent grading</li>
                <li>Organize test sections logically (e.g., by difficulty or question type)</li>
                <li>Include detailed marking rubrics for each question</li>
                <li>Save frequently - data is only persisted when you click "Save"</li>
                <li>Test forms support all CBC subjects from the dropdown</li>
                <li>Head teachers have access to manage learning areas to structure school curriculum</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummativeAssessmentModule;
