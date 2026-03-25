import { fetchWithAuth, fetchCached, cachedFetch, cacheDel, cacheDelPrefix, TTL } from './core';
import axiosInstance from './axiosConfig';

export const classAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/classes${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => fetchWithAuth(`/classes/${id}`),
  create: async (classData) =>
    fetchWithAuth('/classes', { method: 'POST', body: JSON.stringify(classData) }),
  update: async (id, classData) =>
    fetchWithAuth(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(classData) }),
  enrollLearner: async (classId, learnerId) =>
    fetchWithAuth('/classes/enroll', { method: 'POST', body: JSON.stringify({ classId, learnerId }) }),
  unenrollLearner: async (classId, learnerId) =>
    fetchWithAuth('/classes/unenroll', { method: 'POST', body: JSON.stringify({ classId, learnerId }) }),
  getLearnerClass: async (learnerId) => fetchWithAuth(`/classes/learner/${learnerId}`),
  assignTeacher: async (classId, teacherId) =>
    fetchWithAuth('/classes/assign-teacher', { method: 'POST', body: JSON.stringify({ classId, teacherId }) }),
  unassignTeacher: async (classId) =>
    fetchWithAuth('/classes/unassign-teacher', { method: 'POST', body: JSON.stringify({ classId }) }),
  getTeacherWorkload: async (teacherId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const key = `teacher-workload:${teacherId}:${queryString}`;
    return cachedFetch(
      key,
      () => fetchWithAuth(`/classes/teacher/${teacherId}/workload${queryString ? `?${queryString}` : ''}`),
      TTL.MEDIUM
    );
  },
  getTeacherSchedules: async (teacherId) => fetchWithAuth(`/classes/teacher/${teacherId}/schedules`),
  getSchedules: async (classId) => fetchWithAuth(`/classes/${classId}/schedules`),
  addSchedule: async (classId, data) =>
    fetchWithAuth(`/classes/${classId}/schedules`, { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: async (classId, scheduleId, data) =>
    fetchWithAuth(`/classes/${classId}/schedules/${scheduleId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: async (classId, scheduleId) =>
    fetchWithAuth(`/classes/${classId}/schedules/${scheduleId}`, { method: 'DELETE' }),
};
