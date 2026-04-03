import api from './client'

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
}

// User
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
}

// Resumes
export const resumeAPI = {
  create: (data) => api.post('/resumes', data),
  getAll: () => api.get('/resumes'),
  getOne: (id) => api.get(`/resumes/${id}`),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  download: (id) => api.get(`/resumes/${id}/download`, { responseType: 'blob' }),
  setDefault: (id) => api.patch(`/resumes/${id}/default`),
}

// ATS
export const atsAPI = {
  analyze: (formData) => api.post('/ats/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: () => api.get('/ats/history'),
}

// Interviews
export const interviewAPI = {
  setup: (data) => api.post('/interviews/setup', data),
  start: (id) => api.patch(`/interviews/${id}/start`),
  submitAnswer: (id, data) => api.patch(`/interviews/${id}/answer`, data),
  complete: (id) => api.patch(`/interviews/${id}/complete`),
  getHistory: () => api.get('/interviews/history'),
  getOne: (id) => api.get(`/interviews/${id}`),
}

// Job Match
export const jobmatchAPI = {
  analyze: (data) => api.post('/jobmatch/analyze', data),
  getHistory: () => api.get('/jobmatch/history'),
}

// Cover Letter
export const coverletterAPI = {
  generate: (data) => api.post('/coverletter/generate', data),
  getAll: () => api.get('/coverletter'),
  getOne: (id) => api.get(`/coverletter/${id}`),
  delete: (id) => api.delete(`/coverletter/${id}`),
}

// Progress
export const progressAPI = {
  getDashboard: () => api.get('/progress/dashboard'),
  getHistory: () => api.get('/progress/history'),
}

// Subscription
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getMySubscription: () => api.get('/subscription/me'),
  getUsage: () => api.get('/subscription/usage'),
  createOrder: () => api.post('/subscription/create-order'),
  verifyPayment: (data) => api.post('/subscription/verify', data),
  cancel: () => api.post('/subscription/cancel'),
}
