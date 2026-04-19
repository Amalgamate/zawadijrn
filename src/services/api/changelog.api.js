import { fetchWithAuth } from './core';

export const changelogAPI = {
  /** All published changelog entries (every authenticated user) */
  getAll: () => fetchWithAuth('/changelogs'),

  /** All entries including drafts — SUPER_ADMIN only */
  getAllAdmin: () => fetchWithAuth('/changelogs/all'),

  /** Create a new changelog entry — SUPER_ADMIN only */
  create: (data) =>
    fetchWithAuth('/changelogs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Update a changelog entry — SUPER_ADMIN only */
  update: (id, data) =>
    fetchWithAuth(`/changelogs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /** Delete a changelog entry — SUPER_ADMIN only */
  delete: (id) =>
    fetchWithAuth(`/changelogs/${id}`, { method: 'DELETE' }),
};
