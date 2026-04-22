import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, MapPin, Download, Plus, Edit, Trash2, X, Loader2, AlertTriangle, Share2 } from 'lucide-react';
import EmptyState from '../shared/EmptyState';
import { useNotifications } from '../hooks/useNotifications';
import Toast from '../shared/Toast';
import api from '../../../services/api';
import { getCurrentWeekday, isTeacherClockedIn } from '../../../utils/teacherClockIn';
import { generateHighFidelityPDF } from '../../../utils/simplePdfGenerator';

const DEFAULT_TIME_SLOTS = [
  { startTime: '08:00', endTime: '08:45' },
  { startTime: '08:45', endTime: '09:30' },
  { startTime: '09:30', endTime: '10:15' },
  { startTime: '10:15', endTime: '11:00' },
  { startTime: '11:00', endTime: '11:45' },
  { startTime: '11:45', endTime: '12:30' },
  { startTime: '12:30', endTime: '13:15' },
  { startTime: '13:15', endTime: '14:00' },
  { startTime: '14:00', endTime: '14:45' },
  { startTime: '14:45', endTime: '15:30' }
];

const parseTimeToMinutes = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return Number.NaN;

  const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHourMatch) {
    const hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const meridiem = twelveHourMatch[3].toUpperCase();
    let normalizedHours = hours % 12;
    if (meridiem === 'PM') normalizedHours += 12;
    return (normalizedHours * 60) + minutes;
  }

  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    return (hours * 60) + minutes;
  }

  return Number.NaN;
};

const toDisplayTime = (value) => {
  const minutes = parseTimeToMinutes(value);
  if (Number.isNaN(minutes)) return String(value || '').trim();

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;
  return `${hours12}:${String(mins).padStart(2, '0')} ${meridiem}`;
};

