import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';
import { userAPI } from './user.api';

export const parentAPI = {
  getAll: async (params = {}) => userAPI.getByRole('PARENT', params),
  create: async (parentData) => userAPI.create({ ...parentData, role: 'PARENT' }),
  update: async (id, parentData) => userAPI.update(id, parentData),
  archive: async (id) => userAPI.archive(id),
  unarchive: async (id) => userAPI.unarchive(id),
  delete: async (id) => userAPI.delete(id),
};
