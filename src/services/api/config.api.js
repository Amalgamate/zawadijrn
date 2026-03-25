import { fetchWithAuth, fetchCached, cachedFetch, cacheDel, cacheDelPrefix, TTL } from './core';
import axiosInstance from './axiosConfig';

export const configAPI = {
  getTermConfigs: async () => fetchWithAuth('/config/term'),
  upsertTermConfig: async (data) =>
    fetchWithAuth('/config/term', { method: 'POST', body: JSON.stringify(data) }),
  updateTermConfig: async (id, data) =>
    fetchWithAuth(`/config/term/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getAggregationConfigs: async () => fetchCached('/config/aggregation'),
  createAggregationConfig: async (data) =>
    fetchWithAuth('/config/aggregation', { method: 'POST', body: JSON.stringify(data) }),
  updateAggregationConfig: async (id, data) =>
    fetchWithAuth(`/config/aggregation/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAggregationConfig: async (id) =>
    fetchWithAuth(`/config/aggregation/${id}`, { method: 'DELETE' }),

  getStreamConfigs: async () =>
    cachedFetch('config:streams', () => fetchWithAuth('/config/streams'), TTL.LONG),
  upsertStreamConfig: async (data) => {
    cacheDel('config:streams');
    return fetchWithAuth('/config/streams', { method: 'POST', body: JSON.stringify(data) });
  },
  deleteStreamConfig: async (id) => {
    cacheDel('config:streams');
    return fetchWithAuth(`/config/streams/${id}`, { method: 'DELETE' });
  },

  getGrades: async () =>
    cachedFetch('config:grades', () => fetchWithAuth('/config/grades'), TTL.VERY_LONG),

  getBranding: async () => fetchWithAuth('/schools/public/branding'),

  getLearningAreas: async () =>
    cachedFetch('config:learning-areas', () => fetchWithAuth('/learning-areas'), TTL.LONG),
  getLearningArea: async (id) => fetchWithAuth(`/learning-areas/${id}`),
  createLearningArea: async (data) => {
    cacheDel('config:learning-areas');
    return fetchWithAuth('/learning-areas', { method: 'POST', body: JSON.stringify(data) });
  },
  updateLearningArea: async (id, data) => {
    cacheDel('config:learning-areas');
    return fetchWithAuth(`/learning-areas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteLearningArea: async (id) => {
    cacheDel('config:learning-areas');
    return fetchWithAuth(`/learning-areas/${id}`, { method: 'DELETE' });
  },
  seedLearningAreas: async () => {
    cacheDel('config:learning-areas');
    return fetchWithAuth('/learning-areas/seed/default', { method: 'POST' });
  },

  seedClasses: async () => fetchWithAuth('/config/classes/seed', { method: 'POST' }),
  seedStreams: async () => {
    cacheDel('config:streams');
    return fetchWithAuth('/config/streams/seed', { method: 'POST' });
  },

  getClasses: async () => fetchWithAuth('/config/classes'),
  upsertClass: async (data) =>
    fetchWithAuth('/config/classes', { method: 'POST', body: JSON.stringify(data) }),
  deleteClass: async (id) =>
    fetchWithAuth(`/config/classes/${id}`, { method: 'DELETE' }),
};
