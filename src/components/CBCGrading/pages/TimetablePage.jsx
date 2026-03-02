import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, MapPin, Users, Download, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import { useNotifications } from '../hooks/useNotifications';
import api from '../../../services/api';

const TimetablePage = () => {
  const [selectedDay, setSelectedDay] = useState(() => {
    return localStorage.getItem('cbc_timetable_selected_day') || 'Monday';
  });

  useEffect(() => {
    localStorage.setItem('cbc_timetable_selected_day', selectedDay);
  }, [selectedDay]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState(() => {
    return localStorage.getItem('cbc_timetable_selected_class') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('cbc_timetable_selected_class', selectedClassId);
  }, [selectedClassId]);

  const { showSuccess, showError } = useNotifications();

  // Form state
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('cbc_timetable_view_mode') || 'weekly';
  });

  useEffect(() => {
    localStorage.setItem('cbc_timetable_view_mode', viewMode);
  }, [viewMode]);
  const [timeLine, setTimeLine] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [grade, setGrade] = useState('');
  const [room, setRoom] = useState('');
  const [lessonDay, setLessonDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classesResp, teachersResp, subjectsResp, assignmentsResp] = await Promise.all([
        api.classes.getAll(),
        api.teachers.getAll(),
        api.config.getLearningAreas(),
        api.subjectAssignments.getAll()
      ]);

      const classesData = classesResp.data || [];
      setClasses(classesData);
      setTeachers(teachersResp.data || []);
      setSubjects(subjectsResp.data || []);
      setAssignments(assignmentsResp.data || []);

      if (classesData.length > 0) {
        // Option to view all or specific class
        // setSelectedClassId('all'); 
      }
    } catch (error) {
      showError('Failed to load timetable data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [scheduleData, setScheduleData] = useState({});

  useEffect(() => {
    if (selectedClassId !== 'all') {
      fetchClassSchedule(selectedClassId);
    } else {
      // If all, maybe we don't show a master one easily without a dedicated endpoint
      // but let's assume we fetch for all active classes if needed
      setScheduleData({});
    }
  }, [selectedClassId]);

  const fetchClassSchedule = async (classId) => {
    try {
      const resp = await api.classes.getSchedules(classId);
      const schedules = resp.data || [];

      // Group by day
      const grouped = schedules.reduce((acc, s) => {
        const day = s.dayOfWeek || 'Monday';
        if (!acc[day]) acc[day] = [];
        acc[day].push({
          id: s.id,
          time: s.timeSlot,
          subject: s.learningArea?.name || s.subject,
          subjectId: s.learningAreaId,
          teacherId: s.teacherId,
          teacherName: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : 'Unassigned',
          grade: s.class?.name || 'N/A',
          room: s.location || 'N/A'
        });
        return acc;
      }, {});

      setScheduleData(grouped);
    } catch (error) {
      showError('Failed to fetch schedules');
    }
  };

  const openAddModal = () => {
    setEditingLesson(null);
    setTimeLine('8:00 AM - 9:30 AM');
    setSubjectId('');
    setTeacherId('');
    setGrade('');
    setRoom('');
    setLessonDay(selectedDay);
    setIsModalOpen(true);
  };

  const openEditModal = (lesson, day) => {
    setEditingLesson(lesson);
    setTimeLine(lesson.time);
    setSubjectId(lesson.subjectId || '');
    setTeacherId(lesson.teacherId || '');
    setRoom(lesson.room || '');
    setLessonDay(day);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, day) => {
    if (!selectedClassId || selectedClassId === 'all') return;
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      try {
        await api.classes.deleteSchedule(selectedClassId, id);
        showSuccess("Lesson deleted successfully");
        fetchClassSchedule(selectedClassId);
      } catch (error) {
        showError("Failed to delete lesson");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!timeLine || !subjectId || !selectedClassId || selectedClassId === 'all') {
      showError("Please select a Class, Subject and Time");
      return;
    }

    const payload = {
      dayOfWeek: lessonDay,
      timeSlot: timeLine,
      learningAreaId: subjectId,
      teacherId: teacherId || null,
      location: room || 'Classroom'
    };

    try {
      if (editingLesson) {
        await api.classes.updateSchedule(selectedClassId, editingLesson.id, payload);
        showSuccess("Lesson updated successfully");
      } else {
        await api.classes.addSchedule(selectedClassId, payload);
        showSuccess("Lesson scheduled successfully");
      }
      fetchClassSchedule(selectedClassId);
      setIsModalOpen(false);
    } catch (error) {
      showError(error.message || "Failed to save lesson");
    }
  };

  const scheduleForSelectedDay = scheduleData[selectedDay] || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        <Loader2 className="animate-spin mb-4 text-brand-purple" size={48} />
        <p className="text-lg font-bold">Synchronizing Timetable...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Download size={18} />
            Export Config
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition shadow-sm font-bold"
          >
            <Plus size={18} />
            Add Lesson
          </button>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Class Timetable</h2>
          <p className="text-sm text-gray-500">Manage daily schedules and room allocations interactively</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 mr-2"
            >
              <option value="all">Master View (Select a Class)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name || `${c.grade} ${c.stream}`}</option>
              ))}
            </select>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'weekly' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'daily' ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Daily
            </button>
          </div>
        </div>
      </div>

      {/* Daily View - Details */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Manage Schedule</h3>
          <p className="text-sm text-gray-600">Click Add Lesson or Edit to modify the timetable</p>
        </div>

        {/* Day Selector */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all ${selectedDay === day
                ? 'bg-brand-purple/5 text-brand-purple border-b-2 border-brand-purple'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule for Selected Day */}
        <div className="p-6">
          {scheduleForSelectedDay.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Classes Scheduled"
              message={`No classes scheduled for ${selectedDay}`}
            />
          ) : (
            <div className="space-y-3">
              {scheduleForSelectedDay.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-purple/30 hover:bg-brand-purple/5 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Time */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <div className="p-2 bg-brand-teal/10 rounded-lg">
                        <Clock className="w-5 h-5 text-brand-teal" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{lesson.time}</p>
                        <p className="text-xs text-gray-500">Scheduled Time</p>
                      </div>
                    </div>

                    {/* Subject & Grade */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <div className="p-2 bg-brand-purple/10 rounded-lg">
                        <BookOpen className="w-5 h-5 text-brand-purple" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{lesson.subject}</p>
                        <p className="text-xs text-brand-purple font-medium">{lesson.grade}</p>
                      </div>
                    </div>

                    {/* Room */}
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-teal/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-brand-teal" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{lesson.room}</p>
                        <p className="text-xs text-gray-500">Location</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(lesson, selectedDay)}
                      className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-lg transition"
                      title="Edit Lesson"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id, selectedDay)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove Lesson"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Overview Grid */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Week at a Glance</h3>
            <p className="text-sm text-gray-600">Your full week schedule overview</p>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-700 w-32">Time Block</th>
                  {days.map((day) => (
                    <th key={day} className="border border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-700 min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Generate time slots based on existing times across all days */}
                {Array.from(new Set(Object.values(scheduleData).flat().map(l => l.time))).sort().map(timeSlot => (
                  <tr key={timeSlot}>
                    <td className="border border-gray-200 px-4 py-3 text-xs font-medium text-gray-700 bg-gray-50">
                      {timeSlot}
                    </td>
                    {days.map((day) => {
                      const lessons = scheduleData[day]?.filter(l => l.time === timeSlot) || [];
                      return (
                        <td key={day} className="border border-gray-200 px-2 py-2">
                          {lessons.length > 0 ? (
                            <div className="space-y-2">
                              {lessons.map(lesson => (
                                <div key={lesson.id} className="bg-brand-purple/5 border border-brand-purple/10 rounded p-2 hover:bg-brand-purple/10 cursor-pointer" onClick={() => { setSelectedDay(day); openEditModal(lesson, day); }}>
                                  <p className="text-xs font-bold text-brand-purple">{lesson.subject}</p>
                                  <p className="text-[10px] text-brand-purple/80">{lesson.teacherName} • {lesson.room}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-300 text-xs italic">Open</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Adding/Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingLesson ? 'Edit Lesson' : 'Schedule New Lesson'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day of Week</label>
                <select value={lessonDay} onChange={e => setLessonDay(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Time Block</label>
                <input type="text" value={timeLine} onChange={e => setTimeLine(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" placeholder="e.g. 8:00 AM - 9:30 AM" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setSubjectId(sid);
                      // Auto-suggest teacher
                      const matchingClass = classes.find(c => c.id === selectedClassId);
                      const assignment = assignments.find(a => a.learningAreaId === sid && (a.grade === matchingClass?.grade || a.grade === 'all'));
                      if (assignment) {
                        setTeacherId(assignment.teacherId);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.gradeLevel})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tutor</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white"
                  >
                    <option value="">Select Tutor (Optional)</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Room/Location</label>
                <input type="text" value={room} onChange={e => setRoom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple" placeholder="e.g. Room 101" />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 bg-white border border-gray-200 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 font-bold shadow-sm">
                  {editingLesson ? 'Save Changes' : 'Add to Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
