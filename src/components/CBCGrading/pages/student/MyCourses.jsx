/**
 * MyCourses — Student's enrolled courses list with progress bars
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, Search, TrendingUp, CheckCircle } from 'lucide-react';
import axiosInstance from '../../../../services/api/axiosConfig';

const MyCourses = ({ onNavigate }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axiosInstance.get('/lms/my-courses')
      .then(r => setCourses(r.data?.data || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 40) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen size={22} className="text-purple-600" /> My Courses
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
              <div className="h-2 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-600">
            {search ? 'No courses match your search.' : 'You are not enrolled in any courses yet.'}
          </p>
          <p className="text-sm text-gray-400 mt-1">Your teacher will enroll you when courses are available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => {
            const pct = course.progressPercent || 0;
            const done = pct === 100;
            return (
              <div
                key={course.courseId}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group overflow-hidden"
                onClick={() => onNavigate?.('student-course-view', { courseId: course.courseId })}
              >
                {/* Top color strip */}
                <div className={`h-1.5 ${getProgressColor(pct)}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-purple-700 transition-colors truncate">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{course.subject}{course.grade ? ` • ${course.grade}` : ''}</p>
                    </div>
                    {done && <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />}
                  </div>

                  {course.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                  )}

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp size={10} /> Progress
                      </span>
                      <span className="text-xs font-semibold" style={{ color: done ? '#10b981' : '#6b7280' }}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400">{course.completedItems} of {course.totalItems} items complete</p>
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <button className="w-full py-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold uppercase tracking-wider hover:bg-purple-100 transition-colors flex items-center justify-center gap-1">
                    {done ? 'Review Course' : (pct > 0 ? 'Continue' : 'Start')} <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
