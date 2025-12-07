import axios, { AxiosError } from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle different error status codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          // Forbidden
          console.error('Access forbidden')
          break
        case 404:
          // Not found
          console.error('Resource not found')
          break
        case 500:
          // Server error
          console.error('Server error')
          break
        default:
          console.error('API error:', error.response.status)
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message)
    }

    return Promise.reject(error)
  }
)

// API service object with commonly used methods
export const apiService = {
  // Generic methods
  get: <T>(url: string, config = {}) => api.get<T>(url, config),
  post: <T>(url: string, data?: any, config = {}) => api.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config = {}) => api.put<T>(url, data, config),
  patch: <T>(url: string, data?: any, config = {}) => api.patch<T>(url, data, config),
  delete: <T>(url: string, config = {}) => api.delete<T>(url, config),

  // Auth methods
  auth: {
    login: (email: string, password: string) =>
      api.post('/auth/login', { email, password }),
    logout: () =>
      api.post('/auth/logout'),
    register: (data: { email: string; password: string; name: string; role: string }) =>
      api.post('/auth/register', data),
    me: () =>
      api.get('/auth/me'),
  },

  // Inspections methods
  inspections: {
    list: (params?: any) =>
      api.get('/inspections', { params }),
    get: (id: string) =>
      api.get(`/inspections/${id}`),
    create: (data: any) =>
      api.post('/inspections', data),
    update: (id: string, data: any) =>
      api.put(`/inspections/${id}`, data),
    delete: (id: string) =>
      api.delete(`/inspections/${id}`),
    submit: (id: string) =>
      api.post(`/inspections/${id}/submit`),
  },

  // Projects methods
  projects: {
    list: (params?: any) =>
      api.get('/projects', { params }),
    get: (id: string) =>
      api.get(`/projects/${id}`),
    create: (data: any) =>
      api.post('/projects', data),
    update: (id: string, data: any) =>
      api.put(`/projects/${id}`, data),
    delete: (id: string) =>
      api.delete(`/projects/${id}`),
  },

  // Users methods
  users: {
    list: (params?: any) =>
      api.get('/users', { params }),
    get: (id: string) =>
      api.get(`/users/${id}`),
    create: (data: any) =>
      api.post('/users', data),
    update: (id: string, data: any) =>
      api.put(`/users/${id}`, data),
    delete: (id: string) =>
      api.delete(`/users/${id}`),
  },

  // Reports methods
  reports: {
    generate: (inspectionId: string) =>
      api.post(`/reports/generate/${inspectionId}`),
    download: (reportId: string) =>
      api.get(`/reports/${reportId}/download`, { responseType: 'blob' }),
  },

  // File upload
  upload: {
    photo: (file: File, metadata?: any) => {
      const formData = new FormData()
      formData.append('file', file)
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }
      return api.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    signature: (file: Blob, metadata?: any) => {
      const formData = new FormData()
      formData.append('file', file)
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }
      return api.post('/upload/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
  },
}

export default api
