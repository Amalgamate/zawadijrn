
import { create } from 'zustand';
import api from '../services/api';

const useSubjectStore = create((set, get) => ({
  subjects: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchSubjects: async (force = false) => {
    const { subjects, lastFetched, loading } = get();
    
    // Cache for 1 hour unless forced
    const now = Date.now();
    if (!force && subjects.length > 0 && lastFetched && (now - lastFetched < 3600000)) {
      return subjects;
    }

    if (loading) return;

    set({ loading: true, error: null });
    try {
      const response = await api.get('/learning-areas');
      const data = response.data?.data || [];
      set({ 
        subjects: data, 
        loading: false, 
        lastFetched: now 
      });
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch subjects';
      set({ error: errorMsg, loading: false });
      return [];
    }
  },

  getSubjectsByGrade: (grade) => {
    const { subjects } = get();
    if (!grade) return [];

    // Normalize grade for comparison (e.g., "Grade 1" vs "GRADE_1")
    const normalizedSearch = String(grade).replace(/\s+/g, '_').toUpperCase();

    return subjects.filter(s => {
      const normalizedSubjectGrade = String(s.gradeLevel).replace(/\s+/g, '_').toUpperCase();
      return normalizedSubjectGrade === normalizedSearch;
    });
  }
}));

export default useSubjectStore;
