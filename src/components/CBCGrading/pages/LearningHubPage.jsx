/**
 * Learning Hub - Placeholder Page
 * Central hub for all teaching and learning materials
 */

import React from 'react';
import {
  FileText, ClipboardList, BookOpen, FolderOpen,
  Sparkles, CheckCircle, Clock, ArrowRight
} from 'lucide-react';

const LearningHubPage = () => {
  const features = [
    {
      icon: FileText,
      title: 'Class Materials',
      description: 'Upload and share lesson notes, study guides, and reference materials.',
      items: ['PDF, Word, PowerPoint', 'Organize by subject', 'CBC alignment']
    },
    {
      icon: ClipboardList,
      title: 'Assignments',
      description: 'Create assignments with due dates and track student submissions.',
      items: ['Homework & projects', 'Due date tracking', 'Online grading']
    },
    {
      icon: BookOpen,
      title: 'Lesson Plans',
      description: 'Plan lessons with CBC-aligned objectives and activities.',
      items: ['Daily & weekly plans', 'Learning objectives', 'CBC strands']
    },
    {
      icon: FolderOpen,
      title: 'Resource Library',
      description: 'School-wide repository of templates, worksheets, and past papers.',
      items: ['Shared resources', 'Templates', 'Past papers']
    }
  ];

  return (
    <div className="space-y-6">

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Coming Soon</h2>
            <p className="text-blue-100">We're building your complete teaching toolkit</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-sm">
            <CheckCircle size={16} /> Research Complete
          </span>
          <span className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-sm">
            <Clock size={16} /> Launch Q2 2026
          </span>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-l-4 border-blue-500"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <feature.icon size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {feature.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowRight size={14} className="text-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">For Teachers</h4>
          <p className="text-sm text-blue-700">Save time, stay organized, and share resources with colleagues.</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">For Students</h4>
          <p className="text-sm text-green-700">Access materials anytime, submit work digitally, and track assignments.</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-2">For Parents</h4>
          <p className="text-sm text-purple-700">Monitor progress, view materials, and support your child's learning.</p>
        </div>
      </div>

      {/* Active Learning Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">🚀 Coding & Robotics Playground</h2>
            <p className="text-indigo-200 max-w-xl">
              Access the virtual lab to practice Python, Web Development, and Robotics.
              Complete your practical assessments and submit them directly to your teachers.
            </p>
          </div>
          <a
            href="/coding-playground"
            className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
          >
            Launch Playground <ArrowRight size={18} />
          </a>
        </div>
      </div>

      {/* CBC Section */}
      <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">🇰🇪 CBC-Aligned Design</h3>
            <p className="text-sm text-gray-700">
              Designed specifically for Kenya's Competency-Based Curriculum with strand mapping,
              competency tracking, and curriculum coverage reports.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Want to share ideas or learn more? Contact your system administrator.
        </p>
      </div>
    </div>
  );
};

export default LearningHubPage;
