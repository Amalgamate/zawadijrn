import axiosInstance, { API_BASE_URL } from './axiosConfig';

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

    // If body is FormData, don't parse it
    if (options.body instanceof FormData) {
      config.data = options.body;
      delete config.headers['Content-Type'];
    }

    const response = await axiosInstance(config);
    return response.data;
  } catch (error) {
    // Axios interceptors handle 401 and refresh
    if (error.response?.data) {
      const data = error.response.data;
      let msg = data.message;

      // Handle nested error objects from middleware
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

// Simple In-Memory Cache for GET requests
const dataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch data with basic caching for non-volatile read operations
 */
const fetchCached = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options.params || {})}`;
  const now = Date.now();

  if (dataCache.has(cacheKey)) {
    const { data, timestamp } = dataCache.get(cacheKey);
    if (now - timestamp < CACHE_TTL) {
      return data;
    }
    dataCache.delete(cacheKey);
  }

  const result = await fetchWithAuth(url, options);
  dataCache.set(cacheKey, { data: result, timestamp: now });
  return result;
};

/**
 * Clear specific or all cache
 */
export const clearApiCache = (key) => {
  if (key) dataCache.delete(key);
  else dataCache.clear();
};

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

export const authAPI = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise} User data and token
   */
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
  /**
   * Fetch public school branding info.
   * @param {string} schoolId
   */
  schoolPublic: async (schoolId) => {
    const response = await axiosInstance.get(`/tenants/public/${schoolId}`);
    return response.data;
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} User data and token
   */
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Check availability of email/phone
   * @param {Object} data - { email, phone }
   * @returns {Promise} Availability status
   */
  checkAvailability: async (data) => {
    const response = await axiosInstance.post('/auth/check-availability', data);
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} Current user data
   */
  me: async () => {
    return fetchWithAuth('/auth/me');
  },

  /**
   * Get seeded development users
   * @returns {Promise} List of seeded users
   */
  getSeededUsers: async () => {
    try {
      const response = await axiosInstance.get('/auth/seeded-users');
      return response.data;
    } catch (error) {
      return { users: [] };
    }
  },

  /**
   * Reset Password
   */
  resetPassword: async (token, password) => {
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  /**
   * Send OTP to user's phone
   * @param {Object} data - { email }
   * @returns {Promise} Confirmation message
   */
  sendOTP: async (data) => {
    const response = await axiosInstance.post('/auth/otp/send', data);
    return response.data;
  },

  /**
   * Verify OTP code
   * @param {Object} data - { email, otp }
   * @returns {Promise} User data and token
   */
  verifyOTP: async (data) => {
    const response = await axiosInstance.post('/auth/otp/verify', data);
    return response.data;
  },

  /**
   * Get CSRF token
   */
  getCsrf: async () => {
    const response = await axiosInstance.get('/auth/csrf');
    return response.data;
  },
};

/**
 * Onboarding Endpoints
 */
export const onboardingAPI = {
  /**
   * Full school registration
   */
  registerFull: async (data) => {
    // Get CSRF token first
    const { token: csrfToken } = await authAPI.getCsrf();

    const response = await axiosInstance.post('/onboarding/register-full', data, {
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    });

    return response.data;
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardAPI = {
  /**
   * Get Admin Dashboard metrics
   */
  getAdminMetrics: async (filter = 'today') => {
    return fetchWithAuth(`/dashboard/admin?filter=${filter}`);
  },

  /**
   * Get Teacher Dashboard metrics
   */
  getTeacherMetrics: async (filter = 'today') => {
    return fetchWithAuth(`/dashboard/teacher?filter=${filter}`);
  },

  /**
   * Get Parent Dashboard metrics
   */
  getParentMetrics: async () => {
    return fetchWithAuth('/dashboard/parent');
  }
};

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

export const configAPI = {
  /**
   * Get Term Configurations for a school
   */
  getTermConfigs: async (schoolId) => {
    return fetchCached(`/config/term/${schoolId}`);
  },

  /**
   * Create or Update Term Configuration
   */
  upsertTermConfig: async (data) => {
    return fetchWithAuth('/config/term', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get Aggregation Configurations
   */
  getAggregationConfigs: async (schoolId) => {
    return fetchCached(`/config/aggregation/${schoolId}`);
  },

  /**
   * Create Aggregation Configuration
   */
  createAggregationConfig: async (data) => {
    return fetchWithAuth('/config/aggregation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update Aggregation Configuration
   */
  updateAggregationConfig: async (id, data) => {
    return fetchWithAuth(`/config/aggregation/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete Aggregation Configuration
   */
  deleteAggregationConfig: async (id) => {
    return fetchWithAuth(`/config/aggregation/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get Stream Configurations
   */
  getStreamConfigs: async (schoolId) => {
    return fetchCached(`/config/streams/${schoolId}`, {
      headers: {
        'X-School-Id': schoolId,
      },
    });
  },

  /**
   * Create or Update Stream Configuration
   */
  upsertStreamConfig: async (data) => {
    return fetchWithAuth('/config/streams', {
      method: 'POST',
      headers: {
        'X-School-Id': data.schoolId,
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete Stream Configuration
   */
  deleteStreamConfig: async (id) => {
    return fetchWithAuth(`/config/streams/${id}`, {
      method: 'DELETE',
    });
  },


  /**
   * Get all available grades (Enum)
   */
  getGrades: async () => {
    return fetchCached('/config/grades');
  },

  /**
   * Get Branding and School Settings
   */
  getBranding: async () => {
    return fetchCached('/settings/branding');
  },

  /**
   * Get Learning Areas for a school
   */
  getLearningAreas: async (schoolId) => {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    return fetchWithAuth(`/learning-areas${query}`);
  },

  /**
   * Get a specific learning area
   */
  getLearningArea: async (id) => {
    return fetchWithAuth(`/learning-areas/${id}`);
  },

  /**
   * Create a learning area
   */
  createLearningArea: async (data) => {
    return fetchWithAuth('/learning-areas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a learning area
   */
  updateLearningArea: async (id, data) => {
    return fetchWithAuth(`/learning-areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a learning area
   */
  deleteLearningArea: async (id) => {
    return fetchWithAuth(`/learning-areas/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Seed default learning areas
   */
  seedLearningAreas: async () => {
    return fetchWithAuth('/learning-areas/seed/default', {
      method: 'POST',
    });
  },

  /**
   * Seed default classes
   */
  seedClasses: async (schoolId) => {
    return fetchWithAuth('/config/classes/seed', {
      method: 'POST',
      headers: {
        'X-School-Id': schoolId,
      },
    });
  },

  /**
   * Seed default streams
   */
  seedStreams: async (schoolId) => {
    return fetchWithAuth('/config/streams/seed', {
      method: 'POST',
      headers: {
        'X-School-Id': schoolId,
      },
    });
  },

  /**
   * Get classes for school
   */
  getClasses: async (schoolId) => {
    return fetchCached(`/config/classes/${schoolId}`);
  },

  /**
   * Create or update class
   */
  upsertClass: async (data) => {
    return fetchWithAuth('/config/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete class
   */
  deleteClass: async (id) => {
    return fetchWithAuth(`/config/classes/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// COMMUNICATION API
// ============================================

export const communicationAPI = {
  /**
   * Get Communication Config
   */
  getConfig: async (schoolId) => {
    return fetchWithAuth(`/communication/config/${schoolId}`);
  },

  /**
   * Save Communication Config
   */
  saveConfig: async (data) => {
    return fetchWithAuth('/communication/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send Test SMS
   */
  sendTestSMS: async (data) => {
    return fetchWithAuth('/communication/test/sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send Test Email
   */
  sendTestEmail: async (data) => {
    return fetchWithAuth('/communication/test/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get Birthdays Today
   */
  getBirthdaysToday: async (schoolId) => {
    return fetchWithAuth(`/communication/birthdays/today/${schoolId}`);
  },

  /**
   * Send Birthday Wishes
   */
  sendBirthdayWishes: async (data) => {
    return fetchWithAuth('/communication/birthdays/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get Broadcast Recipients
   * @param {string} grade - Optional grade filter
   */
  getRecipients: async (grade) => {
    const params = grade ? `?grade=${encodeURIComponent(grade)}` : '';
    return fetchWithAuth(`/communication/recipients${params}`);
  },

  /**
   * Get All Recipients (all parents across all grades)
   */
  getAllRecipients: async () => {
    return fetchWithAuth('/communication/recipients');
  },

  /**
   * Get Staff Contacts
   */
  getStaffContacts: async () => {
    return fetchWithAuth('/communication/staff');
  },

  /**
   * Get all contact groups
   */
  getContactGroups: async () => {
    return fetchWithAuth('/communication/groups');
  },

  /**
   * Get contact group by ID
   */
  getContactGroupById: async (id) => {
    return fetchWithAuth(`/communication/groups/${id}`);
  },

  /**
   * Create contact group
   */
  createContactGroup: async (data) => {
    return fetchWithAuth('/communication/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update contact group
   */
  updateContactGroup: async (id, data) => {
    return fetchWithAuth(`/communication/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete contact group
   */
  deleteContactGroup: async (id) => {
    return fetchWithAuth(`/communication/groups/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// BROADCAST API
// ============================================

export const broadcastAPI = {
  /**
   * Save broadcast campaign after sending
   */
  saveCampaign: async (data) => {
    return fetchWithAuth('/broadcasts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get broadcast history
   */
  getHistory: async (limit = 50, offset = 0) => {
    const params = `?limit=${limit}&offset=${offset}`;
    return fetchWithAuth(`/broadcasts${params}`);
  },

  /**
   * Get broadcast details
   */
  getDetails: async (campaignId) => {
    return fetchWithAuth(`/broadcasts/${campaignId}`);
  },

  /**
   * Get broadcast statistics
   */
  getStats: async (schoolId) => {
    return fetchWithAuth(`/broadcasts/stats/${schoolId}`);
  },

  /**
   * Save SMS delivery log entry
   */
  saveDeliveryLog: async (campaignId, data) => {
    return fetchWithAuth(`/broadcasts/${campaignId}/delivery-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete broadcast campaign
   */
  deleteCampaign: async (campaignId) => {
    return fetchWithAuth(`/broadcasts/${campaignId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

export const userAPI = {
  /**
   * Get all users
   * @param {string} schoolId - Optional school ID to filter users (for Super Admin)
   * @returns {Promise} List of all users
   */
  getAll: async (schoolId) => {
    const params = schoolId ? `?schoolId=${schoolId}` : '';
    return fetchWithAuth(`/users${params}`);
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise} User data
   */
  getById: async (id) => {
    return fetchWithAuth(`/users/${id}`);
  },

  /**
   * Get users by role
   * @param {string} role - User role
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise} List of users with specified role
   */
  getByRole: async (role, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/users/role/${role}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get user statistics
   * @returns {Promise} User statistics for dashboard
   */
  getStats: async () => {
    return fetchWithAuth('/users/stats');
  },

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise} Created user data
   */
  create: async (userData) => {
    return fetchWithAuth('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} Updated user data
   */
  update: async (id, userData) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Archive user (soft delete)
   * @param {string} id - User ID
   * @returns {Promise} Success message
   */
  archive: async (id) => {
    return fetchWithAuth(`/users/${id}/archive`, {
      method: 'POST',
    });
  },

  /**
   * Unarchive user
   * @param {string} id - User ID
   * @returns {Promise} Success message
   */
  unarchive: async (id) => {
    return fetchWithAuth(`/users/${id}/unarchive`, {
      method: 'POST',
    });
  },

  /**
   * Delete user (hard delete)
   * @param {string} id - User ID
   * @returns {Promise} Success message
   */
  delete: async (id) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reset user password (admin action)
   * @param {string} id - User ID
   * @param {Object} data - { newPassword, sendWhatsApp, sendSms }
   * @returns {Promise} Success message
   */
  resetPassword: async (id, data) => {
    return fetchWithAuth(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// SCHOOL MANAGEMENT ENDPOINTS
// ============================================

export const schoolAPI = {
  /**
   * Get all schools
   * @returns {Promise} List of all schools
   */
  getAll: async () => {
    return fetchWithAuth('/schools');
  },

  /**
   * Get school by ID
   * @param {string} id - School ID
   * @returns {Promise} School data
   */
  getById: async (id) => {
    return fetchWithAuth(`/schools/${id}`);
  },

  /**
   * Get branches for a school
   * @param {string} schoolId - School ID
   * @returns {Promise} List of branches
   */
  getBranches: async (schoolId) => {
    return fetchWithAuth(`/schools/${schoolId}/branches`);
  },
  /**
   * Create a new school
   */
  create: async (data) => {
    return fetchWithAuth('/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  /**
   * Update school
   */
  update: async (id, data) => {
    return fetchWithAuth(`/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  /**
   * Deactivate school
   */
  deactivate: async (id) => {
    return fetchWithAuth(`/schools/${id}/deactivate`, {
      method: 'POST',
      headers: {
        'X-School-Id': id,
      },
    });
  },
  /**
   * Delete school
   */
  delete: async (id) => {
    return fetchWithAuth(`/schools/${id}`, {
      method: 'DELETE',
      headers: {
        'X-School-Id': id,
      },
    });
  },

  /**
   * Provision a new school with admin user (complete setup)
   */
  provision: async (data) => {
    return fetchWithAuth('/schools/provision', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get preview of next admission number(s) for a school
   * @param {string} schoolId
   * @param {number} academicYear
   */
  getAdmissionNumberPreview: async (schoolId, academicYear) => {
    return fetchWithAuth(`/schools/${schoolId}/admission-number-preview/${academicYear}`);
  },
};

// ============================================
// FACILITY MANAGEMENT API
// ============================================

export const facilityAPI = {
  /**
   * Get streams by branch
   * @param {string} branchId
   */
  getStreamsByBranch: async (branchId) => {
    return fetchWithAuth(`/facility/streams?branchId=${branchId}`);
  },

  /**
   * Get single stream by ID
   * @param {string} streamId
   */
  getStream: async (streamId) => {
    return fetchWithAuth(`/facility/streams/${streamId}`);
  },

  /**
   * Create stream
   * @param {Object} data - { branchId, name }
   */
  createStream: async (data) => {
    return fetchWithAuth('/facility/streams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update stream
   * @param {string} id
   * @param {Object} data - { name, active }
   */
  updateStream: async (id, data) => {
    return fetchWithAuth(`/facility/streams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete stream (archive)
   * @param {string} id
   */
  deleteStream: async (id) => {
    return fetchWithAuth(`/facility/streams/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get available stream names for a branch
   * @param {string} branchId
   */
  getAvailableStreamNames: async (branchId) => {
    return fetchWithAuth(`/facility/streams/branch/${branchId}/available`);
  },
};

// ============================================
// TEACHERS API (alias to userAPI.getByRole)
// ============================================

export const teacherAPI = {
  /**
   * Get all teachers
   * @returns {Promise} List of teachers
   */
  getAll: async (params = {}) => {
    return userAPI.getByRole('TEACHER', params);
  },

  /**
   * Create new teacher
   * @param {Object} teacherData - Teacher data
   * @returns {Promise} Created teacher data
   */
  create: async (teacherData) => {
    return userAPI.create({ ...teacherData, role: 'TEACHER' });
  },

  /**
   * Update teacher
   * @param {string} id - Teacher ID
   * @param {Object} teacherData - Updated teacher data
   * @returns {Promise} Updated teacher data
   */
  update: async (id, teacherData) => {
    return userAPI.update(id, teacherData);
  },

  /**
   * Delete teacher
   * @param {string} id - Teacher ID
   * @returns {Promise} Success message
   */
  delete: async (id) => {
    return userAPI.delete(id);
  },
};

// ============================================
// PARENTS API (alias to userAPI.getByRole)
// ============================================

export const parentAPI = {
  /**
   * Get all parents
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise} List of parents
   */
  getAll: async (params = {}) => {
    return userAPI.getByRole('PARENT', params);
  },

  /**
   * Create new parent
   * @param {Object} parentData - Parent data
   * @returns {Promise} Created parent data
   */
  create: async (parentData) => {
    return userAPI.create({ ...parentData, role: 'PARENT' });
  },

  /**
   * Update parent
   * @param {string} id - Parent ID
   * @param {Object} parentData - Updated parent data
   * @returns {Promise} Updated parent data
   */
  update: async (id, parentData) => {
    return userAPI.update(id, parentData);
  },

  /**
   * Archive parent (soft delete)
   * @param {string} id - Parent ID
   * @returns {Promise} Success message
   */
  archive: async (id) => {
    return userAPI.archive(id);
  },

  /**
   * Unarchive parent
   * @param {string} id - Parent ID
   * @returns {Promise} Success message
   */
  unarchive: async (id) => {
    return userAPI.unarchive(id);
  },

  /**
   * Delete parent (hard delete)
   * @param {string} id - Parent ID
   * @returns {Promise} Success message
   */
  delete: async (id) => {
    return userAPI.delete(id);
  },
};

// ============================================
// LEARNERS API
// ============================================

export const learnerAPI = {
  /**
   * Get all learners
   * @param {Object} params - Query parameters (grade, stream, status, search, page, limit)
   * @returns {Promise} List of learners
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/learners${queryString ? `?${queryString}` : ''}`);
  },
  /**
   * Get upcoming birthdays
   */
  getBirthdays: async () => {
    return fetchWithAuth('/learners/birthdays/upcoming');
  },

  /**
   * Get learner statistics
   * @returns {Promise} Learner statistics
   */
  getStats: async () => {
    return fetchWithAuth('/learners/stats');
  },

  /**
   * Get learner by ID
   * @param {string} id - Learner ID
   * @returns {Promise} Learner data
   */
  getById: async (id) => {
    return fetchWithAuth(`/learners/${id}`);
  },

  /**
   * Get learner by admission number
   * @param {string} admissionNumber - Admission number
   * @returns {Promise} Learner data
   */
  getByAdmissionNumber: async (admissionNumber) => {
    return fetchWithAuth(`/learners/admission/${admissionNumber}`);
  },

  /**
   * Get learners by grade
   * @param {string} grade - Grade level
   * @param {Object} params - Additional params (stream, status)
   * @returns {Promise} List of learners
   */
  getByGrade: async (grade, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/learners/grade/${grade}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get parent's children
   * @param {string} parentId - Parent user ID
   * @returns {Promise} List of children
   */
  getParentChildren: async (parentId) => {
    return fetchWithAuth(`/learners/parent/${parentId}`);
  },

  /**
   * Create new learner
   * @param {Object} learnerData - Learner data
   * @returns {Promise} Created learner data
   */
  create: async (learnerData) => {
    return fetchWithAuth('/learners', {
      method: 'POST',
      body: JSON.stringify(learnerData),
    });
  },

  /**
   * Update learner
   * @param {string} id - Learner ID
   * @param {Object} learnerData - Updated learner data
   * @returns {Promise} Updated learner data
   */
  update: async (id, learnerData) => {
    return fetchWithAuth(`/learners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(learnerData),
    });
  },

  /**
   * Delete learner
   * @param {string} id - Learner ID
   * @returns {Promise} Success message
   */
  delete: async (id) => {
    return fetchWithAuth(`/learners/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Upload learner photo
   * @param {string} id - Learner ID
   * @param {string} photoData - Base64 encoded image
   * @returns {Promise} Updated learner data
   */
  uploadPhoto: async (id, photoData) => {
    return fetchWithAuth(`/learners/${id}/photo`, {
      method: 'POST',
      body: JSON.stringify({ photoData }),
    });
  },

  /**
   * Process student transfer out
   * @param {Object} transferData - { learnerId, transferDate, destinationSchool, reason, certificateNumber }
   * @returns {Promise} Updated learner data
   */
  transferOut: async (transferData) => {
    return fetchWithAuth('/learners/transfer-out', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  },

  /**
   * Promote multiple learners (bulk)
   * @param {Object} promotionData - { learnerIds, nextGrade }
   * @returns {Promise} Success message
   */
  bulkPromote: async (promotionData) => {
    return fetchWithAuth('/learners/bulk-promote', {
      method: 'POST',
      body: JSON.stringify(promotionData),
    });
  },
};

// ============================================
// SUBJECT ASSIGNMENT API
// ============================================

export const subjectAssignmentAPI = {
  /**
   * Get all subject assignments
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/subject-assignments${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Create a new subject assignment
   */
  create: async (data) => {
    return fetchWithAuth('/subject-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove a subject assignment
   */
  delete: async (id) => {
    return fetchWithAuth(`/subject-assignments/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get eligible teachers for a subject and grade
   */
  getEligibleTeachers: async (learningAreaId, grade) => {
    return fetchWithAuth(`/subject-assignments/eligible-teachers?learningAreaId=${learningAreaId}&grade=${grade}`);
  },
};

// ============================================
// CLASSES API
// ============================================

export const classAPI = {
  /**
   * Get all classes
   * @param {Object} params - Query parameters (grade, stream, academicYear, term, active)
   * @returns {Promise} List of classes
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/classes${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get class by ID
   * @param {string} id - Class ID
   * @returns {Promise} Class data with enrolled learners
   */
  getById: async (id) => {
    return fetchWithAuth(`/classes/${id}`);
  },

  /**
   * Create new class
   * @param {Object} classData - Class data
   * @returns {Promise} Created class data
   */
  create: async (classData) => {
    return fetchWithAuth('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  /**
   * Update class
   * @param {string} id - Class ID
   * @param {Object} classData - Updated class data
   * @returns {Promise} Updated class data
   */
  update: async (id, classData) => {
    return fetchWithAuth(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  },

  /**
   * Enroll learner in class
   * @param {string} classId - Class ID
   * @param {string} learnerId - Learner ID
   * @returns {Promise} Enrollment data
   */
  enrollLearner: async (classId, learnerId) => {
    return fetchWithAuth('/classes/enroll', {
      method: 'POST',
      body: JSON.stringify({ classId, learnerId }),
    });
  },

  /**
   * Unenroll learner from class
   * @param {string} classId - Class ID
   * @param {string} learnerId - Learner ID
   * @returns {Promise} Success message
   */
  unenrollLearner: async (classId, learnerId) => {
    return fetchWithAuth('/classes/unenroll', {
      method: 'POST',
      body: JSON.stringify({ classId, learnerId }),
    });
  },

  /**
   * Get learner's current class
   * @param {string} learnerId - Learner ID
   * @returns {Promise} Class enrollment data
   */
  getLearnerClass: async (learnerId) => {
    return fetchWithAuth(`/classes/learner/${learnerId}`);
  },

  /**
   * Assign teacher to class (dedicated endpoint)
   * @param {string} classId - Class ID
   * @param {string} teacherId - Teacher ID
   * @returns {Promise} Updated class data
   */
  assignTeacher: async (classId, teacherId) => {
    return fetchWithAuth('/classes/assign-teacher', {
      method: 'POST',
      body: JSON.stringify({ classId, teacherId }),
    });
  },

  /**
   * Unassign teacher from class
   * @param {string} classId - Class ID
   * @returns {Promise} Success message
   */
  unassignTeacher: async (classId) => {
    return fetchWithAuth('/classes/unassign-teacher', {
      method: 'POST',
      body: JSON.stringify({ classId }),
    });
  },

  /**
   * Get teacher's workload
   * @param {string} teacherId - Teacher ID
   * @param {Object} params - Query parameters (academicYear, term)
   * @returns {Promise} Teacher workload data
   */
  getTeacherWorkload: async (teacherId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/classes/teacher/${teacherId}/workload${queryString ? `?${queryString}` : ''}`);
  },
  getTeacherSchedules: async (teacherId) => {
    return fetchWithAuth(`/classes/teacher/${teacherId}/schedules`);
  },

  /**
   * Get schedules for a specific class
   */
  getSchedules: async (classId) => {
    return fetchWithAuth(`/classes/${classId}/schedules`);
  },

  /**
   * Add a schedule to a class
   */
  addSchedule: async (classId, data) => {
    return fetchWithAuth(`/classes/${classId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a schedule
   */
  updateSchedule: async (classId, scheduleId, data) => {
    return fetchWithAuth(`/classes/${classId}/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a schedule
   */
  deleteSchedule: async (classId, scheduleId) => {
    return fetchWithAuth(`/classes/${classId}/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// ATTENDANCE API
// ============================================

export const attendanceAPI = {
  /**
   * Mark attendance for a single learner
   * @param {Object} attendanceData - { learnerId, date, status, classId, remarks }
   * @returns {Promise} Attendance record
   */
  mark: async (attendanceData) => {
    return fetchWithAuth('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  },

  /**
   * Mark attendance for multiple learners (bulk)
   * @param {Object} bulkData - { date, classId, attendanceRecords }
   * @returns {Promise} Bulk operation results
   */
  markBulk: async (bulkData) => {
    return fetchWithAuth('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  },

  /**
   * Get attendance records
   * @param {Object} params - Query parameters (date, startDate, endDate, learnerId, classId, status)
   * @returns {Promise} List of attendance records
   */
  getRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get attendance statistics
   * @param {Object} params - Query parameters (startDate, endDate, classId, learnerId)
   * @returns {Promise} Attendance statistics
   */
  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance/stats${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get daily class attendance report
   * @param {string} classId - Class ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise} Daily attendance report with all learners
   */
  getDailyClassReport: async (classId, date) => {
    return fetchWithAuth(`/attendance/class/daily?classId=${classId}&date=${date}`);
  },

  /**
   * Get learner attendance summary
   * @param {string} learnerId - Learner ID
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise} Learner attendance summary
   */
  getLearnerSummary: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/attendance/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
};

// ============================================
// ASSESSMENTS API
// ============================================

export const assessmentAPI = {
  // ============================================
  // FORMATIVE ASSESSMENTS
  // ============================================

  /**
   * Create or update formative assessment
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise} Created/updated assessment
   */
  createFormative: async (assessmentData) => {
    return fetchWithAuth('/assessments/formative', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  },

  /**
   * Record bulk formative assessments
   * @param {Object} bulkData - Formative assessment bulk data
   * @returns {Promise} Processing summary
   */
  recordFormativeBulk: async (bulkData) => {
    return fetchWithAuth('/assessments/formative/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  },

  /**
   * Get all formative assessments with filters
   * @param {Object} params - Query parameters (term, academicYear, learningArea, grade)
   * @returns {Promise} List of formative assessments
   */
  getFormativeAssessments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/formative${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get formative assessments for a specific learner
   * @param {string} learnerId - Learner ID
   * @param {Object} params - Query parameters (term, academicYear)
   * @returns {Promise} List of learner's formative assessments
   */
  getFormativeByLearner: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/formative/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Delete formative assessment
   * @param {string} id - Assessment ID
   * @returns {Promise} Success message
   */
  deleteFormative: async (id) => {
    return fetchWithAuth(`/assessments/formative/${id}`, {
      method: 'DELETE',
    });
  },

  // ============================================
  // SUMMATIVE TESTS
  // ============================================

  /**
   * Create summative test
   * @param {Object} testData - Test data
   * @returns {Promise} Created test
   */
  createTest: async (testData) => {
    return fetchWithAuth('/assessments/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  },

  /**
   * Bulk create summative tests
   * @param {Object} bulkData - Bulk test data (grades, term, year, etc.)
   * @returns {Promise} Creation summary
   */
  bulkCreateTests: async (bulkData) => {
    return fetchWithAuth('/assessments/tests/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  },

  /**
   * Get all summative tests with filters
   * @param {Object} params - Query parameters (term, academicYear, grade, learningArea, published)
   * @returns {Promise} List of tests
   */
  getTests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/tests${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get single test with results
   * @param {string} id - Test ID
   * @returns {Promise} Test data with results and statistics
   */
  getTest: async (id) => {
    return fetchWithAuth(`/assessments/tests/${id}`);
  },

  /**
   * Update summative test
   * @param {string} id - Test ID
   * @param {Object} testData - Updated test data
   * @returns {Promise} Updated test
   */
  updateTest: async (id, testData) => {
    return fetchWithAuth(`/assessments/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(testData),
    });
  },

  /**
   * Delete summative test
   * @param {string} id - Test ID
   * @returns {Promise} Success message
   */
  deleteTest: async (id) => {
    return fetchWithAuth(`/assessments/tests/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Delete multiple summative tests
   * @param {string[]} ids - Array of test IDs
   * @returns {Promise} Processing summary
   */
  deleteTestsBulk: async (ids) => {
    return fetchWithAuth('/assessments/tests/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },

  // ============================================
  // SUMMATIVE RESULTS
  // ============================================

  /**
   * Record summative result
   * @param {Object} resultData - Result data (testId, learnerId, marksObtained, remarks, teacherComment)
   * @returns {Promise} Recorded result
   */
  recordResult: async (resultData) => {
    return fetchWithAuth('/assessments/summative/results', {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  },

  /**
   * Record bulk summative results
   * @param {Object} bulkData - { testId, results: [{ learnerId, marksObtained }] }
   * @returns {Promise} Bulk result
   */
  recordBulkResults: async (bulkData) => {
    return fetchWithAuth('/assessments/summative/results/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  },

  /**
   * Get bulk summative results for classes/reports
   * @param {Object} params - { grade, stream, academicYear, term }
   * @returns {Promise} List of results
   */
  getBulkResults: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/summative/results/bulk${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get summative results for a learner
   * @param {string} learnerId - Learner ID
   * @param {Object} params - Query parameters (term, academicYear)
   * @returns {Promise} List of learner's results
   */
  getSummativeByLearner: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/assessments/summative/results/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get all results for a specific test
   * @param {string} testId - Test ID
   * @returns {Promise} List of test results
   */
  async getTestResults(testId) {
    return fetchWithAuth(`/assessments/summative/results/test/${testId}`);
  },

  /**
   * Upload bulk assessments (scores) from Excel/CSV
   * @param {FormData} formData - Contains the file and other parameters
   * @returns {Promise} Upload result summary
   */
  async uploadBulk(formData) {
    return fetchWithAuth('/bulk/assessments/upload', {
      method: 'POST',
      body: formData,
      // Header for FormData is handled automatically by fetch if body is FormData
      headers: {}
    });
  },

  // ============================================
  // SETUP ENDPOINTS (BULK OPERATIONS)
  // ============================================

  /**
   * Create all grading scales for the school
   * @param {Object} data - Setup data (optional: overwrite flag)
   * @returns {Promise} Creation summary with count
   */
  createScalesForSchool: async (data = {}) => {
    return fetchWithAuth('/assessments/setup/create-scales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create all summative tests linked to scales
   * @param {Object} data - Setup data (term, academicYear, overwrite)
   * @returns {Promise} Creation summary with count
   */
  createTestsForScales: async (data) => {
    return fetchWithAuth('/assessments/setup/create-tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete school setup: create scales and tests atomically
   * @param {Object} data - Setup data (term, academicYear, overwrite)
   * @returns {Promise} Complete setup summary
   */
  completeSchoolSetup: async (data) => {
    return fetchWithAuth('/assessments/setup/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// ============================================
// FEE MANAGEMENT API
// ============================================

export const feeAPI = {
  /**
   * Get all fee structures
   * @param {Object} params - Query parameters
   * @returns {Promise} Fee structures
   */
  getAllFeeStructures: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/structures${query ? `?${query}` : ''}`);
  },

  /**
   * Create fee structure
   * @param {Object} data - Fee structure data
   * @returns {Promise} Created fee structure
   */
  createFeeStructure: async (data) => {
    return fetchWithAuth('/fees/structures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update fee structure
   * @param {string} id - Fee structure ID
   * @param {Object} data - Updated data
   * @returns {Promise} Updated fee structure
   */
  updateFeeStructure: async (id, data) => {
    return fetchWithAuth(`/fees/structures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete fee structure
   * @param {string} id - Fee structure ID
   * @returns {Promise} Success message
   */
  deleteFeeStructure: async (id) => {
    return fetchWithAuth(`/fees/structures/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all invoices
   * @param {Object} params - Query parameters
   * @returns {Promise} Invoices
   */
  getAllInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/invoices${query ? `?${query}` : ''}`);
  },

  /**
   * Get learner invoices
   * @param {string} learnerId - Learner ID
   * @returns {Promise} Learner invoices
   */
  getLearnerInvoices: async (learnerId) => {
    return fetchWithAuth(`/fees/invoices/learner/${learnerId}`);
  },

  /**
   * Create invoice
   * @param {Object} data - Invoice data
   * @returns {Promise} Created invoice
   */
  createInvoice: async (data) => {
    return fetchWithAuth('/fees/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Bulk generate invoices
   * @param {Object} data - Bulk generation data
   * @returns {Promise} Created invoices
   */
  bulkGenerateInvoices: async (data) => {
    return fetchWithAuth('/fees/invoices/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Record payment
   * @param {Object} data - Payment data
   * @returns {Promise} Payment record
   */
  recordPayment: async (data) => {
    return fetchWithAuth('/fees/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all fee types
   * @param {Object} params - Query parameters (category, active)
   * @returns {Promise} Fee types
   */
  getAllFeeTypes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/types${query ? `?${query}` : ''}`);
  },

  /**
   * Seed default fee types for school
   * @returns {Promise} Result with created count
   */
  seedDefaultFeeTypes: async () => {
    return fetchWithAuth('/fees/types/seed/defaults', {
      method: 'POST'
    });
  },

  /**
   * Seed default fee structures for all grades and terms
   * @returns {Promise} Result with created count
   */
  seedDefaultFeeStructures: async () => {
    return fetchWithAuth('/fees/types/seed/structures', {
      method: 'POST'
    });
  },

  /**
   * Get payment statistics
   * @param {Object} params - Query parameters
   * @returns {Promise} Payment stats
   */
  getPaymentStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/stats${query ? `?${query}` : ''}`);
  },

  /**
   * Reset all invoices and payments
   * @returns {Promise} Success message
   */
  resetInvoices: async () => {
    return fetchWithAuth('/fees/invoices/reset', {
      method: 'DELETE',
    });
  },

  /**
   * Send invoice reminder
   */
  sendReminder: async (id, data) => {
    return fetchWithAuth(`/fees/invoices/${id}/remind`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Bulk send reminders
   */
  bulkSendReminders: async (data) => {
    return fetchWithAuth('/fees/invoices/remind/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationAPI = {
  /**
   * Send assessment completion notification to parent
   * @param {Object} data - { learnerId, assessmentType, subject, grade, term }
   * @returns {Promise} Send result
   */
  sendAssessmentNotification: async (data) => {
    return fetchWithAuth('/notifications/assessment-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send bulk assessment notifications
   * @param {Object} data - { learnerIds, assessmentType, subject, grade, term }
   * @returns {Promise} Bulk send result
   */
  sendBulkAssessmentNotifications: async (data) => {
    return fetchWithAuth('/notifications/assessment-complete/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send custom message to parent
   * @param {Object} data - { parentId, message }
   * @returns {Promise} Send result
   */
  sendCustomMessage: async (data) => {
    return fetchWithAuth('/notifications/custom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send announcement to all parents or filtered group
   * @param {Object} data - { title, content, grade, stream }
   * @returns {Promise} Send result
   */
  sendAnnouncement: async (data) => {
    return fetchWithAuth('/notifications/announcement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send assessment report via SMS to parent
   * @param {Object} data - Assessment report details
   * @returns {Promise} Send result
   */
  sendAssessmentReportSms: async (data) => {
    return fetchWithAuth('/notifications/sms/assessment-report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Send assessment report via WhatsApp to parent
   * @param {Object} data - Assessment report details
   * @returns {Promise} Send result
   */
  sendAssessmentReportWhatsApp: async (data) => {
    return fetchWithAuth('/notifications/whatsapp/assessment-report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Test WhatsApp connection
   * @param {string} phoneNumber - Phone number to test
   * @returns {Promise} Test result
   */
  testWhatsApp: async (phoneNumber) => {
    return fetchWithAuth('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  },

  /**
   * Get WhatsApp connection status
   * @returns {Promise} Status object { status, qrCode }
   */
  getWhatsAppStatus: async () => {
    return fetchWithAuth('/notifications/whatsapp/status');
  },
};

// ============================================
// REPORTS API (NEW)
// ============================================

export const reportAPI = {
  /**
   * Get comprehensive formative report for a learner
   * @param {string} learnerId - Learner ID
   * @param {Object} params - { term, academicYear }
   * @returns {Promise} Formative report data
   */
  getFormativeReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/formative/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get comprehensive summative report for a learner
   * @param {string} learnerId - Learner ID
   * @param {Object} params - { term, academicYear }
   * @returns {Promise} Summative report data
   */
  getSummativeReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/summative/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get complete termly report (formative + summative + attendance + CBC elements)
   * @param {string} learnerId - Learner ID
   * @param {Object} params - { term, academicYear }
   * @returns {Promise} Complete termly report data
   */
  getTermlyReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/termly/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get class-level performance analytics
   * @param {string} classId - Class ID
   * @param {Object} params - { term, academicYear }
   * @returns {Promise} Class analytics data
   */
  getClassAnalytics: async (classId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/analytics/class/${classId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get individual learner analytics (year-long progress)
   * @param {string} learnerId - Learner ID
   * @param {Object} params - { academicYear }
   * @returns {Promise} Learner analytics data
   */
  getLearnerAnalytics: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/analytics/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Generate high-fidelity PDF from HTML
   * @param {Object} data - { html, fileName, options }
   * @returns {Promise<Blob>} PDF Blob
   */
  generatePdf: async (data) => {
    try {
      const response = await axiosInstance.post('/reports/generate-pdf', data, {
        responseType: 'blob'
      });

      const blob = response.data;
      console.log(`✅ PDF Received: ${blob.size} bytes (${blob.type})`);

      if (blob.size < 100) {
        console.warn('⚠️ PDF Blob is suspiciously small');
      }

      return blob;
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      throw new Error(error.response?.data?.message || 'PDF Generation failed');
    }
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthAPI = {
  /**
   * Check if backend is reachable
   * @returns {Promise} Health status
   */
  check: async () => {
    try {
      const response = await axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend server is not reachable');
    }
  },
};

// ============================================
// CBC ASSESSMENT API (NEW)
// ============================================

export const cbcAPI = {
  // Core Competencies
  saveCompetencies: async (data) => {
    return fetchWithAuth('/cbc/competencies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCompetencies: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/competencies/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  // Values Assessment
  saveValues: async (data) => {
    return fetchWithAuth('/cbc/values', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getValues: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/values/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  // Co-Curricular Activities
  createCoCurricular: async (data) => {
    return fetchWithAuth('/cbc/cocurricular', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCoCurricular: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/cocurricular/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },

  updateCoCurricular: async (id, data) => {
    return fetchWithAuth(`/cbc/cocurricular/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCoCurricular: async (id) => {
    return fetchWithAuth(`/cbc/cocurricular/${id}`, {
      method: 'DELETE',
    });
  },

  // Termly Report Comments
  saveComments: async (data) => {
    return fetchWithAuth('/cbc/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getComments: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/comments/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
};

// ============================================
// WORKFLOW API
// ============================================

export const workflowAPI = {
  submit: async (data) => {
    return fetchWithAuth('/workflow/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  bulkSubmit: async (data) => {
    return fetchWithAuth('/workflow/bulk-submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  approve: async (type, id, data = {}) => {
    return fetchWithAuth(`/workflow/approve/${type}/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  reject: async (type, id, data) => {
    return fetchWithAuth(`/workflow/reject/${type}/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  publish: async (type, id) => {
    return fetchWithAuth(`/workflow/publish/${type}/${id}`, {
      method: 'POST',
    });
  },
  getHistory: async (type, id) => {
    return fetchWithAuth(`/workflow/history/${type}/${id}`);
  },
  approveBulk: async (ids, assessmentType, comments = '') => {
    return fetchWithAuth('/workflow/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids, assessmentType, comments }),
    });
  },
  unlock: async (type, id, reason) => {
    return fetchWithAuth(`/workflow/unlock/${type}/${id}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
};

// ============================================
// GRADING API
// ============================================

export const gradingAPI = {
  getSystems: async (schoolId) => {
    return fetchWithAuth(`/grading/systems`);
  },

  createSystem: async (data) => {
    return fetchWithAuth('/grading/system', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSystem: async (id, data) => {
    return fetchWithAuth(`/grading/system/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSystem: async (id) => {
    return fetchWithAuth(`/grading/system/${id}`, {
      method: 'DELETE',
    });
  },

  updateRange: async (id, data) => {
    return fetchWithAuth(`/grading/range/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  createRange: async (data) => {
    return fetchWithAuth('/grading/range', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteRange: async (id) => {
    return fetchWithAuth(`/grading/range/${id}`, {
      method: 'DELETE',
    });
  },

  // Scale Group endpoints
  getScaleGroups: async () => {
    return fetchWithAuth('/grading/scale-groups');
  },

  getScaleGroupById: async (id) => {
    return fetchWithAuth(`/grading/scale-groups/${id}`);
  },

  createScaleGroup: async (data) => {
    return fetchWithAuth('/grading/scale-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateScaleGroup: async (id, data) => {
    return fetchWithAuth(`/grading/scale-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteScaleGroup: async (id) => {
    return fetchWithAuth(`/grading/scale-groups/${id}`, {
      method: 'DELETE',
    });
  },

  generateGradesForGroup: async (id, data) => {
    return fetchWithAuth(`/grading/scale-groups/${id}/generate-grades`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getScaleForTest: async (groupId, grade, learningArea) => {
    const params = new URLSearchParams({ grade });
    if (learningArea) params.append('learningArea', learningArea);
    return fetchWithAuth(`/grading/scale-groups/${groupId}/for-test?${params.toString()}`);
  },

  // Setup endpoints for bulk operations
  createTestsForScales: async (data) => {
    return fetchWithAuth('/assessments/setup/create-tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createScalesForSchool: async (data = {}) => {
    return fetchWithAuth('/assessments/setup/create-scales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  completeSchoolSetup: async (data) => {
    return fetchWithAuth('/assessments/setup/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

// ============================================
// ADMIN API
// ============================================
export const adminAPI = {
  getSchoolInfo: async () => {
    return fetchCached('/settings/school-info');
  },
  listSchools: async () => {
    return fetchWithAuth('/admin/schools');
  },
  provision: async (data) => {
    return fetchWithAuth('/admin/schools/provision', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  listPlans: async () => {
    return fetchWithAuth('/admin/plans');
  },
  reactivateSchool: async (schoolId) => {
    return fetchWithAuth(`/admin/schools/${schoolId}/reactivate`, {
      method: 'PATCH',
    });
  },
  approvePayment: async (schoolId, payload) => {
    return fetchWithAuth(`/admin/schools/${schoolId}/approve-payment`, {
      method: 'PATCH',
      body: JSON.stringify(payload || {}),
    });
  },
  trialMetrics: async () => {
    return fetchWithAuth('/admin/trials/metrics');
  },
  getSchoolModules: async (schoolId) => {
    return fetchWithAuth(`/admin/schools/${schoolId}/modules`);
  },
  setSchoolModule: async (schoolId, moduleKey, active) => {
    return fetchWithAuth(`/admin/schools/${schoolId}/modules/${moduleKey}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  },
  switchSchool: async (schoolId) => {
    const resp = await fetchWithAuth(`/admin/switch-school/${schoolId}`, { method: 'POST', headers: { 'X-School-Id': schoolId } });
    return resp;
  },
  getSchoolCommunication: async (schoolId) => {
    return fetchWithAuth(`/admin/schools/${schoolId}/communication`);
  },
  updateSchoolCommunication: async (schoolId, data) => {
    return fetchWithAuth(`/admin/schools/${schoolId}/communication`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// DOCUMENTS API
// ============================================

export const documentsAPI = {
  /**
   * Get all documents
   * @param {Object} params - { category, search, page, limit }
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/documents${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get document categories
   */
  getCategories: async () => {
    return fetchWithAuth('/documents/categories');
  },

  /**
   * Upload a single document
   * @param {FormData} formData - Contains 'file', 'category', 'name'
   */
  upload: async (formData) => {
    return fetchWithAuth('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Upload multiple documents
   * @param {FormData} formData - Contains 'files', 'category'
   */
  uploadMultiple: async (formData) => {
    return fetchWithAuth('/documents/upload-multiple', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Update document metadata
   */
  update: async (id, data) => {
    return fetchWithAuth(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a document
   */
  delete: async (id) => {
    return fetchWithAuth(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// BOOKS & RESOURCES API
// ============================================
export const bookAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/books${queryString ? `?${queryString}` : ''}`);
  },
  create: async (data) => {
    return fetchWithAuth('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return fetchWithAuth(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  assign: async (id, userId) => {
    return fetchWithAuth(`/books/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
  return: async (id) => {
    return fetchWithAuth(`/books/${id}/return`, {
      method: 'POST',
    });
  },
  delete: async (id) => {
    return fetchWithAuth(`/books/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// SHARING & COMMUNICATION API
// ============================================
export const sharingAPI = {
  shareDocumentWhatsApp: async (documentId, phoneNumber) => {
    return fetchWithAuth('/notifications/whatsapp/share-document', {
      method: 'POST',
      body: JSON.stringify({ documentId, phoneNumber }),
    });
  },
};

// ============================================
// HR API
// ============================================

export const hrAPI = {
  getStaffDirectory: async () => {
    return fetchWithAuth('/hr/staff');
  },
  updateStaffHR: async (id, data) => {
    return fetchWithAuth(`/hr/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  getLeaveTypes: async () => {
    return fetchWithAuth('/hr/leave/types');
  },
  submitLeaveRequest: async (data) => {
    return fetchWithAuth('/hr/leave/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getLeaveRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/hr/leave/requests?${queryString}`);
  },
  approveLeaveRequest: async (requestId, data) => {
    return fetchWithAuth(`/hr/leave/approve/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  generatePayroll: async (data) => {
    return fetchWithAuth('/hr/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getPayrollRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/hr/payroll?${queryString}`);
  },

  // Performance Management
  getPerformanceReviews: async (userId) => {
    const url = userId ? `/hr/performance?userId=${userId}` : '/hr/performance';
    return fetchWithAuth(url);
  },
  createPerformanceReview: async (data) => {
    return fetchWithAuth('/hr/performance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updatePerformanceReview: async (id, data) => {
    return fetchWithAuth(`/hr/performance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// ACCOUNTING API
// ============================================

export const accountingAPI = {
  initializeCoA: async (schoolId) => {
    return fetchWithAuth('/accounting/initialize', {
      method: 'POST',
      body: JSON.stringify({ schoolId }),
    });
  },
  getAccounts: async (schoolId) => {
    return fetchWithAuth(`/accounting/accounts?schoolId=${schoolId}`);
  },
  getBalances: async (schoolId) => {
    return fetchWithAuth(`/accounting/balances?schoolId=${schoolId}`);
  },
  getJournals: async (schoolId) => {
    return fetchWithAuth(`/accounting/journals?schoolId=${schoolId}`);
  },
  createJournalEntry: async (data) => {
    return fetchWithAuth('/accounting/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  postJournalEntry: async (id) => {
    return fetchWithAuth(`/accounting/entries/${id}/post`, {
      method: 'POST',
    });
  },
  getVendors: async () => {
    return fetchWithAuth('/accounting/vendors');
  },
  createVendor: async (data) => {
    return fetchWithAuth('/accounting/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  recordExpense: async (data) => {
    return fetchWithAuth('/accounting/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getBankStatements: async () => {
    return fetchWithAuth('/accounting/bank-statements');
  },
  importBankStatement: async (data) => {
    return fetchWithAuth('/accounting/bank-statements/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  reconcileLine: async (data) => {
    return fetchWithAuth('/accounting/bank-statements/reconcile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getReport: async (type, startDate, endDate) => {
    return fetchWithAuth(`/accounting/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`);
  },
  getTrialBalance: async (startDate, endDate) => {
    return fetchWithAuth(`/accounting/reports/trial-balance?startDate=${startDate}&endDate=${endDate}`);
  },
};

export const inventoryAPI = {
  // Categories
  getCategories: async () => fetchWithAuth('/inventory/categories'),
  createCategory: async (data) => fetchWithAuth('/inventory/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Stores
  getStores: async () => fetchWithAuth('/inventory/stores'),
  createStore: async (data) => fetchWithAuth('/inventory/stores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Items
  getItems: async (categoryId) => fetchWithAuth(`/inventory/items${categoryId ? `?categoryId=${categoryId}` : ''}`),
  createItem: async (data) => fetchWithAuth('/inventory/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Movements
  getMovements: async () => fetchWithAuth('/inventory/movements'),
  recordMovement: async (data) => fetchWithAuth('/inventory/movements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Requisitions
  getRequisitions: async () => fetchWithAuth('/inventory/requisitions'),
  createRequisition: async (data) => fetchWithAuth('/inventory/requisitions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRequisitionStatus: async (id, status) => fetchWithAuth(`/inventory/requisitions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Assets
  getAssetRegister: async () => fetchWithAuth('/inventory/assets'),
  registerAsset: async (data) => fetchWithAuth('/inventory/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  assignAsset: async (data) => fetchWithAuth('/inventory/assets/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Export all APIs
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
  notifications: {
    getAuditLogs: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/notifications/audit-logs?${queryString}`);
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
  broadcasts: broadcastAPI,
  books: bookAPI,
  sharing: sharingAPI,
  ...configAPI,
  planner: {
    getEvents: async (params) => {
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/planner/events?${queryString}`);
    },
    createEvent: async (data) => {
      return fetchWithAuth('/planner/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateEvent: async (id, data) => {
      return fetchWithAuth(`/planner/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteEvent: async (id) => {
      return fetchWithAuth(`/planner/events/${id}`, {
        method: 'DELETE',
      });
    },
  },
  hr: hrAPI,
  accounting: accountingAPI,
  inventory: inventoryAPI,
};

export default api;
