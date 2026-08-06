const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

async function request(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password } })

export const fetchMe = (token) => request('/auth/me', { token })

function toQueryString(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  const str = query.toString()
  return str ? `?${str}` : ''
}

export const listQuizzesAdmin = (token, params) =>
  request(`/admin/quizzes${toQueryString(params)}`, { token })
export const getQuizAdmin = (token, id) => request(`/admin/quizzes/${id}`, { token })
export const createQuiz = (token, payload) =>
  request('/admin/quizzes', { token, method: 'POST', body: payload })
export const updateQuiz = (token, id, payload) =>
  request(`/admin/quizzes/${id}`, { token, method: 'PUT', body: payload })
export const deleteQuiz = (token, id) =>
  request(`/admin/quizzes/${id}`, { token, method: 'DELETE' })

export const fetchWeeklyDigest = (token) => request('/admin/digest', { token })
export const fetchDashboard = (token, range) =>
  request(`/admin/dashboard${range ? `?range=${range}` : ''}`, { token })

export const fetchAnalytics = (token) => request('/admin/quizzes/analytics', { token })
export const fetchPostAnalytics = (token) => request('/admin/posts/analytics', { token })

export const listAdmins = (token) => request('/admins', { token })
export const createAdmin = (token, payload) =>
  request('/admins', { token, method: 'POST', body: payload })
export const deleteAdmin = (token, id) => request(`/admins/${id}`, { token, method: 'DELETE' })

export const listPostsAdmin = (token, params) =>
  request(`/admin/posts${toQueryString(params)}`, { token })
export const getPostAdmin = (token, id) => request(`/admin/posts/${id}`, { token })
export const createPost = (token, payload) =>
  request('/admin/posts', { token, method: 'POST', body: payload })
export const updatePost = (token, id, payload) =>
  request(`/admin/posts/${id}`, { token, method: 'PUT', body: payload })
export const deletePost = (token, id) => request(`/admin/posts/${id}`, { token, method: 'DELETE' })

export const listStoriesAdmin = (token, params) =>
  request(`/admin/stories${toQueryString(params)}`, { token })
export const getStoryAdmin = (token, id) => request(`/admin/stories/${id}`, { token })
export const createStory = (token, payload) =>
  request('/admin/stories', { token, method: 'POST', body: payload })
export const updateStory = (token, id, payload) =>
  request(`/admin/stories/${id}`, { token, method: 'PUT', body: payload })
export const deleteStory = (token, id) => request(`/admin/stories/${id}`, { token, method: 'DELETE' })

export const listPuzzlesAdmin = (token, params) =>
  request(`/admin/puzzles${toQueryString(params)}`, { token })
export const getPuzzleAdmin = (token, id) => request(`/admin/puzzles/${id}`, { token })
export const createPuzzle = (token, payload) =>
  request('/admin/puzzles', { token, method: 'POST', body: payload })
export const updatePuzzle = (token, id, payload) =>
  request(`/admin/puzzles/${id}`, { token, method: 'PUT', body: payload })
export const deletePuzzle = (token, id) => request(`/admin/puzzles/${id}`, { token, method: 'DELETE' })

export const listFriendshipQuizzesAdmin = (token, params) =>
  request(`/admin/friendship-quizzes${toQueryString(params)}`, { token })
export const getFriendshipQuizAdmin = (token, id) =>
  request(`/admin/friendship-quizzes/${id}`, { token })
export const createFriendshipQuiz = (token, payload) =>
  request('/admin/friendship-quizzes', { token, method: 'POST', body: payload })
export const updateFriendshipQuiz = (token, id, payload) =>
  request(`/admin/friendship-quizzes/${id}`, { token, method: 'PUT', body: payload })
export const deleteFriendshipQuiz = (token, id) =>
  request(`/admin/friendship-quizzes/${id}`, { token, method: 'DELETE' })

export const fetchActivityLog = (token) => request('/admin/activity', { token })

export const fetchEngagementSummary = (token, contentType) =>
  request(`/admin/engagement/${contentType}`, { token })

export const listFeedbackAdmin = (token, params) =>
  request(`/admin/feedback${toQueryString(params)}`, { token })
export const updateFeedback = (token, id, payload) =>
  request(`/admin/feedback/${id}`, { token, method: 'PUT', body: payload })
export const deleteFeedback = (token, id) =>
  request(`/admin/feedback/${id}`, { token, method: 'DELETE' })

export const listEndUsersAdmin = (token, params) =>
  request(`/admin/end-users${toQueryString(params)}`, { token })
export const updateEndUserStatus = (token, id, status) =>
  request(`/admin/end-users/${id}/status`, { token, method: 'PATCH', body: { status } })
export const deleteEndUser = (token, id) =>
  request(`/admin/end-users/${id}`, { token, method: 'DELETE' })
