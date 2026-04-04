/**
 * useApi Hook
 * Provides a unified apiCall function wrapping axiosInstance.
 * Returns the full axios response so callers can access response.data (the server JSON body).
 *
 * Usage:
 *   const { apiCall } = useApi()
 *   const response = await apiCall('/lms/courses')                 // GET
 *   const response = await apiCall('/lms/courses', 'POST', body)   // POST
 *   response.data.courses  →  server JSON payload
 */

import { useCallback } from 'react'
import axiosInstance from '../services/api/axiosConfig'

export const useApi = () => {
  const apiCall = useCallback(async (url, method = 'GET', data = null) => {
    const config = {
      url,
      method,
      ...(data && { data }),
    }
    // axiosInstance returns { data, status, headers, ... }
    // response.data is the raw server JSON body e.g. { success: true, data: [...], pagination: {...} }
    return axiosInstance(config)
  }, [])

  return { apiCall }
}
