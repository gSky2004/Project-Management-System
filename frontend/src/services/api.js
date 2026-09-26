import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('adminName')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
}

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  search: (keyword) => api.get(`/projects/search?keyword=${keyword}`),
}

export const clientAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  search: (keyword) => api.get(`/clients/search?keyword=${keyword}`),
}

export const teamMemberAPI = {
  getAll: () => api.get('/team-members'),
  getById: (id) => api.get(`/team-members/${id}`),
  create: (data) => api.post('/team-members', data),
  update: (id, data) => api.put(`/team-members/${id}`, data),
  delete: (id) => api.delete(`/team-members/${id}`),
}

export const taskAPI = {
  getAll: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  search: (keyword) => api.get(`/tasks/search?keyword=${keyword}`),
  getByProject: (projectId) => api.get(`/tasks/by-project/${projectId}`),
}

export const assignmentAPI = {
  getAll: () => api.get('/assignments'),
  getByProject: (projectId) => api.get(`/assignments/by-project/${projectId}`),
  create: (data) => api.post('/assignments', data),
  delete: (id) => api.delete(`/assignments/${id}`),
}

export const progressReportAPI = {
  getAll: () => api.get('/progress-reports'),
  getByProject: (projectId) => api.get(`/progress-reports/by-project/${projectId}`),
  create: (data) => api.post('/progress-reports', data),
}
