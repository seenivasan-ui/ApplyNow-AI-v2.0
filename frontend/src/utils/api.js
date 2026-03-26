import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export default api

export const fetchStats = () => api.get('/jobs/stats').then(r => r.data)
export const fetchJobs = (params) => api.get('/jobs', { params }).then(r => r.data)
export const fetchProfile = () => api.get('/profile').then(r => r.data)
export const updateProfile = (data) => api.put('/profile', data).then(r => r.data)
export const fetchAgentStatus = () => api.get('/agent/status').then(r => r.data)
export const startAgent = () => api.post('/agent/start').then(r => r.data)
export const stopAgent = () => api.post('/agent/stop').then(r => r.data)
export const fetchNotifications = () => api.get('/notifications').then(r => r.data)
export const updateJobStatus = (url, status) => api.patch(`/jobs/${encodeURIComponent(url)}`, { status }).then(r => r.data)
