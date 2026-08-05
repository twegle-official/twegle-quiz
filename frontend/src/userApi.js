// Mirrors admin/adminApi.js's request() helper (Bearer-token support, JSON
// in/out, thrown Error on failure) — cleaner for auth calls than the ad hoc
// fetch style the rest of api.js uses for anonymous, unauthenticated traffic.
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

export const signupUser = (username, password, displayName) =>
  request('/users/signup', { method: 'POST', body: { username, password, displayName } })

export const loginUser = (username, password) =>
  request('/users/login', { method: 'POST', body: { username, password } })

export const resetUserPassword = (username, recoveryCode, newPassword) =>
  request('/users/reset-password', { method: 'POST', body: { username, recoveryCode, newPassword } })

export const fetchCurrentUser = (token) => request('/users/me', { token })

export const updateDisplayName = (token, displayName) =>
  request('/users/me', { token, method: 'PATCH', body: { displayName } })

export const regenerateRecoveryCode = (token) =>
  request('/users/me/regenerate-recovery-code', { token, method: 'POST' })
