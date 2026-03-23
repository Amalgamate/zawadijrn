import axiosInstance, { API_BASE_URL } from './axiosConfig';
import { cachedFetch, cacheDel, cacheDelPrefix, dedupe, TTL } from './apiCache';

export { API_BASE_URL };

/**
 * Helper function to make authenticated requests using Axios
 */
const fetchWithAuth = async (url, options = {}) => {
  try {
    const config = {
      url,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : options.data,
      headers: options.headers || {},
      params: options.params,
    };

    if (options.body instanceof FormData) {
      config.data = options.body;
      delete config.headers['Content-Type'];
    }

    const response = await axiosInstance(config);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      const data = error.response.data;
      let msg = data.message;
      if (!msg && data.error) {
        if (typeof data.error === 'object') {
          msg = data.error.message || JSON.stringify(data.error);
        } else {
          msg = data.error;
        }
      }
      msg = msg || `HTTP ${error.response.status}`;
      throw new Error(msg);
    }
    throw error;
  }
};

// ── Legacy simple cache (kept for fetchCached call-sites not yet migrated) ────
const dataCache = new Map();
const LEGACY_CACHE_TTL = 5 * 60 * 1000;

const fetchCached = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options.params || {})}`;
  const now = Date.now();

  if (dataCache.has(cacheKey)) {
    const { data, timestamp } = dataCache.get(cacheKey);
    if (now - timestamp < LEGACY_CACHE_TTL) return data;
    dataCache.delete(cacheKey);
  }

  const result = await fetchWithAuth(url, options);
  dataCache.set(cacheKey, { data: result, timestamp: now });
  return result;
};

export const clearApiCache = (key) => {
  if (key) { dataCache.delete(key); cacheDel(key); }
  else { dataCache.clear(); cacheDelPrefix(''); }
};

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const data = error.response?.data;
        let msg = data.message || data.error;
        if (!msg) msg = `HTTP ${error.response.status}`;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
      }
      throw error;
    }
  },

  schoolPublic: async () => {
    const response = await axiosInstance.get('/schools/public/branding');
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  checkAvailability: async (data) => {
    const response = await axiosInstance.post('/auth/check-availability', data);
    return response.data;
  },

  me: async () => fetchWithAuth('/auth/me'),

  getSeededUsers: async () => {
    try {
      const response = await axiosInstance.get('/auth/seeded-users');
      return response.data;
    } catch {
      return { users: [] };
    }
  },

  resetPassword: async (token, password) =>
    fetchWithAuth('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  sendOTP: async (data) => {
    try {
      const response = await axiosInstance.post('/auth/otp/send', data);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const d = error.response?.data;
        let msg = d.message || d.error;
        if (!msg) msg = `HTTP ${error.response.status}`;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
      }
      throw error;
    }
  },

  verifyOTP: async (data) => {
    try {
      const response = await axiosInstance.post('/auth/otp/verify', data);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const d = error.response?.data;
        let msg = d.message || d.error;
        if (!msg) msg = `HTTP ${error.response.status}`;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
      }
      throw error;
    }
  },

  getCsrf: async () => {
    const response = await axiosInstance.get('/auth/csrf');
    return response.data;
  },
};

export const onboardingAPI = {
  registerFull: async (data) => {
    const { token: csrfToken } = await authAPI.getCsrf();
    const response = await axiosInstance.post('/onboarding/register-full', data, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
    return response.data;
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardAPI = {
  getAdminMetrics: async (filter = 'today') =>
    fetchWithAuth(`/dashboard/admin?filter=${filter}`),
  getTeacherMetrics: async (filter = 'today') =>
    fetchWithAuth(`/dashboard/teacher?filter=${filter}`),
  getParentMetrics: async () =>
    fetchWithAuth('/dashboard/parent'),
};

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

export const configAPI = {
  getTermConfigs: async () => fetchCached('/config/term'),
  upsertTermConfig: async (data) =>
    fetchWithAuth('/config/term', { method: 'POST', body: JSON.stringify(data) }),

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

  getBranding: async () => fetchCached('/settings/branding'),

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

  getClasses: async () => fetchCached('/config/classes'),
  upsertClass: async (data) =>
    fetchWithAuth('/config/classes', { method: 'POST', body: JSON.stringify(data) }),
  deleteClass: async (id) =>
    fetchWithAuth(`/config/classes/${id}`, { method: 'DELETE' }),
};

// ============================================
// COMMUNICATION API
// ============================================

export const communicationAPI = {
  getConfig: async () => fetchWithAuth('/communication/config'),
  saveConfig: async (data) =>
    fetchWithAuth('/communication/config', { method: 'POST', body: JSON.stringify(data) }),
  sendTestSMS: async (data) =>
    fetchWithAuth('/communication/test/sms', { method: 'POST', body: JSON.stringify(data) }),
  sendTestEmail: async (data) =>
    fetchWithAuth('/communication/test/email', { method: 'POST', body: JSON.stringify(data) }),
  getBirthdaysToday: async () => fetchWithAuth('/communication/birthdays/today'),
  sendBirthdayWishes: async (data) =>
    fetchWithAuth('/communication/birthdays/send', { method: 'POST', body: JSON.stringify(data) }),
  getRecipients: async (grade) => {
    const params = grade ? `?grade=${encodeURIComponent(grade)}` : '';
    return fetchWithAuth(`/communication/recipients${params}`);
  },
  getAllRecipients: async () => fetchWithAuth('/communication/recipients'),
  getStaffContacts: async () => fetchWithAuth('/communication/staff'),
  getContactGroups: async () => fetchWithAuth('/communication/groups'),
  getContactGroupById: async (id) => fetchWithAuth(`/communication/groups/${id}`),
  createContactGroup: async (data) =>
    fetchWithAuth('/communication/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateContactGroup: async (id, data) =>
    fetchWithAuth(`/communication/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContactGroup: async (id) =>
    fetchWithAuth(`/communication/groups/${id}`, { method: 'DELETE' }),
};

