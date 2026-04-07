import React from 'react';
import { BookOpen, PlayCircle, Clock, Award, Star } from 'lucide-react';

const LMSCourses = () => {
  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end bg-brand-purple p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
          <BookOpen size={200} className="-mr-10 -mt-10" />
        </div>
        <div className="relative z-10 w-full relative">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Learning Management System</h1>
            <p className="text-purple-100 max-w-2xl">
              Create, manage, and track digital courses. Empower your students with interactive learning materials, assignments, and real-time progress tracking.
            </p>
            <div className="mt-6 flex gap-4">
                <button className="bg-white text-brand-purple px-6 py-2.5 rounded-lg font-bold shadow hover:bg-gray-50 transition-colors">
                    Create New Course
                </button>
                <button className="bg-purple-700/50 hover:bg-purple-600/50 border border-purple-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                    Browse Template Library
                </button>
            </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={24} /></div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-800">12</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg"><PlayCircle size={24} /></div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-800">438</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock size={24} /></div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Avg Completion Time</p>
                  <p className="text-2xl font-bold text-gray-800">14d</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Award size={24} /></div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Certificates Issued</p>
                  <p className="text-2xl font-bold text-gray-800">89</p>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400 shadow-inner">
              <Star size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No Courses Created Yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
              Get started by creating your first course. You can add video lessons, quizzes, reading materials, and interactive assignments.
          </p>
      </div>
    </div>
  );
};

export default LMSCourses;
