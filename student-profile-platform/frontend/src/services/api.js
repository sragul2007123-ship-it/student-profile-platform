let API_BASE = import.meta.env.VITE_API_URL || '/api'

// Ensure API_BASE ends with /api if it's a full URL and missing it
if (API_BASE.startsWith('http') && !API_BASE.endsWith('/api')) {
  API_BASE = API_BASE.replace(/\/$/, '') + '/api'
}

if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE)
}


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
    const error = await response.json().catch(() => ({ detail: `Request to ${url} failed with status ${response.status}` }))
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
  getFriendsLeaderboard: (userId) => request(`/leaderboard/friends/${userId}`),
  getFriendsActivity: (userId) => request(`/leaderboard/friends/${userId}/activity`),

  // Views
  incrementViews: (username) => request(`/profile/${username}/views`, { method: 'POST' }),

  // Friends
  getFriends: (userId) => request(`/friends/${userId}`),
  getPendingRequests: (userId) => request(`/friends/${userId}/pending`),
  getSentRequests: (userId) => request(`/friends/${userId}/sent`),
  sendFriendRequest: (userId, addresseeId) => request(`/friends/${userId}/send`, { method: 'POST', body: { addressee_id: addresseeId } }),
  acceptFriendRequest: (friendshipId) => request(`/friends/${friendshipId}/accept`, { method: 'POST' }),
  rejectFriendRequest: (friendshipId) => request(`/friends/${friendshipId}/reject`, { method: 'POST' }),
  removeFriend: (friendshipId) => request(`/friends/${friendshipId}`, { method: 'DELETE' }),
  searchUsers: (userId, query) => request(`/friends/${userId}/search?q=${encodeURIComponent(query)}`),

  // Admin
  getAllStudents: () => request('/admin/students'),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),

  // Recruiters
  getRecruiters: () => request('/recruiters/'),
  getRecruiter: (username) => request(`/recruiters/${username}`),
  searchRecruiters: (query) => request(`/recruiters/search/${query}`),

  // Posts
  getAllPosts: () => request('/posts/'),
  createPost: (data) => request('/posts/', { method: 'POST', body: data }),
}
