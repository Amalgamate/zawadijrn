import { fetchWithAuth, fetchCached, cachedFetch, cacheDel, cacheDelPrefix, TTL } from './core';
import axiosInstance from './axiosConfig';

export const gradingAPI = {
  getSystems: async () =>
    cachedFetch('grading:systems', () => fetchWithAuth('/grading/systems'), TTL.LONG),
  createSystem: async (data) => {
    cacheDel('grading:systems');
    return fetchWithAuth('/grading/system', { method: 'POST', body: JSON.stringify(data) });
  },
  updateSystem: async (id, data) => {
    cacheDel('grading:systems');
    return fetchWithAuth(`/grading/system/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteSystem: async (id) => {
    cacheDel('grading:systems');
    return fetchWithAuth(`/grading/system/${id}`, { method: 'DELETE' });
  },
  updateRange: async (id, data) => {
    cacheDel('grading:systems');
    return fetchWithAuth(`/grading/range/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  createRange: async (data) => {
    cacheDel('grading:systems');
    return fetchWithAuth('/grading/range', { method: 'POST', body: JSON.stringify(data) });
  },
  deleteRange: async (id) => {
    cacheDel('grading:systems');
    return fetchWithAuth(`/grading/range/${id}`, { method: 'DELETE' });
  },
  getScaleGroups: async () =>
    cachedFetch('grading:scale-groups', () => fetchWithAuth('/grading/scale-groups'), TTL.LONG),
  getScaleGroupById: async (id) => fetchWithAuth(`/grading/scale-groups/${id}`),
  createScaleGroup: async (data) => {
    cacheDel('grading:scale-groups');
    return fetchWithAuth('/grading/scale-groups', { method: 'POST', body: JSON.stringify(data) });
  },
  updateScaleGroup: async (id, data) => {
    cacheDel('grading:scale-groups');
    return fetchWithAuth(`/grading/scale-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteScaleGroup: async (id, params = {}) => {
    cacheDel('grading:scale-groups');
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/grading/scale-groups/${id}${queryString ? `?${queryString}` : ''}`, { method: 'DELETE' });
  },
  generateGradesForGroup: async (id, data) =>
    fetchWithAuth(`/grading/scale-groups/${id}/generate-grades`, { method: 'POST', body: JSON.stringify(data) }),
  getScaleForTest: async (groupId, grade, learningArea) => {
    const params = new URLSearchParams({ grade });
    if (learningArea) params.append('learningArea', learningArea);
    return fetchWithAuth(`/grading/scale-groups/${groupId}/for-test?${params.toString()}`);
  },
  createTestsForScales: async (data) =>
    fetchWithAuth('/assessments/setup/create-tests', { method: 'POST', body: JSON.stringify(data) }),
  createScalesForSchool: async (data = {}) =>
    fetchWithAuth('/assessments/setup/create-scales', { method: 'POST', body: JSON.stringify(data) }),
  completeSchoolSetup: async (data) =>
    fetchWithAuth('/assessments/setup/complete', { method: 'POST', body: JSON.stringify(data) }),
};
