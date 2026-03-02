import api from '../api';

/**
 * Performance Scale Service
 * Handles all API calls related to performance scales (grading systems)
 */

const performanceScaleService = {
  /**
   * Get all performance scales for a school
   * @param {string} schoolId - The school ID
   * @returns {Promise<Array>} List of performance scales
   */
  getPerformanceScales: async (schoolId) => {
    try {
      const response = await api.get(`/api/grading/school/${schoolId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance scales:', error);
      throw error;
    }
  },

  /**
   * Create a new performance scale
   * @param {Object} scaleData - The scale data
   * @param {string} scaleData.schoolId - School ID
   * @param {string} scaleData.name - Scale name
   * @param {string} scaleData.type - Scale type (SUMMATIVE or CBC)
   * @param {Array} scaleData.ranges - Array of grading ranges
   * @returns {Promise<Object>} Created performance scale
   */
  createPerformanceScale: async (scaleData) => {
    try {
      const response = await api.post('/api/grading/system', scaleData);
      return response.data;
    } catch (error) {
      console.error('Error creating performance scale:', error);
      throw error;
    }
  },

  /**
   * Update an existing performance scale
   * @param {string} scaleId - The scale ID
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} Updated performance scale
   */
  updatePerformanceScale: async (scaleId, updateData) => {
    try {
      const response = await api.put(`/api/grading/system/${scaleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating performance scale:', error);
      throw error;
    }
  },

  /**
   * Delete a performance scale
   * @param {string} scaleId - The scale ID
   * @returns {Promise<Object>} Deletion result
   */
  deletePerformanceScale: async (scaleId) => {
    try {
      const response = await api.delete(`/api/grading/system/${scaleId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting performance scale:', error);
      throw error;
    }
  },

  /**
   * Create a new grading range for a scale
   * @param {Object} rangeData - The range data
   * @returns {Promise<Object>} Created grading range
   */
  createGradingRange: async (rangeData) => {
    try {
      const response = await api.post('/api/grading/range', rangeData);
      return response.data;
    } catch (error) {
      console.error('Error creating grading range:', error);
      throw error;
    }
  },

  /**
   * Update a grading range
   * @param {string} rangeId - The range ID
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} Updated grading range
   */
  updateGradingRange: async (rangeId, updateData) => {
    try {
      const response = await api.put(`/api/grading/range/${rangeId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating grading range:', error);
      throw error;
    }
  },

  /**
   * Delete a grading range
   * @param {string} rangeId - The range ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteGradingRange: async (rangeId) => {
    try {
      const response = await api.delete(`/api/grading/range/${rangeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting grading range:', error);
      throw error;
    }
  }
};

export default performanceScaleService;
