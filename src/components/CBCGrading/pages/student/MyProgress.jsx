/**
 * MyProgress — Per-course completion breakdown for students
 */
import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, CheckCircle, Circle, Video, FileText, Link2, Music, Download } from 'lucide-react';
import axiosInstance from '../../../../services/api/axiosConfig';

const TYPE_ICONS = {
  VIDEO:    { icon: Video,    color: 'text-blue-500' },
  PDF:      { icon: FileText, color: 'text-red-500' },
  LINK:     { icon: Link2,    color: 'text-purple-500' },
  AUDIO:    { icon: Music,    color: 'text-emerald-500' },
  DOCUMENT: { icon: Download, color: 'text-amber-500' },
};

const ProgressRing = ({ percent, size = 80, stroke = 8 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? '#10b981' : percent >= 40 ? '#3b82f6' : '#f59e0b';
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" transform={`rotate(90, ${size/2}, ${size/2})`}
        style={{ fontSize: size * 0.22, fontWeight: 900, fill: color }}>
        {percent}%
      </text>
    </svg>
  );
};

const MyProgress = ({ onNavigate }) => {
  const [courses, setCourses] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    axiosInstance.get('/lms/my-courses')
      .then(r => setCourses(r.data?.data || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (courseId) => {
    if (expanded === courseId) { setExpanded(null); return; }
    setExpanded(courseId);
    if (details[courseId]) return;
    setLoadingDetail(true);
    try {
      const r = await axiosInstance.get(`/lms/my-courses/${courseId}`);
      setDetails(prev => ({ ...prev, [courseId]: r.data?.data }));
    } catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  };

  const overallProgress = courses.length
    ? Math.round(courses.reduce((s, c) => s + (c.progressPercent || 0), 0) / courses.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-purple-600" /> My Progress
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your completion across all enrolled courses</p>
        </div>
      </div>

      {/* Overall summary card */}
      {!loading && courses.length > 0 && (
        <div className="bg-gradient-to-r from-[#520050] to-purple-700 rounded-xl p-6 text-white flex items-center gap-6">
          <ProgressRing percent={overallProgress} size={90} stroke={9} />
          <div>
            <p className="text-purple-200 text-xs font-bold uppercase tracking-widest">Overall Progress</p>
            <p className="text-2xl font-black mt-1">{overallProgress}% Complete</p>
            <p className="text-purple-100 text-sm mt-1">
              {courses.reduce((s, c) => s + (c.completedItems || 0), 0)} of {courses.reduce((s, c) => s + (c.totalItems || 0), 0)} items done across {courses.length} course{courses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Per-course breakdown */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-20" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-500">No courses enrolled yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => {
            const pct = course.progressPercent || 0;
            const isOpen = expanded === course.courseId;
            const courseDetail = details[course.courseId];

            return (
              <div key={course.courseId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Course row */}
                <button
                  onClick={() => toggleExpand(course.courseId)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <ProgressRing percent={pct} size={56} stroke={6} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-400">{course.subject}{course.grade ? ` • ${course.grade}` : ''}</p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-gray-500">{course.completedItems}/{course.totalItems}</p>
                    <p className="text-[10px] text-gray-400">items done</p>
                    <button
                      onClick={e => { e.stopPropagation(); onNavigate?.('student-course-view', { courseId: course.courseId }); }}
                      className="mt-1 text-[10px] font-black text-purple-600 uppercase tracking-wider hover:underline"
                    >
                      Open Course
                    </button>
                  </div>
                </button>

                {/* Expanded content list */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {loadingDetail && !courseDetail ? (
                      <div className="p-4 text-center text-xs text-gray-400">Loading content…</div>
                    ) : courseDetail?.contentItems?.length > 0 ? (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Content Item</th>
                            <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                            <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {courseDetail.contentItems.map((item, idx) => {
                            const meta = TYPE_ICONS[item.contentType] || TYPE_ICONS.DOCUMENT;
                            const Icon = meta.icon;
                            return (
                              <tr key={item.id} className="hover:bg-white transition-colors">
                                <td className="px-5 py-2.5 text-xs font-medium text-gray-700">
                                  {idx + 1}. {item.title}
                                </td>
                                <td className="px-5 py-2.5">
                                  <span className={`flex items-center gap-1 text-[10px] font-black uppercase ${meta.color}`}>
                                    <Icon size={11} /> {item.contentType}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5">
                                  {item.completed ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                                      <CheckCircle size={12} /> Done
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-gray-400">
                                      <Circle size={12} /> Not started
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-400">No content items in this course yet.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProgress;
