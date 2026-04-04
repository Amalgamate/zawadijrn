/**
 * Student Dashboard — Portal for STUDENT role
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, ClipboardList, TrendingUp, Bell, ChevronRight, PlayCircle, Calendar, Clock, GraduationCap } from 'lucide-react';
import axiosInstance from '../../../../services/api/axiosConfig';

const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass = 'text-gray-400', onClick }) => (
  <div onClick={onClick} className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-purple-300 transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}`}>
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 bg-gray-50 rounded-md ${colorClass}`}><Icon size={18} /></div>
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
    <h3 className="text-xl font-black text-gray-900 mt-1">{value}</h3>
    {subtitle && <p className="text-[10px] text-gray-500 mt-1 font-medium">{subtitle}</p>}
  </div>
);

const StudentDashboard = ({ user, onNavigate }) => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, assignRes] = await Promise.allSettled([
          axiosInstance.get('/lms/my-courses'),
          axiosInstance.get('/lms/my-assignments'),
        ]);
        if (courseRes.status === 'fulfilled') setCourses(courseRes.value.data?.data || []);
        if (assignRes.status === 'fulfilled') setAssignments(assignRes.value.data?.data || []);
      } catch (e) {
        console.error('StudentDashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dueSoon = assignments.filter(a => !a.submission && a.dueDate && new Date(a.dueDate) > new Date());
  const overallProgress = courses.length ? Math.round(courses.reduce((s, c) => s + (c.progressPercent || 0), 0) / courses.length) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#520050] to-purple-700 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none"><GraduationCap size={200} /></div>
        <div className="relative z-10">
          <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-2xl font-black tracking-tight mb-1">{user?.firstName || 'Student'}</h1>
          <p className="text-purple-100 text-sm mt-2">
            You have <strong>{dueSoon.length}</strong> assignment{dueSoon.length !== 1 ? 's' : ''} due soon.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Courses Enrolled" value={loading ? '…' : courses.length} subtitle="Active courses" icon={BookOpen} colorClass="text-blue-500" onClick={() => onNavigate?.('student-courses')} />
        <MetricCard title="Due Soon" value={loading ? '…' : dueSoon.length} subtitle="Pending submissions" icon={ClipboardList} colorClass="text-amber-500" onClick={() => onNavigate?.('student-assignments')} />
        <MetricCard title="Overall Progress" value={loading ? '…' : `${overallProgress}%`} subtitle="Across all courses" icon={TrendingUp} colorClass="text-emerald-500" onClick={() => onNavigate?.('student-progress')} />
        <MetricCard title="Notices" value="📢" subtitle="Tap to view" icon={Bell} colorClass="text-indigo-500" onClick={() => onNavigate?.('comm-notices')} />
      </div>

      {/* My Courses strip */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <PlayCircle size={14} className="text-purple-600" /> My Courses
          </h3>
          <button onClick={() => onNavigate?.('student-courses')} className="text-purple-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
            View All <ChevronRight size={12} />
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading your courses…</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">You are not enrolled in any courses yet.</p>
            <p className="text-xs text-gray-400 mt-1">Ask your teacher to enroll you.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {courses.slice(0, 3).map(course => (
              <div key={course.courseId} className="px-6 py-4 flex items-center gap-4 hover:bg-purple-50/30 cursor-pointer transition-colors" onClick={() => onNavigate?.('student-course-view', { courseId: course.courseId })}>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{course.title}</p>
                  <p className="text-xs text-gray-400">{course.subject}{course.grade ? ` • ${course.grade}` : ''}</p>
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[200px]">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${course.progressPercent || 0}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-emerald-600">{course.progressPercent || 0}%</span>
                  <p className="text-[10px] text-gray-400">{course.completedItems}/{course.totalItems} done</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Due soon */}
      {!loading && dueSoon.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-amber-500" /> Due Soon
            </h3>
            <button onClick={() => onNavigate?.('student-assignments')} className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {dueSoon.slice(0, 3).map(a => (
              <div key={a.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.course?.title} • {a.totalPoints} pts</p>
                </div>
                <p className="text-xs font-bold text-amber-600 flex items-center gap-1 flex-shrink-0">
                  <Calendar size={11} />
                  {new Date(a.dueDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
