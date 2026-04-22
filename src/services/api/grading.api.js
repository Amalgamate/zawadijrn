import { fetchWithAuth, cachedFetch, cacheDel, cacheDelPrefix, TTL } from './core';
import axiosInstance from './axiosConfig';

const institutionCacheKeySuffix = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'PRIMARY_CBC';
    const u = JSON.parse(raw);
    return u?.institutionType || 'PRIMARY_CBC';
  } catch {
    return 'PRIMARY_CBC';
  }
};

export const gradingAPI = {
  getSystems: async () =>
    cachedFetch(`grading:systems:${institutionCacheKeySuffix()}`, () => fetchWithAuth('/grading/systems'), TTL.LONG),
  createSystem: async (data) => {
    cacheDelPrefix('grading:systems:');
    return fetchWithAuth('/grading/system', { method: 'POST', body: JSON.stringify(data) });
  },
  updateSystem: async (id, data) => {
    cacheDelPrefix('grading:systems:');
    return fetchWithAuth(`/grading/system/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteSystem: async (id) => {
    cacheDelPrefix('grading:systems:');
    return fetchWithAuth(`/grading/system/${id}`, { method: 'DELETE' });
  },
  updateRange: async (id, data) => {
    cacheDelPrefix('grading:systems:');
    return fetchWithAuth(`/grading/range/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  createRange: async (data) => {
    cacheDelPrefix('grading:systems:');
    return fetchWithAuth('/grading/range', { method: 'POST', body: JSON.stringify(data) });
  },
  deleteRange: async (id) => {
    cacheDelPrefix('grading:systems:');
    return fetchWithAuth(`/grading/range/${id}`, { method: 'DELETE' });
  },
  getScaleGroups: async () =>
    cachedFetch(`grading:scale-groups:${institutionCacheKeySuffix()}`, () => fetchWithAuth('/grading/scale-groups'), TTL.LONG),
  getScaleGroupById: async (id) => fetchWithAuth(`/grading/scale-groups/${id}`),
  createScaleGroup: async (data) => {
    cacheDelPrefix('grading:scale-groups:');
    return fetchWithAuth('/grading/scale-groups', { method: 'POST', body: JSON.stringify(data) });
  },
  updateScaleGroup: async (id, data) => {
    cacheDelPrefix('grading:scale-groups:');
    return fetchWithAuth(`/grading/scale-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteScaleGroup: async (id, params = {}) => {
    cacheDelPrefix('grading:scale-groups:');
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
