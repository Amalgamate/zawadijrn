import { fetchWithAuth, fetchCached, cachedFetch, cacheDel, cacheDelPrefix, TTL } from './core';
import axiosInstance from './axiosConfig';
import { communicationAPI } from './communication.api';

export const learnerAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `learners:${queryString}`;
    return cachedFetch(
      cacheKey,
      () => fetchWithAuth(`/learners${queryString ? `?${queryString}` : ''}`),
      TTL.SHORT
    );
  },
  getStats: async () => fetchWithAuth('/learners/stats'),
  getNextAdmissionNumber: async () => fetchWithAuth('/learners/next-admission-number'),
  getById: async (id) => fetchWithAuth(`/learners/${id}`),
  getByAdmissionNumber: async (admissionNumber) =>
    fetchWithAuth(`/learners/admission/${admissionNumber}`),
  getByGrade: async (grade, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/learners/grade/${grade}${queryString ? `?${queryString}` : ''}`);
  },
  getParentChildren: async (parentId) => fetchWithAuth(`/learners/parent/${parentId}`),
  create: async (learnerData) => {
    cacheDelPrefix('learners:');
    return fetchWithAuth('/learners', { method: 'POST', body: JSON.stringify(learnerData) });
  },
  update: async (id, learnerData) => {
    cacheDelPrefix('learners:');
    return fetchWithAuth(`/learners/${id}`, { method: 'PUT', body: JSON.stringify(learnerData) });
  },
  delete: async (id) => {
    cacheDelPrefix('learners:');
    return fetchWithAuth(`/learners/${id}`, { method: 'DELETE' });
  },
  uploadPhoto: async (id, photoData) =>
    fetchWithAuth(`/learners/${id}/photo`, { method: 'POST', body: JSON.stringify({ photoData }) }),
  transferOut: async (transferData) =>
    fetchWithAuth('/learners/transfer-out', { method: 'POST', body: JSON.stringify(transferData) }),
  bulkPromote: async (promotionData) => {
    cacheDelPrefix('learners:');
    return fetchWithAuth('/learners/bulk-promote', { method: 'POST', body: JSON.stringify(promotionData) });
  },
  getBirthdays: async () => communicationAPI.getBirthdaysToday(),
};