// ============================================
// BROADCAST API
// ============================================

export const broadcastAPI = {
  saveCampaign: async (data) =>
    fetchWithAuth('/broadcasts', { method: 'POST', body: JSON.stringify(data) }),
  getHistory: async (limit = 50, offset = 0) =>
    fetchWithAuth(`/broadcasts?limit=${limit}&offset=${offset}`),
  getDetails: async (campaignId) => fetchWithAuth(`/broadcasts/${campaignId}`),
  getStats: async () => fetchWithAuth('/broadcasts/stats'),
  saveDeliveryLog: async (campaignId, data) =>
    fetchWithAuth(`/broadcasts/${campaignId}/delivery-logs`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCampaign: async (campaignId) =>
    fetchWithAuth(`/broadcasts/${campaignId}`, { method: 'DELETE' }),
  sendBulk: async (data) =>
    fetchWithAuth('/broadcasts/send-bulk', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

export const userAPI = {
  getAll: async () => fetchWithAuth('/users'),
  getById: async (id) => fetchWithAuth(`/users/${id}`),
  getByRole: async (role, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/users/role/${role}${queryString ? `?${queryString}` : ''}`);
  },
  getStats: async () => fetchWithAuth('/users/stats'),
  create: async (userData) =>
    fetchWithAuth('/users', { method: 'POST', body: JSON.stringify(userData) }),
  update: async (id, userData) =>
    fetchWithAuth(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  archive: async (id) =>
    fetchWithAuth(`/users/${id}/archive`, { method: 'POST' }),
  unarchive: async (id) =>
    fetchWithAuth(`/users/${id}/unarchive`, { method: 'POST' }),
  delete: async (id) =>
    fetchWithAuth(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: async (id, data) =>
    fetchWithAuth(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// SCHOOL MANAGEMENT ENDPOINTS
// ============================================

export const schoolAPI = {
  getAll: async () => fetchWithAuth('/schools'),
  getById: async (id) => fetchWithAuth(`/schools/${id}`),
  create: async (data) =>
    fetchWithAuth('/schools', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: async (id) =>
    fetchWithAuth(`/schools/${id}/deactivate`, { method: 'POST' }),
  delete: async (id) =>
    fetchWithAuth(`/schools/${id}`, { method: 'DELETE' }),
  provision: async (data) =>
    fetchWithAuth('/schools/provision', { method: 'POST', body: JSON.stringify(data) }),
  getAdmissionNumberPreview: async (academicYear) =>
    fetchWithAuth(`/schools/admission-number-preview/${academicYear}`),
};

// ============================================
// FACILITY MANAGEMENT API
// ============================================

export const facilityAPI = {
  getStreamsByBranch: async () => fetchWithAuth('/facility/streams'),
  getStream: async (streamId) => fetchWithAuth(`/facility/streams/${streamId}`),
  createStream: async (data) =>
    fetchWithAuth('/facility/streams', { method: 'POST', body: JSON.stringify(data) }),
  updateStream: async (id, data) =>
    fetchWithAuth(`/facility/streams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStream: async (id) =>
    fetchWithAuth(`/facility/streams/${id}`, { method: 'DELETE' }),
  getAvailableStreamNames: async () => fetchWithAuth('/facility/streams/available'),
};

// ============================================
// TEACHERS API
// ============================================

export const teacherAPI = {
  getAll: async (params = {}) => userAPI.getByRole('TEACHER', params),
  create: async (teacherData) => userAPI.create({ ...teacherData, role: 'TEACHER' }),
  update: async (id, teacherData) => userAPI.update(id, teacherData),
  delete: async (id) => userAPI.delete(id),
};

// ============================================
// PARENTS API
// ============================================

export const parentAPI = {
  getAll: async (params = {}) => userAPI.getByRole('PARENT', params),
  create: async (parentData) => userAPI.create({ ...parentData, role: 'PARENT' }),
  update: async (id, parentData) => userAPI.update(id, parentData),
  archive: async (id) => userAPI.archive(id),
  unarchive: async (id) => userAPI.unarchive(id),
  delete: async (id) => userAPI.delete(id),
};

// ============================================
// LEARNERS API
// ============================================

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

// ============================================
// SUBJECT ASSIGNMENT API
// ============================================

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

// ============================================
// CLASSES API
// ============================================

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

// ============================================
// ATTENDANCE API
// ============================================

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

// ============================================
// ASSESSMENTS API
// ============================================

export const assessmentAPI = {
  createFormative: async (assessmentData) =>
    fetchWithAuth('/assessments/formative', { method: 'POST', body: JSON.stringify(assessmentData) }),
  recordFormativeBulk: async (bulkData) =>
    fetchWithAuth('/assessments/formative/bulk', { method: 'POST', body: JSON.stringify(bulkData) }),
  getFormativeAssessments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/formative${queryString ? `?${queryString}` : ''}`);
  },
  getFormativeByLearner: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/formative/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  deleteFormative: async (id) =>
    fetchWithAuth(`/assessments/formative/${id}`, { method: 'DELETE' }),

  createTest: async (testData) => {
    cacheDelPrefix('tests:');
    return fetchWithAuth('/assessments/tests', { method: 'POST', body: JSON.stringify(testData) });
  },
  bulkCreateTests: async (bulkData) => {
    cacheDelPrefix('tests:');
    return fetchWithAuth('/assessments/tests/bulk', { method: 'POST', body: JSON.stringify(bulkData) });
  },
  getTests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const key = `tests:${queryString}`;
    return cachedFetch(key, () => fetchWithAuth(`/assessments/tests${queryString ? `?${queryString}` : ''}`), TTL.MEDIUM);
  },
  getTest: async (id) =>
    cachedFetch(`test:${id}`, () => fetchWithAuth(`/assessments/tests/${id}`), TTL.MEDIUM),
  updateTest: async (id, testData) => {
    cacheDel(`test:${id}`);
    cacheDelPrefix('tests:');
    return fetchWithAuth(`/assessments/tests/${id}`, { method: 'PUT', body: JSON.stringify(testData) });
  },
  deleteTest: async (id) => {
    cacheDel(`test:${id}`);
    cacheDelPrefix('tests:');
    return fetchWithAuth(`/assessments/tests/${id}`, { method: 'DELETE' });
  },
  deleteTestsBulk: async (ids) => {
    cacheDelPrefix('tests:');
    return fetchWithAuth('/assessments/tests/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) });
  },

  recordResult: async (resultData) => {
    cacheDel(`results:${resultData.testId}`);
    return fetchWithAuth('/assessments/summative/results', { method: 'POST', body: JSON.stringify(resultData) });
  },
  recordBulkResults: async (bulkData) => {
    const result = await fetchWithAuth('/assessments/summative/results/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
    cacheDel(`results:${bulkData.testId}`);
    return result;
  },
  getBulkResults: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/summative/results/bulk${queryString ? `?${queryString}` : ''}`);
  },
  getSummativeByLearner: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/summative/results/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  async getTestResults(testId) {
    return cachedFetch(`results:${testId}`, () => fetchWithAuth(`/assessments/summative/results/test/${testId}`), TTL.SHORT);
  },
  async uploadBulk(formData) {
    return fetchWithAuth('/bulk/assessments/upload', { method: 'POST', body: formData, headers: {} });
  },

  createScalesForSchool: async (data = {}) =>
    fetchWithAuth('/assessments/setup/create-scales', { method: 'POST', body: JSON.stringify(data) }),
  createTestsForScales: async (data) =>
    fetchWithAuth('/assessments/setup/create-tests', { method: 'POST', body: JSON.stringify(data) }),
  completeSchoolSetup: async (data) =>
    fetchWithAuth('/assessments/setup/complete', { method: 'POST', body: JSON.stringify(data) }),
  resetAssessments: async (data) =>
    fetchWithAuth('/assessments/setup/reset', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// FEE MANAGEMENT API
// ============================================

export const feeAPI = {
  getAllFeeStructures: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/structures${query ? `?${query}` : ''}`);
  },
  createFeeStructure: async (data) =>
    fetchWithAuth('/fees/structures', { method: 'POST', body: JSON.stringify(data) }),
  updateFeeStructure: async (id, data) =>
    fetchWithAuth(`/fees/structures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeeStructure: async (id) =>
    fetchWithAuth(`/fees/structures/${id}`, { method: 'DELETE' }),
  getAllInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/invoices${query ? `?${query}` : ''}`);
  },
  getLearnerInvoices: async (learnerId) => fetchWithAuth(`/fees/invoices/learner/${learnerId}`),
  createInvoice: async (data) =>
    fetchWithAuth('/fees/invoices', { method: 'POST', body: JSON.stringify(data) }),
  bulkGenerateInvoices: async (data) =>
    fetchWithAuth('/fees/invoices/bulk', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: async (data) =>
    fetchWithAuth('/fees/payments', { method: 'POST', body: JSON.stringify(data) }),
  getAllFeeTypes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/types${query ? `?${query}` : ''}`);
  },
  seedDefaultFeeTypes: async () =>
    fetchWithAuth('/fees/types/seed/defaults', { method: 'POST' }),
  seedDefaultFeeStructures: async () =>
    fetchWithAuth('/fees/types/seed/structures', { method: 'POST' }),
  getPaymentStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/stats${query ? `?${query}` : ''}`);
  },
  exportInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_BASE_URL}/fees/invoices/export${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to export invoices');
    return response.blob();
  },
  resetInvoices: async () => fetchWithAuth('/fees/invoices/reset', { method: 'DELETE' }),
  sendReminder: async (id, data) =>
    fetchWithAuth(`/fees/invoices/${id}/remind`, { method: 'POST', body: JSON.stringify(data) }),
  bulkSendReminders: async (data) =>
    fetchWithAuth('/fees/invoices/remind/bulk', { method: 'POST', body: JSON.stringify(data) }),
  emailStatement: async (learnerId, data) =>
    fetchWithAuth(`/fees/invoices/learner/${learnerId}/email`, { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationAPI = {
  sendAssessmentNotification: async (data) =>
    fetchWithAuth('/notifications/assessment-complete', { method: 'POST', body: JSON.stringify(data) }),
  sendBulkAssessmentNotifications: async (data) =>
    fetchWithAuth('/notifications/assessment-complete/bulk', { method: 'POST', body: JSON.stringify(data) }),
  sendCustomMessage: async (data) =>
    fetchWithAuth('/notifications/custom', { method: 'POST', body: JSON.stringify(data) }),
  sendAnnouncement: async (data) =>
    fetchWithAuth('/notifications/announcement', { method: 'POST', body: JSON.stringify(data) }),
  sendAssessmentReportSms: async (data) =>
    fetchWithAuth('/notifications/sms/assessment-report', { method: 'POST', body: JSON.stringify(data) }),
  sendAssessmentReportWhatsApp: async (data) =>
    fetchWithAuth('/notifications/whatsapp/assessment-report', { method: 'POST', body: JSON.stringify(data) }),
  testWhatsApp: async (phoneNumber) =>
    fetchWithAuth('/notifications/test', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),
  getWhatsAppStatus: async () => fetchWithAuth('/notifications/whatsapp/status'),
};

// ============================================
// REPORTS API
// ============================================

export const reportAPI = {
  getFormativeReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/formative/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  getSummativeReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/summative/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  getTermlyReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/termly/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  getClassAnalytics: async (classId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/analytics/class/${classId}${queryString ? `?${queryString}` : ''}`);
  },
  getLearnerAnalytics: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/analytics/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  generatePdf: async (data) => {
    try {
      const response = await axiosInstance.post('/reports/generate-pdf', data, { responseType: 'blob' });
      const blob = response.data;
      if (blob.size < 100) console.warn('⚠️ PDF Blob is suspiciously small');
      return blob;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'PDF Generation failed');
    }
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthAPI = {
  check: async () => {
    try {
      const response = await axiosInstance.get('/health');
      return response.data;
    } catch {
      throw new Error('Backend server is not reachable');
    }
  },
};

// ============================================
// CBC ASSESSMENT API
// ============================================

export const cbcAPI = {
  saveCompetencies: async (data) =>
    fetchWithAuth('/cbc/competencies', { method: 'POST', body: JSON.stringify(data) }),
  getCompetencies: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/competencies/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  saveValues: async (data) =>
    fetchWithAuth('/cbc/values', { method: 'POST', body: JSON.stringify(data) }),
  getValues: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/values/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  createCoCurricular: async (data) =>
    fetchWithAuth('/cbc/cocurricular', { method: 'POST', body: JSON.stringify(data) }),
  getCoCurricular: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/cocurricular/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  updateCoCurricular: async (id, data) =>
    fetchWithAuth(`/cbc/cocurricular/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoCurricular: async (id) =>
    fetchWithAuth(`/cbc/cocurricular/${id}`, { method: 'DELETE' }),
  saveComments: async (data) =>
    fetchWithAuth('/cbc/comments', { method: 'POST', body: JSON.stringify(data) }),
  getComments: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/comments/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
};

// ============================================
// WORKFLOW API — stubs (approval flow disabled)
// ============================================

export const workflowAPI = {
  submit: async () => ({ success: true }),
  bulkSubmit: async () => ({ success: true }),
  approve: async () => ({ success: true }),
  reject: async () => ({ success: true }),
  publish: async () => ({ success: true }),
  getHistory: async () => ({ success: true, data: [] }),
  approveBulk: async () => ({ success: true, message: 'Auto-approved' }),
  unlock: async () => ({ success: true }),
};

// ============================================
// GRADING API
// ============================================

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

// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
  getSchoolInfo: async () => fetchCached('/settings/school-info'),
  listSchools: async () => fetchWithAuth('/admin/schools'),
  provision: async (data) =>
    fetchWithAuth('/admin/schools/provision', { method: 'POST', body: JSON.stringify(data) }),
  listPlans: async () => fetchWithAuth('/admin/plans'),
  reactivateSchool: async () =>
    fetchWithAuth('/admin/school/reactivate', { method: 'PATCH' }),
  approvePayment: async (payload) =>
    fetchWithAuth('/admin/school/approve-payment', { method: 'PATCH', body: JSON.stringify(payload || {}) }),
  trialMetrics: async () => fetchWithAuth('/admin/trials/metrics'),
  getSchoolModules: async () => fetchWithAuth('/admin/school/modules'),
  setSchoolModule: async (moduleKey, active) =>
    fetchWithAuth(`/admin/school/modules/${moduleKey}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  switchSchool: async () => fetchWithAuth('/admin/switch-school', { method: 'POST' }),
  getSchoolCommunication: async () => fetchWithAuth('/admin/school/communication'),
  updateSchoolCommunication: async (data) =>
    fetchWithAuth('/admin/school/communication', { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================
// DOCUMENTS API
// ============================================

export const documentsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/documents${queryString ? `?${queryString}` : ''}`);
  },
  getCategories: async () => fetchWithAuth('/documents/categories'),
  upload: async (formData) =>
    fetchWithAuth('/documents/upload', { method: 'POST', body: formData }),
  uploadMultiple: async (formData) =>
    fetchWithAuth('/documents/upload-multiple', { method: 'POST', body: formData }),
  update: async (id, data) =>
    fetchWithAuth(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/documents/${id}`, { method: 'DELETE' }),
};

// ============================================
// BOOKS & RESOURCES API
// ============================================

export const bookAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/books${queryString ? `?${queryString}` : ''}`);
  },
  create: async (data) =>
    fetchWithAuth('/books', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assign: async (id, userId) =>
    fetchWithAuth(`/books/${id}/assign`, { method: 'POST', body: JSON.stringify({ userId }) }),
  return: async (id) =>
    fetchWithAuth(`/books/${id}/return`, { method: 'POST' }),
  delete: async (id) =>
    fetchWithAuth(`/books/${id}`, { method: 'DELETE' }),
};

// ============================================
// SHARING API
// ============================================

export const sharingAPI = {
  shareDocumentWhatsApp: async (documentId, phoneNumber) =>
    fetchWithAuth('/notifications/whatsapp/share-document', {
      method: 'POST',
      body: JSON.stringify({ documentId, phoneNumber }),
    }),
};

// ============================================
// HR API
// ============================================

export const hrAPI = {
  clockInStaff: async (data = {}) =>
    fetchWithAuth('/hr/attendance/clock-in', { method: 'POST', body: JSON.stringify(data) }),
  clockOutStaff: async (data = {}) =>
    fetchWithAuth('/hr/attendance/clock-out', { method: 'POST', body: JSON.stringify(data) }),
  getTodayClockIn: async () => fetchWithAuth('/hr/attendance/today'),
  getStaffDirectory: async () => fetchWithAuth('/hr/staff'),
  updateStaffHR: async (id, data) =>
    fetchWithAuth(`/hr/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLeaveTypes: async () => fetchWithAuth('/hr/leave/types'),
  submitLeaveRequest: async (data) =>
    fetchWithAuth('/hr/leave/apply', { method: 'POST', body: JSON.stringify(data) }),
  getLeaveRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/hr/leave/requests?${queryString}`);
  },
  approveLeaveRequest: async (requestId, data) =>
    fetchWithAuth(`/hr/leave/approve/${requestId}`, { method: 'PUT', body: JSON.stringify(data) }),
  generatePayroll: async (data) =>
    fetchWithAuth('/hr/payroll/generate', { method: 'POST', body: JSON.stringify(data) }),
  getPayrollRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/hr/payroll?${queryString}`);
  },
  getPerformanceReviews: async (userId) => {
    const url = userId ? `/hr/performance?userId=${userId}` : '/hr/performance';
    return fetchWithAuth(url);
  },
  createPerformanceReview: async (data) =>
    fetchWithAuth('/hr/performance', { method: 'POST', body: JSON.stringify(data) }),
  updatePerformanceReview: async (id, data) =>
    fetchWithAuth(`/hr/performance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ============================================
// ACCOUNTING API
// ============================================

export const accountingAPI = {
  initializeCoA: async () =>
    fetchWithAuth('/accounting/initialize', { method: 'POST', body: JSON.stringify({}) }),
  getAccounts: async () => fetchWithAuth('/accounting/accounts'),
  getBalances: async () => fetchWithAuth('/accounting/balances'),
  getJournals: async () => fetchWithAuth('/accounting/journals'),
  createJournalEntry: async (data) =>
    fetchWithAuth('/accounting/entries', { method: 'POST', body: JSON.stringify(data) }),
  postJournalEntry: async (id) =>
    fetchWithAuth(`/accounting/entries/${id}/post`, { method: 'POST' }),
  getVendors: async () => fetchWithAuth('/accounting/vendors'),
  createVendor: async (data) =>
    fetchWithAuth('/accounting/vendors', { method: 'POST', body: JSON.stringify(data) }),
  recordExpense: async (data) =>
    fetchWithAuth('/accounting/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getBankStatements: async () => fetchWithAuth('/accounting/bank-statements'),
  importBankStatement: async (data) =>
    fetchWithAuth('/accounting/bank-statements/import', { method: 'POST', body: JSON.stringify(data) }),
  reconcileLine: async (data) =>
    fetchWithAuth('/accounting/bank-statements/reconcile', { method: 'POST', body: JSON.stringify(data) }),
  getReport: async (type, startDate, endDate) =>
    fetchWithAuth(`/accounting/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`),
  getTrialBalance: async (startDate, endDate) =>
    fetchWithAuth(`/accounting/reports/trial-balance?startDate=${startDate}&endDate=${endDate}`),
};

// ============================================
// INVENTORY API
// ============================================

export const inventoryAPI = {
  getCategories: async () => fetchWithAuth('/inventory/categories'),
  createCategory: async (data) =>
    fetchWithAuth('/inventory/categories', { method: 'POST', body: JSON.stringify(data) }),
  getStores: async () => fetchWithAuth('/inventory/stores'),
  createStore: async (data) =>
    fetchWithAuth('/inventory/stores', { method: 'POST', body: JSON.stringify(data) }),
  getItems: async (categoryId) =>
    fetchWithAuth(`/inventory/items${categoryId ? `?categoryId=${categoryId}` : ''}`),
  createItem: async (data) =>
    fetchWithAuth('/inventory/items', { method: 'POST', body: JSON.stringify(data) }),
  getMovements: async () => fetchWithAuth('/inventory/movements'),
  recordMovement: async (data) =>
    fetchWithAuth('/inventory/movements', { method: 'POST', body: JSON.stringify(data) }),
  getRequisitions: async () => fetchWithAuth('/inventory/requisitions'),
  createRequisition: async (data) =>
    fetchWithAuth('/inventory/requisitions', { method: 'POST', body: JSON.stringify(data) }),
  updateRequisitionStatus: async (id, status) =>
    fetchWithAuth(`/inventory/requisitions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAssetRegister: async () => fetchWithAuth('/inventory/assets'),
  registerAsset: async (data) =>
    fetchWithAuth('/inventory/assets', { method: 'POST', body: JSON.stringify(data) }),
  assignAsset: async (data) =>
    fetchWithAuth('/inventory/assets/assign', { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// NOTICES API
// ============================================

export const noticesAPI = {
  getAll: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/notices${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => fetchWithAuth(`/notices/${id}`),
  create: async (data) =>
    fetchWithAuth('/notices', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/notices/${id}`, { method: 'DELETE' }),
};

// ============================================
// AI & ANALYTICS API
// ============================================

export const aiAPI = {
  generateFeedback: async (learnerId, term, academicYear) =>
    fetchWithAuth(`/ai/feedback/${learnerId}?term=${term}&academicYear=${academicYear}`),
  analyzeRisk: async (learnerId) => fetchWithAuth(`/ai/analyze-risk/${learnerId}`),
  getTrend: async (learnerId) => fetchWithAuth(`/ai/trend/${learnerId}`),
};

// ============================================
// SCHEMES OF WORK API
// ============================================

export const schemeOfWorkAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/schemes-of-work${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => fetchWithAuth(`/schemes-of-work/${id}`),
  create: async (data) =>
    fetchWithAuth('/schemes-of-work', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/schemes-of-work/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: async (id, status) =>
    fetchWithAuth(`/schemes-of-work/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  review: async (id, data) =>
    fetchWithAuth(`/schemes-of-work/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/schemes-of-work/${id}`, { method: 'DELETE' }),
};

// ============================================
// DEFAULT EXPORT
// ============================================

const api = {
  auth: authAPI,
  users: userAPI,
  teachers: teacherAPI,
  parents: parentAPI,
  learners: learnerAPI,
  classes: classAPI,
  attendance: attendanceAPI,
  subjectAssignments: subjectAssignmentAPI,
  assessments: assessmentAPI,
  reports: reportAPI,

  // ── notifications: full object — spread notificationAPI then add getAuditLogs ──
  notifications: {
    ...notificationAPI,
    getAuditLogs: async (params = {}) => {
      // Strip undefined / null / empty string values so they don't appear in the query
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      );
      const queryString = new URLSearchParams(clean).toString();
      return fetchWithAuth(`/notifications/audit-logs${queryString ? `?${queryString}` : ''}`);
    },
  },

  fees: feeAPI,
  cbc: cbcAPI,
  health: healthAPI,
  workflow: workflowAPI,
  grading: gradingAPI,
  admin: adminAPI,
  documents: documentsAPI,
  communication: communicationAPI,
  notices: noticesAPI,
  broadcasts: broadcastAPI,
  books: bookAPI,
  sharing: sharingAPI,
  config: configAPI,
  ...configAPI,
  planner: {
    getEvents: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/planner/events?${queryString}`);
    },
    createEvent: async (data) =>
      fetchWithAuth('/planner/events', { method: 'POST', body: JSON.stringify(data) }),
    updateEvent: async (id, data) =>
      fetchWithAuth(`/planner/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEvent: async (id) =>
      fetchWithAuth(`/planner/events/${id}`, { method: 'DELETE' }),
  },
  schemesOfWork: schemeOfWorkAPI,
  hr: hrAPI,
  accounting: accountingAPI,
  inventory: inventoryAPI,
};

export default api;
