import { fetchWithAuth } from './core';
import axiosInstance from './axiosConfig';

export const subjectAssignmentAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/subject-assignments${queryString ? `?${queryString}` : ''}`);
  },
  create: async (data) =>
    fetchWithAuth('/subject-assignments', { method: 'POST', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/subject-assignments/${id}`, { method: 'DELETE' }),
  getEligibleTeachers: async (learningAreaId, grade) =>
    fetchWithAuth(`/subject-assignments/eligible-teachers?learningAreaId=${learningAreaId}&grade=${grade}`),
};