const normalizeSlotKeyPart = (value) => {
  const minutes = parseTimeToMinutes(value);
  if (Number.isNaN(minutes)) return String(value || '').trim().toUpperCase();
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const buildSlotKey = (startTime, endTime) => `${normalizeSlotKeyPart(startTime)}-${normalizeSlotKeyPart(endTime)}`;

const buildTimeLine = (startTime, endTime) => `${toDisplayTime(startTime)} - ${toDisplayTime(endTime)}`;

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

  const { showSuccess, showError, showInfo, showToast, toastMessage, toastType, hideNotification } = useNotifications();

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
  const [room, setRoom] = useState('');
  const [lessonDay, setLessonDay] = useState('Monday');
  const [isDownloadingWeekPdf, setIsDownloadingWeekPdf] = useState(false);
  const [isSharingWeekPdf, setIsSharingWeekPdf] = useState(false);

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

  const normalizeGrade = (value) => {
    if (!value) return '';
    return String(value).trim().toUpperCase().replace(/\s+/g, '_');
  };

  const getSelectedClass = () => classes.find((c) => c.id === selectedClassId);

  const getPrefilledTeacherId = (learningAreaId) => {
    if (!learningAreaId) return '';
    const selectedClass = getSelectedClass();
    if (!selectedClass) return '';

    const classGrade = normalizeGrade(selectedClass.grade);
    const assignment = assignments.find((a) => (
      a.learningAreaId === learningAreaId
      && normalizeGrade(a.grade) === classGrade
      && a.active !== false
    ));

    return assignment?.teacherId || selectedClass.teacherId || '';
  };

  const parseTimeLine = (value) => {
    const segments = String(value || '').split('-').map((part) => part.trim());
    if (segments.length < 2 || !segments[0] || !segments[1]) return null;
    return { startTime: segments[0], endTime: segments[1] };
  };

  const getTimeSlotOptions = (day) => {
    const slotMap = new Map();

    DEFAULT_TIME_SLOTS.forEach((slot) => {
      const key = buildSlotKey(slot.startTime, slot.endTime);
      slotMap.set(key, {
        key,
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: buildTimeLine(slot.startTime, slot.endTime)
      });
    });

    (scheduleData[day] || []).forEach((lesson) => {
      const parsed = parseTimeLine(lesson.time);
      if (!parsed) return;
      const key = buildSlotKey(parsed.startTime, parsed.endTime);
      if (!slotMap.has(key)) {
        slotMap.set(key, {
          key,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          label: buildTimeLine(parsed.startTime, parsed.endTime)
        });
      }
    });

    return Array.from(slotMap.values()).sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.startTime);
      const bMinutes = parseTimeToMinutes(b.startTime);
      if (Number.isNaN(aMinutes) || Number.isNaN(bMinutes)) {
        return a.label.localeCompare(b.label);
      }
      return aMinutes - bMinutes;
    });
  };

  const getUsedSlotKeysForDay = (day) => {
    return new Set(
      (scheduleData[day] || [])
        .map((lesson) => parseTimeLine(lesson.time))
        .filter(Boolean)
        .map((slot) => buildSlotKey(slot.startTime, slot.endTime))
    );
  };

  const getNextAvailableSlot = (day, excludeKey = '') => {
    const usedSlotKeys = getUsedSlotKeysForDay(day);
    const options = getTimeSlotOptions(day);
    return options.find((option) => !usedSlotKeys.has(option.key) || option.key === excludeKey) || null;
  };

  useEffect(() => {
    if (selectedClassId !== 'all') {
      fetchClassSchedule(selectedClassId);
    } else {
      // If all, maybe we don't show a master one easily without a dedicated endpoint
      // but let's assume we fetch for all active classes if needed
      setScheduleData({});
    }
  }, [selectedClassId, classes]);

  useEffect(() => {
    if (!isModalOpen || editingLesson || !subjectId || teacherId) return;
    const suggestedTeacherId = getPrefilledTeacherId(subjectId);
    if (suggestedTeacherId) {
      setTeacherId(suggestedTeacherId);
    }
  }, [isModalOpen, editingLesson, subjectId, teacherId, selectedClassId, assignments, classes]);

  const fetchClassSchedule = async (classId) => {
    try {
      const resp = await api.classes.getSchedules(classId);
      const schedules = resp.data || [];
      const selectedClass = classes.find((c) => c.id === classId);
      const classLabel = selectedClass?.name || [selectedClass?.grade, selectedClass?.stream].filter(Boolean).join(' ') || 'N/A';

      // Group by day
      const grouped = schedules.reduce((acc, s) => {
        const day = s.day || 'Monday';
        if (!acc[day]) acc[day] = [];
        acc[day].push({
          id: s.id,
          time: buildTimeLine(s.startTime || '', s.endTime || ''),
          subject: s.learningArea?.name || s.subject,
          subjectId: s.learningAreaId,
          teacherId: s.teacherId,
          teacherName: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : 'Unassigned',
          grade: classLabel,
          room: s.room || 'N/A'
        });
        return acc;
      }, {});

      setScheduleData(grouped);
    } catch (error) {
      showError(`Failed to fetch schedules: ${error.message || String(error)}`);
      console.error(error);
    }
  };

  const openAddModal = () => {
    setEditingLesson(null);
    const nextSlot = getNextAvailableSlot(selectedDay);
    setTimeLine(nextSlot?.label || '');
    setSubjectId('');
    setTeacherId('');
    setRoom('');
    setLessonDay(selectedDay);
    if (!nextSlot) {
      showError(`All configured time slots are used for ${selectedDay}. Please choose another day.`);
    }
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

    const parsedTime = parseTimeLine(timeLine);
    if (!parsedTime) {
      showError('Please provide a valid time block in the format "Start - End"');
      return;
    }

    const selectedSlotKey = buildSlotKey(parsedTime.startTime, parsedTime.endTime);
    const usedSlotKeys = getUsedSlotKeysForDay(lessonDay);
    const editingSlot = editingLesson ? parseTimeLine(editingLesson.time) : null;
    const editingSlotKey = editingSlot ? buildSlotKey(editingSlot.startTime, editingSlot.endTime) : '';

    if (usedSlotKeys.has(selectedSlotKey) && selectedSlotKey !== editingSlotKey) {
      const nextAvailable = getNextAvailableSlot(lessonDay, editingSlotKey);
      if (nextAvailable) {
        setTimeLine(nextAvailable.label);
      }
      showError(`That slot is already booked. ${nextAvailable ? `Next available slot preselected: ${nextAvailable.label}` : 'No more free slots for this day.'}`);
      return;
    }

    if (lessonDay === getCurrentWeekday() && teacherId && !isTeacherClockedIn(teacherId)) {
      showError('Selected tutor is not clocked in for today. Ask the tutor to clock in before booking today\'s lesson.');
      return;
    }

    const selectedSubject = subjects.find((s) => s.id === subjectId);
    if (!selectedSubject?.name) {
      showError('Please select a valid subject');
      return;
    }

    const payload = {
      subject: selectedSubject.name,
      day: lessonDay,
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      learningAreaId: subjectId,
      teacherId: teacherId || null,
      room: room || 'Classroom'
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

  const getWeekPdfFilename = () => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    const classLabel = selectedClass
      ? (selectedClass.name || `${selectedClass.grade || ''}_${selectedClass.stream || ''}`.trim())
      : 'all_classes';
    const safeClass = String(classLabel || 'all_classes').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    return `timetable_week_${safeClass}_${new Date().toISOString().split('T')[0]}.pdf`;
  };

  const handleDownloadWeekPdf = async () => {
    if (isDownloadingWeekPdf || isSharingWeekPdf) return;
    if (viewMode !== 'weekly') {
      showError('Switch to Weekly view to download Week at a Glance PDF.');
      return;
    }

    const hasLessons = Object.values(scheduleData).flat().length > 0;
    if (!hasLessons) {
      showError('No timetable lessons found to export.');
      return;
    }

    try {
      showInfo('Generating Week at a Glance PDF...');
      setIsDownloadingWeekPdf(true);
      const result = await generateHighFidelityPDF('week-at-a-glance-content', getWeekPdfFilename(), {
        action: 'download',
        includeLetterhead: false
      });

      if (result?.success) showSuccess('Week at a Glance downloaded as PDF.');
      else showError(result?.error || 'Failed to download Week at a Glance PDF.');
    } finally {
      setIsDownloadingWeekPdf(false);
    }
  };

  const handleShareWeekPdf = async () => {
    if (isSharingWeekPdf || isDownloadingWeekPdf) return;
    if (viewMode !== 'weekly') {
      showError('Switch to Weekly view to share Week at a Glance PDF.');
      return;
    }

    const hasLessons = Object.values(scheduleData).flat().length > 0;
    if (!hasLessons) {
      showError('No timetable lessons found to share.');
      return;
    }

    try {
      showInfo('Generating Week at a Glance PDF for sharing...');
      setIsSharingWeekPdf(true);
      const fileName = getWeekPdfFilename();
      const result = await generateHighFidelityPDF('week-at-a-glance-content', fileName, {
        action: 'blob',
        includeLetterhead: false
      });

      if (!result?.success || !result?.blob) {
        showError(result?.error || 'Failed to generate PDF for sharing.');
        return;
      }

      const pdfFile = new File([result.blob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: 'Class Timetable - Week at a Glance',
            text: 'Weekly class timetable PDF'
          });
          showSuccess('Week at a Glance shared successfully.');
        } catch (error) {
          if (error?.name !== 'AbortError') {
            showError('Share was not completed.');
          }
        }
        return;
      }

      await generateHighFidelityPDF('week-at-a-glance-content', fileName, { action: 'download', includeLetterhead: false });
      showSuccess('Sharing is not supported on this browser. PDF downloaded instead.');
    } finally {
      setIsSharingWeekPdf(false);
    }
  };

  const scheduleForSelectedDay = scheduleData[selectedDay] || [];
  const isTodaySelected = selectedDay === getCurrentWeekday();
  const daySlotOptions = getTimeSlotOptions(lessonDay);
  const usedSlotKeys = getUsedSlotKeysForDay(lessonDay);
  const editingSlotKey = editingLesson ? (() => {
    const slot = parseTimeLine(editingLesson.time);
    return slot ? buildSlotKey(slot.startTime, slot.endTime) : '';
  })() : '';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        <Loader2 className="animate-spin mb-4 text-brand-purple" size={48} />
        <p className="text-lg font-medium">Synchronizing Timetable...</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition shadow-sm font-medium"
          >
            <Plus size={18} />
            Add Lesson
          </button>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium text-gray-800">Class Timetable</h2>
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
              className={`flex-1 px-6 py-4 text-sm font-semibold uppercase tracking-widest transition-all ${selectedDay === day
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

                    {isTodaySelected && lesson.teacherId && !isTeacherClockedIn(lesson.teacherId) && (
                      <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold">Tutor not clocked in</span>
                      </div>
                    )}
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
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Week at a Glance</h3>
              <p className="text-sm text-gray-600">Your full week schedule overview</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWeekPdf}
                disabled={isSharingWeekPdf || isDownloadingWeekPdf}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSharingWeekPdf ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                {isSharingWeekPdf ? 'Sharing…' : 'Share PDF'}
              </button>
              <button
                onClick={handleDownloadWeekPdf}
                disabled={isDownloadingWeekPdf || isSharingWeekPdf}
                className="flex items-center gap-2 px-3 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloadingWeekPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isDownloadingWeekPdf ? 'Downloading…' : 'Download PDF'}
              </button>
            </div>
          </div>

          <div id="week-at-a-glance-content" className="p-6 overflow-x-auto">
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
                                  <p className="text-xs font-medium text-brand-purple">{lesson.subject}</p>
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
              <h3 className="text-lg font-medium text-gray-900">
                {editingLesson ? 'Edit Lesson' : 'Schedule New Lesson'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day of Week</label>
                <select
                  value={lessonDay}
                  onChange={e => {
                    const nextDay = e.target.value;
                    setLessonDay(nextDay);
                    if (!editingLesson) {
                      const nextSlot = getNextAvailableSlot(nextDay);
                      setTimeLine(nextSlot?.label || '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white"
                >
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Time Block</label>
                <select
                  value={timeLine}
                  onChange={e => setTimeLine(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-purple bg-white"
                  required
                >
                  <option value="">Select Time Slot</option>
                  {daySlotOptions.map((slot) => {
                    const isUsed = usedSlotKeys.has(slot.key) && slot.key !== editingSlotKey;
                    return (
                      <option key={slot.key} value={slot.label} disabled={isUsed}>
                        {slot.label}{isUsed ? ' (Booked)' : ''}
                      </option>
                    );
                  })}
                </select>
                {!editingLesson && !timeLine && (
                  <p className="mt-1 text-xs text-amber-700 font-medium">No free slots available for this day. Choose another day.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setSubjectId(sid);
                      const suggestedTeacherId = getPrefilledTeacherId(sid);
                      setTeacherId(suggestedTeacherId);
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
              {lessonDay === getCurrentWeekday() && teacherId && !isTeacherClockedIn(teacherId) && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
                  Selected tutor has not clocked in today. This booking cannot be saved until the tutor clocks in.
                </div>
              )}
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 bg-white border border-gray-200 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 font-medium shadow-sm">
                  {editingLesson ? 'Save Changes' : 'Add to Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={hideNotification}
      />
    </div>
  );
};

export default TimetablePage;
