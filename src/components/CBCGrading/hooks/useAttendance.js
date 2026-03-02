/**
 * useAttendance Hook
 * Manage attendance tracking and records
 */

import { useState, useCallback, useMemo } from 'react';
import { ATTENDANCE_STATUS } from '../utils/constants';
import { getCurrentDate, getCurrentTime } from '../utils/dateHelpers';
import { calculateAttendancePercentage } from '../utils/gradeCalculations';

export const useAttendance = (initialRecords = []) => {
  const [attendanceRecords, setAttendanceRecords] = useState(initialRecords);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [loading,] = useState(false);

  /**
   * Mark attendance for a learner
   * @param {Object} attendanceData - Attendance data
   * @returns {Object} Result with success flag
   */
  const markAttendance = useCallback((attendanceData) => {
    const {
      learnerId,
      date = selectedDate,
      status,
      reason = '',
      markedBy
    } = attendanceData;

    // Check if attendance already exists for this date and learner
    const existingIndex = attendanceRecords.findIndex(
      record => record.date === date && record.learnerId === learnerId
    );

    const newRecord = {
      id: existingIndex >= 0 ? attendanceRecords[existingIndex].id : Date.now(),
      learnerId,
      date,
      status,
      reason,
      markedBy,
      markedAt: getCurrentTime(),
      createdAt: existingIndex >= 0 ? attendanceRecords[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing record
      setAttendanceRecords(prev =>
        prev.map((record, index) => index === existingIndex ? newRecord : record)
      );
    } else {
      // Add new record
      setAttendanceRecords(prev => [...prev, newRecord]);
    }

    return { success: true, data: newRecord };
  }, [attendanceRecords, selectedDate]);

  /**
   * Mark attendance for multiple learners
   * @param {Array} learners - Array of learners
   * @param {string} date - Date
   * @param {string} defaultStatus - Default status (Present/Absent/Late)
   * @param {string} markedBy - Name of person marking
   * @returns {Object} Result with success flag and count
   */
  const markBulkAttendance = useCallback((learners, date, defaultStatus, markedBy) => {
    const newRecords = learners.map(learner => ({
      id: Date.now() + learner.id,
      learnerId: learner.id,
      date,
      status: defaultStatus,
      reason: '',
      markedBy,
      markedAt: getCurrentTime(),
      createdAt: new Date().toISOString()
    }));

    setAttendanceRecords(prev => {
      // Remove existing records for this date/class
      const filtered = prev.filter(record =>
        record.date !== date || !learners.find(l => l.id === record.learnerId)
      );
      return [...filtered, ...newRecords];
    });

    return { success: true, count: newRecords.length };
  }, []);

  /**
   * Get attendance record for a learner on a specific date
   * @param {number} learnerId - Learner ID
   * @param {string} date - Date
   * @returns {Object|null} Attendance record or null
   */
  const getAttendanceRecord = useCallback((learnerId, date) => {
    return attendanceRecords.find(
      record => record.learnerId === learnerId && record.date === date
    ) || null;
  }, [attendanceRecords]);

  /**
   * Get all attendance records for a learner
   * @param {number} learnerId - Learner ID
   * @returns {Array} Array of attendance records
   */
  const getLearnerAttendance = useCallback((learnerId) => {
    return attendanceRecords.filter(record => record.learnerId === learnerId);
  }, [attendanceRecords]);

  /**
   * Get attendance records for a specific date
   * @param {string} date - Date
   * @returns {Array} Array of attendance records
   */
  const getAttendanceByDate = useCallback((date) => {
    return attendanceRecords.filter(record => record.date === date);
  }, [attendanceRecords]);

  /**
   * Get attendance records within date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Array} Array of attendance records
   */
  const getAttendanceByDateRange = useCallback((startDate, endDate) => {
    return attendanceRecords.filter(record =>
      record.date >= startDate && record.date <= endDate
    );
  }, [attendanceRecords]);

  /**
   * Calculate attendance statistics for a learner
   * @param {number} learnerId - Learner ID
   * @param {string} startDate - Start date (optional)
   * @param {string} endDate - End date (optional)
   * @returns {Object} Attendance statistics
   */
  const calculateLearnerAttendance = useCallback((learnerId, startDate = null, endDate = null) => {
    let records = getLearnerAttendance(learnerId);

    // Filter by date range if provided
    if (startDate && endDate) {
      records = records.filter(record =>
        record.date >= startDate && record.date <= endDate
      );
    }

    const totalDays = records.length;
    const daysPresent = records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
    const daysAbsent = records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;
    const daysLate = records.filter(r => r.status === ATTENDANCE_STATUS.LATE).length;
    const percentage = calculateAttendancePercentage(daysPresent, totalDays);

    return {
      totalDays,
      daysPresent,
      daysAbsent,
      daysLate,
      percentage
    };
  }, [getLearnerAttendance]);

  /**
   * Calculate class attendance for a specific date
   * @param {Array} learnerIds - Array of learner IDs in class
   * @param {string} date - Date
   * @returns {Object} Class attendance statistics
   */
  const calculateClassAttendance = useCallback((learnerIds, date) => {
    const records = attendanceRecords.filter(
      record => record.date === date && learnerIds.includes(record.learnerId)
    );

    const totalLearners = learnerIds.length;
    const markedLearners = records.length;
    const present = records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
    const absent = records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;
    const late = records.filter(r => r.status === ATTENDANCE_STATUS.LATE).length;
    const unmarked = totalLearners - markedLearners;

    return {
      totalLearners,
      markedLearners,
      present,
      absent,
      late,
      unmarked,
      percentagePresent: calculateAttendancePercentage(present, markedLearners)
    };
  }, [attendanceRecords]);

  /**
   * Delete attendance record
   * @param {number} recordId - Record ID
   * @returns {Object} Result with success flag
   */
  const deleteAttendanceRecord = useCallback((recordId) => {
    setAttendanceRecords(prev => prev.filter(record => record.id !== recordId));
    return { success: true };
  }, []);

  /**
   * Delete all attendance records for a date
   * @param {string} date - Date
   * @returns {Object} Result with success flag and count
   */
  const deleteAttendanceByDate = useCallback((date) => {
    const countBefore = attendanceRecords.length;
    setAttendanceRecords(prev => prev.filter(record => record.date !== date));
    const countAfter = attendanceRecords.length;

    return { success: true, count: countBefore - countAfter };
  }, [attendanceRecords]);

  // Computed values
  const todayAttendance = useMemo(() =>
    getAttendanceByDate(getCurrentDate()),
    [getAttendanceByDate]
  );

  const totalRecords = useMemo(() =>
    attendanceRecords.length,
    [attendanceRecords]
  );

  return {
    // State
    attendanceRecords,
    selectedDate,
    selectedClass,
    selectedStream,
    loading,
    todayAttendance,
    totalRecords,

    // Setters
    setAttendanceRecords,
    setSelectedDate,
    setSelectedClass,
    setSelectedStream,

    // Actions
    markAttendance,
    markBulkAttendance,
    getAttendanceRecord,
    getLearnerAttendance,
    getAttendanceByDate,
    getAttendanceByDateRange,
    calculateLearnerAttendance,
    calculateClassAttendance,
    deleteAttendanceRecord,
    deleteAttendanceByDate
  };
};
