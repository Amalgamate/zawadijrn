import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const attendanceAPI = {
  mark: async (attendanceData) =>
    fetchWithAuth('/attendance', { method: 'POST', body: JSON.stringify(attendanceData) }),
  markBulk: async (bulkData) =>
    fetchWithAuth('/attendance/bulk', { method: 'POST', body: JSON.stringify(bulkData) }),
  getRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance${queryString ? `?${queryString}` : ''}`);
  },
  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance/stats${queryString ? `?${queryString}` : ''}`);
  },
  getDailyClassReport: async (classId, date) =>
    fetchWithAuth(`/attendance/class/daily?classId=${classId}&date=${date}`),
  getLearnerSummary: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
};
