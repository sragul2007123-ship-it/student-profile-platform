const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  const response = await fetch(url, config)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }
  return response.json()
}

export const api = {
  // Profile
  getProfile: (userId) => request(`/profile/${userId}`),
  getPublicProfile: (username) => request(`/profile/username/${username}`),
  updateProfile: (userId, data) => request(`/profile/${userId}`, { method: 'PUT', body: data }),

  // Skills
  getSkills: (userId) => request(`/skills/${userId}`),
  addSkill: (userId, data) => request(`/skills/${userId}`, { method: 'POST', body: data }),
  updateSkill: (skillId, data) => request(`/skills/${skillId}`, { method: 'PUT', body: data }),
  deleteSkill: (skillId) => request(`/skills/${skillId}`, { method: 'DELETE' }),

  // Projects
  getProjects: (userId) => request(`/projects/${userId}`),
  addProject: (userId, data) => request(`/projects/${userId}`, { method: 'POST', body: data }),
  updateProject: (projectId, data) => request(`/projects/${projectId}`, { method: 'PUT', body: data }),
  deleteProject: (projectId) => request(`/projects/${projectId}`, { method: 'DELETE' }),

  // Certificates
  getCertificates: (userId) => request(`/certificates/${userId}`),
  addCertificate: (userId, data) => request(`/certificates/${userId}`, { method: 'POST', body: data }),
  deleteCertificate: (certId) => request(`/certificates/${certId}`, { method: 'DELETE' }),

  // Leaderboard
  getLeaderboard: () => request('/leaderboard'),

  // Views
  incrementViews: (username) => request(`/profile/${username}/views`, { method: 'POST' }),

  // Admin
  getAllStudents: () => request('/admin/students'),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),
}
